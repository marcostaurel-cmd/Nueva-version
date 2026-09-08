import { FolderOpen } from 'lucide-react'

export default function FolderPicker({ label, path, onSelect, disabled }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-3">
        <button
          onClick={onSelect}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FolderOpen size={16} />
          {path ? 'Cambiar carpeta' : 'Seleccionar carpeta'}
        </button>
        {path && (
          <span
            className="flex-1 text-sm text-gray-600 truncate font-mono bg-gray-50 px-3 py-2 rounded-lg border border-gray-200"
            title={path}
          >
            {path}
          </span>
        )}
        {!path && (
          <span className="text-sm text-gray-400 italic">Ninguna carpeta seleccionada</span>
        )}
      </div>
    </div>
  )
}
