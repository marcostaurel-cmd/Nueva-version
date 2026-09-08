import { useState } from 'react';
import { Plus, Trash2, Tag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';

const DEFAULTS = [
  'cat-1','cat-2','cat-3','cat-4','cat-5','cat-6','cat-7','cat-8','cat-9','cat-10',
];

function CategoryForm({ onSave, onClose }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('income');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), type });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Nombre de la categoría *</label>
        <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Consultoría" required autoFocus />
      </div>
      <div>
        <label className="label">Tipo *</label>
        <div className="grid grid-cols-2 gap-2">
          {['income', 'expense'].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                type === t
                  ? t === 'income' ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {t === 'income' ? '↑ Ingreso' : '↓ Egreso'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn-primary">Agregar</button>
      </div>
    </form>
  );
}

export default function Categories() {
  const { state, dispatch } = useApp();
  const [modal, setModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const income = state.categories.filter(c => c.type === 'income');
  const expense = state.categories.filter(c => c.type === 'expense');

  const handleSave = (data) => {
    dispatch({ type: 'ADD_CATEGORY', payload: data });
    setModal(false);
  };

  const usageCount = (catId) =>
    state.transactions.filter(t => t.categoryId === catId).length;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
          <p className="text-gray-500 text-sm">{state.categories.length} categorías configuradas</p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <Plus size={16} /> Nueva Categoría
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {[{ label: 'Ingresos', items: income, type: 'income' }, { label: 'Egresos', items: expense, type: 'expense' }].map(({ label, items, type }) => (
          <div key={type} className="card">
            <div className="flex items-center gap-2 mb-4">
              <Tag size={16} className={type === 'income' ? 'text-green-600' : 'text-red-500'} />
              <h2 className="font-semibold text-gray-900">{label}</h2>
              <span className="badge bg-gray-100 text-gray-600 ml-auto">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map(cat => {
                const count = usageCount(cat.id);
                const isDefault = DEFAULTS.includes(cat.id);
                return (
                  <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{cat.name}</p>
                      <p className="text-xs text-gray-400">{count} movimiento{count !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isDefault && (
                        <span className="badge bg-blue-100 text-blue-600">Default</span>
                      )}
                      {!isDefault && (
                        <button
                          onClick={() => setDeleteTarget(cat)}
                          className="btn-ghost p-1.5 text-gray-400 hover:text-red-500"
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {items.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-4">Sin categorías</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Nueva Categoría" size="sm">
        <CategoryForm onSave={handleSave} onClose={() => setModal(false)} />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => dispatch({ type: 'DELETE_CATEGORY', payload: deleteTarget?.id })}
        title="Eliminar categoría"
        message={`¿Eliminar la categoría "${deleteTarget?.name}"? Los movimientos asociados quedarán sin categoría.`}
      />
    </div>
  );
}
