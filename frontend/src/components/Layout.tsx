import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard,
  Users,
  Mail,
  FileText,
  LogOut,
  Sparkles,
  List,
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', gradient: 'from-blue-500 to-purple-600' },
    { path: '/campaigns', icon: Mail, label: 'Campaigns', gradient: 'from-purple-500 to-pink-600' },
    { path: '/contacts', icon: Users, label: 'Contacts', gradient: 'from-pink-500 to-rose-600' },
    { path: '/contact-lists', icon: List, label: 'Contact Lists', gradient: 'from-rose-500 to-pink-600' },
    { path: '/templates', icon: FileText, label: 'Templates', gradient: 'from-orange-500 to-red-600' },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex flex-col shadow-2xl relative overflow-hidden">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-accent-500/10 to-transparent pointer-events-none" />

        {/* Logo & User */}
        <div className="relative p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/50">
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                MailFlow
              </h1>
              <p className="text-xs text-gray-400">Email Marketing Platform</p>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
            <p className="text-xs text-gray-400 mb-1">Logged in as</p>
            <p className="text-sm text-white font-medium truncate">{user?.email}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="relative flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 font-semibold text-sm overflow-hidden ${
                  active
                    ? 'bg-white/10 text-white shadow-lg scale-105'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {/* Gradient background on hover/active */}
                <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${active ? 'opacity-20' : ''}`} />

                {/* Icon with gradient background */}
                <div className={`relative w-10 h-10 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg transform transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
                  <Icon size={20} className="text-white" />
                </div>

                <span className="relative z-10">{item.label}</span>

                {/* Active indicator */}
                {active && (
                  <div className="absolute right-3 w-2 h-2 rounded-full bg-gradient-to-r from-primary-400 to-accent-400 shadow-lg shadow-primary-500/50 animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="relative p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3.5 w-full text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-300 font-semibold text-sm group"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:scale-110">
              <LogOut size={20} className="text-white" />
            </div>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
