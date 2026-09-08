import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openFolderDialog: () =>
    ipcRenderer.invoke('dialog:open-folder'),

  listFiles: (folderPath, recursive = true) =>
    ipcRenderer.invoke('fs:list-files', { folderPath, recursive }),

  copyFiles: (sourcePath, destPath, preserveStructure = true) =>
    ipcRenderer.invoke('fs:copy-files', { sourcePath, destPath, preserveStructure }),

  onCopyProgress: (callback) => {
    const handler = (_event, data) => callback(data)
    ipcRenderer.on('fs:copy-progress', handler)
    return () => ipcRenderer.removeListener('fs:copy-progress', handler)
  },
})
