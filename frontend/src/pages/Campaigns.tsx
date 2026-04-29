import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { campaignsApi } from '../api/campaigns';
import { Campaign } from '../types';
import toast from 'react-hot-toast';
import {
  Plus, Send, Trash2, Eye, Mail, Users, Calendar,
  FileText, Search, X, Pencil, AlertTriangle,
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
  COMPLETED: 'Completada',
  SENDING:   'Enviando',
  SCHEDULED: 'Programada',
  FAILED:    'Fallida',
  DRAFT:     'Borrador',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

interface ConfirmModal {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => void;
}

const MODAL_CLOSED: ConfirmModal = {
  open: false, title: '', message: '', confirmLabel: '', confirmClass: '', onConfirm: () => {},
};

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState<ConfirmModal>(MODAL_CLOSED);
  const navigate = useNavigate();

  const loadCampaigns = useCallback(async () => {
    try {
      const data = await campaignsApi.getAll({
        limit: 100,
        ...(search ? { search } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      setCampaigns(data.campaigns);
    } catch {
      toast.error('Error al cargar campañas');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    setLoading(true);
    loadCampaigns();
  }, [loadCampaigns]);

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
        } catch {
          toast.error('Error al eliminar campaña');
        }
      },
    });
  };

  const counts = {
    total: campaigns.length,
    completed: campaigns.filter(c => c.status === 'COMPLETED').length,
    sending: campaigns.filter(c => c.status === 'SENDING').length,
    scheduled: campaigns.filter(c => c.status === 'SCHEDULED').length,
    draft: campaigns.filter(c => c.status === 'DRAFT').length,
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
              <button
                onClick={() => setModal(MODAL_CLOSED)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={modal.onConfirm}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${modal.confirmClass}`}
              >
                {modal.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Total', value: counts.total, icon: Mail, color: 'bg-orange-100 text-orange-600' },
              { label: 'Completadas', value: counts.completed, icon: Send, color: 'bg-green-100 text-green-600' },
              { label: 'Enviando', value: counts.sending, icon: Send, color: 'bg-blue-100 text-blue-600' },
              { label: 'Programadas', value: counts.scheduled, icon: Calendar, color: 'bg-yellow-100 text-yellow-600' },
              { label: 'Borradores', value: counts.draft, icon: FileText, color: 'bg-gray-100 text-gray-600' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-gray-500 text-sm font-medium mb-0.5">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
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
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
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

          {/* Empty State */}
          {campaigns.length === 0 ? (
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
                    <Plus size={16} />
                    Crear Primera Campaña
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow flex flex-col"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-orange-600" />
                    </div>
                    <StatusBadge status={campaign.status} />
                  </div>

                  {/* Info */}
                  <div className="mb-4 flex-1">
                    <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-1">
                      {campaign.name}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{campaign.subject}</p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Destinatarios</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {campaign._count?.campaignContacts ?? 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Creada</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {format(new Date(campaign.createdAt), 'dd/MM/yy')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {/* Ver analíticas — solo si ya fue enviada */}
                    {(campaign.status === 'COMPLETED' || campaign.status === 'SENDING' || campaign.status === 'FAILED') && (
                      <button
                        onClick={() => navigate(`/campaigns/${campaign.id}`)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Eye size={15} />
                        Ver
                      </button>
                    )}

                    {/* Editar — solo DRAFT */}
                    {campaign.status === 'DRAFT' && (
                      <button
                        onClick={() => navigate(`/campaigns/${campaign.id}/edit`)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                      >
                        <Pencil size={15} />
                        Editar
                      </button>
                    )}

                    {/* Enviar — DRAFT o SCHEDULED */}
                    {(campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED') && (
                      <button
                        onClick={() => confirmSend(campaign.id, campaign.name)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Send size={15} />
                        Enviar
                      </button>
                    )}

                    {/* Reintentar — FAILED */}
                    {campaign.status === 'FAILED' && (
                      <button
                        onClick={() => confirmSend(campaign.id, campaign.name)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Send size={15} />
                        Reintentar
                      </button>
                    )}

                    {/* Eliminar — no se puede si está enviando */}
                    {campaign.status !== 'SENDING' && (
                      <button
                        onClick={() => confirmDelete(campaign.id, campaign.name)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar campaña"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
