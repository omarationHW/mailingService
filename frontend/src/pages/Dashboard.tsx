import { useEffect, useState } from 'react';
import { analyticsApi } from '../api/analytics';
import { DashboardAnalytics } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Mail, Users, MousePointerClick, TrendingUp, BarChart3, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '../store/authStore';

export default function Dashboard() {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await analyticsApi.getDashboard();
      setData(result);
    } catch (error) {
      console.error('Failed to load dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      COMPLETED: 'bg-success-50 text-success-700 border border-success-200',
      SENDING: 'bg-primary-50 text-primary-700 border border-primary-200',
      FAILED: 'bg-red-50 text-red-700 border border-red-200',
      DRAFT: 'bg-gray-100 text-gray-700 border border-gray-300',
    };
    const labels = {
      COMPLETED: 'Completada',
      SENDING: 'Enviando',
      FAILED: 'Fallida',
      DRAFT: 'Borrador',
    };
    return (
      <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl shadow-card border border-gray-200 p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay datos disponibles</h3>
          <p className="text-gray-600 text-sm">
            Comienza creando campañas para ver tus estadísticas
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 via-accent-600 to-primary-600 rounded-3xl p-8 shadow-2xl animate-fade-in">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJoLTYweiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMDUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=')] opacity-30" />
          <div className="relative z-10">
            <h1 className="text-4xl font-extrabold text-white mb-2 drop-shadow-lg">
              ¡Hola, {user?.name || 'Usuario'}! 👋
            </h1>
            <p className="text-white/90 text-lg font-medium">
              Aquí está el resumen de tu rendimiento de email marketing
            </p>
          </div>
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
          <div className="group relative bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden border border-primary-100">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/50 transform group-hover:scale-110 transition-transform duration-300">
                  <Mail className="w-7 h-7 text-white" />
                </div>
              </div>
              <p className="text-gray-600 text-sm font-semibold mb-2">Campañas Totales</p>
              <p className="text-4xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">{data.summary.totalCampaigns}</p>
            </div>
          </div>

          <div className="group relative bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden border border-success-100">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-success-500/20 to-success-600/20 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-success-500 to-success-600 rounded-2xl flex items-center justify-center shadow-lg shadow-success-500/50 transform group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-7 h-7 text-white" />
                </div>
              </div>
              <p className="text-gray-600 text-sm font-semibold mb-2">Contactos Totales</p>
              <p className="text-4xl font-extrabold bg-gradient-to-r from-success-600 to-success-800 bg-clip-text text-transparent">{data.summary.totalContacts}</p>
            </div>
          </div>

          <div className="group relative bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden border border-accent-100">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent-500/20 to-accent-600/20 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center shadow-lg shadow-accent-500/50 transform group-hover:scale-110 transition-transform duration-300">
                  <Eye className="w-7 h-7 text-white" />
                </div>
              </div>
              <p className="text-gray-600 text-sm font-semibold mb-2">Tasa de Apertura</p>
              <p className="text-4xl font-extrabold bg-gradient-to-r from-accent-600 to-accent-800 bg-clip-text text-transparent">{data.summary.openRate}%</p>
            </div>
          </div>

          <div className="group relative bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden border border-purple-100">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50 transform group-hover:scale-110 transition-transform duration-300">
                  <MousePointerClick className="w-7 h-7 text-white" />
                </div>
              </div>
              <p className="text-gray-600 text-sm font-semibold mb-2">Tasa de Clics</p>
              <p className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">{data.summary.clickRate}%</p>
            </div>
          </div>
        </div>

        {/* Engagement Chart */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Interacción en el Tiempo</h2>
              <p className="text-sm text-gray-600">Seguimiento de aperturas y clics</p>
            </div>
          </div>
          {data.engagementOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={data.engagementOverTime}>
                <defs>
                  <linearGradient id="colorOpens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d946ef" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#d946ef" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), 'dd MMM')}
                  stroke="#9ca3af"
                  style={{ fontSize: '13px', fontWeight: '500' }}
                />
                <YAxis stroke="#9ca3af" style={{ fontSize: '13px', fontWeight: '500' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                    padding: '12px'
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
                <Line
                  type="monotone"
                  dataKey="opens"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  name="Aperturas"
                  dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7 }}
                  fill="url(#colorOpens)"
                />
                <Line
                  type="monotone"
                  dataKey="clicks"
                  stroke="#d946ef"
                  strokeWidth={3}
                  name="Clics"
                  dot={{ fill: '#d946ef', r: 5, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7 }}
                  fill="url(#colorClicks)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <BarChart3 className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium">No hay datos de interacción disponibles</p>
            </div>
          )}
        </div>

        {/* Recent Campaigns & Top Contacts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Campaigns */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-lg">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Campañas Recientes</h2>
            </div>
            {data.recentCampaigns.length > 0 ? (
              <div className="space-y-3">
                {data.recentCampaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="group flex justify-between items-start p-4 bg-gradient-to-br from-gray-50 to-white hover:from-primary-50 hover:to-white rounded-xl transition-all duration-300 border-2 border-gray-100 hover:border-primary-200 hover:shadow-lg"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 group-hover:from-primary-500 group-hover:to-primary-600 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-md">
                        <Mail className="w-6 h-6 text-primary-600 group-hover:text-white transition-colors duration-300" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate mb-1">{campaign.name}</p>
                        <p className="text-sm text-gray-600 font-medium">
                          {campaign.recipientsCount} destinatarios
                        </p>
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      {getStatusBadge(campaign.status)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Mail className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium">No hay campañas recientes</p>
              </div>
            )}
          </div>

          {/* Top Engaged Contacts */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-success-500 to-success-600 rounded-lg flex items-center justify-center shadow-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Contactos Más Activos</h2>
            </div>
            {data.topContacts.length > 0 ? (
              <div className="space-y-3">
                {data.topContacts.map((contact, index) => (
                  <div
                    key={contact.id}
                    className="group flex justify-between items-center p-4 bg-gradient-to-br from-gray-50 to-white hover:from-success-50 hover:to-white rounded-xl transition-all duration-300 border-2 border-gray-100 hover:border-success-200 hover:shadow-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-success-100 to-success-200 group-hover:from-success-500 group-hover:to-success-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-success-700 group-hover:text-white transition-all duration-300 shadow-md text-lg">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate mb-1">
                          {contact.name || contact.email}
                        </p>
                        <p className="text-sm text-gray-600 truncate">{contact.email}</p>
                      </div>
                    </div>
                    <div className="ml-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg text-sm font-bold flex-shrink-0 shadow-lg">
                      {contact.eventCount}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium">No hay interacciones registradas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
