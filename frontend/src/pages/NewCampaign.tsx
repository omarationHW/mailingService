import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { campaignsApi } from '../api/campaigns';
import { contactsApi } from '../api/contacts';
import { templatesApi } from '../api/templates';
import toast from 'react-hot-toast';

export default function NewCampaign() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [tags, setTags] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [contactsData, templatesData] = await Promise.all([
        contactsApi.getAll({ limit: 1000 }),
        templatesApi.getAll({ limit: 100 }),
      ]);
      setContacts(contactsData.contacts);
      setTemplates(templatesData.templates);
    } catch (error) {
      toast.error('Failed to load data');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data = {
      name: formData.get('name') as string,
      subject: formData.get('subject') as string,
      htmlContent: formData.get('htmlContent') as string,
      fromEmail: formData.get('fromEmail') as string,
      fromName: formData.get('fromName') as string,
      contactIds: selectedContacts.length > 0 ? selectedContacts : undefined,
      tags: tags ? tags.split(',').map(t => t.trim()) : undefined,
    };

    try {
      await campaignsApi.create(data);
      toast.success('Campaign created successfully');
      navigate('/campaigns');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create campaign');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create Campaign</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
          <input name="name" type="text" required className="w-full px-4 py-2 border rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
          <input name="subject" type="text" required className="w-full px-4 py-2 border rounded-lg" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Email</label>
            <input name="fromEmail" type="email" required className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Name</label>
            <input name="fromName" type="text" required className="w-full px-4 py-2 border rounded-lg" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">HTML Content</label>
          <textarea name="htmlContent" rows={10} required className="w-full px-4 py-2 border rounded-lg font-mono text-sm" placeholder="<h1>Hello {{nombre}}</h1><p>Welcome to {{empresa}}</p>" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Recipients (filter by tags, comma-separated)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="vip,newsletter"
            className="w-full px-4 py-2 border rounded-lg"
          />
          <p className="text-sm text-gray-500 mt-1">Leave empty to select all contacts</p>
        </div>

        <div className="flex gap-4">
          <button type="submit" className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 font-semibold">
            Create Campaign
          </button>
          <button type="button" onClick={() => navigate('/campaigns')} className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
