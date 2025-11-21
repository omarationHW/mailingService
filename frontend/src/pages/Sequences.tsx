import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sequencesApi, Sequence } from '../api/sequences';
import toast from 'react-hot-toast';
import { Plus, Search, Play, Pause, Archive, Edit, Trash2, Zap, Users, Mail } from 'lucide-react';

export default function Sequences() {
  const navigate = useNavigate();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED'>('ALL');

  useEffect(() => {
    loadSequences();
  }, [search, statusFilter]);

  const loadSequences = async () => {
    try {
      const params: any = { search, limit: 100 };
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      const data = await sequencesApi.getAll(params);
      setSequences(data.sequences);
    } catch (error) {
      toast.error('Error al cargar secuencias');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED') => {
    try {
      await sequencesApi.update(id, { status });
      toast.success('Estado actualizado');
      loadSequences();
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta secuencia?')) return;
    try {
      await sequencesApi.delete(id);
      toast.success('Secuencia eliminada');
      loadSequences();
    } catch (error) {
      toast.error('Error al eliminar secuencia');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      ACTIVE: { color: 'bg-green-100 text-green-700', icon: Play, label: 'Activa' },
      PAUSED: { color: 'bg-yellow-100 text-yellow-700', icon: Pause, label: 'Pausada' },
      ARCHIVED: { color: 'bg-gray-100 text-gray-700', icon: Archive, label: 'Archivada' },
    };
    const badge = badges[status as keyof typeof badges];
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${badge.color}`}>
        <Icon size={12} />
        {badge.label}
      </span>
    );
  };

  const getTriggerLabel = (triggerType: string) => {
    const triggers: Record<string, string> = {
      MANUAL: 'Manual',
      CONTACT_CREATED: 'Contacto creado',
      LIST_ADDED: 'Agregado a lista',
      TAG_ADDED: 'Etiqueta agregada',
      EMAIL_OPENED: 'Email abierto',
      LINK_CLICKED: 'Link clickeado',
    };
    return triggers[triggerType] || triggerType;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando secuencias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {sequences.length} {sequences.length === 1 ? 'Secuencia' : 'Secuencias'}
              </h2>
              <p className="text-sm text-gray-600">Automatiza tus emails de seguimiento</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/sequences/new')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            <span className="text-sm">Nueva Secuencia</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar secuencias..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition bg-white"
            >
              <option value="ALL">Todos los estados</option>
              <option value="ACTIVE">Activas</option>
              <option value="PAUSED">Pausadas</option>
              <option value="ARCHIVED">Archivadas</option>
            </select>
          </div>
        </div>

        {/* Sequences Grid or Empty State */}
        {sequences.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {search ? 'No se encontraron secuencias' : 'No hay secuencias aún'}
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                {search
                  ? 'Intenta con otro término de búsqueda'
                  : 'Crea secuencias automáticas de emails para nutrir a tus contactos'}
              </p>
              {!search && (
                <button
                  onClick={() => navigate('/sequences/new')}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Plus size={20} />
                  Crear Primera Secuencia
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sequences.map((sequence) => (
              <div
                key={sequence.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Zap className="text-indigo-600" size={18} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{sequence.name}</h3>
                    </div>
                    {sequence.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 ml-12">{sequence.description}</p>
                    )}
                  </div>
                </div>

                {/* Status and Trigger */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Estado:</span>
                    {getStatusBadge(sequence.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Trigger:</span>
                    <span className="text-xs font-medium text-gray-700">
                      {getTriggerLabel(sequence.triggerType)}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="text-gray-500" size={14} />
                      <span className="text-xs text-gray-600">Pasos</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{sequence._count?.steps || 0}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="text-gray-500" size={14} />
                      <span className="text-xs text-gray-600">Contactos</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{sequence._count?.enrollments || 0}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/sequences/${sequence.id}`)}
                    className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    Ver Detalles
                  </button>

                  {/* Status Actions */}
                  {sequence.status === 'ACTIVE' ? (
                    <button
                      onClick={() => handleStatusChange(sequence.id, 'PAUSED')}
                      className="p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-600 hover:text-white transition-colors"
                      title="Pausar"
                    >
                      <Pause size={16} />
                    </button>
                  ) : sequence.status === 'PAUSED' ? (
                    <button
                      onClick={() => handleStatusChange(sequence.id, 'ACTIVE')}
                      className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-colors"
                      title="Activar"
                    >
                      <Play size={16} />
                    </button>
                  ) : null}

                  <button
                    onClick={() => navigate(`/sequences/${sequence.id}/edit`)}
                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(sequence.id)}
                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
