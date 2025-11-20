import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { campaignsApi } from '../api/campaigns';
import { Campaign } from '../types';
import toast from 'react-hot-toast';
import { Plus, Send, Trash2, Eye, Mail, Users, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const data = await campaignsApi.getAll({ limit: 100 });
      setCampaigns(data.campaigns);
    } catch (error) {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres enviar esta campaña?')) return;
    try {
      await campaignsApi.send(id);
      toast.success('Campaña enviándose...');
      loadCampaigns();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al enviar campaña');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta campaña?')) return;
    try {
      await campaignsApi.delete(id);
      toast.success('Campaña eliminada');
      loadCampaigns();
    } catch (error) {
      toast.error('Error al eliminar campaña');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      COMPLETED: 'bg-success-50 text-success-700 border border-success-200',
      SENDING: 'bg-primary-50 text-primary-700 border border-primary-200',
      FAILED: 'bg-red-50 text-red-700 border border-red-200',
      DRAFT: 'bg-gray-100 text-gray-700 border border-gray-300',
      SCHEDULED: 'bg-accent-50 text-accent-700 border border-accent-200',
    };
    const labels = {
      COMPLETED: 'Completada',
      SENDING: 'Enviando',
      FAILED: 'Fallida',
      DRAFT: 'Borrador',
      SCHEDULED: 'Programada',
    };
    return (
      <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
          <p className="mt-4 text-lg font-semibold text-gray-700">Cargando campañas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 bg-purple-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">Total Campañas</p>
            <p className="text-3xl font-bold text-gray-900">{campaigns.length}</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 bg-green-100 rounded-lg flex items-center justify-center">
                <Send className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">Completadas</p>
            <p className="text-3xl font-bold text-gray-900">
              {campaigns.filter(c => c.status === 'COMPLETED').length}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">En Proceso</p>
            <p className="text-3xl font-bold text-gray-900">
              {campaigns.filter(c => c.status === 'SENDING').length}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 bg-gray-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">Borradores</p>
            <p className="text-3xl font-bold text-gray-900">
              {campaigns.filter(c => c.status === 'DRAFT').length}
            </p>
          </div>
        </div>

        {/* Empty State */}
        {campaigns.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay campañas aún</h3>
              <p className="text-gray-600 text-sm mb-6">
                Comienza creando tu primera campaña de email marketing
              </p>
              <button
                onClick={() => navigate('/campaigns/new')}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus size={20} />
                Crear Primera Campaña
              </button>
            </div>
          </div>
        ) : (
          /* Campaigns Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-purple-600" />
                  </div>
                  {getStatusBadge(campaign.status)}
                </div>

                {/* Campaign Info */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                    {campaign.name}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {campaign.subject}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-5 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Contactos</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {(campaign as any)._count?.campaignContacts || 0}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
                  <button
                    onClick={() => navigate(`/campaigns/${campaign.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    title="Ver analíticas"
                  >
                    <Eye size={16} />
                    <span className="text-sm">Ver</span>
                  </button>
                  {(campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED') && (
                    <button
                      onClick={() => handleSend(campaign.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                      title="Enviar campaña"
                    >
                      <Send size={16} />
                      <span className="text-sm">Enviar</span>
                    </button>
                  )}
                  {campaign.status !== 'SENDING' && (
                    <button
                      onClick={() => handleDelete(campaign.id)}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
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
  );
}
