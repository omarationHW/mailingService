import { useEffect, useState, useCallback } from 'react';
import { templatesApi } from '../api/templates';
import { Template } from '../types';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit, FileText, X, Search, AlertTriangle } from 'lucide-react';

interface ConfirmModal {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}
const MODAL_CLOSED: ConfirmModal = { open: false, title: '', message: '', onConfirm: () => {} };

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formHtml, setFormHtml] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState<ConfirmModal>(MODAL_CLOSED);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await templatesApi.getAll({ search: search || undefined, limit: 100 });
      setTemplates(data.templates);
    } catch {
      toast.error('Error al cargar plantillas');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => loadTemplates(), search ? 400 : 0);
    return () => clearTimeout(t);
  }, [loadTemplates]);

  const openCreate = () => {
    setEditingTemplate(null);
    setFormName('');
    setFormDescription('');
    setFormHtml('');
    setShowModal(true);
  };

  const openEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormName(template.name);
    setFormDescription(template.description || '');
    setFormHtml(template.htmlContent);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: formName,
        htmlContent: formHtml,
        description: formDescription || undefined,
      };
      if (editingTemplate) {
        await templatesApi.update(editingTemplate.id, payload);
        toast.success('Plantilla actualizada');
      } else {
        await templatesApi.create(payload);
        toast.success('Plantilla creada');
      }
      closeModal();
      loadTemplates();
    } catch {
      toast.error('Error al guardar plantilla');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (template: Template) => {
    setModal({
      open: true,
      title: 'Eliminar plantilla',
      message: `¿Eliminar la plantilla "${template.name}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        setModal(MODAL_CLOSED);
        try {
          await templatesApi.delete(template.id);
          toast.success('Plantilla eliminada');
          loadTemplates();
        } catch {
          toast.error('Error al eliminar plantilla');
        }
      },
    });
  };

  return (
    <>
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(MODAL_CLOSED)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">{modal.title}</h3>
                <p className="text-sm text-gray-600">{modal.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setModal(MODAL_CLOSED)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={modal.onConfirm} className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar plantillas..."
                className="w-full pl-9 pr-9 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={15} />
                </button>
              )}
            </div>
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap">
              <Plus size={16} />
              Nueva plantilla
            </button>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">
                {search ? 'Resultados de búsqueda' : 'Total de plantillas'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          ) : templates.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {search ? 'No se encontraron plantillas' : 'No hay plantillas aún'}
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  {search ? 'Intenta con otro término de búsqueda.' : 'Crea plantillas reutilizables para tus campañas de email.'}
                </p>
                {!search && (
                  <button onClick={openCreate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors">
                    <Plus size={16} />Crear primera plantilla
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {templates.map(template => (
                <div key={template.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow flex flex-col">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 truncate">{template.name}</h3>
                      {template.description && (
                        <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">{template.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 mb-4">
                    <FileText size={13} className="text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-500 truncate font-mono">
                      {template.htmlContent.length.toLocaleString()} caracteres de HTML
                    </span>
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <button onClick={() => openEdit(template)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors">
                      <Edit size={14} />
                      Editar
                    </button>
                    <button onClick={() => confirmDelete(template)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">
                {editingTemplate ? 'Editar plantilla' : 'Nueva plantilla'}
              </h2>
              <button onClick={closeModal} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre <span className="text-red-500">*</span></label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} required
                  placeholder="Ej: Bienvenida a nuevos clientes"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                <input type="text" value={formDescription} onChange={e => setFormDescription(e.target.value)}
                  placeholder="Breve descripción de la plantilla"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Contenido HTML <span className="text-red-500">*</span></label>
                <textarea value={formHtml} onChange={e => setFormHtml(e.target.value)} required rows={18}
                  placeholder={'<html>\n  <body>\n    Tu contenido aquí...\n  </body>\n</html>'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition font-mono resize-none" />
                <p className="text-xs text-gray-400 mt-1.5">
                  Puedes usar variables como {'{{nombre}}'}, {'{{email}}'}, etc.
                </p>
              </div>

              <div className="flex gap-3 pt-2 border-t border-gray-200">
                <button type="submit" disabled={submitting}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white py-2.5 rounded-lg font-medium text-sm transition">
                  {submitting ? 'Guardando...' : editingTemplate ? 'Actualizar' : 'Crear'}
                </button>
                <button type="button" onClick={closeModal}
                  className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50 transition">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
