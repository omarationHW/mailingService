import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contactListsApi, ContactListWithMembers } from '../api/contactLists';
import { contactsApi } from '../api/contacts';
import { Contact } from '../types';
import toast from 'react-hot-toast';
import { ArrowLeft, UserPlus, Trash2, Mail, Building2, Phone, X, Search } from 'lucide-react';

export default function ContactListDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [list, setList] = useState<ContactListWithMembers | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableContacts, setAvailableContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [searchContacts, setSearchContacts] = useState('');

  useEffect(() => {
    if (id) {
      loadList();
    }
  }, [id]);

  const loadList = async () => {
    try {
      const data = await contactListsApi.getById(id!);
      setList(data.list);
    } catch (error) {
      toast.error('Error al cargar lista');
      navigate('/contact-lists');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableContacts = async () => {
    try {
      const data = await contactsApi.getAll({ search: searchContacts, limit: 100 });
      // Filter out contacts already in the list
      const memberIds = new Set(list?.members.map(m => m.contactId) || []);
      setAvailableContacts(data.contacts.filter((c: Contact) => !memberIds.has(c.id)));
    } catch (error) {
      toast.error('Error al cargar contactos');
    }
  };

  useEffect(() => {
    if (showAddModal) {
      loadAvailableContacts();
    }
  }, [showAddModal, searchContacts, list]);

  const handleAddContacts = async () => {
    if (selectedContacts.size === 0) {
      toast.error('Selecciona al menos un contacto');
      return;
    }

    try {
      await contactListsApi.addContacts(id!, Array.from(selectedContacts));
      toast.success(`${selectedContacts.size} contacto(s) agregado(s)`);
      setShowAddModal(false);
      setSelectedContacts(new Set());
      loadList();
    } catch (error) {
      toast.error('Error al agregar contactos');
    }
  };

  const handleRemoveContact = async (contactId: string) => {
    if (!confirm('¿Remover este contacto de la lista?')) return;

    try {
      await contactListsApi.removeContact(id!, contactId);
      toast.success('Contacto removido');
      loadList();
    } catch (error) {
      toast.error('Error al remover contacto');
    }
  };

  const toggleContactSelection = (contactId: string) => {
    const newSelection = new Set(selectedContacts);
    if (newSelection.has(contactId)) {
      newSelection.delete(contactId);
    } else {
      newSelection.add(contactId);
    }
    setSelectedContacts(newSelection);
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-pink-200 border-t-pink-600"></div>
          <p className="mt-4 text-lg font-semibold text-gray-700">Cargando lista...</p>
        </div>
      </div>
    );
  }

  if (!list) return null;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate('/contact-lists')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Volver a Listas
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
              {list.name}
            </h1>
            {list.description && (
              <p className="text-gray-600">{list.description}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              {list.members.length} contacto{list.members.length !== 1 ? 's' : ''} en esta lista
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
          >
            <UserPlus size={20} />
            Agregar Contactos
          </button>
        </div>

        {/* Contacts List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {list.members.length === 0 ? (
            <div className="text-center py-16">
              <UserPlus className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay contactos en esta lista</h3>
              <p className="text-gray-600 mb-6">Agrega contactos para empezar</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
              >
                <UserPlus size={20} />
                Agregar Contactos
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-pink-50 to-purple-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Contacto</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Empresa</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Teléfono</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Fecha Agregado</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {list.members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{member.contact.name || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Mail size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-700">{member.contact.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-700">{member.contact.company || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Phone size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-700">{member.contact.phone || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {new Date(member.addedAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRemoveContact(member.contactId)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Contacts Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Agregar Contactos</h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setSelectedContacts(new Set());
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar contactos..."
                    value={searchContacts}
                    onChange={(e) => setSearchContacts(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {availableContacts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No hay contactos disponibles para agregar</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableContacts.map((contact) => (
                      <label
                        key={contact.id}
                        className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedContacts.has(contact.id)}
                          onChange={() => toggleContactSelection(contact.id)}
                          className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{contact.name || contact.email}</div>
                          <div className="text-sm text-gray-600">{contact.email}</div>
                          {contact.company && (
                            <div className="text-sm text-gray-500">{contact.company}</div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-100">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setSelectedContacts(new Set());
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddContacts}
                    disabled={selectedContacts.size === 0}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Agregar ({selectedContacts.size})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
