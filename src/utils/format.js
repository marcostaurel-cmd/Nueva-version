export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateStr));
}

export function formatDateInput(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
}

export const PROJECT_STATUSES = {
  active: { label: 'Activo', color: 'bg-green-100 text-green-700' },
  paused: { label: 'Pausado', color: 'bg-yellow-100 text-yellow-700' },
  completed: { label: 'Completado', color: 'bg-blue-100 text-blue-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
};
