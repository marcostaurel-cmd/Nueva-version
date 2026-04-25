import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, GitBranch, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDate, formatDateInput, DOC_STATUSES, TYPE_COLORS } from '../utils/format';

const EMPTY_FORM = {
  code: '',
  title: '',
  typeId: '',
  version: '1.0',
  status: 'draft',
  description: '',
  author: '',
  reviewedBy: '',
  approvedBy: '',
  effectiveDate: '',
  nextReviewDate: '',
  tags: '',
};

function DocumentForm({ initial = EMPTY_FORM, onSave, onClose }) {
  const { state } = useApp();
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.typeId) return;
    onSave(form);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Código</label>
          <input className="input" value={form.code} onChange={e => set('code', e.target.value)} placeholder="Ej: PRO-001" />
        </div>
        <div>
          <label className="label">Versión *</label>
          <input className="input" value={form.version} onChange={e => set('version', e.target.value)} placeholder="1.0" required />
        </div>
      </div>

      <div>
        <label className="label">Título *</label>
        <input className="input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Nombre del documento" required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Tipo *</label>
          <select className="select" value={form.typeId} onChange={e => set('typeId', e.target.value)} required>
            <option value="">Seleccionar tipo...</option>
            {state.documentTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Estado *</label>
          <select className="select" value={form.status} onChange={e => set('status', e.target.value)}>
            {Object.entries(DOC_STATUSES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Descripción</label>
        <textarea className="input resize-none" rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Descripción del documento" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Autor</label>
          <input className="input" value={form.author} onChange={e => set('author', e.target.value)} placeholder="Nombre" />
        </div>
        <div>
          <label className="label">Revisado por</label>
          <input className="input" value={form.reviewedBy} onChange={e => set('reviewedBy', e.target.value)} placeholder="Nombre" />
        </div>
        <div>
          <label className="label">Aprobado por</label>
          <input className="input" value={form.approvedBy} onChange={e => set('approvedBy', e.target.value)} placeholder="Nombre" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Fecha de vigencia</label>
          <input className="input" type="date" value={form.effectiveDate} onChange={e => set('effectiveDate', e.target.value)} />
        </div>
        <div>
          <label className="label">Próxima revisión</label>
          <input className="input" type="date" value={form.nextReviewDate} onChange={e => set('nextReviewDate', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label">Etiquetas</label>
        <input className="input" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="Ej: seguridad, operaciones (separadas por coma)" />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn-primary">Guardar</button>
      </div>
    </form>
  );
}

export default function Documents() {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [revModal, setRevModal] = useState(null);

  const filtered = state.documents.filter(d => {
    const matchSearch =
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      (d.code || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.author || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    const matchType = typeFilter === 'all' || d.typeId === typeFilter;
    return matchSearch && matchStatus && matchType;
  }).sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

  const handleSave = (data) => {
    if (modal === 'new') {
      dispatch({ type: 'ADD_DOCUMENT', payload: data });
    } else {
      dispatch({ type: 'UPDATE_DOCUMENT', payload: { id: modal.id, ...data } });
    }
    setModal(null);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
          <p className="text-gray-500 text-sm">{state.documents.length} documento{state.documents.length !== 1 ? 's' : ''} en el sistema</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('new')}>
          <Plus size={16} /> Nuevo Documento
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Buscar por código, título o autor..."
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
        <select className="select w-auto" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="all">Todos los tipos</option>
          {state.documentTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Código</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Título</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Versión</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Autor</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vigencia</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actualizado</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400 text-sm">
                    {search || statusFilter !== 'all' || typeFilter !== 'all'
                      ? 'No se encontraron documentos con los filtros aplicados'
                      : 'No hay documentos. ¡Crea el primero!'}
                  </td>
                </tr>
              ) : (
                filtered.map(doc => {
                  const type = state.documentTypes.find(t => t.id === doc.typeId);
                  const revCount = state.revisions.filter(r => r.documentId === doc.id).length;
                  return (
                    <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono font-medium text-gray-700">{doc.code || '—'}</span>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                        {doc.description && <p className="text-xs text-gray-400 truncate">{doc.description}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {type ? (
                          <span className={`badge ${TYPE_COLORS[type.color] || 'bg-gray-100 text-gray-600'}`}>
                            {type.name}
                          </span>
                        ) : <span className="text-gray-400 text-sm">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700">v{doc.version}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={doc.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{doc.author || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(doc.effectiveDate)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(doc.updatedAt || doc.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 items-center">
                          <button
                            onClick={() => setRevModal(doc)}
                            className="btn-ghost p-1.5 text-gray-400 hover:text-indigo-600"
                            title={`Ver revisiones (${revCount})`}
                          >
                            <GitBranch size={15} />
                          </button>
                          <button
                            onClick={() => setModal(doc)}
                            className="btn-ghost p-1.5 text-gray-400 hover:text-blue-600"
                            title="Editar"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(doc)}
                            className="btn-ghost p-1.5 text-gray-400 hover:text-red-500"
                            title="Eliminar"
                          >
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

      {/* New / Edit modal */}
      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'new' ? 'Nuevo Documento' : 'Editar Documento'}
        size="lg"
      >
        <DocumentForm
          initial={modal && modal !== 'new' ? {
            ...modal,
            effectiveDate: formatDateInput(modal.effectiveDate),
            nextReviewDate: formatDateInput(modal.nextReviewDate),
          } : EMPTY_FORM}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      </Modal>

      {/* Revision history modal */}
      <Modal
        isOpen={!!revModal}
        onClose={() => setRevModal(null)}
        title={`Historial de revisiones — ${revModal?.code || ''} ${revModal?.title || ''}`}
        size="lg"
      >
        <RevisionHistory doc={revModal} onClose={() => setRevModal(null)} />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => dispatch({ type: 'DELETE_DOCUMENT', payload: deleteTarget?.id })}
        title="Eliminar documento"
        message={`¿Eliminar el documento "${deleteTarget?.title}"? También se eliminarán todas sus revisiones.`}
      />
    </div>
  );
}

function RevisionHistory({ doc, onClose }) {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const revisions = state.revisions
    .filter(r => r.documentId === doc?.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleAddRevision = (data) => {
    dispatch({ type: 'ADD_REVISION', payload: { documentId: doc.id, ...data } });
    setShowForm(false);
  };

  if (!doc) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusBadge status={doc.status} />
          <span className="text-sm text-gray-500">Versión actual: v{doc.version}</span>
        </div>
        <button className="btn-primary text-sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} /> Nueva revisión
        </button>
      </div>

      {showForm && (
        <NewRevisionForm
          currentVersion={doc.version}
          currentStatus={doc.status}
          onSave={handleAddRevision}
          onClose={() => setShowForm(false)}
        />
      )}

      {revisions.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-8">Sin revisiones registradas</p>
      ) : (
        <div className="space-y-2">
          {revisions.map(rev => {
            const st = DOC_STATUSES[rev.status] || DOC_STATUSES.draft;
            return (
              <div key={rev.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                  v{rev.version}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`badge ${st.color}`}>{st.label}</span>
                    {rev.changedBy && <span className="text-xs text-gray-500">{rev.changedBy}</span>}
                    <span className="text-xs text-gray-400">{formatDate(rev.date || rev.createdAt)}</span>
                  </div>
                  {rev.description && <p className="text-sm text-gray-700 mt-1">{rev.description}</p>}
                </div>
                <button
                  onClick={() => setDeleteTarget(rev)}
                  className="btn-ghost p-1 text-gray-400 hover:text-red-500 shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => dispatch({ type: 'DELETE_REVISION', payload: deleteTarget?.id })}
        title="Eliminar revisión"
        message={`¿Eliminar la revisión v${deleteTarget?.version}?`}
      />
    </div>
  );
}

function StatusBadge({ status }) {
  const st = DOC_STATUSES[status] || DOC_STATUSES.draft;
  return (
    <span className={`badge ${st.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${st.dot}`} />
      {st.label}
    </span>
  );
}

function NewRevisionForm({ currentVersion, currentStatus, onSave, onClose }) {
  const [form, setForm] = useState({
    version: bumpVersion(currentVersion),
    status: currentStatus,
    description: '',
    changedBy: '',
    date: new Date().toISOString().split('T')[0],
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.version.trim()) return;
    onSave(form);
  };

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
      <p className="text-sm font-semibold text-blue-800">Registrar nueva revisión</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Nueva versión *</label>
            <input className="input" value={form.version} onChange={e => set('version', e.target.value)} required />
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
          <textarea className="input resize-none" rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="¿Qué cambió en esta versión?" />
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" className="btn-secondary text-sm" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary text-sm">Registrar</button>
        </div>
      </form>
    </div>
  );
}

function bumpVersion(v) {
  if (!v) return '1.1';
  const parts = String(v).split('.');
  if (parts.length === 1) return `${parseInt(v) + 1}.0`;
  const minor = parseInt(parts[parts.length - 1]) + 1;
  return [...parts.slice(0, -1), minor].join('.');
}
