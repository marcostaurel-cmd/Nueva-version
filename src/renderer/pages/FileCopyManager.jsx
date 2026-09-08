import { useState, useEffect } from 'react'
import FolderPicker from '../components/FolderPicker'
import FileList from '../components/FileList'
import ProgressBar from '../components/ProgressBar'
import { Copy, AlertCircle, CheckCircle2 } from 'lucide-react'

const api = window.electronAPI ?? null

export default function FileCopyManager() {
  const [sourcePath, setSourcePath] = useState(null)
  const [destPath, setDestPath] = useState(null)
  const [files, setFiles] = useState([])
  const [recursive, setRecursive] = useState(true)
  const [preserveStructure, setPreserveStructure] = useState(true)
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState({ current: 0, total: 0, currentFile: '', percentage: 0 })
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (status !== 'copying') return
    if (!api) return
    const cleanup = api.onCopyProgress((data) => setProgress(data))
    return cleanup
  }, [status])

  async function handleSelectSource() {
    if (!api) return alert('Esta función solo está disponible en la app de escritorio.')
    const { canceled, folderPath } = await api.openFolderDialog()
    if (canceled || !folderPath) return
    setSourcePath(folderPath)
    setFiles([])
    setStatus('listing')
    setResult(null)
    setError(null)
    const { files: listed, error: listErr } = await api.listFiles(folderPath, recursive)
    if (listErr) {
      setError(listErr)
      setStatus('error')
    } else {
      setFiles(listed)
      setStatus('ready')
    }
  }

  async function handleSelectDest() {
    if (!api) return alert('Esta función solo está disponible en la app de escritorio.')
    const { canceled, folderPath } = await api.openFolderDialog()
    if (!canceled && folderPath) setDestPath(folderPath)
  }

  async function handleProcess() {
    if (!sourcePath || !destPath) return
    if (!api) return
    setStatus('copying')
    setProgress({ current: 0, total: files.length, currentFile: '', percentage: 0 })
    setResult(null)
    setError(null)
    try {
      const res = await api.copyFiles(sourcePath, destPath, preserveStructure)
      setResult(res)
      setProgress(p => ({ ...p, percentage: 100 }))
      setStatus('done')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  const busy = status === 'listing' || status === 'copying'
  const canProcess = sourcePath && destPath && files.length > 0 && !busy

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Copiar Archivos</h1>
        <p className="text-sm text-gray-500 mt-1">
          Selecciona una carpeta de origen y una de destino, luego copia todos los archivos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source column */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-sm">
          <h2 className="font-semibold text-gray-800">Carpeta de origen</h2>
          <FolderPicker
            label="Carpeta a copiar"
            path={sourcePath}
            onSelect={handleSelectSource}
            disabled={busy}
          />

          <div className="flex items-center gap-2">
            <input
              id="recursive"
              type="checkbox"
              checked={recursive}
              onChange={e => setRecursive(e.target.checked)}
              disabled={busy}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="recursive" className="text-sm text-gray-700 select-none cursor-pointer">
              Incluir subcarpetas (recursivo)
            </label>
          </div>

          {status === 'listing' && (
            <p className="text-sm text-blue-600 animate-pulse">Leyendo archivos...</p>
          )}

          <FileList files={files} />
        </div>

        {/* Destination column */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 shadow-sm">
          <h2 className="font-semibold text-gray-800">Carpeta de destino</h2>
          <FolderPicker
            label="Copiar hacia"
            path={destPath}
            onSelect={handleSelectDest}
            disabled={busy}
          />

          <div className="flex items-center gap-2">
            <input
              id="preserve"
              type="checkbox"
              checked={preserveStructure}
              onChange={e => setPreserveStructure(e.target.checked)}
              disabled={busy}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="preserve" className="text-sm text-gray-700 select-none cursor-pointer">
              Preservar estructura de carpetas
            </label>
          </div>

          <button
            onClick={handleProcess}
            disabled={!canProcess}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full justify-center"
          >
            <Copy size={16} />
            {status === 'copying' ? 'Copiando...' : 'Copiar archivos'}
          </button>

          <ProgressBar progress={progress} status={status} />

          {status === 'done' && result && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 space-y-1">
              <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
                <CheckCircle2 size={16} />
                Operación completada
              </div>
              <p className="text-sm text-green-600">
                {result.copied} archivo{result.copied !== 1 ? 's' : ''} copiado{result.copied !== 1 ? 's' : ''} correctamente.
              </p>
              {result.failed > 0 && (
                <p className="text-sm text-amber-600">
                  {result.failed} archivo{result.failed !== 1 ? 's' : ''} con error.
                </p>
              )}
            </div>
          )}

          {(status === 'error' || (status === 'done' && result?.errors?.length > 0)) && error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 space-y-1">
              <div className="flex items-center gap-2 text-red-700 font-medium text-sm">
                <AlertCircle size={16} />
                Error
              </div>
              <p className="text-xs text-red-600 font-mono break-all">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
