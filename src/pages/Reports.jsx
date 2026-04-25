import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { DOC_STATUSES, TYPE_DOT_COLORS, STATUS_CHART_COLORS } from '../utils/format';
import { formatDate } from '../utils/format';
import { FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

function getMonthlyCreated(documents) {
  const months = {};
  documents.forEach(d => {
    const dt = new Date(d.createdAt);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    months[key] = (months[key] || 0) + 1;
  });
  const labels = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return Object.entries(months)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, count]) => {
      const [year, month] = key.split('-');
      return { name: `${labels[parseInt(month) - 1]} ${year.slice(2)}`, count };
    });
}

export default function Reports() {
  const { state } = useApp();

  const statusData = Object.entries(DOC_STATUSES).map(([key, val]) => ({
    name: val.label,
    value: state.documents.filter(d => d.status === key).length,
    color: STATUS_CHART_COLORS[key],
  }));

  const typeData = state.documentTypes.map(t => {
    const docs = state.documents.filter(d => d.typeId === t.id);
    return {
      name: t.name,
      total: docs.length,
      aprobados: docs.filter(d => d.status === 'approved').length,
      revision: docs.filter(d => d.status === 'review').length,
      borrador: docs.filter(d => d.status === 'draft').length,
      obsoleto: docs.filter(d => d.status === 'obsolete').length,
      color: TYPE_DOT_COLORS[t.color] || '#3b82f6',
    };
  }).filter(d => d.total > 0);

  const monthlyData = getMonthlyCreated(state.documents);

  const totalDocs = state.documents.length;
  const approved = state.documents.filter(d => d.status === 'approved').length;
  const review = state.documents.filter(d => d.status === 'review').length;

  // Documents with nextReviewDate in next 30 days
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const dueForReview = state.documents.filter(d => {
    if (!d.nextReviewDate) return false;
    const rd = new Date(d.nextReviewDate);
    return rd >= now && rd <= in30;
  });

  const overdue = state.documents.filter(d => {
    if (!d.nextReviewDate) return false;
    return new Date(d.nextReviewDate) < now && d.status !== 'obsolete';
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-500 text-sm">Análisis y estadísticas del sistema documental</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="card flex items-center gap-3 p-4">
          <div className="p-2.5 rounded-xl bg-blue-50">
            <FileText size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-xl font-bold text-gray-900">{totalDocs}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <div className="p-2.5 rounded-xl bg-green-50">
            <CheckCircle size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Aprobados</p>
            <p className="text-xl font-bold text-gray-900">{approved}</p>
            <p className="text-xs text-gray-400">{totalDocs > 0 ? `${Math.round((approved / totalDocs) * 100)}%` : '0%'}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <div className="p-2.5 rounded-xl bg-yellow-50">
            <Clock size={20} className="text-yellow-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">En revisión</p>
            <p className="text-xl font-bold text-gray-900">{review}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <div className="p-2.5 rounded-xl bg-red-50">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Vencidos</p>
            <p className="text-xl font-bold text-gray-900">{overdue.length}</p>
          </div>
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card xl:col-span-2">
          <h2 className="font-semibold text-gray-900 mb-4">Documentos por tipo y estado</h2>
          {typeData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Sin datos</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={typeData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="aprobados" name="Aprobado" fill={STATUS_CHART_COLORS.approved} stackId="s" radius={[0,0,0,0]} />
                <Bar dataKey="revision" name="En Revisión" fill={STATUS_CHART_COLORS.review} stackId="s" />
                <Bar dataKey="borrador" name="Borrador" fill={STATUS_CHART_COLORS.draft} stackId="s" />
                <Bar dataKey="obsoleto" name="Obsoleto" fill={STATUS_CHART_COLORS.obsolete} stackId="s" radius={[4,4,0,0]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Distribución por estado</h2>
          {statusData.every(d => d.value === 0) ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Sin datos</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusData.filter(d => d.value > 0)} cx="50%" cy="50%" outerRadius={72} dataKey="value">
                    {statusData.filter(d => d.value > 0).map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {statusData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-gray-600">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{d.value}</span>
                      <span className="text-xs text-gray-400">
                        {totalDocs > 0 ? `${Math.round((d.value / totalDocs) * 100)}%` : '0%'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Monthly creation chart */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Documentos creados por mes</h2>
        {monthlyData.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Sin datos</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="Documentos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Review alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-3">
            <span className="inline-flex items-center gap-2">
              <Clock size={16} className="text-yellow-500" />
              Próximos a revisar (30 días)
            </span>
          </h2>
          {dueForReview.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Sin revisiones próximas</p>
          ) : (
            <div className="space-y-2">
              {dueForReview.map(doc => {
                const daysLeft = Math.ceil((new Date(doc.nextReviewDate) - now) / (1000 * 60 * 60 * 24));
                return (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{doc.code ? `${doc.code} — ` : ''}{doc.title}</p>
                      <p className="text-xs text-gray-500">Revisión: {formatDate(doc.nextReviewDate)}</p>
                    </div>
                    <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
                      {daysLeft}d
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-3">
            <span className="inline-flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              Revisiones vencidas
            </span>
          </h2>
          {overdue.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Sin revisiones vencidas</p>
          ) : (
            <div className="space-y-2">
              {overdue.map(doc => {
                const daysOver = Math.ceil((now - new Date(doc.nextReviewDate)) / (1000 * 60 * 60 * 24));
                return (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{doc.code ? `${doc.code} — ` : ''}{doc.title}</p>
                      <p className="text-xs text-gray-500">Venció: {formatDate(doc.nextReviewDate)}</p>
                    </div>
                    <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                      +{daysOver}d
                    </span>
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
