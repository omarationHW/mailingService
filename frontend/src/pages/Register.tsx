import { Link } from 'react-router-dom';
import { Send, ShieldCheck } from 'lucide-react';

export default function Register() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="w-full max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="text-orange-600" size={28} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Acceso por invitación</h1>
        <p className="text-gray-500 mb-8">
          MailFlow es una plataforma de uso interno. Para obtener acceso, solicita a un administrador que cree tu cuenta.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium text-sm transition-colors"
        >
          <Send size={16} />
          Ir al inicio de sesión
        </Link>
      </div>
    </div>
  );
}
