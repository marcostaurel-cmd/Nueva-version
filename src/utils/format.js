export function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateStr));
}

export function formatDateInput(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
}

export const DOC_STATUSES = {
  draft:    { label: 'Borrador',     color: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400' },
  review:   { label: 'En Revisión',  color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  approved: { label: 'Aprobado',     color: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  obsolete: { label: 'Obsoleto',     color: 'bg-red-100 text-red-600',      dot: 'bg-red-400' },
};

export const TYPE_COLORS = {
  blue:   'bg-blue-100 text-blue-700',
  green:  'bg-green-100 text-green-700',
  purple: 'bg-purple-100 text-purple-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  orange: 'bg-orange-100 text-orange-700',
  red:    'bg-red-100 text-red-600',
};

export const TYPE_DOT_COLORS = {
  blue:   '#3b82f6',
  green:  '#22c55e',
  purple: '#8b5cf6',
  yellow: '#f59e0b',
  orange: '#f97316',
  red:    '#ef4444',
};

export const STATUS_CHART_COLORS = {
  draft:    '#94a3b8',
  review:   '#f59e0b',
  approved: '#22c55e',
  obsolete: '#ef4444',
};
