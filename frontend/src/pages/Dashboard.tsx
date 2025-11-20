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
    <div className="p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 bg-blue-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">+12%</span>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">Campañas Totales</p>
            <p className="text-3xl font-bold text-gray-900">{data.summary.totalCampaigns}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">+24%</span>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">Contactos Totales</p>
            <p className="text-3xl font-bold text-gray-900">{data.summary.totalContacts}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 bg-purple-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">+8%</span>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">Tasa de Apertura</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{data.summary.openRate}%</p>
              <span className="text-sm text-gray-500">promedio</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 bg-orange-100 rounded-lg flex items-center justify-center">
                <MousePointerClick className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">+5%</span>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">Tasa de Clics</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{data.summary.clickRate}%</p>
              <span className="text-sm text-gray-500">promedio</span>
            </div>
          </div>
        </div>

        {/* Engagement Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Interacción en el Tiempo</h2>
            <p className="text-sm text-gray-600">Seguimiento de aperturas y clics</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Recent Campaigns */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Campañas Recientes</h2>
            {data.recentCampaigns.length > 0 ? (
              <div className="space-y-2">
                {data.recentCampaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{campaign.name}</p>
                        <p className="text-sm text-gray-500">
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
                <Mail className="w-12 h-12 text-gray-300 mb-2" />
                <p className="text-sm">No hay campañas recientes</p>
              </div>
            )}
          </div>

          {/* Top Engaged Contacts */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contactos Más Activos</h2>
            {data.topContacts.length > 0 ? (
              <div className="space-y-2">
                {data.topContacts.map((contact, index) => (
                  <div
                    key={contact.id}
                    className="flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-blue-600 text-sm">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {contact.name || contact.email}
                        </p>
                        <p className="text-sm text-gray-500 truncate">{contact.email}</p>
                      </div>
                    </div>
                    <div className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium flex-shrink-0">
                      {contact.eventCount}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Users className="w-12 h-12 text-gray-300 mb-2" />
                <p className="text-sm">No hay interacciones registradas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
