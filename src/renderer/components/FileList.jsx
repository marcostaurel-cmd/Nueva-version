function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export default function FileList({ files }) {
  const totalSize = files.reduce((sum, f) => sum + f.size, 0)

  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm border border-dashed border-gray-200 rounded-lg">
        No hay archivos para mostrar
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="overflow-auto max-h-64 rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-gray-600">Nombre</th>
              <th className="text-left px-3 py-2 font-medium text-gray-600 hidden sm:table-cell">Ruta relativa</th>
              <th className="text-right px-3 py-2 font-medium text-gray-600">Tamaño</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {files.map((file, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-3 py-1.5 text-gray-800 font-mono truncate max-w-[160px]" title={file.name}>
                  {file.name}
                </td>
                <td className="px-3 py-1.5 text-gray-500 font-mono truncate max-w-[200px] hidden sm:table-cell" title={file.relativePath}>
                  {file.relativePath}
                </td>
                <td className="px-3 py-1.5 text-gray-600 text-right whitespace-nowrap">
                  {formatSize(file.size)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 text-right">
        {files.length} archivo{files.length !== 1 ? 's' : ''} · {formatSize(totalSize)} total
      </p>
    </div>
  )
}
