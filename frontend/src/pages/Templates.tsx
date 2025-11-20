import { useEffect, useState } from 'react';
import { templatesApi } from '../api/templates';
import { Template } from '../types';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit, FileText, Code, X } from 'lucide-react';

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
      toast.error('Error al cargar plantillas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta plantilla?')) return;
    try {
      await templatesApi.delete(id);
      toast.success('Plantilla eliminada');
      loadTemplates();
    } catch (error) {
      toast.error('Error al eliminar plantilla');
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
        toast.success('Plantilla actualizada');
      } else {
        await templatesApi.create(data);
        toast.success('Plantilla creada');
      }
      setShowModal(false);
      setEditingTemplate(null);
      loadTemplates();
    } catch (error) {
      toast.error('Error al guardar plantilla');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando plantillas...</p>
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
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {templates.length} {templates.length === 1 ? 'Plantilla' : 'Plantillas'}
              </h2>
              <p className="text-sm text-gray-600">Diseños reutilizables para tus campañas</p>
            </div>
          </div>
          <button
            onClick={() => { setEditingTemplate(null); setShowModal(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            <span className="text-sm">Nueva Plantilla</span>
          </button>
        </div>

        {/* Templates Grid or Empty State */}
        {templates.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay plantillas aún</h3>
              <p className="text-gray-600 text-sm mb-6">
                Crea plantillas reutilizables para tus campañas de email
              </p>
              <button
                onClick={() => { setEditingTemplate(null); setShowModal(true); }}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus size={20} />
                Crear Primera Plantilla
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Card Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
                        {template.name}
                      </h3>
                      {template.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {template.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Code Preview */}
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Code className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">HTML</span>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-3 max-h-24 overflow-auto">
                    <pre className="text-xs text-green-400 whitespace-pre-wrap font-mono">
                      {template.htmlContent.substring(0, 120)}...
                    </pre>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-4 flex gap-2">
                  <button
                    onClick={() => { setEditingTemplate(template); setShowModal(true); }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    title="Editar"
                  >
                    <Edit size={16} />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    title="Eliminar"
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
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingTemplate(null); }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre de la Plantilla *
                </label>
                <input
                  name="name"
                  type="text"
                  placeholder="Ej: Bienvenida a Nuevos Clientes"
                  defaultValue={editingTemplate?.name}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descripción
                </label>
                <input
                  name="description"
                  type="text"
                  placeholder="Breve descripción de la plantilla"
                  defaultValue={editingTemplate?.description}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contenido HTML *
                </label>
                <textarea
                  name="htmlContent"
                  rows={16}
                  placeholder="<html>&#10;  <body>&#10;    Tu contenido aquí...&#10;  </body>&#10;</html>"
                  defaultValue={editingTemplate?.htmlContent}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition font-mono text-sm resize-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Puedes usar variables como {'{'}{'{'} nombre {'}'}{'}'}, {'{'}{'{'} email {'}'}{'}'}, etc.
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  {editingTemplate ? 'Actualizar' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingTemplate(null); }}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
