import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';
import toast from 'react-hot-toast';
import { User, Lock, Shield, Eye, EyeOff } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  EDITOR: 'Editor',
  VIEWER: 'Viewer',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-orange-100 text-orange-700 border-orange-200',
  EDITOR: 'bg-blue-100 text-blue-700 border-blue-200',
  VIEWER: 'bg-gray-100 text-gray-600 border-gray-200',
};

export default function Settings() {
  const { user, updateUser } = useAuthStore();

  // Profile form
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { user: updated } = await authApi.updateProfile({
        name: profileName || undefined,
        email: profileEmail || undefined,
      });
      updateUser(updated);
      toast.success('Perfil actualizado');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al actualizar perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setSavingPassword(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      toast.success('Contraseña actualizada');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cambiar contraseña');
    } finally {
      setSavingPassword(false);
    }
  };

  const initials = (user?.name || user?.email || '?').charAt(0).toUpperCase();

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Account overview */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-orange-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-gray-900 truncate">{user?.name || 'Sin nombre'}</p>
              <p className="text-sm text-gray-500 truncate">{user?.email}</p>
              <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border ${ROLE_COLORS[user?.role || ''] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {ROLE_LABELS[user?.role || ''] ?? user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Profile */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 p-5 border-b border-gray-100">
            <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Información de perfil</h2>
              <p className="text-xs text-gray-500">Actualiza tu nombre y dirección de email</p>
            </div>
          </div>
          <form onSubmit={handleProfileSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre</label>
              <input
                type="text"
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                required
                value={profileEmail}
                onChange={e => setProfileEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
              />
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition"
              >
                {savingProfile ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>

        {/* Password */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 p-5 border-b border-gray-100">
            <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Contraseña</h2>
              <p className="text-xs text-gray-500">Cambia tu contraseña de acceso</p>
            </div>
          </div>
          <form onSubmit={handlePasswordSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña actual <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
                <button type="button" onClick={() => setShowCurrent(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nueva contraseña <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirmar nueva contraseña <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-2.5 pr-10 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition ${
                    confirmPassword && confirmPassword !== newPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-xs text-red-500 mt-1.5">Las contraseñas no coinciden</p>
              )}
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={savingPassword}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition"
              >
                {savingPassword ? 'Cambiando...' : 'Cambiar contraseña'}
              </button>
            </div>
          </form>
        </div>

        {/* Account info (read-only) */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center gap-3 p-5 border-b border-gray-100">
            <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Información de cuenta</h2>
              <p className="text-xs text-gray-500">Datos de solo lectura</p>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
              <span className="text-sm text-gray-500">Rol</span>
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${ROLE_COLORS[user?.role || ''] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {ROLE_LABELS[user?.role || ''] ?? user?.role}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm text-gray-500">ID de cuenta</span>
              <span className="text-xs font-mono text-gray-400">{user?.id?.slice(0, 8)}...</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
