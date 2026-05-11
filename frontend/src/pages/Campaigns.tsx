import { useEffect, useState, useCallback, useRef } from 'react';
import { useAutoRefresh, useVisibilityRefresh } from '../hooks/useAutoRefresh';
import { useNavigate } from 'react-router-dom';
import { campaignsApi } from '../api/campaigns';
import { Campaign } from '../types';
import toast from 'react-hot-toast';
import {
  Plus, Send, Trash2, Eye, Mail, Users, Calendar,
  FileText, Search, X, Pencil, AlertTriangle,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: 'bg-green-50 text-green-700 border border-green-200',
  SENDING:   'bg-blue-50 text-blue-700 border border-blue-200',
  SCHEDULED: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  FAILED:    'bg-red-50 text-red-700 border border-red-200',
  DRAFT:     'bg-gray-100 text-gray-700 border border-gray-300',
};
const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Completada', SENDING: 'Enviando',
  SCHEDULED: 'Programada', FAILED: 'Fallida', DRAFT: 'Borrador',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

interface ConfirmModal {
  open: boolean; title: string; message: string;
  confirmLabel: string; confirmClass: string; onConfirm: () => void;
}
const MODAL_CLOSED: ConfirmModal = {
  open: false, title: '', message: '', confirmLabel: '', confirmClass: '', onConfirm: () => {},
};

const PAGE_SIZE = 12;

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalsByStatus, setTotalsByStatus] = useState<Record<string, number>>({});
  const [modal, setModal] = useState<ConfirmModal>(MODAL_CLOSED);

  // Preview modal
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const navigate = useNavigate();

  const loadCampaigns = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await campaignsApi.getAll({
        page,
        limit: PAGE_SIZE,
        ...(search ? { search } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      setCampaigns(data.campaigns);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch {
      toast.error('Error al cargar campañas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter, page]);

  // Single endpoint for all status totals
  const loadStatusTotals = useCallback(async () => {
    try {
      const stats = await campaignsApi.getStats();
      setTotalsByStatus(stats);
    } catch { /* non-critical */ }
  }, []);

  const isFirstLoad = useRef(true);
  useEffect(() => {
    const initial = isFirstLoad.current;
    isFirstLoad.current = false;
    const t = setTimeout(() => loadCampaigns(initial), search ? 400 : 0);
    return () => clearTimeout(t);
  }, [loadCampaigns]);

  useEffect(() => { setPage(1); }, [search, statusFilter]);

  useEffect(() => { loadStatusTotals(); }, [loadStatusTotals]);

  const hasSending = campaigns.some(c => c.status === 'SENDING');
  // Poll every 30s while any campaign is sending; on tab focus always
  useAutoRefresh(() => { loadCampaigns(); loadStatusTotals(); }, 30000, hasSending);
  useVisibilityRefresh(() => { loadCampaigns(); loadStatusTotals(); }, !hasSending);

  // Write iframe content when preview opens
  useEffect(() => {
    if (previewHtml && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) { doc.open(); doc.write(previewHtml); doc.close(); }
    }
  }, [previewHtml]);

  const confirmSend = (id: string, name: string) => {
    setModal({
      open: true,
      title: 'Enviar campaña',
      message: `¿Estás seguro de que quieres enviar "${name}" ahora? Esta acción no se puede deshacer.`,
      confirmLabel: 'Sí, enviar',
      confirmClass: 'bg-orange-600 hover:bg-orange-700 text-white',
      onConfirm: async () => {
        setModal(MODAL_CLOSED);
        try {
          await campaignsApi.send(id);
          toast.success('Campaña enviándose...');
          loadCampaigns();
          loadStatusTotals();
        } catch (error: any) {
          toast.error(error.response?.data?.error || 'Error al enviar campaña');
        }
      },
    });
  };

  const confirmDelete = (id: string, name: string) => {
    setModal({
      open: true,
      title: 'Eliminar campaña',
      message: `¿Estás seguro de que quieres eliminar "${name}"? Esta acción es permanente.`,
      confirmLabel: 'Sí, eliminar',
      confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
      onConfirm: async () => {
        setModal(MODAL_CLOSED);
        try {
          await campaignsApi.delete(id);
          toast.success('Campaña eliminada');
          loadCampaigns();
          loadStatusTotals();
        } catch {
          toast.error('Error al eliminar campaña');
        }
      },
    });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return (
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3">
        <span className="text-xs text-gray-500">{total} campaña{total !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
            className="p-1.5 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronLeft size={16} />
          </button>
          {pages.map((p, i) => p === '...'
            ? <span key={`e${i}`} className="px-2 text-gray-400 text-sm">…</span>
            : <button key={p} onClick={() => setPage(p as number)}
                className={`w-8 h-8 rounded text-sm font-medium transition-colors ${page === p ? 'bg-orange-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
                {p}
              </button>
          )}
          <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
            className="p-1.5 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronRight size={16} />
          </button>
        </div>
        <span className="text-xs text-gray-500">Página {page} de {totalPages}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando campañas...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Confirm Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(MODAL_CLOSED)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">{modal.title}</h3>
                <p className="text-sm text-gray-600">{modal.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setModal(MODAL_CLOSED)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={modal.onConfirm}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${modal.confirmClass}`}>
                {modal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Preview Modal */}
      {previewHtml !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setPreviewHtml(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 flex flex-col" style={{ height: '85vh' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Vista previa del email</h3>
              <button onClick={() => setPreviewHtml(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden rounded-b-xl">
              <iframe
                ref={iframeRef}
                title="Email preview"
                className="w-full h-full border-0"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
      )}

      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Stats Summary — from real totals */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Total', value: Object.values(totalsByStatus).reduce((a, b) => a + b, 0), icon: Mail, color: 'bg-orange-100 text-orange-600' },
              { label: 'Completadas', value: totalsByStatus['COMPLETED'] ?? 0, icon: Send, color: 'bg-green-100 text-green-600' },
              { label: 'Enviando', value: totalsByStatus['SENDING'] ?? 0, icon: Send, color: 'bg-blue-100 text-blue-600' },
              { label: 'Programadas', value: totalsByStatus['SCHEDULED'] ?? 0, icon: Calendar, color: 'bg-yellow-100 text-yellow-600' },
              { label: 'Borradores', value: totalsByStatus['DRAFT'] ?? 0, icon: FileText, color: 'bg-gray-100 text-gray-600' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-gray-500 text-sm font-medium mb-0.5">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nombre o asunto..."
                className="w-full pl-9 pr-9 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={15} />
                </button>
              )}
            </div>
            <select
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              <option value="">Todos los estados</option>
              <option value="DRAFT">Borrador</option>
              <option value="SCHEDULED">Programada</option>
              <option value="SENDING">Enviando</option>
              <option value="COMPLETED">Completada</option>
              <option value="FAILED">Fallida</option>
            </select>
            <button
              onClick={() => navigate('/campaigns/new')}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus size={16} />
              Nueva Campaña
            </button>
          </div>

          {/* Refreshing overlay — keeps cards visible while re-fetching */}
          {refreshing && (
            <div className="flex items-center justify-center gap-2 py-2">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
              <span className="text-xs text-gray-400">Actualizando...</span>
            </div>
          )}

          {/* Empty State */}
          {!loading && !refreshing && campaigns.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {search || statusFilter ? 'No se encontraron campañas' : 'No hay campañas aún'}
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  {search || statusFilter
                    ? 'Intenta con otros filtros de búsqueda.'
                    : 'Comienza creando tu primera campaña de email marketing.'}
                </p>
                {!search && !statusFilter && (
                  <button
                    onClick={() => navigate('/campaigns/new')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Plus size={16} />Crear Primera Campaña
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Campaign Cards */}
          {campaigns.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {campaigns.map(campaign => (
                  <div key={campaign.id}
                    className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow flex flex-col">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-11 h-11 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Mail className="w-5 h-5 text-orange-600" />
                      </div>
                      <StatusBadge status={campaign.status} />
                    </div>

                    {/* Info */}
                    <div className="mb-4 flex-1">
                      <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-1">{campaign.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2">{campaign.subject}</p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Destinatarios</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {(campaign._count?.campaignContacts ?? 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">
                            {campaign.sentAt ? 'Enviada' : 'Creada'}
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            {format(new Date(campaign.sentAt ?? campaign.createdAt), 'dd/MM/yy')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {/* Vista previa — siempre disponible */}
                      <button
                        onClick={() => setPreviewHtml(campaign.htmlContent)}
                        className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Vista previa">
                        <Eye size={16} />
                      </button>

                      {/* Ver analíticas */}
                      {(campaign.status === 'COMPLETED' || campaign.status === 'SENDING' || campaign.status === 'FAILED') && (
                        <button
                          onClick={() => navigate(`/campaigns/${campaign.id}`)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors">
                          <Eye size={15} />Ver analíticas
                        </button>
                      )}

                      {/* Editar — solo DRAFT */}
                      {campaign.status === 'DRAFT' && (
                        <button
                          onClick={() => navigate(`/campaigns/${campaign.id}/edit`)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">
                          <Pencil size={15} />Editar
                        </button>
                      )}

                      {/* Enviar — DRAFT o SCHEDULED */}
                      {(campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED') && (
                        <button
                          onClick={() => confirmSend(campaign.id, campaign.name)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
                          <Send size={15} />Enviar
                        </button>
                      )}

                      {/* Reintentar — FAILED */}
                      {campaign.status === 'FAILED' && (
                        <button
                          onClick={() => confirmSend(campaign.id, campaign.name)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors">
                          <Send size={15} />Reintentar
                        </button>
                      )}

                      {/* Eliminar */}
                      {campaign.status !== 'SENDING' && (
                        <button
                          onClick={() => confirmDelete(campaign.id, campaign.name)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar campaña">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {renderPagination()}
            </>
          )}
        </div>
      </div>
    </>
  );
}
