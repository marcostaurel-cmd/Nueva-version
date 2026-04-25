import { useState } from 'react';
import { Plus, Edit2, Trash2, Layers } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { TYPE_COLORS } from '../utils/format';

const DEFAULT_TYPE_IDS = ['type-1', 'type-2', 'type-3', 'type-4', 'type-5', 'type-6'];

const COLOR_OPTIONS = [
  { value: 'blue',   label: 'Azul' },
  { value: 'green',  label: 'Verde' },
  { value: 'purple', label: 'Violeta' },
  { value: 'yellow', label: 'Amarillo' },
  { value: 'orange', label: 'Naranja' },
  { value: 'red',    label: 'Rojo' },
];

const EMPTY_FORM = { name: '', prefix: '', color: 'blue' };

function TypeForm({ initial = EMPTY_FORM, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.prefix.trim()) return;
    onSave({ ...form, prefix: form.prefix.toUpperCase().trim() });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Nombre *</label>
        <input
          className="input"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="Ej: Procedimiento"
          required
          autoFocus
        />
      </div>
      <div>
        <label className="label">Prefijo de código *</label>
        <input
          className="input uppercase"
          value={form.prefix}
          onChange={e => set('prefix', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          placeholder="Ej: PRO"
          maxLength={6}
          required
        />
        <p className="text-xs text-gray-400 mt-1">Se usará para generar códigos como {form.prefix || 'PRO'}-001</p>
      </div>
      <div>
        <label className="label">Color</label>
        <div className="grid grid-cols-3 gap-2">
          {COLOR_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set('color', opt.value)}
              className={`py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                form.color === opt.value
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className={`badge ${TYPE_COLORS[opt.value] || 'bg-gray-100 text-gray-600'}`}>
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn-primary">Guardar</button>
      </div>
    </form>
  );
}

export default function DocumentTypes() {
  const { state, dispatch } = useApp();
  const [modal, setModal] = useState(null); // null | 'new' | type object
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleSave = (data) => {
    if (modal === 'new') {
      dispatch({ type: 'ADD_DOCUMENT_TYPE', payload: data });
    } else {
      dispatch({ type: 'UPDATE_DOCUMENT_TYPE', payload: { id: modal.id, ...data } });
    }
    setModal(null);
  };

  const docCount = (typeId) => state.documents.filter(d => d.typeId === typeId).length;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tipos de Documento</h1>
          <p className="text-gray-500 text-sm">{state.documentTypes.length} tipo{state.documentTypes.length !== 1 ? 's' : ''} configurado{state.documentTypes.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('new')}>
          <Plus size={16} /> Nuevo Tipo
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {state.documentTypes.map(type => {
          const count = docCount(type.id);
          const isDefault = DEFAULT_TYPE_IDS.includes(type.id);
          return (
            <div key={type.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Layers size={18} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{type.name}</p>
                    <span className={`badge mt-0.5 ${TYPE_COLORS[type.color] || 'bg-gray-100 text-gray-600'}`}>
                      {type.prefix}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setModal(type)}
                    className="btn-ghost p-1.5 text-gray-400 hover:text-blue-600"
                    title="Editar"
                  >
                    <Edit2 size={15} />
                  </button>
                  {!isDefault && (
                    <button
                      onClick={() => setDeleteTarget(type)}
                      className="btn-ghost p-1.5 text-gray-400 hover:text-red-500"
                      title="Eliminar"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {count} documento{count !== 1 ? 's' : ''}
                </span>
                {isDefault && (
                  <span className="badge bg-blue-100 text-blue-600">Predeterminado</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'new' ? 'Nuevo Tipo de Documento' : 'Editar Tipo'}
        size="sm"
      >
        <TypeForm
          initial={modal && modal !== 'new' ? { name: modal.name, prefix: modal.prefix, color: modal.color } : EMPTY_FORM}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          dispatch({ type: 'DELETE_DOCUMENT_TYPE', payload: deleteTarget?.id });
          setDeleteTarget(null);
        }}
        title="Eliminar tipo de documento"
        message={`¿Eliminar el tipo "${deleteTarget?.name}"? Los documentos asociados quedarán sin tipo asignado.`}
      />
    </div>
  );
}
