import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { sequencesApi, Sequence } from '../api/sequences';
import toast from 'react-hot-toast';
import {
  Plus, Search, Play, Pause, Archive, Edit, Trash2,
  Zap, Users, Mail, X, AlertTriangle,
} from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:   'bg-green-100 text-green-700',
  PAUSED:   'bg-yellow-100 text-yellow-700',
  ARCHIVED: 'bg-gray-100 text-gray-600',
};
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activa', PAUSED: 'Pausada', ARCHIVED: 'Archivada',
};
const STATUS_ICONS: Record<string, typeof Play> = {
  ACTIVE: Play, PAUSED: Pause, ARCHIVED: Archive,
};

const TRIGGER_LABELS: Record<string, string> = {
  MANUAL:          'Manual',
  CONTACT_CREATED: 'Contacto creado',
  LIST_ADDED:      'Agregado a lista',
  TAG_ADDED:       'Etiqueta agregada',
  EMAIL_OPENED:    'Email abierto',
  LINK_CLICKED:    'Link clicado',
};

interface ConfirmModal {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}
const MODAL_CLOSED: ConfirmModal = { open: false, title: '', message: '', onConfirm: () => {} };

export default function Sequences() {
  const navigate = useNavigate();
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState<ConfirmModal>(MODAL_CLOSED);

  const loadSequences = useCallback(async () => {
    try {
      const params: any = { limit: 100 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const data = await sequencesApi.getAll(params);
      setSequences(data.sequences);
    } catch {
      toast.error('Error al cargar secuencias');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    setLoading(true);
    loadSequences();
  }, [loadSequences]);

  const handleStatusChange = async (id: string, status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED') => {
    try {
      await sequencesApi.update(id, { status });
      toast.success('Estado actualizado');
      loadSequences();
    } catch {
      toast.error('Error al actualizar estado');
    }
  };

  const confirmDelete = (id: string, name: string) => {
    setModal({
      open: true,
      title: 'Eliminar secuencia',
      message: `¿Estás seguro de que quieres eliminar "${name}"? Esta acción es permanente.`,
      onConfirm: async () => {
        setModal(MODAL_CLOSED);
        try {
          await sequencesApi.delete(id);
          toast.success('Secuencia eliminada');
          loadSequences();
        } catch {
          toast.error('Error al eliminar secuencia');
        }
      },
    });
  };

  const counts = {
    total:    sequences.length,
    active:   sequences.filter(s => s.status === 'ACTIVE').length,
    paused:   sequences.filter(s => s.status === 'PAUSED').length,
    archived: sequences.filter(s => s.status === 'ARCHIVED').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando secuencias...</p>
        </div>
      </div>
    );
  }

  return (
    <>
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
              <button onClick={() => setModal(MODAL_CLOSED)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={modal.onConfirm} className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total',      value: counts.total,    icon: Zap,     color: 'bg-orange-100 text-orange-600' },
              { label: 'Activas',    value: counts.active,   icon: Play,    color: 'bg-green-100 text-green-600' },
              { label: 'Pausadas',   value: counts.paused,   icon: Pause,   color: 'bg-yellow-100 text-yellow-600' },
              { label: 'Archivadas', value: counts.archived, icon: Archive, color: 'bg-gray-100 text-gray-500' },
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
                placeholder="Buscar secuencias..."
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
              <option value="ACTIVE">Activas</option>
              <option value="PAUSED">Pausadas</option>
              <option value="ARCHIVED">Archivadas</option>
            </select>
            <button
              onClick={() => navigate('/sequences/new')}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus size={16} />
              Nueva Secuencia
            </button>
          </div>

          {/* Empty State */}
          {sequences.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {search || statusFilter ? 'No se encontraron secuencias' : 'No hay secuencias aún'}
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  {search || statusFilter
                    ? 'Intenta con otros filtros de búsqueda.'
                    : 'Crea secuencias automáticas de emails para nutrir a tus contactos.'}
                </p>
                {!search && !statusFilter && (
                  <button
                    onClick={() => navigate('/sequences/new')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <Plus size={16} />
                    Crear Primera Secuencia
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sequences.map((sequence) => {
                const StatusIcon = STATUS_ICONS[sequence.status] ?? Zap;
                return (
                  <div key={sequence.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow flex flex-col">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Zap className="text-orange-600" size={18} />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 truncate">{sequence.name}</h3>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium flex-shrink-0 ml-2 ${STATUS_STYLES[sequence.status]}`}>
                        <StatusIcon size={11} />
                        {STATUS_LABELS[sequence.status]}
                      </span>
                    </div>

                    {sequence.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{sequence.description}</p>
                    )}

                    {/* Trigger */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                      <span className="text-xs text-gray-400">Activación</span>
                      <span className="text-xs font-medium text-gray-700">{TRIGGER_LABELS[sequence.triggerType] ?? sequence.triggerType}</span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4 flex-1">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Mail className="text-gray-400" size={13} />
                          <span className="text-xs text-gray-500">Pasos</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{sequence._count?.steps ?? 0}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Users className="text-gray-400" size={13} />
                          <span className="text-xs text-gray-500">Inscritos</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{sequence._count?.enrollments ?? 0}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/sequences/${sequence.id}`)}
                        className="flex-1 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Ver detalles
                      </button>
                      {sequence.status === 'ACTIVE' && (
                        <button onClick={() => handleStatusChange(sequence.id, 'PAUSED')} className="p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors" title="Pausar">
                          <Pause size={16} />
                        </button>
                      )}
                      {sequence.status === 'PAUSED' && (
                        <button onClick={() => handleStatusChange(sequence.id, 'ACTIVE')} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors" title="Activar">
                          <Play size={16} />
                        </button>
                      )}
                      <button onClick={() => navigate(`/sequences/${sequence.id}/edit`)} className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" title="Editar">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => confirmDelete(sequence.id, sequence.name)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
