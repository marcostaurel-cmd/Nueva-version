import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { formatCurrency, PROJECT_STATUSES } from '../utils/format';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

function getMonthlyData(transactions, year) {
  const months = Array.from({ length: 12 }, (_, i) => ({
    name: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][i],
    income: 0,
    expense: 0,
  }));
  transactions.forEach(t => {
    const d = new Date(t.date || t.createdAt);
    if (d.getFullYear() !== year) return;
    const m = d.getMonth();
    if (t.type === 'income') months[m].income += t.amount;
    else months[m].expense += t.amount;
  });
  return months.map(m => ({ ...m, balance: m.income - m.expense }));
}

function getCategoryData(transactions, categories, type) {
  return categories
    .filter(c => c.type === type)
    .map(c => ({
      name: c.name,
      value: transactions.filter(t => t.categoryId === c.id && t.type === type).reduce((s, t) => s + t.amount, 0),
    }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);
}

function getProjectData(projects, transactions) {
  return projects.map(p => {
    const income = transactions.filter(t => t.projectId === p.id && t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.projectId === p.id && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { name: p.name, income, expense, balance: income - expense };
  }).sort((a, b) => b.income - a.income);
}

export default function Reports() {
  const { state } = useApp();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const years = Array.from(new Set([
    currentYear - 1, currentYear,
    ...state.transactions.map(t => new Date(t.date || t.createdAt).getFullYear()),
  ])).sort((a, b) => b - a);

  const monthly = getMonthlyData(state.transactions, year);
  const incomeCats = getCategoryData(state.transactions, state.categories, 'income');
  const expenseCats = getCategoryData(state.transactions, state.categories, 'expense');
  const projectData = getProjectData(state.projects, state.transactions);

  const totalIncome = state.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = state.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-500 text-sm">Análisis financiero detallado</p>
        </div>
        <select className="select w-auto" value={year} onChange={e => setYear(Number(e.target.value))}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Monthly bar chart */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Ingresos y Egresos mensuales — {year}</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthly} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={v => formatCurrency(v)} />
            <Bar dataKey="income" name="Ingresos" fill="#22c55e" radius={[4,4,0,0]} />
            <Bar dataKey="expense" name="Egresos" fill="#ef4444" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Balance line chart */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Balance mensual — {year}</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={v => formatCurrency(v)} />
            <Line type="monotone" dataKey="balance" name="Balance" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Category pies */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-2">Ingresos por categoría</h2>
          <p className="text-sm text-gray-500 mb-4">Total: {formatCurrency(totalIncome)}</p>
          {incomeCats.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">Sin datos</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={incomeCats} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                    {incomeCats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => formatCurrency(v)} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {incomeCats.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-700">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-green-600">{formatCurrency(d.value)}</span>
                      <span className="text-xs text-gray-400">{totalIncome > 0 ? ((d.value / totalIncome) * 100).toFixed(1) : 0}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-2">Egresos por categoría</h2>
          <p className="text-sm text-gray-500 mb-4">Total: {formatCurrency(totalExpense)}</p>
          {expenseCats.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">Sin datos</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={expenseCats} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                    {expenseCats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => formatCurrency(v)} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {expenseCats.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-700">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-red-500">{formatCurrency(d.value)}</span>
                      <span className="text-xs text-gray-400">{totalExpense > 0 ? ((d.value / totalExpense) * 100).toFixed(1) : 0}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Per project */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Resumen por proyecto</h2>
        {projectData.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-6">Sin proyectos registrados</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={Math.max(200, projectData.length * 50)}>
              <BarChart data={projectData} layout="vertical" barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={120} />
                <Tooltip formatter={v => formatCurrency(v)} />
                <Bar dataKey="income" name="Ingresos" fill="#22c55e" radius={[0,4,4,0]} />
                <Bar dataKey="expense" name="Egresos" fill="#ef4444" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {projectData.map((p, i) => {
                const st = PROJECT_STATUSES[state.projects.find(pr => pr.name === p.name)?.status] || PROJECT_STATUSES.active;
                return (
                  <div key={i} className="flex items-center justify-between py-2 border-t border-gray-50 text-sm">
                    <span className="font-medium text-gray-800">{p.name}</span>
                    <div className="flex gap-6">
                      <span className="text-green-600">{formatCurrency(p.income)}</span>
                      <span className="text-red-500">{formatCurrency(p.expense)}</span>
                      <span className={`font-semibold ${p.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{formatCurrency(p.balance)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
