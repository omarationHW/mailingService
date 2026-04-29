import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { contactListsApi, ContactList } from '../api/contactLists';
import toast from 'react-hot-toast';
import { Plus, Search, Trash2, Edit, Users, List, X, AlertTriangle } from 'lucide-react';

interface ConfirmModal {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}
const MODAL_CLOSED: ConfirmModal = { open: false, title: '', message: '', onConfirm: () => {} };

export default function ContactLists() {
  const navigate = useNavigate();
  const [lists, setLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingList, setEditingList] = useState<ContactList | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState<ConfirmModal>(MODAL_CLOSED);

  const loadLists = useCallback(async () => {
    setLoading(true);
    try {
      const data = await contactListsApi.getAll({ search: search || undefined, limit: 100 });
      setLists(data.lists);
    } catch {
      toast.error('Error al cargar listas');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => loadLists(), search ? 400 : 0);
    return () => clearTimeout(t);
  }, [loadLists]);

  const openCreate = () => {
    setEditingList(null);
    setFormName('');
    setFormDescription('');
    setShowModal(true);
  };

  const openEdit = (list: ContactList) => {
    setEditingList(list);
    setFormName(list.name);
    setFormDescription(list.description || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingList) {
        await contactListsApi.update(editingList.id, { name: formName, description: formDescription || undefined });
        toast.success('Lista actualizada');
      } else {
        await contactListsApi.create({ name: formName, description: formDescription || undefined });
        toast.success('Lista creada');
      }
      setShowModal(false);
      loadLists();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar lista');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (list: ContactList) => {
    setModal({
      open: true,
      title: 'Eliminar lista',
      message: `¿Eliminar la lista "${list.name}"? Los contactos no serán eliminados.`,
      onConfirm: async () => {
        setModal(MODAL_CLOSED);
        try {
          await contactListsApi.delete(list.id);
          toast.success('Lista eliminada');
          loadLists();
        } catch {
          toast.error('Error al eliminar lista');
        }
      },
    });
  };

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
              <button onClick={() => setModal(MODAL_CLOSED)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={modal.onConfirm} className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar listas..."
                className="w-full pl-9 pr-9 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={15} /></button>
              )}
            </div>
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap">
              <Plus size={16} />
              Nueva lista
            </button>
          </div>

          {/* Stats summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                <List className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-gray-500 text-sm font-medium mb-0.5">
                {search ? 'Resultados de búsqueda' : 'Total de listas'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{lists.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-gray-500 text-sm font-medium mb-0.5">Total de miembros</p>
              <p className="text-2xl font-bold text-gray-900">{lists.reduce((s, l) => s + (l._count?.members || 0), 0)}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          ) : lists.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <List className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {search ? 'No se encontraron listas' : 'No hay listas de contactos'}
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  {search ? 'Intenta con otro término de búsqueda.' : 'Crea tu primera lista para organizar tus contactos.'}
                </p>
                {!search && (
                  <button onClick={openCreate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors">
                    <Plus size={16} />Crear primera lista
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {lists.map(list => (
                <div key={list.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <List className="text-orange-600" size={18} />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 truncate">{list.name}</h3>
                    </div>
                  </div>

                  {list.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{list.description}</p>
                  )}

                  <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                    <Users className="text-gray-400" size={14} />
                    <span className="text-sm font-medium text-gray-700">
                      {list._count?.members || 0} contacto{(list._count?.members || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <button onClick={() => navigate(`/contact-lists/${list.id}`)}
                      className="flex-1 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors">
                      Ver lista
                    </button>
                    <button onClick={() => openEdit(list)}
                      className="p-2 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Editar">
                      <Edit size={15} />
                    </button>
                    <button onClick={() => confirmDelete(list)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">
                {editingList ? 'Editar lista' : 'Nueva lista'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre <span className="text-red-500">*</span></label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} required
                  placeholder="Ej: Clientes VIP"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                <textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} rows={3}
                  placeholder="Describe el propósito de esta lista..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white py-2.5 rounded-lg font-medium text-sm transition">
                  {submitting ? 'Guardando...' : editingList ? 'Actualizar' : 'Crear'}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50 transition">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
