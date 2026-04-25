import { Link } from 'react-router-dom';
import {
  FileText, CheckCircle, Clock, FileMinus, Plus, ArrowRight, GitBranch,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useApp, useDocumentStats } from '../context/AppContext';
import StatCard from '../components/StatCard';
import { formatDate, DOC_STATUSES, TYPE_DOT_COLORS, STATUS_CHART_COLORS } from '../utils/format';

export default function Dashboard() {
  const { state } = useApp();
  const stats = useDocumentStats();

  const statusData = Object.entries(DOC_STATUSES).map(([key, val]) => ({
    name: val.label,
    value: state.documents.filter(d => d.status === key).length,
    color: STATUS_CHART_COLORS[key],
  })).filter(d => d.value > 0);

  const typeData = state.documentTypes.map(t => ({
    name: t.name,
    total: state.documents.filter(d => d.typeId === t.id).length,
    color: TYPE_DOT_COLORS[t.color] || '#3b82f6',
  })).filter(d => d.total > 0);

  const recentDocs = [...state.documents]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 6);

  const recentRevisions = [...state.revisions]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const pendingReview = state.documents.filter(d => d.status === 'review');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">Resumen del sistema de control de documentos</p>
        </div>
        <Link to="/documents" className="btn-primary">
          <Plus size={16} /> Nuevo Documento
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Documentos" value={stats.total} icon={FileText} color="blue" />
        <StatCard label="Aprobados" value={stats.approved} icon={CheckCircle} color="green" sub={stats.total > 0 ? `${Math.round((stats.approved / stats.total) * 100)}% del total` : undefined} />
        <StatCard label="En Revisión" value={stats.review} icon={Clock} color="yellow" />
        <StatCard label="Obsoletos" value={stats.obsolete} icon={FileMinus} color="red" sub={`${stats.draft} en borrador`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card xl:col-span-2">
          <h2 className="font-semibold text-gray-900 mb-4">Documentos por tipo</h2>
          {typeData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              Sin documentos registrados
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={typeData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" name="Documentos" radius={[4, 4, 0, 0]}>
                  {typeData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Estado de documentos</h2>
          {statusData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              Sin documentos
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={70} dataKey="value">
                    {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {statusData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-gray-600">{d.name}</span>
                    </div>
                    <span className="font-medium text-gray-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pending review alert */}
      {pendingReview.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <Clock size={18} className="text-yellow-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">
              {pendingReview.length} documento{pendingReview.length !== 1 ? 's' : ''} pendiente{pendingReview.length !== 1 ? 's' : ''} de aprobación
            </p>
            <p className="text-xs text-yellow-600 mt-0.5">
              {pendingReview.map(d => d.code || d.title).join(', ')}
            </p>
          </div>
          <Link to="/documents" className="text-xs font-medium text-yellow-700 hover:underline shrink-0">
            Ver
          </Link>
        </div>
      )}

      {/* Bottom rows */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Recent documents */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Documentos recientes</h2>
            <Link to="/documents" className="text-blue-600 text-xs flex items-center gap-1 hover:underline">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          {recentDocs.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No hay documentos registrados</p>
          ) : (
            <div className="space-y-3">
              {recentDocs.map(doc => {
                const type = state.documentTypes.find(t => t.id === doc.typeId);
                const st = DOC_STATUSES[doc.status] || DOC_STATUSES.draft;
                return (
                  <div key={doc.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {type?.prefix || 'DOC'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc.code && <span className="text-gray-400 mr-1">{doc.code}</span>}
                        {doc.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`badge ${st.color}`}>{st.label}</span>
                        <span className="text-xs text-gray-400">v{doc.version}</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{formatDate(doc.updatedAt || doc.createdAt)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent revisions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Últimas revisiones</h2>
            <Link to="/revisions" className="text-blue-600 text-xs flex items-center gap-1 hover:underline">
              Ver todas <ArrowRight size={12} />
            </Link>
          </div>
          {recentRevisions.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No hay revisiones registradas</p>
          ) : (
            <div className="space-y-3">
              {recentRevisions.map(rev => {
                const doc = state.documents.find(d => d.id === rev.documentId);
                const st = DOC_STATUSES[rev.status] || DOC_STATUSES.draft;
                return (
                  <div key={rev.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <GitBranch size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc?.code ? `${doc.code} — ` : ''}{doc?.title || 'Documento eliminado'}
                      </p>
                      <p className="text-xs text-gray-400">
                        v{rev.version} · <span className={`${st.color} px-1 rounded`}>{st.label}</span>
                        {rev.changedBy && ` · ${rev.changedBy}`}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{formatDate(rev.date || rev.createdAt)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
