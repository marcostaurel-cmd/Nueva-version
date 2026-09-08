import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import Categories from './pages/Categories';
import FileCopyManager from './pages/FileCopyManager';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="reports" element={<Reports />} />
            <Route path="categories" element={<Categories />} />
            <Route path="file-copy" element={<FileCopyManager />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
