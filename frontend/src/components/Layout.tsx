import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore, AppNotification } from '../store/notificationStore';
import {
  LayoutDashboard, Users, Mail, FileText, LogOut, List,
  Bell, Settings, ChevronDown, Plus, Send, Zap, X,
  AlertCircle, CheckCircle2, AlertTriangle, Info,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const NOTIF_ICONS: Record<AppNotification['type'], JSX.Element> = {
  error:   <AlertCircle size={16} className="text-red-500 flex-shrink-0" />,
  success: <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />,
  warning: <AlertTriangle size={16} className="text-yellow-500 flex-shrink-0" />,
  info:    <Info size={16} className="text-blue-500 flex-shrink-0" />,
};

export default function Layout() {
  const { user, logout } = useAuthStore();
  const { notifications, fetch: fetchNotifications, markRead, markAllRead, unreadCount } = useNotificationStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Fetch notifications on mount and every 5 minutes
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: '/',              icon: LayoutDashboard, label: 'Dashboard',  description: 'Vista general' },
    { path: '/campaigns',     icon: Mail,            label: 'Campañas',   description: 'Gestiona tus emails' },
    { path: '/sequences',     icon: Zap,             label: 'Secuencias', description: 'Automatización' },
    { path: '/contacts',      icon: Users,           label: 'Contactos',  description: 'Base de datos' },
    { path: '/contact-lists', icon: List,            label: 'Listas',     description: 'Segmentación' },
    { path: '/templates',     icon: FileText,        label: 'Plantillas', description: 'Diseños guardados' },
  ];

  const getPageTitle = () => {
    const p = location.pathname;
    if (p === '/') return 'Dashboard';
    if (p.startsWith('/campaigns/new')) return 'Nueva Campaña';
    if (p.match(/^\/campaigns\/.+\/edit$/)) return 'Editar Campaña';
    if (p.match(/^\/campaigns\/.+$/)) return 'Detalle de Campaña';
    if (p === '/campaigns') return 'Campañas';
    if (p.startsWith('/sequences/new')) return 'Nueva Secuencia';
    if (p.match(/^\/sequences\/.+\/edit$/)) return 'Editar Secuencia';
    if (p.match(/^\/sequences\/.+$/)) return 'Detalle de Secuencia';
    if (p === '/sequences') return 'Secuencias';
    if (p === '/contacts') return 'Contactos';
    if (p.match(/^\/contact-lists\/.+$/)) return 'Detalle de Lista';
    if (p === '/contact-lists') return 'Listas';
    if (p === '/templates') return 'Plantillas';
    if (p === '/settings') return 'Configuración';
    return 'MailFlow';
  };

  const initials = (user?.name || user?.email || '?').charAt(0).toUpperCase();
  const unread = unreadCount();

  const handleNotifClick = (notif: AppNotification) => {
    markRead(notif.id);
    if (notif.link) {
      navigate(notif.link);
      setShowNotifications(false);
    }
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
              <h1 className="text-lg font-bold text-gray-900">MailFlow</h1>
              <p className="text-xs text-gray-500">Email Marketing</p>
            </div>
          </div>
        </div>

        {/* Quick Action */}
        <div className="px-4 py-4">
          <Link
            to="/campaigns/new"
            className="flex items-center justify-center gap-2 w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors text-sm"
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
                  active ? 'bg-orange-50 text-orange-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={18} className={active ? 'text-orange-600' : 'text-gray-400'} />
                <p className="font-medium text-sm flex-1">{item.label}</p>
                {active && <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setShowUserMenu(v => !v)}
              className="flex items-center gap-3 w-full p-2.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Usuario'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <ChevronDown size={16} className={`text-gray-400 flex-shrink-0 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <Link
                  to="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings size={16} />
                  <span>Configuración</span>
                </Link>
                <div className="my-1 border-t border-gray-200" />
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
            <h2 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h2>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(v => !v)}
                className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell size={20} />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold leading-none">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 flex flex-col max-h-96">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="text-sm font-semibold text-gray-900">
                      Notificaciones {unread > 0 && <span className="ml-1 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{unread}</span>}
                    </span>
                    <div className="flex items-center gap-2">
                      {unread > 0 && (
                        <button onClick={markAllRead} className="text-xs text-orange-600 hover:text-orange-700 font-medium">
                          Marcar todas
                        </button>
                      )}
                      <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="overflow-y-auto flex-1">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Bell size={18} className="text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-400">Sin notificaciones</p>
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <button
                          key={notif.id}
                          onClick={() => handleNotifClick(notif)}
                          className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                            !notif.read ? 'bg-orange-50/40' : ''
                          }`}
                        >
                          <div className="mt-0.5">{NOTIF_ICONS[notif.type]}</div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium text-gray-900 truncate ${!notif.read ? 'font-semibold' : ''}`}>
                              {notif.title}
                            </p>
                            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{notif.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {format(notif.createdAt, "d MMM, HH:mm", { locale: es })}
                            </p>
                          </div>
                          {!notif.read && (
                            <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 flex-shrink-0" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
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
