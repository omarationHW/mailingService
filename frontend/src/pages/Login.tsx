import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { Send, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const errors = {
    email: touched.email && !email ? 'El email es requerido' : touched.email && !/\S+@\S+\.\S+/.test(email) ? 'Email inválido' : '',
    password: touched.password && !password ? 'La contraseña es requerida' : '',
  };

  const isValid = !errors.email && !errors.password && email && password;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!isValid) return;
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Bienvenido de vuelta');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-orange-600 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
            <Send className="text-white" size={18} />
          </div>
          <span className="text-white text-xl font-bold">MailFlow</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Tu plataforma de email marketing profesional
          </h2>
          <p className="text-orange-100 text-lg">
            Campañas, secuencias automatizadas y analíticas en un solo lugar.
          </p>
        </div>
        <p className="text-orange-200 text-sm">© 2025 MailFlow. Todos los derechos reservados.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-lg bg-orange-600 flex items-center justify-center">
              <Send className="text-white" size={18} />
            </div>
            <span className="text-gray-900 text-xl font-bold">MailFlow</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Iniciar sesión</h1>
          <p className="text-gray-500 mb-8">Ingresa tus credenciales para continuar</p>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, email: true }))}
                className={`w-full px-4 py-3 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
                }`}
                placeholder="tu@empresa.com"
              />
              {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, password: true }))}
                  className={`w-full px-4 py-3 pr-11 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-500">
            ¿No tienes cuenta?{' '}
            <span className="text-orange-600 font-medium">Contacta a un administrador</span>
          </p>
        </div>
      </div>
    </div>
  );
}
