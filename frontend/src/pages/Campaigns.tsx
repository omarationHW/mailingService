import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { campaignsApi } from '../api/campaigns';
import { Campaign } from '../types';
import toast from 'react-hot-toast';
import { Plus, Send, Trash2, Eye, Mail, Users, Calendar } from 'lucide-react';
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
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-3xl p-8 shadow-2xl animate-fade-in">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJoLTYweiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMDUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=')] opacity-30" />
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-extrabold text-white mb-2 drop-shadow-lg">Campañas</h1>
              <p className="text-white/90 text-lg font-medium">Gestiona tus campañas de email marketing</p>
            </div>
            <button
              onClick={() => navigate('/campaigns/new')}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              Nueva Campaña
            </button>
          </div>
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        </div>

        {/* Empty State */}
        {campaigns.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-16 text-center animate-scale-in">
            <div className="max-w-md mx-auto">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-12 h-12 text-purple-600" />
                </div>
                <div className="absolute top-0 right-1/4 w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full blur-2xl opacity-30 animate-pulse-slow" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No hay campañas aún</h3>
              <p className="text-gray-600 mb-8 text-lg">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="group relative bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden"
              >
                {/* Gradient Background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />

                {/* Content */}
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/50 transform group-hover:scale-110 transition-transform duration-300">
                      <Mail className="w-7 h-7 text-white" />
                    </div>
                    {getStatusBadge(campaign.status)}
                  </div>

                  {/* Campaign Info */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                      {campaign.name}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {campaign.subject}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-success-100 to-success-200 rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-success-700" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Contactos</p>
                        <p className="text-sm font-bold text-gray-900">
                          {(campaign as any)._count?.campaignContacts || 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-primary-700" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Fecha</p>
                        <p className="text-sm font-bold text-gray-900">
                          {format(new Date(campaign.createdAt), 'dd/MM/yy')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/campaigns/${campaign.id}`)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                      title="Ver analíticas"
                    >
                      <Eye size={18} />
                      <span>Ver</span>
                    </button>
                    {(campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED') && (
                      <button
                        onClick={() => handleSend(campaign.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-success-500 to-success-600 text-white rounded-xl hover:from-success-600 hover:to-success-700 font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                        title="Enviar campaña"
                      >
                        <Send size={18} />
                        <span>Enviar</span>
                      </button>
                    )}
                    {campaign.status !== 'SENDING' && (
                      <button
                        onClick={() => handleDelete(campaign.id)}
                        className="px-3 py-2.5 bg-gradient-to-r from-danger-500 to-danger-600 text-white rounded-xl hover:from-danger-600 hover:to-danger-700 font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                        title="Eliminar campaña"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
