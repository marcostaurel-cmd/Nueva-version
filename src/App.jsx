import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Revisions from './pages/Revisions';
import Reports from './pages/Reports';
import DocumentTypes from './pages/DocumentTypes';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="documents" element={<Documents />} />
            <Route path="revisions" element={<Revisions />} />
            <Route path="reports" element={<Reports />} />
            <Route path="types" element={<DocumentTypes />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
