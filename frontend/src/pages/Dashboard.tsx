import { useEffect, useState, useCallback } from 'react';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { Link } from 'react-router-dom';
import { analyticsApi } from '../api/analytics';
import { DashboardAnalytics } from '../types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import {
  Mail, Users, MousePointerClick, BarChart3, Eye, Send,
  TrendingUp, TrendingDown, Minus, RefreshCw, AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';

function ChangeBadge({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
        <Minus size={11} />
        Sin datos previos
      </span>
    );
  }
  if (value > 0) {
    return (
      <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded flex items-center gap-1">
        <TrendingUp size={11} />
        +{value}%
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded flex items-center gap-1">
        <TrendingDown size={11} />
        {value}%
      </span>
    );
  }
  return (
    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
      <Minus size={11} />
      0%
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: 'bg-green-50 text-green-700 border border-green-200',
  SENDING:   'bg-blue-50 text-blue-700 border border-blue-200',
  SCHEDULED: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  FAILED:    'bg-red-50 text-red-700 border border-red-200',
  DRAFT:     'bg-gray-100 text-gray-700 border border-gray-300',
};
const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Completada',
  SENDING:   'Enviando',
  SCHEDULED: 'Programada',
  FAILED:    'Fallida',
  DRAFT:     'Borrador',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setError(false);
    try {
      const result = await analyticsApi.getDashboard();
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load dashboard', err);
      if (!silent) setError(true);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useAutoRefresh(() => loadData(true), 60000);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">No se pudo cargar el dashboard</h3>
          <p className="text-sm text-gray-500 mb-4">Verifica tu conexión e intenta de nuevo.</p>
          <button
            onClick={() => { setLoading(true); loadData(); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <RefreshCw size={15} />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center m-8">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay datos disponibles</h3>
          <p className="text-gray-500 text-sm">Comienza creando y enviando campañas para ver tus estadísticas aquí.</p>
        </div>
      </div>
    );
  }

  const { summary } = data;
  const changes = summary.changes ?? { campaigns: null, contacts: null, openRate: null, clickRate: null };

  return (
    <div className="p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Header row: last updated + refresh */}
        <div className="flex items-center justify-end gap-3">
          {lastUpdated && (
            <p className="text-xs text-gray-400">
              Actualizado a las {format(lastUpdated, 'HH:mm:ss')}
            </p>
          )}
          <button
            onClick={() => { setLoading(true); loadData(); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
          >
            <RefreshCw size={13} />
            Actualizar
          </button>
        </div>

        {/* KPI Cards — 4 principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Campañas enviadas */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 bg-blue-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <ChangeBadge value={changes.campaigns} />
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">Campañas Enviadas</p>
            <p className="text-3xl font-bold text-gray-900">{summary.totalCampaigns}</p>
            <p className="text-xs text-gray-400 mt-1">vs. mes anterior</p>
          </div>

          {/* Contactos */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <ChangeBadge value={changes.contacts} />
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">Contactos Totales</p>
            <p className="text-3xl font-bold text-gray-900">{summary.totalContacts}</p>
            <p className="text-xs text-gray-400 mt-1">vs. mes anterior</p>
          </div>

          {/* Tasa de apertura */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 bg-purple-100 rounded-lg flex items-center justify-center">
                <Eye className="w-5 h-5 text-purple-600" />
              </div>
              <ChangeBadge value={changes.openRate} />
            </div>
            <div className="flex items-center gap-1 mb-1">
              <p className="text-gray-600 text-sm font-medium">Tasa de Apertura</p>
              <div className="relative group">
                <AlertCircle className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-gray-800 text-white text-xs rounded-lg p-3 hidden group-hover:block z-10 leading-relaxed shadow-lg">
                  Solo incluye aperturas humanas confirmadas. Las aperturas detectadas vía Google Image Proxy (Gmail) son excluidas porque el proxy descarga imágenes automáticamente, sin que el destinatario haya abierto el correo. Clientes como Outlook sí generan datos precisos.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                </div>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{summary.openRate}%</p>
              <span className="text-sm text-gray-500">promedio</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">vs. mes anterior</p>
          </div>

          {/* Tasa de clics */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 bg-orange-100 rounded-lg flex items-center justify-center">
                <MousePointerClick className="w-5 h-5 text-orange-600" />
              </div>
              <ChangeBadge value={changes.clickRate} />
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">Tasa de Clics</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{summary.clickRate}%</p>
              <span className="text-sm text-gray-500">promedio</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">vs. mes anterior</p>
          </div>
        </div>

        {/* Card de métricas brutas — totales acumulados */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Totales acumulados</h2>
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            <div className="flex items-center gap-4 pr-6">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Send className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{summary.totalSent.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Emails enviados</p>
              </div>
            </div>
            <div className="flex items-center gap-4 px-6">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Eye className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{summary.totalOpens.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Aperturas reales</p>
                <p className="text-xs text-gray-400">Excluye proxy de Gmail</p>
              </div>
            </div>
            <div className="flex items-center gap-4 pl-6">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <MousePointerClick className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{summary.totalClicks.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Clics totales</p>
              </div>
            </div>
          </div>
        </div>

        {/* Engagement Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Interacción en el Tiempo</h2>
            <p className="text-sm text-gray-500">Aperturas y clics de los últimos 30 días</p>
          </div>
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800 mb-5">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
            <span>Las aperturas mostradas excluyen las detectadas vía Google Image Proxy (Gmail). Outlook y otros clientes generan datos de apertura precisos.</span>
          </div>
          {data.engagementOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={data.engagementOverTime}>
                <defs>
                  <linearGradient id="colorOpens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d946ef" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#d946ef" stopOpacity={0} />
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
                    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                    padding: '12px',
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                <Line
                  type="monotone" dataKey="opens" stroke="#3b82f6" strokeWidth={3}
                  name="Aperturas"
                  dot={{ fill: '#3b82f6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7 }} fill="url(#colorOpens)"
                />
                <Line
                  type="monotone" dataKey="clicks" stroke="#d946ef" strokeWidth={3}
                  name="Clics"
                  dot={{ fill: '#d946ef', r: 5, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7 }} fill="url(#colorClicks)"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <BarChart3 className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">Aún no hay datos de interacción</p>
              <p className="text-xs text-gray-400 text-center max-w-xs">
                Envía tu primera campaña para comenzar a ver aperturas y clics graficados aquí.
              </p>
            </div>
          )}
        </div>

        {/* Recent Campaigns & Top Contacts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Recent Campaigns */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Campañas Recientes</h2>
              <Link to="/campaigns" className="text-xs text-orange-600 hover:text-orange-700 font-medium">
                Ver todas →
              </Link>
            </div>
            {data.recentCampaigns.length > 0 ? (
              <div className="space-y-2">
                {data.recentCampaigns.map((campaign) => (
                  <Link
                    key={campaign.id}
                    to={`/campaigns/${campaign.id}`}
                    className="flex justify-between items-center p-4 bg-gray-50 hover:bg-orange-50 rounded-md transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Mail className="w-5 h-5 text-gray-400 group-hover:text-orange-500 flex-shrink-0 transition-colors" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate group-hover:text-orange-700 transition-colors">
                          {campaign.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {campaign.recipientsCount} destinatarios
                        </p>
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      <StatusBadge status={campaign.status} />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Mail className="w-12 h-12 text-gray-200 mb-3" />
                <p className="text-sm font-medium text-gray-500 mb-1">No hay campañas recientes</p>
                <p className="text-xs text-gray-400 text-center max-w-xs">
                  Crea y envía tu primera campaña para verla aquí.
                </p>
              </div>
            )}
          </div>

          {/* Top Engaged Contacts */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Contactos Más Activos</h2>
              <Link to="/contacts" className="text-xs text-orange-600 hover:text-orange-700 font-medium">
                Ver todos →
              </Link>
            </div>
            {data.topContacts.length > 0 ? (
              <div className="space-y-2">
                {data.topContacts.map((contact, index) => (
                  <Link
                    key={contact.id}
                    to="/contacts"
                    className="flex justify-between items-center p-4 bg-gray-50 hover:bg-orange-50 rounded-md transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-blue-100 group-hover:bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-blue-600 group-hover:text-orange-600 text-sm transition-colors">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate group-hover:text-orange-700 transition-colors">
                          {contact.name || contact.email}
                        </p>
                        <p className="text-sm text-gray-500 truncate">{contact.email}</p>
                      </div>
                    </div>
                    <div className="ml-2 px-3 py-1 bg-blue-100 group-hover:bg-orange-100 text-blue-700 group-hover:text-orange-700 rounded-md text-sm font-medium flex-shrink-0 transition-colors">
                      {contact.eventCount} eventos
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Users className="w-12 h-12 text-gray-200 mb-3" />
                <p className="text-sm font-medium text-gray-500 mb-1">No hay interacciones registradas</p>
                <p className="text-xs text-gray-400 text-center max-w-xs">
                  Cuando tus contactos abran o hagan clic en tus emails, aparecerán aquí.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
