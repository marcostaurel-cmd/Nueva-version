import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { promises as fs, readdirSync, statSync } from 'fs'

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => mainWindow.show())
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('dialog:open-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  })
  return {
    canceled: result.canceled,
    folderPath: result.canceled ? null : result.filePaths[0],
  }
})

function walkDir(dir, baseDir = dir, results = []) {
  const entries = readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      walkDir(fullPath, baseDir, results)
    } else {
      const stat = statSync(fullPath)
      results.push({
        name: entry.name,
        absolutePath: fullPath,
        relativePath: fullPath.slice(baseDir.length + 1),
        size: stat.size,
      })
    }
  }
  return results
}

ipcMain.handle('fs:list-files', async (_event, { folderPath, recursive }) => {
  try {
    const files = recursive
      ? walkDir(folderPath)
      : readdirSync(folderPath, { withFileTypes: true })
          .filter(e => e.isFile())
          .map(e => {
            const full = join(folderPath, e.name)
            return { name: e.name, absolutePath: full, relativePath: e.name, size: statSync(full).size }
          })
    return { files }
  } catch (err) {
    return { files: [], error: err.message }
  }
})

ipcMain.handle('fs:copy-files', async (event, { sourcePath, destPath, preserveStructure }) => {
  const files = walkDir(sourcePath)
  const total = files.length
  let copied = 0
  let failed = 0
  const errors = []
  const usedNames = new Set()

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    let targetPath

    if (preserveStructure) {
      targetPath = join(destPath, file.relativePath)
    } else {
      let name = file.name
      if (usedNames.has(name)) {
        const dotIdx = name.lastIndexOf('.')
        const ext = dotIdx !== -1 ? name.slice(dotIdx) : ''
        const base = dotIdx !== -1 ? name.slice(0, dotIdx) : name
        let counter = 1
        while (usedNames.has(`${base}_${counter}${ext}`)) counter++
        name = `${base}_${counter}${ext}`
      }
      usedNames.add(name)
      targetPath = join(destPath, name)
    }

    try {
      event.sender.send('fs:copy-progress', {
        current: i + 1,
        total,
        currentFile: file.relativePath,
        percentage: Math.round(((i + 1) / total) * 100),
      })
    } catch (_) {
      break
    }

    try {
      const targetDir = join(targetPath, '..')
      await fs.mkdir(targetDir, { recursive: true })
      await fs.copyFile(file.absolutePath, targetPath)
      copied++
    } catch (err) {
      failed++
      errors.push(`${file.relativePath}: ${err.message}`)
    }
  }

  return { copied, failed, errors }
})
