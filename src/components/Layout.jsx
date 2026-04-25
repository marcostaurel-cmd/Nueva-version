import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  GitBranch,
  BarChart3,
  Layers,
} from 'lucide-react';

const navItems = [
  { to: '/',         label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/documents', label: 'Documentos',  icon: FileText },
  { to: '/revisions', label: 'Revisiones',  icon: GitBranch },
  { to: '/reports',   label: 'Reportes',    icon: BarChart3 },
  { to: '/types',     label: 'Tipos',       icon: Layers },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col fixed h-full z-20">
        <div className="px-6 py-5 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <FileText size={16} />
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight">Control de</p>
              <p className="font-semibold text-sm leading-tight text-blue-400">Documentos</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">v1.0.0 &copy; 2026</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 flex flex-col min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
