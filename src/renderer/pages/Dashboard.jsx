import { Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Wallet, FolderKanban, Plus, ArrowRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useApp, useGlobalStats } from '../context/AppContext';
import StatCard from '../components/StatCard';
import { formatCurrency, formatDate, PROJECT_STATUSES } from '../utils/format';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function getMonthlyData(transactions) {
  const months = {};
  transactions.forEach(t => {
    const d = new Date(t.date || t.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!months[key]) months[key] = { name: key, income: 0, expense: 0 };
    if (t.type === 'income') months[key].income += t.amount;
    else months[key].expense += t.amount;
  });
  return Object.values(months).sort((a, b) => a.name.localeCompare(b.name)).slice(-6);
}

function formatMonthLabel(key) {
  const [year, month] = key.split('-');
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${months[parseInt(month) - 1]} ${year.slice(2)}`;
}

export default function Dashboard() {
  const { state } = useApp();
  const stats = useGlobalStats();

  const monthlyData = getMonthlyData(state.transactions).map(d => ({
    ...d,
    name: formatMonthLabel(d.name),
  }));

  const categoryData = state.categories
    .filter(c => c.type === 'expense')
    .map(c => {
      const total = state.transactions
        .filter(t => t.type === 'expense' && t.categoryId === c.id)
        .reduce((s, t) => s + t.amount, 0);
      return { name: c.name, value: total };
    })
    .filter(d => d.value > 0);

  const recentTxs = [...state.transactions]
    .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
    .slice(0, 5);

  const recentProjects = [...state.projects]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">Resumen general de proyectos y finanzas</p>
        </div>
        <div className="flex gap-2">
          <Link to="/projects/new" className="btn-primary">
            <Plus size={16} /> Nuevo Proyecto
          </Link>
          <Link to="/transactions/new" className="btn-success">
            <Plus size={16} /> Movimiento
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Balance Total"
          value={formatCurrency(stats.balance)}
          icon={Wallet}
          color={stats.balance >= 0 ? 'blue' : 'red'}
        />
        <StatCard
          label="Total Ingresos"
          value={formatCurrency(stats.income)}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          label="Total Egresos"
          value={formatCurrency(stats.expense)}
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          label="Proyectos Activos"
          value={stats.activeProjects}
          icon={FolderKanban}
          color="purple"
          sub={`${stats.totalProjects} en total`}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card xl:col-span-2">
          <h2 className="font-semibold text-gray-900 mb-4">Ingresos vs Egresos (últimos 6 meses)</h2>
          {monthlyData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              Sin datos disponibles
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="income" name="Ingresos" fill="#22c55e" radius={[4,4,0,0]} />
                <Bar dataKey="expense" name="Egresos" fill="#ef4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Egresos por categoría</h2>
          {categoryData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              Sin egresos registrados
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent rows */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Recent transactions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Últimos movimientos</h2>
            <Link to="/transactions" className="text-blue-600 text-xs flex items-center gap-1 hover:underline">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          {recentTxs.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No hay movimientos registrados</p>
          ) : (
            <div className="space-y-3">
              {recentTxs.map(tx => {
                const project = state.projects.find(p => p.id === tx.projectId);
                const cat = state.categories.find(c => c.id === tx.categoryId);
                return (
                  <div key={tx.id} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      tx.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{tx.description}</p>
                      <p className="text-xs text-gray-400">{project?.name || '—'} · {cat?.name || '—'} · {formatDate(tx.date || tx.createdAt)}</p>
                    </div>
                    <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent projects */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Proyectos recientes</h2>
            <Link to="/projects" className="text-blue-600 text-xs flex items-center gap-1 hover:underline">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          {recentProjects.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No hay proyectos creados</p>
          ) : (
            <div className="space-y-3">
              {recentProjects.map(project => {
                const income = state.transactions.filter(t => t.projectId === project.id && t.type === 'income').reduce((s, t) => s + t.amount, 0);
                const expense = state.transactions.filter(t => t.projectId === project.id && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
                const balance = income - expense;
                const st = PROJECT_STATUSES[project.status] || PROJECT_STATUSES.active;
                return (
                  <div key={project.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                      {project.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                      <span className={`badge ${st.color}`}>{st.label}</span>
                    </div>
                    <span className={`text-sm font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(balance)}
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
