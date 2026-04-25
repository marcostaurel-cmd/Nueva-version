import { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const AppContext = createContext(null);

const STORAGE_KEY = 'doc-control-data';

const initialState = {
  documents: [],
  revisions: [],
  documentTypes: [
    { id: 'type-1', name: 'Procedimiento', prefix: 'PRO', color: 'blue' },
    { id: 'type-2', name: 'Instructivo', prefix: 'INS', color: 'green' },
    { id: 'type-3', name: 'Política', prefix: 'POL', color: 'purple' },
    { id: 'type-4', name: 'Formulario', prefix: 'FOR', color: 'yellow' },
    { id: 'type-5', name: 'Registro', prefix: 'REG', color: 'orange' },
    { id: 'type-6', name: 'Manual', prefix: 'MAN', color: 'red' },
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
    // Documents
    case 'ADD_DOCUMENT': {
      const doc = {
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'draft',
        ...action.payload,
      };
      return { ...state, documents: [...state.documents, doc] };
    }
    case 'UPDATE_DOCUMENT': {
      return {
        ...state,
        documents: state.documents.map(d =>
          d.id === action.payload.id
            ? { ...d, ...action.payload, updatedAt: new Date().toISOString() }
            : d
        ),
      };
    }
    case 'DELETE_DOCUMENT': {
      return {
        ...state,
        documents: state.documents.filter(d => d.id !== action.payload),
        revisions: state.revisions.filter(r => r.documentId !== action.payload),
      };
    }
    // Revisions
    case 'ADD_REVISION': {
      const rev = {
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        ...action.payload,
      };
      // Also update document version and status
      const updatedDocs = state.documents.map(d =>
        d.id === rev.documentId
          ? { ...d, version: rev.version, status: rev.status, updatedAt: new Date().toISOString() }
          : d
      );
      return { ...state, revisions: [...state.revisions, rev], documents: updatedDocs };
    }
    case 'DELETE_REVISION': {
      return { ...state, revisions: state.revisions.filter(r => r.id !== action.payload) };
    }
    // Document Types
    case 'ADD_DOCUMENT_TYPE': {
      const dt = { id: uuidv4(), ...action.payload };
      return { ...state, documentTypes: [...state.documentTypes, dt] };
    }
    case 'UPDATE_DOCUMENT_TYPE': {
      return {
        ...state,
        documentTypes: state.documentTypes.map(t =>
          t.id === action.payload.id ? { ...t, ...action.payload } : t
        ),
      };
    }
    case 'DELETE_DOCUMENT_TYPE': {
      return { ...state, documentTypes: state.documentTypes.filter(t => t.id !== action.payload) };
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
export function useDocumentStats() {
  const { state } = useApp();
  const total = state.documents.length;
  const approved = state.documents.filter(d => d.status === 'approved').length;
  const review = state.documents.filter(d => d.status === 'review').length;
  const draft = state.documents.filter(d => d.status === 'draft').length;
  const obsolete = state.documents.filter(d => d.status === 'obsolete').length;
  return { total, approved, review, draft, obsolete };
}
