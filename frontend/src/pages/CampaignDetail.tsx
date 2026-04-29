import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { analyticsApi } from '../api/analytics';
import { CampaignAnalytics } from '../types';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Download, ArrowLeft, Mail, MousePointerClick, Eye, TrendingUp,
  Globe, Smartphone, Clock, Link as LinkIcon, AlertCircle, Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const COLORS = ['#ea580c', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Completada', SENDING: 'Enviando',
  SCHEDULED: 'Programada', FAILED: 'Fallida', DRAFT: 'Borrador',
};

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<CampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    setError(false);
    try {
      const result = await analyticsApi.getCampaign(id!);
      setData(result);
    } catch {
      setError(true);
      toast.error('Error al cargar las analíticas');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await analyticsApi.exportCampaign(id!);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `campaign-${id}-report.csv`;
      a.click();
      toast.success('Reporte exportado exitosamente');
    } catch {
      toast.error('Error al exportar reporte');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando analíticas...</p>
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
          <h3 className="text-base font-semibold text-gray-900 mb-1">No se pudo cargar la campaña</h3>
          <p className="text-sm text-gray-500 mb-4">Verifica tu conexión e intenta de nuevo.</p>
          <button
            onClick={() => { setLoading(true); loadData(); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isDraft = data.campaign.status === 'DRAFT' || data.campaign.status === 'SCHEDULED';
  const hasSentData = data.metrics.sent > 0;

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <button
            onClick={() => navigate('/campaigns')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Volver a campañas
          </button>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-orange-600" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 truncate">{data.campaign.name}</h1>
              </div>
              <div className="flex items-center gap-3 mt-2 pl-1">
                <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                  data.campaign.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' :
                  data.campaign.status === 'SENDING'   ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  data.campaign.status === 'SCHEDULED' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                  data.campaign.status === 'FAILED'    ? 'bg-red-50 text-red-700 border-red-200' :
                                                         'bg-gray-100 text-gray-700 border-gray-300'
                }`}>
                  {STATUS_LABELS[data.campaign.status] ?? data.campaign.status}
                </span>
                {data.campaign.sentAt && (
                  <span className="text-sm text-gray-500">
                    Enviada el {format(new Date(data.campaign.sentAt), 'dd/MM/yyyy HH:mm')}
                  </span>
                )}
              </div>
            </div>
            {hasSentData && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 text-sm font-medium rounded-lg transition-colors flex-shrink-0"
              >
                <Download size={15} />
                Exportar CSV
              </button>
            )}
          </div>
        </div>

        {/* DRAFT / SCHEDULED — no data state */}
        {isDraft && (
          <div className="bg-white rounded-xl border border-orange-200 p-10 text-center">
            <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-7 h-7 text-orange-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Esta campaña aún no ha sido enviada
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              Las analíticas estarán disponibles una vez que la campaña sea enviada y los destinatarios comiencen a interactuar.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => navigate(`/campaigns/${id}/edit`)}
                className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                Editar campaña
              </button>
              <button
                onClick={() => navigate('/campaigns')}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Ir a campañas para enviar
              </button>
            </div>
          </div>
        )}

        {/* Analytics — only when there's sent data */}
        {!isDraft && (
          <>
            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  label: 'Enviados', value: data.metrics.sent.toLocaleString(),
                  sub: null, icon: Mail, color: 'bg-blue-100 text-blue-600',
                },
                {
                  label: 'Aperturas únicas', value: data.metrics.uniqueOpens.toLocaleString(),
                  sub: `${data.metrics.openRate}% tasa`, icon: Eye, color: 'bg-purple-100 text-purple-600',
                },
                {
                  label: 'Clics únicos', value: data.metrics.uniqueClicks.toLocaleString(),
                  sub: `${data.metrics.clickRate}% tasa`, icon: MousePointerClick, color: 'bg-orange-100 text-orange-600',
                },
                {
                  label: 'Tasa de rebote', value: `${data.metrics.bounceRate}%`,
                  sub: `${data.metrics.bounced} rebotados`, icon: TrendingUp, color: 'bg-red-100 text-red-600',
                },
              ].map(({ label, value, sub, icon: Icon, color }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center mb-4 ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
                  <p className="text-3xl font-bold text-gray-900">{value}</p>
                  {sub && <p className="text-sm text-gray-500 mt-1">{sub}</p>}
                </div>
              ))}
            </div>

            {/* Engagement Timeline */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Timeline de interacciones</h2>
                  <p className="text-sm text-gray-500">Aperturas y clics por día</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.engagementTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tickFormatter={(d) => format(new Date(d), 'dd MMM')} stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '16px' }} />
                  <Line type="monotone" dataKey="opens" stroke="#8b5cf6" strokeWidth={3} name="Aperturas" dot={{ fill: '#8b5cf6', r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="clicks" stroke="#ea580c" strokeWidth={3} name="Clics" dot={{ fill: '#ea580c', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Opens by Hour */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Aperturas por hora</h2>
                    <p className="text-sm text-gray-500">Distribución horaria del día</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.opensByHour}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="hour" stroke="#9ca3af" style={{ fontSize: '12px' }} tickFormatter={h => `${h}h`} />
                    <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Aperturas" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Devices */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Dispositivos</h2>
                    <p className="text-sm text-gray-500">Desde dónde se abren los emails</p>
                  </div>
                </div>
                {data.deviceStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={data.deviceStats} dataKey="count" nameKey="device" cx="50%" cy="50%" outerRadius={90} label={({ device, count }) => `${device}: ${count}`}>
                        {data.deviceStats.map((_e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                      <Legend iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-400">
                    <p className="text-sm">Sin datos de dispositivos</p>
                  </div>
                )}
              </div>

              {/* Top Countries */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Países principales</h2>
                    <p className="text-sm text-gray-500">Top 5 por aperturas</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {data.countryStats.length > 0 ? (
                    data.countryStats.slice(0, 5).map((stat, i) => (
                      <div key={stat.country} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 bg-green-100 rounded-md flex items-center justify-center text-xs font-bold text-green-700">
                            {i + 1}
                          </div>
                          <span className="text-sm font-medium text-gray-800">{stat.country}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{stat.count}</span>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-sm text-gray-400">Sin datos de países</div>
                  )}
                </div>
              </div>

              {/* Most Clicked Links */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <LinkIcon className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Links más clicados</h2>
                    <p className="text-sm text-gray-500">Top 5 por clics</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {data.clickedLinks.length > 0 ? (
                    data.clickedLinks.slice(0, 5).map((link, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 p-3 bg-gray-50 hover:bg-orange-50 rounded-lg transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-7 h-7 bg-orange-100 rounded-md flex items-center justify-center text-xs font-bold text-orange-700 flex-shrink-0">
                            {i + 1}
                          </div>
                          <span className="text-sm text-gray-700 truncate" title={link.url}>{link.url}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900 flex-shrink-0">{link.count}</span>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-sm text-gray-400">Sin clics en links registrados</div>
                  )}
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}
