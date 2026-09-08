import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, ArrowUpCircle, ArrowDownCircle, Filter } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatCurrency, formatDate } from '../utils/format';

const EMPTY_FORM = {
  type: 'income',
  projectId: '',
  categoryId: '',
  amount: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  notes: '',
};

function TransactionForm({ initial = EMPTY_FORM, onSave, onClose }) {
  const { state } = useApp();
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const cats = state.categories.filter(c => c.type === form.type);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || !form.projectId || !form.categoryId || !form.description) return;
    onSave({ ...form, amount: parseFloat(form.amount) });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type toggle */}
      <div>
        <label className="label">Tipo de movimiento *</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => { set('type', 'income'); set('categoryId', ''); }}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
              form.type === 'income'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            <ArrowUpCircle size={16} /> Ingreso
          </button>
          <button
            type="button"
            onClick={() => { set('type', 'expense'); set('categoryId', ''); }}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
              form.type === 'expense'
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            <ArrowDownCircle size={16} /> Egreso
          </button>
        </div>
      </div>

      <div>
        <label className="label">Descripción *</label>
        <input className="input" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Descripción del movimiento" required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Monto *</label>
          <input className="input" type="number" min="0.01" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" required />
        </div>
        <div>
          <label className="label">Fecha *</label>
          <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
        </div>
      </div>

      <div>
        <label className="label">Proyecto *</label>
        <select className="select" value={form.projectId} onChange={e => set('projectId', e.target.value)} required>
          <option value="">Seleccionar proyecto...</option>
          {state.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div>
        <label className="label">Categoría *</label>
        <select className="select" value={form.categoryId} onChange={e => set('categoryId', e.target.value)} required>
          <option value="">Seleccionar categoría...</option>
          {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div>
        <label className="label">Notas</label>
        <textarea className="input resize-none" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Notas adicionales (opcional)" />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
        <button type="submit" className={form.type === 'income' ? 'btn-success' : 'btn-danger'}>Guardar</button>
      </div>
    </form>
  );
}

export default function Transactions() {
  const { state, dispatch } = useApp();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState(searchParams.get('project') || 'all');
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const p = searchParams.get('project');
    if (p) setProjectFilter(p);
  }, [searchParams]);

  const filtered = state.transactions
    .filter(t => {
      const matchSearch = t.description.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'all' || t.type === typeFilter;
      const matchProject = projectFilter === 'all' || t.projectId === projectFilter;
      return matchSearch && matchType && matchProject;
    })
    .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const handleSave = (data) => {
    if (modal === 'new') {
      dispatch({ type: 'ADD_TRANSACTION', payload: data });
    } else {
      dispatch({ type: 'UPDATE_TRANSACTION', payload: { id: modal.id, ...data } });
    }
    setModal(null);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Movimientos</h1>
          <p className="text-gray-500 text-sm">{filtered.length} movimiento{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('new')}>
          <Plus size={16} /> Nuevo Movimiento
        </button>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg">
          <ArrowUpCircle size={16} className="text-green-600" />
          <span className="text-sm font-medium text-green-700">{formatCurrency(totalIncome)}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg">
          <ArrowDownCircle size={16} className="text-red-500" />
          <span className="text-sm font-medium text-red-600">{formatCurrency(totalExpense)}</span>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${totalIncome - totalExpense >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
          <span className="text-xs font-medium text-gray-500">Balance:</span>
          <span className={`text-sm font-semibold ${totalIncome - totalExpense >= 0 ? 'text-blue-700' : 'text-orange-600'}`}>
            {formatCurrency(totalIncome - totalExpense)}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select w-auto" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="all">Todos los tipos</option>
          <option value="income">Ingresos</option>
          <option value="expense">Egresos</option>
        </select>
        <select className="select w-auto" value={projectFilter} onChange={e => setProjectFilter(e.target.value)}>
          <option value="all">Todos los proyectos</option>
          {state.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripción</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Proyecto</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoría</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Monto</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                    No se encontraron movimientos
                  </td>
                </tr>
              ) : (
                filtered.map(tx => {
                  const project = state.projects.find(p => p.id === tx.projectId);
                  const cat = state.categories.find(c => c.id === tx.categoryId);
                  return (
                    <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`badge ${tx.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {tx.type === 'income' ? '↑ Ingreso' : '↓ Egreso'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                        {tx.notes && <p className="text-xs text-gray-400 truncate max-w-xs">{tx.notes}</p>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{project?.name || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{cat?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(tx.date || tx.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => setModal(tx)} className="btn-ghost p-1.5 text-gray-400 hover:text-blue-600">
                            <Edit2 size={15} />
                          </button>
                          <button onClick={() => setDeleteTarget(tx)} className="btn-ghost p-1.5 text-gray-400 hover:text-red-500">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'new' ? 'Nuevo Movimiento' : 'Editar Movimiento'}
        size="md"
      >
        <TransactionForm
          initial={modal && modal !== 'new' ? { ...modal, amount: String(modal.amount) } : EMPTY_FORM}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => dispatch({ type: 'DELETE_TRANSACTION', payload: deleteTarget?.id })}
        title="Eliminar movimiento"
        message={`¿Eliminar "${deleteTarget?.description}"?`}
      />
    </div>
  );
}
