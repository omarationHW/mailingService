import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { analyticsApi } from '../api/analytics';
import { CampaignAnalytics } from '../types';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Download, ArrowLeft, Mail, MousePointerClick, Eye, TrendingUp, Globe, Smartphone, Clock, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<CampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const result = await analyticsApi.getCampaign(id!);
      setData(result);
    } catch (error) {
      toast.error('Error al cargar analíticas');
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
    } catch (error) {
      toast.error('Error al exportar reporte');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
          <p className="mt-4 text-lg font-semibold text-gray-700">Cargando analíticas...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-700">No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJoLTYweiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMDUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=')] opacity-30" />
          <div className="relative z-10">
            <button
              onClick={() => navigate('/campaigns')}
              className="mb-4 flex items-center gap-2 text-white/90 hover:text-white transition-colors group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Volver a Campañas</span>
            </button>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-extrabold text-white mb-2 drop-shadow-lg">
                  {data.campaign.name}
                </h1>
                <p className="text-white/90 text-lg font-medium">Analíticas de Campaña</p>
                {data.campaign.sentAt && (
                  <p className="text-white/80 text-sm mt-1">
                    Enviada el {format(new Date(data.campaign.sentAt), 'dd/MM/yyyy HH:mm')}
                  </p>
                )}
              </div>
              <button
                onClick={handleExport}
                className="btn-secondary flex items-center gap-2"
              >
                <Download size={20} />
                Exportar Reporte
              </button>
            </div>
          </div>
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
          {/* Sent */}
          <div className="group relative bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/50 transform group-hover:scale-110 transition-transform duration-300">
                  <Mail className="w-7 h-7 text-white" />
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">Enviados</p>
              <p className="text-3xl font-extrabold text-gray-900">{data.metrics.sent.toLocaleString()}</p>
            </div>
          </div>

          {/* Opens */}
          <div className="group relative bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/50 transform group-hover:scale-110 transition-transform duration-300">
                  <Eye className="w-7 h-7 text-white" />
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">Aperturas</p>
              <p className="text-3xl font-extrabold text-gray-900">{data.metrics.uniqueOpens.toLocaleString()}</p>
              <div className="mt-2 inline-flex items-center gap-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                <TrendingUp size={14} />
                {data.metrics.openRate}%
              </div>
            </div>
          </div>

          {/* Clicks */}
          <div className="group relative bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50 transform group-hover:scale-110 transition-transform duration-300">
                  <MousePointerClick className="w-7 h-7 text-white" />
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">Clicks</p>
              <p className="text-3xl font-extrabold text-gray-900">{data.metrics.uniqueClicks.toLocaleString()}</p>
              <div className="mt-2 inline-flex items-center gap-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-3 py-1 rounded-full text-sm font-bold">
                <TrendingUp size={14} />
                {data.metrics.clickRate}%
              </div>
            </div>
          </div>

          {/* Bounce Rate */}
          <div className="group relative bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/50 transform group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-7 h-7 text-white rotate-180" />
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-1">Tasa de Rebote</p>
              <p className="text-3xl font-extrabold text-gray-900">{data.metrics.bounceRate}%</p>
              <p className="text-sm text-gray-600 mt-2">
                {data.metrics.bounced} rebotados
              </p>
            </div>
          </div>
        </div>

        {/* Engagement Timeline */}
        <div className="bg-white rounded-2xl shadow-xl p-8 animate-scale-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-700" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Timeline de Interacciones</h2>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data.engagementTimeline}>
              <defs>
                <linearGradient id="colorOpens" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => format(new Date(date), 'dd MMM')}
                stroke="#6b7280"
              />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="opens"
                stroke="#10b981"
                strokeWidth={3}
                name="Aperturas"
                dot={{ fill: '#10b981', r: 5 }}
                activeDot={{ r: 7 }}
                fill="url(#colorOpens)"
              />
              <Line
                type="monotone"
                dataKey="clicks"
                stroke="#8b5cf6"
                strokeWidth={3}
                name="Clicks"
                dot={{ fill: '#8b5cf6', r: 5 }}
                activeDot={{ r: 7 }}
                fill="url(#colorClicks)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Opens by Hour */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-700" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Aperturas por Hora</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.opensByHour}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="hour" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="url(#barGradient)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Devices */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-purple-700" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Dispositivos</h2>
            </div>
            {data.deviceStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.deviceStats}
                    dataKey="count"
                    nameKey="device"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ device, count }) => `${device}: ${count}`}
                  >
                    {data.deviceStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <p>No hay datos de dispositivos disponibles</p>
              </div>
            )}
          </div>

          {/* Top Countries */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-green-700" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Países Principales</h2>
            </div>
            <div className="space-y-3">
              {data.countryStats.length > 0 ? (
                data.countryStats.slice(0, 5).map((stat, index) => (
                  <div
                    key={stat.country}
                    className="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white hover:from-green-50 hover:to-green-50 rounded-xl border border-gray-100 hover:border-green-200 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center font-bold text-green-700">
                        {index + 1}
                      </div>
                      <span className="font-semibold text-gray-900">{stat.country}</span>
                    </div>
                    <span className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                      {stat.count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No hay datos de países disponibles</p>
              )}
            </div>
          </div>

          {/* Most Clicked Links */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl flex items-center justify-center">
                <LinkIcon className="w-6 h-6 text-pink-700" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Links Más Clickeados</h2>
            </div>
            <div className="space-y-3">
              {data.clickedLinks.length > 0 ? (
                data.clickedLinks.slice(0, 5).map((link, index) => (
                  <div
                    key={index}
                    className="group flex items-start justify-between p-4 bg-gradient-to-r from-gray-50 to-white hover:from-pink-50 hover:to-pink-50 rounded-xl border border-gray-100 hover:border-pink-200 transition-all duration-300"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-100 to-pink-200 rounded-lg flex items-center justify-center font-bold text-pink-700 flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="text-sm text-gray-700 truncate group-hover:text-pink-700 transition-colors" title={link.url}>
                        {link.url}
                      </span>
                    </div>
                    <span className="text-xl font-bold text-gray-900 group-hover:text-pink-600 transition-colors ml-3 flex-shrink-0">
                      {link.count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No hay datos de clicks en links</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
