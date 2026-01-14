import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sequencesApi, SequenceWithSteps, SequenceEnrollment } from '../api/sequences';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Zap,
  Mail,
  Eye,
  MousePointerClick,
  Clock,
  CheckCircle,
  Pause,
  Play,
  Archive,
  TrendingUp,
  Users,
  Calendar,
  BarChart3,
  Smartphone,
  Globe,
} from 'lucide-react';

interface SequenceAnalytics {
  overview: {
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    openRate: number;
    clickRate: number;
  };
  stepMetrics: Array<{
    stepId: string;
    stepName: string;
    stepOrder: number;
    sent: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
  }>;
  deviceStats: Array<{
    device: string;
    count: number;
  }>;
  countryStats: Array<{
    country: string;
    count: number;
  }>;
  engagementTimeline: Array<{
    date: string;
    sent: number;
    opened: number;
    clicked: number;
  }>;
}

export default function SequenceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sequence, setSequence] = useState<SequenceWithSteps | null>(null);
  const [analytics, setAnalytics] = useState<SequenceAnalytics | null>(null);
  const [enrollments, setEnrollments] = useState<SequenceEnrollment[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'steps' | 'contacts'>('overview');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [seqData, analyticsData, enrollmentsData] = await Promise.all([
        sequencesApi.getById(id),
        sequencesApi.getAnalytics(id),
        sequencesApi.getEnrollments(id, { limit: 100 }),
      ]);
      setSequence(seqData);
      setAnalytics(analyticsData);
      setEnrollments(enrollmentsData.enrollments || []);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al cargar secuencia');
      navigate('/sequences');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED') => {
    if (!id) return;

    try {
      await sequencesApi.update(id, { status });
      toast.success('Estado actualizado');
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al actualizar estado');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!sequence || !analytics) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-800',
      PAUSED: 'bg-yellow-100 text-yellow-800',
      ARCHIVED: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles]}`}>
        {status === 'ACTIVE' ? 'Activa' : status === 'PAUSED' ? 'Pausada' : 'Archivada'}
      </span>
    );
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/sequences')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{sequence.name}</h1>
                {sequence.description && (
                  <p className="text-sm text-gray-600">{sequence.description}</p>
                )}
              </div>
            </div>
            {getStatusBadge(sequence.status)}
          </div>

          <div className="flex items-center gap-3">
            {sequence.status === 'ACTIVE' ? (
              <button
                onClick={() => updateStatus('PAUSED')}
                className="btn-secondary flex items-center gap-2"
              >
                <Pause size={16} />
                Pausar
              </button>
            ) : sequence.status === 'PAUSED' ? (
              <button
                onClick={() => updateStatus('ACTIVE')}
                className="btn-secondary flex items-center gap-2"
              >
                <Play size={16} />
                Activar
              </button>
            ) : null}
            {sequence.status !== 'ARCHIVED' && (
              <button
                onClick={() => updateStatus('ARCHIVED')}
                className="btn-secondary flex items-center gap-2"
              >
                <Archive size={16} />
                Archivar
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'overview'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="inline w-4 h-4 mr-2" />
              Resumen
            </button>
            <button
              onClick={() => setActiveTab('steps')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'steps'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Mail className="inline w-4 h-4 mr-2" />
              Pasos
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'contacts'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="inline w-4 h-4 mr-2" />
              Contactos ({enrollments.length})
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Enviados</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalSent}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Abiertos</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalOpened}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <MousePointerClick className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Clics</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalClicked}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tasa Apertura</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics.overview.openRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tasa Clics</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics.overview.clickRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step Performance */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Rendimiento por Paso</h2>
              <div className="space-y-3">
                {analytics.stepMetrics.map((step) => (
                  <div key={step.stepId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-semibold text-indigo-600">
                            {step.stepOrder}
                          </span>
                        </div>
                        <h3 className="font-semibold text-gray-900">{step.stepName}</h3>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Enviados</p>
                        <p className="text-lg font-semibold text-gray-900">{step.sent}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Abiertos</p>
                        <p className="text-lg font-semibold text-gray-900">{step.opened}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Clics</p>
                        <p className="text-lg font-semibold text-gray-900">{step.clicked}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Tasa Apertura</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {step.openRate.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Tasa Clics</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {step.clickRate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Device and Country Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Device Stats */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Smartphone className="w-5 h-5 text-gray-700" />
                  <h2 className="text-lg font-semibold text-gray-900">Dispositivos</h2>
                </div>
                {analytics.deviceStats.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.deviceStats.map((stat, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 capitalize">{stat.device}</span>
                        <span className="text-sm font-semibold text-gray-900">{stat.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No hay datos disponibles</p>
                )}
              </div>

              {/* Country Stats */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-gray-700" />
                  <h2 className="text-lg font-semibold text-gray-900">Países</h2>
                </div>
                {analytics.countryStats.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.countryStats.map((stat, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{stat.country}</span>
                        <span className="text-sm font-semibold text-gray-900">{stat.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No hay datos disponibles</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Steps Tab */}
        {activeTab === 'steps' && (
          <div className="space-y-4">
            {sequence.steps.map((step, index) => (
              <div key={step.id} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-semibold text-indigo-600">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{step.name}</h3>
                    <p className="text-sm text-gray-600">{step.subject}</p>
                  </div>
                </div>

                {index > 0 && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      {step.schedulingType === 'RELATIVE_DELAY' ? (
                        <>
                          <Clock size={16} />
                          <span>
                            Se envía {step.delayDays} días y {step.delayHours} horas después del paso
                            anterior
                          </span>
                        </>
                      ) : (
                        <>
                          <Calendar size={16} />
                          <span>
                            Se envía el{' '}
                            {step.absoluteScheduleDate
                              ? new Date(step.absoluteScheduleDate).toLocaleString('es-MX', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'fecha no especificada'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Contenido HTML:</p>
                  <div className="text-xs text-gray-600 font-mono max-h-40 overflow-y-auto">
                    {step.htmlContent}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contacts Tab */}
        {activeTab === 'contacts' && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Inscrito
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Progreso
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {enrollments.map((enrollment) => {
                    const sent = enrollment.executions.filter((e) => e.status === 'SENT').length;
                    const total = enrollment.executions.length;

                    return (
                      <tr key={enrollment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {enrollment.contact.name || enrollment.contact.email}
                            </p>
                            {enrollment.contact.name && (
                              <p className="text-sm text-gray-600">{enrollment.contact.email}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {enrollment.status === 'ACTIVE' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle size={12} />
                              Activo
                            </span>
                          ) : enrollment.status === 'PAUSED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Pause size={12} />
                              Pausado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <Archive size={12} />
                              Archivado
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(enrollment.enrolledAt).toLocaleDateString('es-MX')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-indigo-600 h-2 rounded-full transition-all"
                                style={{ width: `${(sent / total) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                              {sent}/{total}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {enrollments.length === 0 && (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Sin contactos inscritos</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Aún no hay contactos inscritos en esta secuencia.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
