import { useEffect, useState } from 'react';
import { contactsApi } from '../api/contacts';
import { Contact } from '../types';
import toast from 'react-hot-toast';
import { Plus, Upload, Download, Search, Trash2, Edit, Users, Mail, Building2, Tag, X } from 'lucide-react';

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  useEffect(() => {
    loadContacts();
  }, [search]);

  const loadContacts = async () => {
    try {
      const data = await contactsApi.getAll({ search, limit: 100 });
      setContacts(data.contacts);
    } catch (error) {
      toast.error('Error al cargar contactos');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await contactsApi.import(file);
      toast.success(`${result.imported} contactos importados`);
      loadContacts();
    } catch (error) {
      toast.error('Error al importar contactos');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await contactsApi.export();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'contacts.csv';
      a.click();
      toast.success('Contactos exportados');
    } catch (error) {
      toast.error('Error al exportar contactos');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este contacto?')) return;
    try {
      await contactsApi.delete(id);
      toast.success('Contacto eliminado');
      loadContacts();
    } catch (error) {
      toast.error('Error al eliminar contacto');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get('email') as string,
      name: formData.get('name') as string,
      company: formData.get('company') as string,
      phone: formData.get('phone') as string,
      tags: (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean),
    };

    try {
      if (editingContact) {
        await contactsApi.update(editingContact.id, data);
        toast.success('Contacto actualizado');
      } else {
        await contactsApi.create(data);
        toast.success('Contacto creado');
      }
      setShowModal(false);
      setEditingContact(null);
      loadContacts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar contacto');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-pink-200 border-t-pink-600"></div>
          <p className="mt-4 text-lg font-semibold text-gray-700">Cargando contactos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 rounded-3xl p-8 shadow-2xl animate-fade-in">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJoLTYweiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMDUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=')] opacity-30" />
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-extrabold text-white mb-2 drop-shadow-lg">Contactos</h1>
              <p className="text-white/90 text-lg font-medium">Gestiona tu lista de contactos</p>
            </div>
            <div className="flex gap-3">
              <label className="cursor-pointer btn-secondary flex items-center gap-2">
                <Upload size={18} />
                Importar CSV
                <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
              </label>
              <button
                onClick={handleExport}
                className="btn-secondary flex items-center gap-2"
              >
                <Download size={18} />
                Exportar
              </button>
              <button
                onClick={() => { setEditingContact(null); setShowModal(true); }}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={18} />
                Agregar Contacto
              </button>
            </div>
          </div>
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="relative">
            <Search size={24} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por email, nombre o empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-14 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-pink-100 focus:border-pink-500 transition-all duration-300 bg-white text-lg"
            />
          </div>
        </div>

        {/* Contacts Grid or Empty State */}
        {contacts.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-16 text-center animate-scale-in">
            <div className="max-w-md mx-auto">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center mx-auto">
                  <Users className="w-12 h-12 text-pink-600" />
                </div>
                <div className="absolute top-0 right-1/4 w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-400 rounded-full blur-2xl opacity-30 animate-pulse-slow" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {search ? 'No se encontraron contactos' : 'No hay contactos aún'}
              </h3>
              <p className="text-gray-600 mb-8 text-lg">
                {search ? 'Intenta con otro término de búsqueda' : 'Comienza agregando tu primer contacto'}
              </p>
              {!search && (
                <button
                  onClick={() => { setEditingContact(null); setShowModal(true); }}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Plus size={20} />
                  Agregar Primer Contacto
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="group relative bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden"
              >
                {/* Gradient Background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-500/10 to-rose-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />

                {/* Content */}
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/50 transform group-hover:scale-110 transition-transform duration-300">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingContact(contact); setShowModal(true); }}
                        className="p-2 bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 hover:from-primary-500 hover:to-primary-600 hover:text-white rounded-lg transition-all duration-300"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="p-2 bg-gradient-to-r from-danger-100 to-danger-200 text-danger-700 hover:from-danger-500 hover:to-danger-600 hover:text-white rounded-lg transition-all duration-300"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
                      {contact.name || contact.email}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{contact.email}</span>
                    </div>
                    {contact.company && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{contact.company}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="pt-4 border-t border-gray-100">
                    {contact.tags.length > 0 ? (
                      <div className="flex gap-2 flex-wrap">
                        {contact.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 text-xs px-3 py-1.5 rounded-full border border-pink-200 font-semibold"
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Sin etiquetas</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingContact ? 'Editar Contacto' : 'Agregar Contacto'}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingContact(null); }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="contacto@empresa.com"
                  defaultValue={editingContact?.email}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre
                </label>
                <input
                  name="name"
                  type="text"
                  placeholder="Juan Pérez"
                  defaultValue={editingContact?.name}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Empresa
                </label>
                <input
                  name="company"
                  type="text"
                  placeholder="Empresa S.A."
                  defaultValue={editingContact?.company}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  name="phone"
                  type="text"
                  placeholder="+1 234 567 8900"
                  defaultValue={editingContact?.phone}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Etiquetas
                </label>
                <input
                  name="tags"
                  type="text"
                  placeholder="vip, cliente, newsletter"
                  defaultValue={editingContact?.tags.join(', ')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
                <p className="text-xs text-gray-500 mt-1.5">Separadas por comas</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 font-medium transition shadow-sm hover:shadow-md"
                >
                  {editingContact ? 'Actualizar' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingContact(null); }}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 font-medium transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
