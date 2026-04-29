import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sequencesApi, SequenceWithSteps, SequenceEnrollment } from '../api/sequences';
import { contactsApi } from '../api/contacts';
import { Contact } from '../types';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Zap, Mail, Eye, MousePointerClick, Clock, CheckCircle,
  Pause, Play, Archive, TrendingUp, Users, Calendar, BarChart3,
  Smartphone, Globe, UserPlus, X, Search, Tags, Edit,
} from 'lucide-react';
import { format } from 'date-fns';

// ── Analytics shape from backend ──────────────────────────────────────────────
interface SequenceAnalytics {
  metrics: {
    enrollments: number;
    activeEnrollments: number;
    completedEnrollments: number;
    totalExecutions: number;
    sent: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
  };
  stepMetrics: Array<{
    stepId: string;
    name: string;
    subject: string;
    stepOrder: number;
    sent: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
  }>;
  deviceStats: Array<{ device: string; count: number }>;
  countryStats: Array<{ country: string; count: number }>;
  engagementTimeline: Array<{ date: string; opens: number; clicks: number }>;
}

// ── Enroll Modal ──────────────────────────────────────────────────────────────
function EnrollModal({
  sequenceId,
  onClose,
  onEnrolled,
}: {
  sequenceId: string;
  onClose: () => void;
  onEnrolled: () => void;
}) {
  const [tab, setTab] = useState<'search' | 'tags'>('search');
  const [query, setQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tags, setTags] = useState('');
  const [preview, setPreview] = useState<{ count: number; contacts: Array<{ id: string; email: string; name?: string }> } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  // Search contacts
  useEffect(() => {
    if (tab !== 'search') return;
    const t = setTimeout(async () => {
      try {
        const data = await contactsApi.getAll({ search: query || undefined, limit: 20 });
        setContacts(data.contacts);
      } catch { setContacts([]); }
    }, 400);
    return () => clearTimeout(t);
  }, [query, tab]);

  // Preview by tags
  useEffect(() => {
    if (tab !== 'tags') return;
    const t = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const data = await sequencesApi.previewEnrollByTags(sequenceId, tags || undefined);
        setPreview(data);
      } catch { setPreview(null); }
      finally { setPreviewLoading(false); }
    }, 500);
    return () => clearTimeout(t);
  }, [tags, tab, sequenceId]);

  const toggleContact = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleEnrollSelected = async () => {
    if (selected.size === 0) { toast.error('Selecciona al menos un contacto'); return; }
    setEnrolling(true);
    try {
      await sequencesApi.enrollContacts(sequenceId, Array.from(selected));
      toast.success(`${selected.size} contacto(s) inscritos`);
      onEnrolled();
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al inscribir contactos');
    } finally { setEnrolling(false); }
  };

  const handleEnrollByTags = async () => {
    if (!preview || preview.count === 0) { toast.error('No hay contactos elegibles'); return; }
    setEnrolling(true);
    try {
      const { enrolled } = await sequencesApi.enrollByTags(sequenceId, tags || undefined);
      toast.success(`${enrolled} contacto(s) inscritos`);
      onEnrolled();
      onClose();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al inscribir contactos');
    } finally { setEnrolling(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Inscribir contactos</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {([['search', 'Búsqueda individual', Search], ['tags', 'Por tags (masivo)', Tags]] as const).map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === key ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'search' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="Buscar por nombre o email..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {contacts.map(c => (
                  <label key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleContact(c.id)}
                      className="accent-orange-600 w-4 h-4 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{c.name || c.email}</p>
                      {c.name && <p className="text-xs text-gray-500 truncate">{c.email}</p>}
                    </div>
                  </label>
                ))}
                {contacts.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-6">Sin resultados</p>
                )}
              </div>
              {selected.size > 0 && (
                <p className="text-xs text-orange-600 font-medium">{selected.size} contacto(s) seleccionado(s)</p>
              )}
            </div>
          )}

          {tab === 'tags' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tags a inscribir</label>
                <input type="text" value={tags} onChange={e => setTags(e.target.value)}
                  placeholder="vip, newsletter, clientes (separados por comas)"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                <p className="text-xs text-gray-400 mt-1.5">Dejar vacío para inscribir a todos los contactos.</p>
              </div>

              {previewLoading && <p className="text-sm text-gray-400">Calculando...</p>}

              {!previewLoading && preview && (
                <div className={`rounded-lg p-4 border ${preview.count > 0 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                  <p className="text-sm font-semibold text-gray-800 mb-2">
                    {preview.count > 0
                      ? <><span className="text-orange-600 text-lg">{preview.count}</span> contacto(s) elegibles para inscribir</>
                      : 'No hay contactos elegibles (ya inscritos o sin coincidencias)'}
                  </p>
                  {preview.contacts.length > 0 && (
                    <div className="space-y-1">
                      {preview.contacts.map(c => (
                        <p key={c.id} className="text-xs text-gray-600">{c.name ? `${c.name} (${c.email})` : c.email}</p>
                      ))}
                      {preview.count > 5 && <p className="text-xs text-gray-400">y {preview.count - 5} más...</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-5 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          {tab === 'search' ? (
            <button onClick={handleEnrollSelected} disabled={enrolling || selected.size === 0}
              className="px-4 py-2 text-sm font-medium bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-lg transition-colors">
              {enrolling ? 'Inscribiendo...' : `Inscribir ${selected.size > 0 ? `(${selected.size})` : ''}`}
            </button>
          ) : (
            <button onClick={handleEnrollByTags} disabled={enrolling || !preview || preview.count === 0}
              className="px-4 py-2 text-sm font-medium bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-lg transition-colors">
              {enrolling ? 'Inscribiendo...' : `Confirmar inscripción${preview ? ` (${preview.count})` : ''}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SequenceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sequence, setSequence] = useState<SequenceWithSteps | null>(null);
  const [analytics, setAnalytics] = useState<SequenceAnalytics | null>(null);
  const [enrollments, setEnrollments] = useState<SequenceEnrollment[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'steps' | 'contacts'>('overview');
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [seqData, analyticsData, enrollmentsData] = await Promise.all([
        sequencesApi.getById(id),
        sequencesApi.getAnalytics(id),
        sequencesApi.getEnrollments(id, { limit: 100 }),
      ]);
      setSequence(seqData.sequence ?? seqData);
      setAnalytics(analyticsData);
      setEnrollments(enrollmentsData.enrollments ?? []);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al cargar secuencia');
      navigate('/sequences');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  const updateStatus = async (status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED') => {
    if (!id) return;
    try {
      await sequencesApi.update(id, { status });
      toast.success('Estado actualizado');
      loadData();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Error al actualizar estado');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }
  if (!sequence || !analytics) return null;

  const m = analytics.metrics;
  const hasData = m.sent > 0;

  const STATUS_STYLE: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700', PAUSED: 'bg-yellow-100 text-yellow-700', ARCHIVED: 'bg-gray-100 text-gray-600',
  };
  const STATUS_LABEL: Record<string, string> = { ACTIVE: 'Activa', PAUSED: 'Pausada', ARCHIVED: 'Archivada' };

  return (
    <>
      {showEnrollModal && sequence.status === 'ACTIVE' && (
        <EnrollModal sequenceId={id!} onClose={() => setShowEnrollModal(false)} onEnrolled={loadData} />
      )}

      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <button onClick={() => navigate('/sequences')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors group">
              <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              Volver a secuencias
            </button>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold text-gray-900 truncate">{sequence.name}</h1>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${STATUS_STYLE[sequence.status]}`}>
                      {STATUS_LABEL[sequence.status]}
                    </span>
                  </div>
                  {sequence.description && <p className="text-sm text-gray-500 mt-0.5">{sequence.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {sequence.status === 'ACTIVE' && (
                  <button onClick={() => setShowEnrollModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors">
                    <UserPlus size={15} />
                    Inscribir
                  </button>
                )}
                {sequence.status !== 'ARCHIVED' && (
                  <button onClick={() => navigate(`/sequences/${id}/edit`)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors">
                    <Edit size={15} />Editar
                  </button>
                )}
                {sequence.status === 'ACTIVE' && (
                  <button onClick={() => updateStatus('PAUSED')} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors">
                    <Pause size={15} />Pausar
                  </button>
                )}
                {sequence.status === 'PAUSED' && (
                  <button onClick={() => updateStatus('ACTIVE')} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors">
                    <Play size={15} />Activar
                  </button>
                )}
                {sequence.status !== 'ARCHIVED' && (
                  <button onClick={() => updateStatus('ARCHIVED')} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors">
                    <Archive size={15} />Archivar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex gap-1">
              {([
                ['overview', 'Resumen', BarChart3],
                ['steps', 'Pasos', Mail],
                ['contacts', `Contactos (${enrollments.length})`, Users],
              ] as const).map(([key, label, Icon]) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === key ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}>
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Overview Tab ── */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* KPI cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: 'Inscritos',   value: m.enrollments,        icon: Users,            color: 'bg-orange-100 text-orange-600' },
                  { label: 'Activos',     value: m.activeEnrollments,  icon: Play,             color: 'bg-green-100 text-green-600' },
                  { label: 'Enviados',    value: m.sent,               icon: Mail,             color: 'bg-blue-100 text-blue-600' },
                  { label: 'Aperturas',   value: m.opened,             icon: Eye,              color: 'bg-purple-100 text-purple-600' },
                  { label: 'Clics',       value: m.clicked,            icon: MousePointerClick, color: 'bg-pink-100 text-pink-600' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                  </div>
                ))}
              </div>

              {/* Rates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Tasa de apertura', value: `${m.openRate.toFixed(1)}%`, icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
                  { label: 'Tasa de clics',    value: `${m.clickRate.toFixed(1)}%`, icon: TrendingUp, color: 'bg-pink-100 text-pink-600' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{label}</p>
                      <p className="text-2xl font-bold text-gray-900">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Step performance */}
              {analytics.stepMetrics.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-4">Rendimiento por paso</h2>
                  <div className="space-y-3">
                    {analytics.stepMetrics.map(step => (
                      <div key={step.stepId} className="border border-gray-100 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-bold text-orange-600">{step.stepOrder + 1}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-sm">{step.name}</h3>
                            <p className="text-xs text-gray-500">{step.subject}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-5 gap-3 text-sm">
                          {[
                            { label: 'Enviados', value: step.sent },
                            { label: 'Abiertos', value: step.opened },
                            { label: 'Clics', value: step.clicked },
                            { label: 'T. Apertura', value: `${step.openRate.toFixed(1)}%` },
                            { label: 'T. Clics', value: `${step.clickRate.toFixed(1)}%` },
                          ].map(({ label, value }) => (
                            <div key={label}>
                              <p className="text-xs text-gray-500">{label}</p>
                              <p className="font-semibold text-gray-900">{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Device & Country */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Smartphone className="w-5 h-5 text-gray-500" />
                    <h2 className="text-base font-semibold text-gray-900">Dispositivos</h2>
                  </div>
                  {analytics.deviceStats.length > 0 ? (
                    <div className="space-y-2">
                      {analytics.deviceStats.map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700 capitalize">{s.device}</span>
                          <span className="text-sm font-semibold text-gray-900">{s.count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Sin datos de dispositivos</p>
                  )}
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="w-5 h-5 text-gray-500" />
                    <h2 className="text-base font-semibold text-gray-900">Países</h2>
                  </div>
                  {analytics.countryStats.length > 0 ? (
                    <div className="space-y-2">
                      {analytics.countryStats.slice(0, 5).map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">{s.country}</span>
                          <span className="text-sm font-semibold text-gray-900">{s.count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Sin datos de países</p>
                  )}
                </div>
              </div>

              {!hasData && (
                <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
                  <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-7 h-7 text-orange-500" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Aún no hay datos de envío</h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    Las métricas aparecerán aquí una vez que los contactos inscritos reciban sus emails.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Steps Tab ── */}
          {activeTab === 'steps' && (
            <div className="space-y-4">
              {sequence.steps.map((step, index) => (
                <div key={step.id} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-orange-600">{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{step.name}</h3>
                      <p className="text-sm text-gray-500">{step.subject}</p>
                    </div>
                  </div>

                  {index > 0 && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-2 text-sm text-gray-600">
                      {step.schedulingType === 'RELATIVE_DELAY' ? (
                        <><Clock size={14} /><span>Se envía {step.delayDays}d {step.delayHours}h después del paso anterior</span></>
                      ) : (
                        <><Calendar size={14} /><span>Se envía el {step.absoluteScheduleDate ? format(new Date(step.absoluteScheduleDate), 'dd/MM/yyyy HH:mm') : 'fecha no especificada'}</span></>
                      )}
                    </div>
                  )}

                  {/* iframe preview */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
                      <Eye size={13} className="text-gray-400" />
                      <span className="text-xs font-medium text-gray-500">Vista previa del email</span>
                    </div>
                    <iframe
                      srcDoc={step.htmlContent}
                      className="w-full"
                      style={{ height: '300px', border: 'none' }}
                      sandbox="allow-same-origin"
                      title={`Preview paso ${index + 1}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Contacts Tab ── */}
          {activeTab === 'contacts' && (
            <div className="bg-white rounded-xl border border-gray-200">
              {enrollments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['Contacto', 'Estado', 'Inscrito', 'Progreso'].map(h => (
                          <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {enrollments.map(enrollment => {
                        const sent = enrollment.executions.filter(e => e.status === 'SENT').length;
                        const total = enrollment.executions.length;
                        const pct = total > 0 ? (sent / total) * 100 : 0;
                        return (
                          <tr key={enrollment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <p className="font-medium text-gray-900 text-sm">{enrollment.contact.name || enrollment.contact.email}</p>
                              {enrollment.contact.name && <p className="text-xs text-gray-500">{enrollment.contact.email}</p>}
                            </td>
                            <td className="px-6 py-4">
                              {enrollment.status === 'ACTIVE' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle size={11} />Activo</span>
                              ) : enrollment.status === 'PAUSED' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700"><Pause size={11} />Pausado</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"><CheckCircle size={11} />Completado</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {format(new Date(enrollment.enrolledAt), 'dd/MM/yyyy')}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                  <div className="bg-orange-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-xs font-medium text-gray-600 whitespace-nowrap">{sent}/{total}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-7 h-7 text-orange-500" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Sin contactos inscritos</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {sequence.status === 'ACTIVE'
                      ? 'Usa el botón "Inscribir" para agregar contactos a esta secuencia.'
                      : 'Activa la secuencia para poder inscribir contactos.'}
                  </p>
                  {sequence.status === 'ACTIVE' && (
                    <button onClick={() => setShowEnrollModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors">
                      <UserPlus size={15} />
                      Inscribir contactos
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
