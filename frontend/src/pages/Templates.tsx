import { useEffect, useState } from 'react';
import { templatesApi } from '../api/templates';
import { Template } from '../types';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit } from 'lucide-react';

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await templatesApi.getAll({ limit: 100 });
      setTemplates(data.templates);
    } catch (error) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await templatesApi.delete(id);
      toast.success('Template deleted');
      loadTemplates();
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      htmlContent: formData.get('htmlContent') as string,
      description: formData.get('description') as string,
    };

    try {
      if (editingTemplate) {
        await templatesApi.update(editingTemplate.id, data);
        toast.success('Template updated');
      } else {
        await templatesApi.create(data);
        toast.success('Template created');
      }
      setShowModal(false);
      setEditingTemplate(null);
      loadTemplates();
    } catch (error) {
      toast.error('Failed to save template');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Templates</h1>
        <button onClick={() => { setEditingTemplate(null); setShowModal(true); }} className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2">
          <Plus size={20} />
          New Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-lg">{template.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
            </div>
            <div className="p-4 bg-gray-50 max-h-48 overflow-auto">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap">{template.htmlContent.substring(0, 200)}...</pre>
            </div>
            <div className="p-4 flex gap-2 justify-end border-t">
              <button onClick={() => { setEditingTemplate(template); setShowModal(true); }} className="text-blue-600 hover:text-blue-800">
                <Edit size={18} />
              </button>
              <button onClick={() => handleDelete(template.id)} className="text-red-600 hover:text-red-800">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-2xl font-bold mb-4">{editingTemplate ? 'Edit' : 'New'} Template</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input name="name" type="text" placeholder="Template Name" defaultValue={editingTemplate?.name} className="w-full px-4 py-2 border rounded-lg" required />
              <input name="description" type="text" placeholder="Description" defaultValue={editingTemplate?.description} className="w-full px-4 py-2 border rounded-lg" />
              <textarea name="htmlContent" rows={12} placeholder="HTML Content" defaultValue={editingTemplate?.htmlContent} className="w-full px-4 py-2 border rounded-lg font-mono text-sm" required />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700">Save</button>
                <button type="button" onClick={() => { setShowModal(false); setEditingTemplate(null); }} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
