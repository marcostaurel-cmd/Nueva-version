import { useState } from 'react';
import { Plus, Search, Trash2, GitBranch } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDate, DOC_STATUSES } from '../utils/format';

const EMPTY_FORM = {
  documentId: '',
  version: '',
  status: 'review',
  description: '',
  changedBy: '',
  date: new Date().toISOString().split('T')[0],
};

function RevisionForm({ initial = EMPTY_FORM, onSave, onClose }) {
  const { state } = useApp();
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const selectedDoc = state.documents.find(d => d.id === form.documentId);

  const handleDocChange = (id) => {
    const doc = state.documents.find(d => d.id === id);
    set('documentId', id);
    if (doc) set('version', bumpVersion(doc.version));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.documentId || !form.version.trim()) return;
    onSave(form);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Documento *</label>
        <select className="select" value={form.documentId} onChange={e => handleDocChange(e.target.value)} required>
          <option value="">Seleccionar documento...</option>
          {state.documents.map(d => (
            <option key={d.id} value={d.id}>
              {d.code ? `${d.code} — ` : ''}{d.title} (v{d.version})
            </option>
          ))}
        </select>
        {selectedDoc && (
          <p className="text-xs text-gray-400 mt-1">
            Estado actual: {DOC_STATUSES[selectedDoc.status]?.label}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Nueva versión *</label>
          <input className="input" value={form.version} onChange={e => set('version', e.target.value)} placeholder="Ej: 2.0" required />
        </div>
        <div>
          <label className="label">Estado resultante *</label>
          <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
            {Object.entries(DOC_STATUSES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Modificado por</label>
          <input className="input" value={form.changedBy} onChange={e => set('changedBy', e.target.value)} placeholder="Nombre" />
        </div>
        <div>
          <label className="label">Fecha</label>
          <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label">Descripción de cambios</label>
        <textarea
          className="input resize-none"
          rows={3}
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="¿Qué cambió en esta revisión?"
        />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn-primary">Registrar revisión</button>
      </div>
    </form>
  );
}

function bumpVersion(v) {
  if (!v) return '1.1';
  const parts = String(v).split('.');
  if (parts.length === 1) return `${parseInt(v) + 1}.0`;
  const minor = parseInt(parts[parts.length - 1]) + 1;
  return [...parts.slice(0, -1), minor].join('.');
}

export default function Revisions() {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [docFilter, setDocFilter] = useState('all');
  const [modal, setModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = state.revisions
    .filter(r => {
      const doc = state.documents.find(d => d.id === r.documentId);
      const matchSearch =
        (doc?.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (doc?.code || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.changedBy || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.description || '').toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchDoc = docFilter === 'all' || r.documentId === docFilter;
      return matchSearch && matchStatus && matchDoc;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleSave = (data) => {
    dispatch({ type: 'ADD_REVISION', payload: data });
    setModal(false);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revisiones</h1>
          <p className="text-gray-500 text-sm">{state.revisions.length} revisión{state.revisions.length !== 1 ? 'es' : ''} registrada{state.revisions.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <Plus size={16} /> Nueva Revisión
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Buscar por documento, autor o descripción..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="select w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">Todos los estados</option>
          {Object.entries(DOC_STATUSES).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select className="select w-auto" value={docFilter} onChange={e => setDocFilter(e.target.value)}>
          <option value="all">Todos los documentos</option>
          {state.documents.map(d => (
            <option key={d.id} value={d.id}>{d.code ? `${d.code} — ` : ''}{d.title}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Documento</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Versión</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripción</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Modificado por</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                    {search || statusFilter !== 'all' || docFilter !== 'all'
                      ? 'No se encontraron revisiones con los filtros aplicados'
                      : 'No hay revisiones registradas'}
                  </td>
                </tr>
              ) : (
                filtered.map(rev => {
                  const doc = state.documents.find(d => d.id === rev.documentId);
                  const st = DOC_STATUSES[rev.status] || DOC_STATUSES.draft;
                  return (
                    <tr key={rev.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                            <GitBranch size={13} />
                          </div>
                          <div>
                            {doc ? (
                              <>
                                {doc.code && <span className="text-xs text-gray-400 font-mono">{doc.code} </span>}
                                <p className="text-sm font-medium text-gray-900">{doc.title}</p>
                              </>
                            ) : (
                              <p className="text-sm text-gray-400 italic">Documento eliminado</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-700 font-mono">v{rev.version}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${st.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${st.dot}`} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-sm text-gray-700 truncate">{rev.description || '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{rev.changedBy || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(rev.date || rev.createdAt)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setDeleteTarget(rev)}
                          className="btn-ghost p-1.5 text-gray-400 hover:text-red-500"
                          title="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Registrar Revisión" size="md">
        <RevisionForm onSave={handleSave} onClose={() => setModal(false)} />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => dispatch({ type: 'DELETE_REVISION', payload: deleteTarget?.id })}
        title="Eliminar revisión"
        message={`¿Eliminar la revisión v${deleteTarget?.version}? Nota: el documento mantendrá su versión y estado actuales.`}
      />
    </div>
  );
}
