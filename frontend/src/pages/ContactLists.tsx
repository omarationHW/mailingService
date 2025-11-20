import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { contactListsApi, ContactList } from '../api/contactLists';
import toast from 'react-hot-toast';
import { Plus, Search, Trash2, Edit, Users, List, X } from 'lucide-react';

export default function ContactLists() {
  const navigate = useNavigate();
  const [lists, setLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingList, setEditingList] = useState<ContactList | null>(null);

  useEffect(() => {
    loadLists();
  }, [search]);

  const loadLists = async () => {
    try {
      const data = await contactListsApi.getAll({ search, limit: 100 });
      setLists(data.lists);
    } catch (error) {
      toast.error('Error al cargar listas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta lista?')) return;
    try {
      await contactListsApi.delete(id);
      toast.success('Lista eliminada');
      loadLists();
    } catch (error) {
      toast.error('Error al eliminar lista');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
    };

    try {
      if (editingList) {
        await contactListsApi.update(editingList.id, data);
        toast.success('Lista actualizada');
      } else {
        await contactListsApi.create(data);
        toast.success('Lista creada');
      }
      setShowModal(false);
      setEditingList(null);
      loadLists();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar lista');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando listas...</p>
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
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <List className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {lists.length} {lists.length === 1 ? 'Lista' : 'Listas'}
              </h2>
              <p className="text-sm text-gray-600">Organiza tus contactos en grupos</p>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingList(null);
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            <span className="text-sm">Nueva Lista</span>
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar listas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
            />
          </div>
        </div>

        {/* Lists Grid or Empty State */}
        {lists.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <List className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {search ? 'No se encontraron listas' : 'No hay listas de contactos'}
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                {search ? 'Intenta con otro término de búsqueda' : 'Crea tu primera lista para organizar tus contactos'}
              </p>
              {!search && (
                <button
                  onClick={() => setShowModal(true)}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Plus size={20} />
                  Crear Primera Lista
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {lists.map((list) => (
              <div
                key={list.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <List className="text-blue-600" size={18} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{list.name}</h3>
                    </div>
                    {list.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 ml-12">{list.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                  <Users className="text-gray-600" size={16} />
                  <span className="text-sm font-medium text-gray-700">
                    {list._count?.members || 0} contacto{list._count?.members !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/contact-lists/${list.id}`)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Ver Lista
                  </button>
                  <button
                    onClick={() => {
                      setEditingList(list);
                      setShowModal(true);
                    }}
                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(list.id)}
                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingList ? 'Editar Lista' : 'Nueva Lista'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setEditingList(null);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre de la Lista *
                    </label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingList?.name}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                      placeholder="Ej: Clientes VIP"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      name="description"
                      defaultValue={editingList?.description}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                      placeholder="Describe el propósito de esta lista..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingList(null);
                      }}
                      className="flex-1 btn-secondary"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 btn-primary"
                    >
                      {editingList ? 'Actualizar' : 'Crear'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
