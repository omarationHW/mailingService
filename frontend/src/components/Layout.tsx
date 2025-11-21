import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard,
  Users,
  Mail,
  FileText,
  LogOut,
  List,
  Search,
  Bell,
  Settings,
  ChevronDown,
  Plus,
  Send,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    {
      path: '/',
      icon: LayoutDashboard,
      label: 'Dashboard',
      description: 'Vista general'
    },
    {
      path: '/campaigns',
      icon: Mail,
      label: 'Campañas',
      description: 'Gestiona tus emails'
    },
    {
      path: '/sequences',
      icon: Zap,
      label: 'Secuencias',
      description: 'Automatización'
    },
    {
      path: '/contacts',
      icon: Users,
      label: 'Contactos',
      description: 'Base de datos'
    },
    {
      path: '/contact-lists',
      icon: List,
      label: 'Listas',
      description: 'Segmentación'
    },
    {
      path: '/templates',
      icon: FileText,
      label: 'Plantillas',
      description: 'Diseños guardados'
    },
  ];

  const getPageTitle = () => {
    const item = navItems.find(item => item.path === location.pathname);
    return item?.label || 'Dashboard';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-50 flex flex-col border-r border-gray-200">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-600 flex items-center justify-center">
              <Send className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                MailFlow
              </h1>
              <p className="text-xs text-gray-500">Email Marketing</p>
            </div>
          </div>
        </div>

        {/* Quick Action */}
        <div className="px-4 py-4">
          <Link
            to="/campaigns/new"
            className="flex items-center justify-center gap-2 w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            <span>Nueva Campaña</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  active
                    ? 'bg-orange-50 text-orange-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={18} className={active ? 'text-orange-600' : 'text-gray-400'} />
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.label}</p>
                </div>
                {active && (
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-600"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-gray-700 font-semibold text-sm">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Usuario'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
            </button>

            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                <button
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings size={16} />
                  <span>Configuración</span>
                </button>
                <div className="my-1 border-t border-gray-200"></div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h2 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h2>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
