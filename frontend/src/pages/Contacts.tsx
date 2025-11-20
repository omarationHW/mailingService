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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando contactos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {contacts.length} {contacts.length === 1 ? 'Contacto' : 'Contactos'}
              </h2>
              <p className="text-sm text-gray-600">Gestiona tu base de datos</p>
            </div>
          </div>
          <div className="flex gap-2">
            <label className="cursor-pointer btn-secondary flex items-center gap-2">
              <Upload size={16} />
              <span className="text-sm">Importar</span>
              <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
            </label>
            <button
              onClick={handleExport}
              className="btn-secondary flex items-center gap-2"
            >
              <Download size={16} />
              <span className="text-sm">Exportar</span>
            </button>
            <button
              onClick={() => { setEditingContact(null); setShowModal(true); }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={16} />
              <span className="text-sm">Nuevo Contacto</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por email, nombre o empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
            />
          </div>
        </div>

        {/* Contacts Grid or Empty State */}
        {contacts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {search ? 'No se encontraron contactos' : 'No hay contactos aún'}
              </h3>
              <p className="text-gray-600 text-sm mb-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingContact(contact); setShowModal(true); }}
                      className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                    {contact.name || contact.email}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
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
                <div className="pt-4 border-t border-gray-200">
                  {contact.tags.length > 0 ? (
                    <div className="flex gap-2 flex-wrap">
                      {contact.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-md font-medium"
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
