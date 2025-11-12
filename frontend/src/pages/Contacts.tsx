import { useEffect, useState } from 'react';
import { contactsApi } from '../api/contacts';
import { Contact } from '../types';
import toast from 'react-hot-toast';
import { Plus, Upload, Download, Search, Trash2, Edit } from 'lucide-react';

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
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await contactsApi.import(file);
      toast.success(`Imported ${result.imported} contacts`);
      loadContacts();
    } catch (error) {
      toast.error('Failed to import contacts');
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
    } catch (error) {
      toast.error('Failed to export contacts');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await contactsApi.delete(id);
      toast.success('Contact deleted');
      loadContacts();
    } catch (error) {
      toast.error('Failed to delete contact');
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
        toast.success('Contact updated');
      } else {
        await contactsApi.create(data);
        toast.success('Contact created');
      }
      setShowModal(false);
      setEditingContact(null);
      loadContacts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save contact');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Contacts</h1>
        <div className="flex gap-3">
          <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Upload size={20} />
            Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </label>
          <button onClick={handleExport} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Download size={20} />
            Export
          </button>
          <button onClick={() => { setEditingContact(null); setShowModal(true); }} className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2">
            <Plus size={20} />
            Add Contact
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-2 mb-4">
          <Search size={20} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border-0 focus:ring-0"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tags</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {contacts.map((contact) => (
                <tr key={contact.id}>
                  <td className="px-6 py-4">{contact.email}</td>
                  <td className="px-6 py-4">{contact.name || '-'}</td>
                  <td className="px-6 py-4">{contact.company || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {contact.tags.map((tag, i) => (
                        <span key={i} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingContact(contact); setShowModal(true); }} className="text-blue-600 hover:text-blue-800">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(contact.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">{editingContact ? 'Edit' : 'Add'} Contact</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input name="email" type="email" placeholder="Email" defaultValue={editingContact?.email} className="w-full px-4 py-2 border rounded-lg" required />
              <input name="name" type="text" placeholder="Name" defaultValue={editingContact?.name} className="w-full px-4 py-2 border rounded-lg" />
              <input name="company" type="text" placeholder="Company" defaultValue={editingContact?.company} className="w-full px-4 py-2 border rounded-lg" />
              <input name="phone" type="text" placeholder="Phone" defaultValue={editingContact?.phone} className="w-full px-4 py-2 border rounded-lg" />
              <input name="tags" type="text" placeholder="Tags (comma-separated)" defaultValue={editingContact?.tags.join(', ')} className="w-full px-4 py-2 border rounded-lg" />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700">Save</button>
                <button type="button" onClick={() => { setShowModal(false); setEditingContact(null); }} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
