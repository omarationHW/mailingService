import { useEffect, useState, useCallback } from 'react';
import { contactsApi } from '../api/contacts';
import { Contact } from '../types';
import toast from 'react-hot-toast';
import {
  Plus, Upload, Download, Search, Trash2, Edit, Users,
  Mail, Building2, Tag, X, AlertTriangle, ChevronLeft, ChevronRight,
  FileSpreadsheet, FileText, Filter,
} from 'lucide-react';

interface ConfirmModal {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}
const MODAL_CLOSED: ConfirmModal = { open: false, title: '', message: '', onConfirm: () => {} };

const LIMIT_OPTIONS = [25, 50, 100, 250];

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formEmail, setFormEmail] = useState('');
  const [formName, setFormName] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formTags, setFormTags] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState<ConfirmModal>(MODAL_CLOSED);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors?: any[] } | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (search) params.search = search;
      if (tagFilter) params.tags = tagFilter;
      const data = await contactsApi.getAll(params);
      setContacts(data.contacts);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch {
      toast.error('Error al cargar contactos');
    } finally {
      setLoading(false);
    }
  }, [search, tagFilter, page, limit]);

  // Debounce search/tag changes and reset page
  useEffect(() => {
    setPage(1);
  }, [search, tagFilter, limit]);

  useEffect(() => {
    const t = setTimeout(() => { loadContacts(); }, search || tagFilter ? 400 : 0);
    return () => clearTimeout(t);
  }, [loadContacts]);

  const openCreate = () => {
    setEditingContact(null);
    setFormEmail(''); setFormName(''); setFormCompany(''); setFormPhone(''); setFormTags('');
    setShowContactModal(true);
  };

  const openEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormEmail(contact.email);
    setFormName(contact.name || '');
    setFormCompany(contact.company || '');
    setFormPhone(contact.phone || '');
    setFormTags(contact.tags.join(', '));
    setShowContactModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      email: formEmail,
      name: formName || undefined,
      company: formCompany || undefined,
      phone: formPhone || undefined,
      tags: formTags.split(',').map(t => t.trim()).filter(Boolean),
    };
    setSubmitting(true);
    try {
      if (editingContact) {
        await contactsApi.update(editingContact.id, data);
        toast.success('Contacto actualizado');
      } else {
        await contactsApi.create(data);
        toast.success('Contacto creado');
      }
      setShowContactModal(false);
      loadContacts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar contacto');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (contact: Contact) => {
    setModal({
      open: true,
      title: 'Eliminar contacto',
      message: `¿Eliminar a "${contact.name || contact.email}"? Esta acción es permanente.`,
      onConfirm: async () => {
        setModal(MODAL_CLOSED);
        try {
          await contactsApi.delete(contact.id);
          toast.success('Contacto eliminado');
          loadContacts();
        } catch {
          toast.error('Error al eliminar contacto');
        }
      },
    });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const result = await contactsApi.import(file);
      setImportResult(result);
      toast.success(`${result.imported} contacto(s) importados`);
      loadContacts();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al importar contactos');
    }
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      const blob = await contactsApi.export(format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contactos.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Error al exportar contactos');
    }
  };

  const handleTemplate = async (format: 'csv' | 'xlsx') => {
    try {
      const blob = await contactsApi.downloadTemplate(format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plantilla_contactos.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Error al descargar plantilla');
    }
  };

  const isFiltered = Boolean(search || tagFilter);
  const pageStart = contacts.length > 0 ? (page - 1) * limit + 1 : 0;
  const pageEnd = Math.min(page * limit, total);

  return (
    <>
      {/* Confirm Modal */}
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

      {/* Import Result Modal */}
      {importResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setImportResult(null)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Resultado de importación</h3>
              <button onClick={() => setImportResult(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-sm font-medium text-green-800">Importados</span>
                <span className="text-lg font-bold text-green-700">{importResult.imported}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-sm font-medium text-gray-700">Omitidos (duplicados u error)</span>
                <span className="text-lg font-bold text-gray-600">{importResult.skipped}</span>
              </div>
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-xs font-semibold text-red-700 mb-2">Primeros errores:</p>
                  {importResult.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-600">{err.error} — {err.row?.email || 'fila desconocida'}</p>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setImportResult(null)} className="mt-4 w-full px-4 py-2 text-sm font-medium bg-orange-600 hover:bg-orange-700 text-white rounded-lg">Cerrar</button>
          </div>
        </div>
      )}

      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-gray-500 text-sm font-medium mb-0.5">Total de contactos</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <Filter className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-gray-500 text-sm font-medium mb-0.5">
                {isFiltered ? 'Resultados de búsqueda' : 'Mostrando'}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {contacts.length > 0 ? `${pageStart}–${pageEnd}` : '0'}
              </p>
              {isFiltered && (
                <p className="text-xs text-gray-400 mt-0.5">{total} coincidencia{total !== 1 ? 's' : ''} encontrada{total !== 1 ? 's' : ''}</p>
              )}
            </div>
          </div>

          {/* Toolbar — filters row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nombre, email o empresa..."
                className="w-full pl-9 pr-9 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={15} /></button>
              )}
            </div>

            <div className="relative sm:w-44">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input type="text" value={tagFilter} onChange={e => setTagFilter(e.target.value)}
                placeholder="Filtrar por tag..."
                className="w-full pl-9 pr-9 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
              {tagFilter && (
                <button onClick={() => setTagFilter('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={15} /></button>
              )}
            </div>

            <select value={limit} onChange={e => setLimit(Number(e.target.value))}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-orange-500 bg-white">
              {LIMIT_OPTIONS.map(n => <option key={n} value={n}>{n} por página</option>)}
            </select>
          </div>

          {/* Toolbar — actions row */}
          <div className="flex flex-wrap gap-2">
            <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors">
              <Upload size={15} />
              Importar
              <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleImport} />
            </label>

            {/* Export dropdown */}
            <div className="relative">
              <button onClick={() => { setExportOpen(o => !o); setTemplateOpen(false); }}
                className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors">
                <Download size={15} />
                Exportar
              </button>
              {exportOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[150px]">
                    <button onClick={() => { handleExport('xlsx'); setExportOpen(false); }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 rounded-t-lg">
                      <FileSpreadsheet size={14} />XLSX
                    </button>
                    <button onClick={() => { handleExport('csv'); setExportOpen(false); }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 rounded-b-lg">
                      <FileText size={14} />CSV
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Template dropdown */}
            <div className="relative">
              <button onClick={() => { setTemplateOpen(o => !o); setExportOpen(false); }}
                className="flex items-center gap-1.5 px-3 py-2.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors">
                <FileSpreadsheet size={15} />
                Plantilla
              </button>
              {templateOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setTemplateOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[150px]">
                    <button onClick={() => { handleTemplate('xlsx'); setTemplateOpen(false); }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 rounded-t-lg">
                      <FileSpreadsheet size={14} />XLSX
                    </button>
                    <button onClick={() => { handleTemplate('csv'); setTemplateOpen(false); }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 rounded-b-lg">
                      <FileText size={14} />CSV
                    </button>
                  </div>
                </>
              )}
            </div>

            <button onClick={openCreate}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors">
              <Plus size={15} />
              Nuevo contacto
            </button>
          </div>

          {/* Contact grid / empty / loading */}
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          ) : contacts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {search || tagFilter ? 'No se encontraron contactos' : 'No hay contactos aún'}
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  {search || tagFilter ? 'Intenta con otros filtros de búsqueda.' : 'Agrega tu primer contacto o importa una lista.'}
                </p>
                {!search && !tagFilter && (
                  <button onClick={openCreate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors">
                    <Plus size={16} />Agregar primer contacto
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {contacts.map(contact => (
                  <div key={contact.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-11 h-11 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-orange-600">
                          {(contact.name || contact.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(contact)}
                          className="p-2 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Editar">
                          <Edit size={15} />
                        </button>
                        <button onClick={() => confirmDelete(contact)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h3 className="text-base font-semibold text-gray-900 mb-1 truncate">
                        {contact.name || contact.email}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{contact.email}</span>
                      </div>
                      {contact.company && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{contact.company}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                      {contact.tags.length > 0 ? (
                        <div className="flex gap-1.5 flex-wrap">
                          {contact.tags.map((tag, i) => (
                            <span key={i} className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded-md font-medium border border-orange-100">
                              <Tag className="w-2.5 h-2.5" />{tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Sin etiquetas</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-5 py-3">
                  <p className="text-sm text-gray-500">
                    {pageStart}–{pageEnd} de {total} contactos
                  </p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let p: number;
                      if (totalPages <= 5) p = i + 1;
                      else if (page <= 3) p = i + 1;
                      else if (page >= totalPages - 2) p = totalPages - 4 + i;
                      else p = page - 2 + i;
                      return (
                        <button key={p} onClick={() => setPage(p)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === p ? 'bg-orange-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                          {p}
                        </button>
                      );
                    })}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Contact Form Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowContactModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">
                {editingContact ? 'Editar contacto' : 'Nuevo contacto'}
              </h2>
              <button onClick={() => setShowContactModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
                <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} required
                  placeholder="contacto@empresa.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)}
                  placeholder="Juan Pérez"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Empresa</label>
                <input type="text" value={formCompany} onChange={e => setFormCompany(e.target.value)}
                  placeholder="Empresa S.A."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
                <input type="text" value={formPhone} onChange={e => setFormPhone(e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Etiquetas</label>
                <input type="text" value={formTags} onChange={e => setFormTags(e.target.value)}
                  placeholder="vip, cliente, newsletter"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition" />
                <p className="text-xs text-gray-400 mt-1.5">Separadas por comas</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white py-2.5 rounded-lg font-medium text-sm transition">
                  {submitting ? 'Guardando...' : editingContact ? 'Actualizar' : 'Crear'}
                </button>
                <button type="button" onClick={() => setShowContactModal(false)}
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
