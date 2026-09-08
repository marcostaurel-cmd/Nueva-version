import { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const AppContext = createContext(null);

const STORAGE_KEY = 'project-tracker-data';

const initialState = {
  projects: [],
  transactions: [],
  categories: [
    { id: 'cat-1', name: 'Ventas', type: 'income' },
    { id: 'cat-2', name: 'Servicios', type: 'income' },
    { id: 'cat-3', name: 'Inversión', type: 'income' },
    { id: 'cat-4', name: 'Otros ingresos', type: 'income' },
    { id: 'cat-5', name: 'Materiales', type: 'expense' },
    { id: 'cat-6', name: 'Personal', type: 'expense' },
    { id: 'cat-7', name: 'Marketing', type: 'expense' },
    { id: 'cat-8', name: 'Infraestructura', type: 'expense' },
    { id: 'cat-9', name: 'Administrativo', type: 'expense' },
    { id: 'cat-10', name: 'Otros egresos', type: 'expense' },
  ],
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...initialState, ...parsed };
    }
  } catch {}
  return initialState;
}

function reducer(state, action) {
  switch (action.type) {
    // Projects
    case 'ADD_PROJECT': {
      const project = { id: uuidv4(), createdAt: new Date().toISOString(), status: 'active', ...action.payload };
      return { ...state, projects: [...state.projects, project] };
    }
    case 'UPDATE_PROJECT': {
      return {
        ...state,
        projects: state.projects.map(p => p.id === action.payload.id ? { ...p, ...action.payload } : p),
      };
    }
    case 'DELETE_PROJECT': {
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.payload),
        transactions: state.transactions.filter(t => t.projectId !== action.payload),
      };
    }
    // Transactions
    case 'ADD_TRANSACTION': {
      const tx = { id: uuidv4(), createdAt: new Date().toISOString(), ...action.payload };
      return { ...state, transactions: [...state.transactions, tx] };
    }
    case 'UPDATE_TRANSACTION': {
      return {
        ...state,
        transactions: state.transactions.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t),
      };
    }
    case 'DELETE_TRANSACTION': {
      return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload) };
    }
    // Categories
    case 'ADD_CATEGORY': {
      const cat = { id: uuidv4(), ...action.payload };
      return { ...state, categories: [...state.categories, cat] };
    }
    case 'DELETE_CATEGORY': {
      return { ...state, categories: state.categories.filter(c => c.id !== action.payload) };
    }
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// Derived selectors
export function useProjectStats(projectId) {
  const { state } = useApp();
  const txs = state.transactions.filter(t => t.projectId === projectId);
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  return { income, expense, balance: income - expense, count: txs.length };
}

export function useGlobalStats() {
  const { state } = useApp();
  const income = state.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = state.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  return {
    income,
    expense,
    balance: income - expense,
    totalProjects: state.projects.length,
    activeProjects: state.projects.filter(p => p.status === 'active').length,
  };
}
