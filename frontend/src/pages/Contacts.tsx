import { useEffect, useState, useCallback, useRef } from 'react';
import { contactsApi } from '../api/contacts';
import { Contact } from '../types';
import toast from 'react-hot-toast';
import {
  Plus, Upload, Download, Search, Trash2, Users,
  Mail, Building2, Tag, X, AlertTriangle, ChevronLeft, ChevronRight,
  FileSpreadsheet, FileText, Phone, CheckCircle2, AlertCircle, ChevronDown, Pencil,
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
  const [companyFilter, setCompanyFilter] = useState('');
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [tagFilterOpen, setTagFilterOpen] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [allCompanies, setAllCompanies] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Batch selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchCompany, setBatchCompany] = useState('');
  const [batchTagsAdd, setBatchTagsAdd] = useState('');
  const [batchTagsRemove, setBatchTagsRemove] = useState('');
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formEmail, setFormEmail] = useState('');
  const [formName, setFormName] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formTags, setFormTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Meta: existing companies and tags
  const [metaCompanies, setMetaCompanies] = useState<string[]>([]);
  const [metaTags, setMetaTags] = useState<string[]>([]);
  const [companySearch, setCompanySearch] = useState('');
  const [companyFocused, setCompanyFocused] = useState(false);
  const [tagInputFocused, setTagInputFocused] = useState(false);

  // Email validation
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'ok' | 'taken' | 'invalid'>('idle');
  const [emailCheckTimer, setEmailCheckTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [modal, setModal] = useState<ConfirmModal>(MODAL_CLOSED);
  const [importPreview, setImportPreview] = useState<any | null>(null);
  const [importPreviewing, setImportPreviewing] = useState(false);
  const [importConfirming, setImportConfirming] = useState(false);
  const [importProgress, setImportProgress] = useState<{ imported: number; processed: number; total: number } | null>(null);
  const [importDone, setImportDone] = useState<{ imported: number; skipped: number } | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (search) params.search = search;
      if (companyFilter) params.company = companyFilter;
      if (tagFilter.length > 0) params.tags = tagFilter.join(',');
      const data = await contactsApi.getAll(params);
      setContacts(data.contacts);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch {
      toast.error('Error al cargar contactos');
    } finally {
      setLoading(false);
    }
  }, [search, companyFilter, tagFilter, page, limit]);

  // Load meta once on mount
  useEffect(() => {
    contactsApi.getMeta().then(meta => {
      setAllTags(meta.tags);
      setAllCompanies(meta.companies);
    }).catch(() => {});
  }, []);

  // Reset page and selection on filter change
  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [search, companyFilter, tagFilter, limit]);

  useEffect(() => {
    const t = setTimeout(() => { loadContacts(); }, search || companyFilter || tagFilter.length ? 400 : 0);
    return () => clearTimeout(t);
  }, [loadContacts]);

  // Sync indeterminate state on select-all checkbox
  useEffect(() => {
    if (!selectAllRef.current) return;
    const allSelected = contacts.length > 0 && contacts.every(c => selected.has(c.id));
    const someSelected = contacts.some(c => selected.has(c.id));
    selectAllRef.current.checked = allSelected;
    selectAllRef.current.indeterminate = someSelected && !allSelected;
  }, [selected, contacts]);

  const resetForm = () => {
    setFormEmail(''); setFormName(''); setFormCompany(''); setFormPhone('');
    setFormTags([]); setTagInput(''); setCompanySearch('');
    setEmailStatus('idle'); setCompanyFocused(false); setTagInputFocused(false);
  };

  const openCreate = async () => {
    setEditingContact(null);
    resetForm();
    setShowContactModal(true);
    try {
      const meta = await contactsApi.getMeta();
      setMetaCompanies(meta.companies);
      setMetaTags(meta.tags);
    } catch { /* non-critical */ }
  };

  const openEdit = async (contact: Contact) => {
    setEditingContact(contact);
    setFormEmail(contact.email);
    setFormName(contact.name || '');
    setFormCompany(contact.company || '');
    setCompanySearch(contact.company || '');
    setFormPhone(contact.phone || '');
    setFormTags(contact.tags);
    setTagInput('');
    setEmailStatus('ok');
    setCompanyFocused(false);
    setTagInputFocused(false);
    setShowContactModal(true);
    try {
      const meta = await contactsApi.getMeta();
      setMetaCompanies(meta.companies);
      setMetaTags(meta.tags);
    } catch { /* non-critical */ }
  };

  // Email validation on blur
  const handleEmailBlur = () => {
    const email = formEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) { setEmailStatus('idle'); return; }
    if (!emailRegex.test(email)) { setEmailStatus('invalid'); return; }
    if (editingContact && email === editingContact.email) { setEmailStatus('ok'); return; }

    setEmailStatus('checking');
    if (emailCheckTimer) clearTimeout(emailCheckTimer);
    const timer = setTimeout(async () => {
      try {
        const { exists } = await contactsApi.checkEmail(email, editingContact?.id);
        setEmailStatus(exists ? 'taken' : 'ok');
      } catch { setEmailStatus('idle'); }
    }, 300);
    setEmailCheckTimer(timer);
  };

  // Phone: allow only digits, +, spaces, hyphens, parens; validate 10 digits for MX
  const handlePhoneChange = (raw: string) => {
    const cleaned = raw.replace(/[^\d+\s\-()]/g, '');
    setFormPhone(cleaned);
  };

  const phoneDigits = formPhone.replace(/\D/g, '').replace(/^52/, ''); // strip MX country code
  const phoneValid = formPhone === '' || phoneDigits.length === 10;

  // Tags
  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !formTags.includes(t)) setFormTags(prev => [...prev, t]);
    setTagInput('');
  };

  const removeTag = (tag: string) => setFormTags(prev => prev.filter(t => t !== tag));

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && formTags.length > 0) {
      removeTag(formTags[formTags.length - 1]);
    }
  };

  // Company autocomplete — only show when typing
  const companySuggestions = companyFocused && companySearch.trim()
    ? metaCompanies.filter(c => c.toLowerCase().includes(companySearch.toLowerCase()))
    : [];

  const selectCompany = (company: string) => {
    setFormCompany(company);
    setCompanySearch(company);
    setCompanyFocused(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailStatus === 'taken') { toast.error('Este email ya está registrado'); return; }
    if (emailStatus === 'invalid') { toast.error('El email no tiene un formato válido'); return; }
    if (!formName.trim()) { toast.error('El nombre es obligatorio'); return; }
    if (!formCompany.trim()) { toast.error('La empresa es obligatoria'); return; }
    if (formTags.length === 0) { toast.error('Agrega al menos una etiqueta'); return; }
    if (!phoneValid) { toast.error('El teléfono debe tener 10 dígitos'); return; }

    const data = {
      email: formEmail.trim(),
      name: formName.trim(),
      company: formCompany.trim(),
      phone: formPhone.trim() || undefined,
      tags: formTags,
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

  const handleImportFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setImportPreviewing(true);
    try {
      const preview = await contactsApi.previewImport(file);
      setImportPreview(preview);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al analizar el archivo');
    } finally {
      setImportPreviewing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreview?.validRows?.length) return;
    setImportConfirming(true);
    setImportProgress({ imported: 0, processed: 0, total: importPreview.validRows.length });
    try {
      const result = await contactsApi.import(
        importPreview.validRows,
        (imported, processed, total) => setImportProgress({ imported, processed, total }),
      );
      setImportPreview(null);
      setImportProgress(null);
      setImportDone({ imported: result.imported, skipped: result.skipped });
      loadContacts();
    } catch (error: any) {
      toast.error(error?.message || 'Error al importar contactos');
      setImportProgress(null);
    } finally {
      setImportConfirming(false);
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

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const allOnPage = contacts.map(c => c.id);
    const allSelected = allOnPage.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      allOnPage.forEach(id => allSelected ? next.delete(id) : next.add(id));
      return next;
    });
  };

  const handleBatchDelete = () => {
    setModal({
      open: true,
      title: 'Eliminar contactos seleccionados',
      message: `¿Eliminar ${selected.size} contacto${selected.size !== 1 ? 's' : ''}? Esta acción es permanente.`,
      onConfirm: async () => {
        setModal(MODAL_CLOSED);
        try {
          await contactsApi.batchDelete(Array.from(selected));
          toast.success(`${selected.size} contacto${selected.size !== 1 ? 's' : ''} eliminado${selected.size !== 1 ? 's' : ''}`);
          setSelected(new Set());
          loadContacts();
        } catch {
          toast.error('Error al eliminar contactos');
        }
      },
    });
  };

  const handleBatchUpdate = async () => {
    const tagsAdd = batchTagsAdd.split(',').map(t => t.trim()).filter(Boolean);
    const tagsRemove = batchTagsRemove.split(',').map(t => t.trim()).filter(Boolean);
    if (!batchCompany && tagsAdd.length === 0 && tagsRemove.length === 0) {
      toast.error('Define al menos un cambio a aplicar');
      return;
    }
    setBatchSubmitting(true);
    try {
      const data: any = {};
      if (batchCompany !== '') data.company = batchCompany;
      if (tagsAdd.length) data.tagsAdd = tagsAdd;
      if (tagsRemove.length) data.tagsRemove = tagsRemove;
      await contactsApi.batchUpdate(Array.from(selected), data);
      toast.success(`${selected.size} contacto${selected.size !== 1 ? 's' : ''} actualizados`);
      setBatchModalOpen(false);
      setBatchCompany(''); setBatchTagsAdd(''); setBatchTagsRemove('');
      setSelected(new Set());
      loadContacts();
      // Refresh meta
      contactsApi.getMeta().then(m => { setAllTags(m.tags); setAllCompanies(m.companies); }).catch(() => {});
    } catch {
      toast.error('Error al actualizar contactos');
    } finally {
      setBatchSubmitting(false);
    }
  };

  const clearFilters = () => { setSearch(''); setCompanyFilter(''); setTagFilter([]); };
  const isFiltered = Boolean(search || companyFilter || tagFilter.length);
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

      {/* Import Preview Modal */}
      {importPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => !importConfirming && setImportPreview(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Revisión de importación</h3>
                <p className="text-xs text-gray-500 mt-0.5">{importPreview.total} filas analizadas — confirma antes de importar</p>
              </div>
              {!importConfirming && (
                <button onClick={() => setImportPreview(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X size={16} /></button>
              )}
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3 p-5 border-b border-gray-100">
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-2xl font-bold text-green-700">{importPreview.toImport}</p>
                <p className="text-xs font-medium text-green-600 mt-0.5">Listos para importar</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-2xl font-bold text-yellow-700">{importPreview.alreadyExists}</p>
                <p className="text-xs font-medium text-yellow-600 mt-0.5">Ya existen en la BD</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-2xl font-bold text-red-700">{importPreview.invalid}</p>
                <p className="text-xs font-medium text-red-600 mt-0.5">Con errores</p>
              </div>
            </div>

            {/* Error list */}
            {(importPreview.invalidRows?.length > 0 || importPreview.duplicateRows?.length > 0) && (
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                <p className="text-sm font-semibold text-gray-700">
                  Registros con problemas ({(importPreview.invalidRows?.length || 0) + (importPreview.duplicateRows?.length || 0)})
                </p>

                {/* Already in DB */}
                {importPreview.duplicateRows?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-2">Ya existen en la base de datos</p>
                    <div className="space-y-1.5">
                      {importPreview.duplicateRows.map((row: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-xs">
                          <span className="text-yellow-500 font-mono flex-shrink-0">Fila {row.rowIndex}</span>
                          <span className="font-medium text-yellow-800 truncate">{row.raw.email}</span>
                          <span className="text-yellow-600 ml-auto flex-shrink-0">Duplicado en BD</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Validation errors */}
                {importPreview.invalidRows?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">Errores de validación</p>
                    <div className="space-y-1.5">
                      {importPreview.invalidRows.map((row: any, i: number) => (
                        <div key={i} className="p-3 bg-red-50 rounded-lg border border-red-200 text-xs">
                          <div className="flex items-center gap-3 mb-1.5">
                            <span className="text-red-400 font-mono flex-shrink-0">Fila {row.rowIndex}</span>
                            <span className="font-medium text-red-800 truncate">{row.raw.email || <em className="text-red-400">sin email</em>}</span>
                            {row.raw.name && <span className="text-red-500 truncate">{row.raw.name}</span>}
                          </div>
                          <ul className="space-y-0.5 pl-2">
                            {row.errors.map((err: string, j: number) => (
                              <li key={j} className="text-red-600 before:content-['•'] before:mr-1.5">{err}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="p-5 border-t border-gray-200 space-y-3">
              {/* Progress bar — visible while importing */}
              {importProgress && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Importando contactos...</span>
                    <span className="font-medium tabular-nums">
                      {importProgress.processed} / {importProgress.total}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.round((importProgress.processed / importProgress.total) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span className="text-green-600 font-medium">{importProgress.imported} importados</span>
                    <span>{Math.round((importProgress.processed / importProgress.total) * 100)}%</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-gray-400">
                  {importProgress
                    ? 'No cierres esta ventana mientras se importa.'
                    : importPreview.toImport === 0
                      ? 'No hay contactos válidos para importar.'
                      : `Se importarán ${importPreview.toImport} contacto${importPreview.toImport !== 1 ? 's' : ''}. Los errores serán omitidos.`
                  }
                </p>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setImportPreview(null)} disabled={importConfirming}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={importConfirming || importPreview.toImport === 0}
                    className="px-4 py-2 text-sm font-medium bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-2">
                    {importConfirming
                      ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Importando...</>
                      : `Importar ${importPreview.toImport} contacto${importPreview.toImport !== 1 ? 's' : ''}`
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Done Modal */}
      {importDone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setImportDone(null)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Importación completada</h3>
            <p className="text-sm text-gray-500 mb-4">
              <span className="font-bold text-green-700">{importDone.imported}</span> contacto{importDone.imported !== 1 ? 's' : ''} importado{importDone.imported !== 1 ? 's' : ''} correctamente.
              {importDone.skipped > 0 && <> <span className="text-gray-400">({importDone.skipped} omitido{importDone.skipped !== 1 ? 's' : ''})</span></>}
            </p>
            <button onClick={() => setImportDone(null)} className="w-full px-4 py-2.5 text-sm font-medium bg-orange-600 hover:bg-orange-700 text-white rounded-lg">
              Cerrar
            </button>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-4">

          {/* Top bar: filters + actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">

            {/* Row 1: search fields */}
            <div className="flex flex-wrap gap-2">
              {/* General search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Nombre o email..."
                  className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={13} /></button>}
              </div>

              {/* Company filter */}
              <div className="relative min-w-[180px]">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)}
                  className={`w-full pl-9 pr-8 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white appearance-none ${companyFilter ? 'border-orange-400 text-orange-700' : 'border-gray-300 text-gray-700'}`}>
                  <option value="">Todas las empresas</option>
                  {allCompanies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={13} />
              </div>

              {/* Tag filter */}
              <div className="relative">
                <button onClick={() => setTagFilterOpen(o => !o)}
                  className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    tagFilter.length > 0 ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}>
                  <Tag size={14} />
                  {tagFilter.length > 0 ? `${tagFilter.length} tag${tagFilter.length > 1 ? 's' : ''}` : 'Tags'}
                  <ChevronDown size={13} />
                </button>
                {tagFilterOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setTagFilterOpen(false)} />
                    <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[200px] max-h-60 overflow-y-auto">
                      {tagFilter.length > 0 && (
                        <button onClick={() => setTagFilter([])} className="flex items-center gap-2 w-full px-4 py-2 text-xs text-orange-600 hover:bg-orange-50 border-b border-gray-100">
                          <X size={11} /> Limpiar selección
                        </button>
                      )}
                      {allTags.length === 0
                        ? <p className="px-4 py-3 text-sm text-gray-400">No hay tags disponibles</p>
                        : allTags.map(tag => {
                          const checked = tagFilter.includes(tag);
                          return (
                            <label key={tag} className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 cursor-pointer">
                              <input type="checkbox" checked={checked}
                                onChange={() => setTagFilter(prev => checked ? prev.filter(t => t !== tag) : [...prev, tag])}
                                className="accent-orange-600 w-3.5 h-3.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{tag}</span>
                            </label>
                          );
                        })
                      }
                    </div>
                  </>
                )}
              </div>

              {isFiltered && (
                <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <X size={13} /> Limpiar filtros
                </button>
              )}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Per-page */}
              <select value={limit} onChange={e => setLimit(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-orange-500 bg-white">
                {LIMIT_OPTIONS.map(n => <option key={n} value={n}>{n} / pág</option>)}
              </select>
            </div>

            {/* Row 2: action buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100">
              <label className={`cursor-pointer flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors ${importPreviewing ? 'opacity-60 pointer-events-none' : ''}`}>
                {importPreviewing
                  ? <><div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />Analizando...</>
                  : <><Upload size={14} />Importar</>}
                <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleImportFileSelect} disabled={importPreviewing} />
              </label>

              <div className="relative">
                <button onClick={() => { setExportOpen(o => !o); setTemplateOpen(false); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors">
                  <Download size={14} />Exportar<ChevronDown size={13} />
                </button>
                {exportOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                    <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[130px]">
                      <button onClick={() => { handleExport('xlsx'); setExportOpen(false); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 rounded-t-lg"><FileSpreadsheet size={13} />XLSX</button>
                      <button onClick={() => { handleExport('csv'); setExportOpen(false); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 rounded-b-lg"><FileText size={13} />CSV</button>
                    </div>
                  </>
                )}
              </div>

              <div className="relative">
                <button onClick={() => { setTemplateOpen(o => !o); setExportOpen(false); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors">
                  <FileSpreadsheet size={14} />Plantilla<ChevronDown size={13} />
                </button>
                {templateOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setTemplateOpen(false)} />
                    <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[130px]">
                      <button onClick={() => { handleTemplate('xlsx'); setTemplateOpen(false); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 rounded-t-lg"><FileSpreadsheet size={13} />XLSX</button>
                      <button onClick={() => { handleTemplate('csv'); setTemplateOpen(false); }} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 rounded-b-lg"><FileText size={13} />CSV</button>
                    </div>
                  </>
                )}
              </div>

              <div className="flex-1" />
              <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors">
                <Plus size={14} />Nuevo contacto
              </button>
            </div>
          </div>

          {/* Batch action bar — appears when rows are selected */}
          {selected.size > 0 && (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-orange-50 border border-orange-200 rounded-xl">
              <span className="text-sm font-medium text-orange-700">{selected.size} seleccionado{selected.size !== 1 ? 's' : ''}</span>
              <div className="flex-1" />
              <button onClick={() => setBatchModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                <Pencil size={13} />Editar seleccionados
              </button>
              <button onClick={handleBatchDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors">
                <Trash2 size={13} />Eliminar seleccionados
              </button>
              <button onClick={() => setSelected(new Set())} className="p-1.5 text-orange-400 hover:text-orange-700"><X size={15} /></button>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-orange-600" />
              </div>
            ) : contacts.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-orange-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  {isFiltered ? 'Sin resultados' : 'No hay contactos aún'}
                </h3>
                <p className="text-sm text-gray-400 mb-5">
                  {isFiltered ? 'Prueba ajustando los filtros.' : 'Crea tu primer contacto o importa una lista.'}
                </p>
                {isFiltered
                  ? <button onClick={clearFilters} className="inline-flex items-center gap-2 px-4 py-2 text-sm text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50"><X size={14} />Limpiar filtros</button>
                  : <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg"><Plus size={14} />Agregar contacto</button>
                }
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="w-10 px-4 py-3">
                          <input ref={selectAllRef} type="checkbox" onChange={toggleSelectAll} className="accent-orange-600 w-4 h-4" />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Empresa</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Teléfono</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tags</th>
                        <th className="w-20 px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {contacts.map(contact => {
                        const isSelected = selected.has(contact.id);
                        return (
                          <tr key={contact.id} className={`transition-colors ${isSelected ? 'bg-orange-50' : 'hover:bg-gray-50'}`}>
                            <td className="px-4 py-3">
                              <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(contact.id)}
                                className="accent-orange-600 w-4 h-4" />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-bold text-orange-600">
                                    {(contact.name || contact.email).charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-gray-900 truncate max-w-[160px]">
                                  {contact.name || <span className="text-gray-400 italic">Sin nombre</span>}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                <Mail size={13} className="text-gray-400 flex-shrink-0" />
                                <span className="truncate max-w-[200px]">{contact.email}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                <Building2 size={13} className="text-gray-400 flex-shrink-0" />
                                <span className="truncate max-w-[160px]">{contact.company || <span className="text-gray-300">—</span>}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                <Phone size={13} className="text-gray-400 flex-shrink-0" />
                                <span>{contact.phone || <span className="text-gray-300">—</span>}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1 flex-wrap max-w-[200px]">
                                {contact.tags.slice(0, 3).map((tag, i) => (
                                  <span key={i} className="inline-flex items-center gap-0.5 bg-orange-50 text-orange-700 text-xs px-1.5 py-0.5 rounded border border-orange-100 font-medium">
                                    {tag}
                                  </span>
                                ))}
                                {contact.tags.length > 3 && (
                                  <span className="text-xs text-gray-400">+{contact.tags.length - 3}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1 justify-end">
                                <button onClick={() => openEdit(contact)}
                                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Editar">
                                  <Pencil size={14} />
                                </button>
                                <button onClick={() => confirmDelete(contact)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    {pageStart}–{pageEnd} de <span className="font-medium">{total}</span> contactos
                    {isFiltered && <span className="text-gray-400"> (filtrado)</span>}
                  </p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                      <ChevronLeft size={16} />
                    </button>
                    {(() => {
                      const pages: (number | '...')[] = [];
                      if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
                      else {
                        pages.push(1);
                        if (page > 3) pages.push('...');
                        for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
                        if (page < totalPages - 2) pages.push('...');
                        pages.push(totalPages);
                      }
                      return pages.map((p, i) => p === '...'
                        ? <span key={`e${i}`} className="px-1 text-gray-400 text-sm">…</span>
                        : <button key={p} onClick={() => setPage(p as number)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === p ? 'bg-orange-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                            {p}
                          </button>
                      );
                    })()}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Batch Edit Modal */}
      {batchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => !batchSubmitting && setBatchModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Editar {selected.size} contacto{selected.size !== 1 ? 's' : ''}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Solo se aplicarán los campos que completes</p>
              </div>
              {!batchSubmitting && <button onClick={() => setBatchModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"><X size={16} /></button>}
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Building2 size={13} className="inline mr-1.5 text-gray-400" />
                  Cambiar empresa
                </label>
                <select value={batchCompany} onChange={e => setBatchCompany(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white">
                  <option value="">— Sin cambio —</option>
                  {allCompanies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Tag size={13} className="inline mr-1.5 text-gray-400" />
                  Agregar tags
                </label>
                <input type="text" value={batchTagsAdd} onChange={e => setBatchTagsAdd(e.target.value)}
                  placeholder="tag1, tag2, tag3"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                <p className="text-xs text-gray-400 mt-1">Separados por coma. Se añadirán a los tags existentes.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <X size={13} className="inline mr-1.5 text-gray-400" />
                  Quitar tags
                </label>
                <input type="text" value={batchTagsRemove} onChange={e => setBatchTagsRemove(e.target.value)}
                  placeholder="tag1, tag2"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                <p className="text-xs text-gray-400 mt-1">Separados por coma. Se eliminarán de los tags existentes.</p>
              </div>
            </div>
            <div className="flex gap-3 px-5 pb-5">
              <button onClick={handleBatchUpdate} disabled={batchSubmitting}
                className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white py-2.5 rounded-lg font-medium text-sm transition flex items-center justify-center gap-2">
                {batchSubmitting ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Aplicando...</> : 'Aplicar cambios'}
              </button>
              <button onClick={() => setBatchModalOpen(false)} disabled={batchSubmitting}
                className="flex-1 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50 transition disabled:opacity-50">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Form Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowContactModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">
                {editingContact ? 'Editar contacto' : 'Nuevo contacto'}
              </h2>
              <button onClick={() => setShowContactModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Mail size={13} className="inline mr-1.5 text-gray-400" />
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email" required
                    value={formEmail}
                    onChange={e => { setFormEmail(e.target.value); setEmailStatus('idle'); }}
                    onBlur={handleEmailBlur}
                    placeholder="contacto@empresa.com"
                    className={`w-full px-4 py-2.5 pr-10 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition ${
                      emailStatus === 'taken' || emailStatus === 'invalid' ? 'border-red-400 bg-red-50' :
                      emailStatus === 'ok' ? 'border-green-400' : 'border-gray-300'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {emailStatus === 'checking' && <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />}
                    {emailStatus === 'ok' && <CheckCircle2 size={16} className="text-green-500" />}
                    {(emailStatus === 'taken' || emailStatus === 'invalid') && <AlertCircle size={16} className="text-red-500" />}
                  </div>
                </div>
                {emailStatus === 'taken' && <p className="text-xs text-red-500 mt-1.5">Este email ya está registrado</p>}
                {emailStatus === 'invalid' && <p className="text-xs text-red-500 mt-1.5">El formato del email no es válido</p>}
              </div>

              {/* Nombre */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre <span className="text-red-500">*</span></label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)}
                  placeholder="Juan Pérez"
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition ${!formName.trim() ? 'border-gray-300' : 'border-gray-300'}`} />
              </div>

              {/* Empresa con autocomplete */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Building2 size={13} className="inline mr-1.5 text-gray-400" />
                  Empresa <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={companySearch}
                    onChange={e => {
                      setCompanySearch(e.target.value);
                      setFormCompany(e.target.value);
                    }}
                    onFocus={() => setCompanyFocused(true)}
                    onBlur={() => setTimeout(() => setCompanyFocused(false), 200)}
                    placeholder="Escribe o selecciona una empresa..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                  />
                  {companySuggestions.length > 0 && (
                    <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-44 overflow-y-auto">
                      {companySuggestions.map(company => (
                        <button
                          key={company} type="button"
                          onMouseDown={() => selectCompany(company)}
                          className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                        >
                          <Building2 size={13} className="text-gray-400 flex-shrink-0" />
                          {company}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {metaCompanies.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1.5">{metaCompanies.length} empresa{metaCompanies.length !== 1 ? 's' : ''} registrada{metaCompanies.length !== 1 ? 's' : ''}</p>
                )}
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Phone size={13} className="inline mr-1.5 text-gray-400" />
                  Teléfono
                </label>
                <input
                  type="tel" value={formPhone}
                  onChange={e => handlePhoneChange(e.target.value)}
                  placeholder="55 1234 5678"
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition ${
                    !phoneValid ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {!phoneValid && (
                  <p className="text-xs text-red-500 mt-1.5">El teléfono debe tener 10 dígitos</p>
                )}
                {phoneValid && formPhone && (
                  <p className="text-xs text-gray-400 mt-1.5">{phoneDigits.length} dígitos</p>
                )}
              </div>

              {/* Etiquetas como chips */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Tag size={13} className="inline mr-1.5 text-gray-400" />
                  Etiquetas <span className="text-red-500">*</span>
                </label>

                {/* Existing tags as selectable chips (all, always visible) */}
                {metaTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="w-full text-xs text-gray-400 mb-1">Etiquetas existentes — clic para agregar:</p>
                    {metaTags.map(tag => {
                      const selected = formTags.includes(tag);
                      return (
                        <button
                          key={tag} type="button"
                          onClick={() => selected ? removeTag(tag) : addTag(tag)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                            selected
                              ? 'bg-orange-100 text-orange-700 border-orange-300'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-orange-300 hover:text-orange-600'
                          }`}
                        >
                          {selected ? <X size={10} /> : <Plus size={10} />}
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Tag input with suggestions dropdown */}
                <div className="relative">
                  <div className={`flex flex-wrap gap-1.5 px-3 py-2 border rounded-lg focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent min-h-[42px] items-center ${
                    formTags.length === 0 ? 'border-gray-300' : 'border-orange-300'
                  }`}>
                    {formTags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-md font-medium border border-orange-200 flex-shrink-0">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-600 ml-0.5">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text" value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      onFocus={() => setTagInputFocused(true)}
                      onBlur={() => setTimeout(() => {
                        setTagInputFocused(false);
                        if (tagInput.trim()) addTag(tagInput);
                      }, 200)}
                      placeholder={formTags.length === 0 ? 'Nueva etiqueta...' : 'Agregar otra...'}
                      className="flex-1 min-w-[100px] text-sm outline-none bg-transparent placeholder-gray-400"
                    />
                  </div>

                  {/* Suggestions dropdown — only shown while typing */}
                  {tagInputFocused && tagInput.trim() && (() => {
                    const suggestions = metaTags.filter(t =>
                      t.toLowerCase().includes(tagInput.toLowerCase()) &&
                      !formTags.includes(t)
                    );
                    return suggestions.length > 0 ? (
                      <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-36 overflow-y-auto">
                        {suggestions.map(tag => (
                          <button
                            key={tag} type="button"
                            onMouseDown={e => { e.preventDefault(); addTag(tag); }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                          >
                            <Tag size={12} className="text-gray-400 flex-shrink-0" />
                            {tag}
                          </button>
                        ))}
                      </div>
                    ) : null;
                  })()}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Enter o coma para confirmar una etiqueta nueva. Mínimo 1 requerida.</p>
              </div>

              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={submitting || emailStatus === 'taken' || emailStatus === 'invalid' || emailStatus === 'checking' || !phoneValid}
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
