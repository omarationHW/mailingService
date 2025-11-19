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
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-pink-200 border-t-pink-600"></div>
          <p className="mt-4 text-lg font-semibold text-gray-700">Cargando listas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Listas de Contactos
            </h1>
            <p className="text-gray-600">Organiza tus contactos en grupos para tus campañas</p>
          </div>
          <button
            onClick={() => {
              setEditingList(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
          >
            <Plus size={20} />
            Nueva Lista
          </button>
        </div>

        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar listas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        {/* Lists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map((list) => (
            <div
              key={list.id}
              className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <List className="text-pink-600" size={20} />
                      <h3 className="text-xl font-bold text-gray-900">{list.name}</h3>
                    </div>
                    {list.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{list.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
                  <Users className="text-pink-600" size={18} />
                  <span className="text-sm font-medium text-gray-700">
                    {list._count?.members || 0} contacto{list._count?.members !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/contact-lists/${list.id}`)}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:shadow-md transition-all text-sm font-medium"
                  >
                    Ver Lista
                  </button>
                  <button
                    onClick={() => {
                      setEditingList(list);
                      setShowModal(true);
                    }}
                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(list.id)}
                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {lists.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full mb-4">
              <List className="text-pink-600" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay listas de contactos</h3>
            <p className="text-gray-600 mb-6">Crea tu primera lista para organizar tus contactos</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
            >
              <Plus size={20} />
              Crear Primera Lista
            </button>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Lista *
                    </label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingList?.name}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="Ej: Clientes VIP"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      name="description"
                      defaultValue={editingList?.description}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
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
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
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
