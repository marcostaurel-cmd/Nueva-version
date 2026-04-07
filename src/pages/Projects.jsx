import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Eye, TrendingUp, TrendingDown } from 'lucide-react';
import { useApp, useProjectStats } from '../context/AppContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatCurrency, formatDate, formatDateInput, PROJECT_STATUSES } from '../utils/format';

const EMPTY_FORM = {
  name: '',
  description: '',
  client: '',
  budget: '',
  startDate: '',
  endDate: '',
  status: 'active',
};

function ProjectForm({ initial = EMPTY_FORM, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({ ...form, budget: form.budget ? parseFloat(form.budget) : 0 });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Nombre del proyecto *</label>
        <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej: Desarrollo web XYZ" required />
      </div>
      <div>
        <label className="label">Cliente</label>
        <input className="input" value={form.client} onChange={e => set('client', e.target.value)} placeholder="Nombre del cliente" />
      </div>
      <div>
        <label className="label">Descripción</label>
        <textarea className="input resize-none" rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Descripción opcional" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Presupuesto</label>
          <input className="input" type="number" min="0" step="0.01" value={form.budget} onChange={e => set('budget', e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <label className="label">Estado</label>
          <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
            {Object.entries(PROJECT_STATUSES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Fecha inicio</label>
          <input className="input" type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
        </div>
        <div>
          <label className="label">Fecha fin</label>
          <input className="input" type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} />
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn-primary">Guardar</button>
      </div>
    </form>
  );
}

function ProjectRow({ project, onEdit, onDelete }) {
  const stats = useProjectStats(project.id);
  const st = PROJECT_STATUSES[project.status] || PROJECT_STATUSES.active;

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
            {project.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">{project.name}</p>
            {project.client && <p className="text-xs text-gray-400">{project.client}</p>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`badge ${st.color}`}>{st.label}</span>
      </td>
      <td className="px-4 py-3 text-sm text-green-600 font-medium">{formatCurrency(stats.income)}</td>
      <td className="px-4 py-3 text-sm text-red-500 font-medium">{formatCurrency(stats.expense)}</td>
      <td className="px-4 py-3">
        <span className={`text-sm font-semibold ${stats.balance >= 0 ? 'text-green-700' : 'text-red-600'}`}>
          {formatCurrency(stats.balance)}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(project.startDate)}</td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
          <Link to={`/transactions?project=${project.id}`} className="btn-ghost p-1.5 text-gray-400 hover:text-blue-600" title="Ver movimientos">
            <Eye size={15} />
          </Link>
          <button onClick={() => onEdit(project)} className="btn-ghost p-1.5 text-gray-400 hover:text-blue-600" title="Editar">
            <Edit2 size={15} />
          </button>
          <button onClick={() => onDelete(project)} className="btn-ghost p-1.5 text-gray-400 hover:text-red-500" title="Eliminar">
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function Projects() {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState(null); // null | 'new' | project
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = state.projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.client || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSave = (data) => {
    if (modal === 'new') {
      dispatch({ type: 'ADD_PROJECT', payload: data });
    } else {
      dispatch({ type: 'UPDATE_PROJECT', payload: { id: modal.id, ...data } });
    }
    setModal(null);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proyectos</h1>
          <p className="text-gray-500 text-sm">{state.projects.length} proyecto{state.projects.length !== 1 ? 's' : ''} en total</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('new')}>
          <Plus size={16} /> Nuevo Proyecto
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Buscar por nombre o cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="select w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">Todos los estados</option>
          {Object.entries(PROJECT_STATUSES).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Proyecto</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ingresos</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Egresos</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Inicio</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                    {search || statusFilter !== 'all' ? 'No se encontraron proyectos con los filtros aplicados' : 'No hay proyectos. ¡Crea el primero!'}
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <ProjectRow
                    key={p.id}
                    project={p}
                    onEdit={setModal}
                    onDelete={setDeleteTarget}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal new/edit */}
      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'new' ? 'Nuevo Proyecto' : 'Editar Proyecto'}
      >
        <ProjectForm
          initial={modal && modal !== 'new' ? {
            ...modal,
            budget: modal.budget || '',
            startDate: formatDateInput(modal.startDate),
            endDate: formatDateInput(modal.endDate),
          } : EMPTY_FORM}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => dispatch({ type: 'DELETE_PROJECT', payload: deleteTarget?.id })}
        title="Eliminar proyecto"
        message={`¿Estás seguro que deseas eliminar el proyecto "${deleteTarget?.name}"? También se eliminarán todos sus movimientos.`}
      />
    </div>
  );
}
