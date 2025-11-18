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
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-600"></div>
          <p className="mt-4 text-lg font-semibold text-gray-700">Cargando plantillas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 rounded-3xl p-8 shadow-2xl animate-fade-in">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwdjJoLTYweiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIuMDUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=')] opacity-30" />
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-extrabold text-white mb-2 drop-shadow-lg">Plantillas</h1>
              <p className="text-white/90 text-lg font-medium">Crea y gestiona plantillas de email reutilizables</p>
            </div>
            <button
              onClick={() => { setEditingTemplate(null); setShowModal(true); }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              Nueva Plantilla
            </button>
          </div>
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        </div>

        {/* Templates Grid or Empty State */}
        {templates.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-16 text-center animate-scale-in">
            <div className="max-w-md mx-auto">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="w-12 h-12 text-orange-600" />
                </div>
                <div className="absolute top-0 right-1/4 w-16 h-16 bg-gradient-to-br from-red-400 to-orange-400 rounded-full blur-2xl opacity-30 animate-pulse-slow" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No hay plantillas aún</h3>
              <p className="text-gray-600 mb-8 text-lg">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
            {templates.map((template) => (
              <div
                key={template.id}
                className="group relative bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              >
                {/* Gradient Background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />

                {/* Content */}
                <div className="relative z-10">
                  {/* Card Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/50 transform group-hover:scale-110 transition-transform duration-300">
                        <FileText className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 truncate mb-1">
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
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
                        <Code className="w-4 h-4 text-orange-700" />
                      </div>
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Vista previa</span>
                    </div>
                    <div className="bg-gray-900 rounded-xl p-4 max-h-32 overflow-auto shadow-inner">
                      <pre className="text-xs text-green-400 whitespace-pre-wrap font-mono">
                        {template.htmlContent.substring(0, 150)}...
                      </pre>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="p-4 flex gap-2">
                    <button
                      onClick={() => { setEditingTemplate(template); setShowModal(true); }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                      title="Editar"
                    >
                      <Edit size={18} />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="px-3 py-2.5 bg-gradient-to-r from-danger-500 to-danger-600 text-white rounded-xl hover:from-danger-600 hover:to-danger-700 font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                      title="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition font-mono text-sm resize-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Puedes usar variables como {'{'}{'{'} nombre {'}'}{'}'}, {'{'}{'{'} email {'}'}{'}'}, etc.
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 text-white py-2.5 rounded-lg hover:bg-primary-700 font-medium transition shadow-sm hover:shadow-md"
                >
                  {editingTemplate ? 'Actualizar Plantilla' : 'Crear Plantilla'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditingTemplate(null); }}
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
    </div>
  );
}
