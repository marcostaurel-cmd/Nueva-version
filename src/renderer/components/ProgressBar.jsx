export default function ProgressBar({ progress, status }) {
  if (status !== 'copying' && status !== 'done') return null

  const { current, total, currentFile, percentage } = progress

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-gray-600">
        <span>
          {status === 'done'
            ? 'Completado'
            : `Copiando archivo ${current} de ${total}`}
        </span>
        <span className="font-medium">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            status === 'done' ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {status === 'copying' && currentFile && (
        <p className="text-xs text-gray-400 font-mono truncate" title={currentFile}>
          {currentFile}
        </p>
      )}
    </div>
  )
}
