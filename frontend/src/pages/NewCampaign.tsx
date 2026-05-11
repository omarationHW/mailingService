import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { campaignsApi } from '../api/campaigns';
import { templatesApi } from '../api/templates';
import { contactListsApi, ContactList } from '../api/contactLists';
import { contactsApi } from '../api/contacts';
import { Template } from '../types';
import toast from 'react-hot-toast';
import EmailEditor from '../components/EmailEditor';
import { allTemplates, EmailTemplate } from '../data/emailTemplates';
import { Users, ArrowLeft, FileText, Eye, X, List, Tag, ChevronDown, Clock } from 'lucide-react';

type SegmentMode = 'all' | 'tags' | 'lists';

interface FormState {
  name: string;
  subject: string;
  preheader: string;
  fromEmail: string;
  fromName: string;
  htmlContent: string;
}

interface SavedSender {
  email: string;
  name: string;
}

const EMPTY_FORM: FormState = {
  name: '', subject: '', preheader: '', fromEmail: '', fromName: '', htmlContent: '',
};

const SENDERS_KEY = 'mailing_saved_senders';
const MAX_SENDERS = 5;

function loadSenders(): SavedSender[] {
  try { return JSON.parse(localStorage.getItem(SENDERS_KEY) || '[]'); } catch { return []; }
}

function saveSender(email: string, name: string) {
  if (!email || !name) return;
  const existing = loadSenders().filter(s => s.email !== email);
  const updated = [{ email, name }, ...existing].slice(0, MAX_SENDERS);
  localStorage.setItem(SENDERS_KEY, JSON.stringify(updated));
}

export default function NewCampaign() {
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showTemplates, setShowTemplates] = useState(!isEditing);
  const [savedTemplates, setSavedTemplates] = useState<Template[]>([]);

  // Segmentation
  const [segmentMode, setSegmentMode] = useState<SegmentMode>('all');
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [showListDropdown, setShowListDropdown] = useState(false);
  const listDropdownRef = useRef<HTMLDivElement>(null);

  // Tags with autocomplete
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const tagContainerRef = useRef<HTMLDivElement>(null);

  // Saved senders
  const [savedSenders, setSavedSenders] = useState<SavedSender[]>([]);
  const [showSenderDropdown, setShowSenderDropdown] = useState(false);
  const senderDropdownRef = useRef<HTMLDivElement>(null);

  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [recipientLoading, setRecipientLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Preview
  const [showPreview, setShowPreview] = useState(false);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  // Load campaign when editing
  useEffect(() => {
    if (!isEditing || !id) return;
    campaignsApi.getOne(id).then(({ campaign }) => {
      setForm({
        name: campaign.name,
        subject: campaign.subject,
        preheader: campaign.preheader ?? '',
        fromEmail: campaign.fromEmail,
        fromName: campaign.fromName,
        htmlContent: campaign.htmlContent,
      });
    }).catch(() => {
      toast.error('Error al cargar la campaña');
      navigate('/campaigns');
    });
  }, [id, isEditing, navigate]);

  // Load saved templates
  useEffect(() => {
    if (isEditing) return;
    templatesApi.getAll({ limit: 100 }).then(data => setSavedTemplates(data.templates)).catch(() => {});
  }, [isEditing]);

  // Load contact lists + all tags + saved senders
  useEffect(() => {
    contactListsApi.getAll({ limit: 200 }).then(data => setContactLists(data.lists)).catch(() => {});
    contactsApi.getMeta().then(({ tags }) => setAllTags(tags)).catch(() => {});
    setSavedSenders(loadSenders());
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (listDropdownRef.current && !listDropdownRef.current.contains(e.target as Node))
        setShowListDropdown(false);
      if (tagContainerRef.current && !tagContainerRef.current.contains(e.target as Node))
        setShowTagSuggestions(false);
      if (senderDropdownRef.current && !senderDropdownRef.current.contains(e.target as Node))
        setShowSenderDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Write preview iframe
  useEffect(() => {
    if (showPreview && previewIframeRef.current && form.htmlContent) {
      const doc = previewIframeRef.current.contentDocument;
      if (doc) { doc.open(); doc.write(form.htmlContent); doc.close(); }
    }
  }, [showPreview, form.htmlContent]);

  // Debounced recipient count
  const fetchRecipientCount = useCallback(async () => {
    setRecipientLoading(true);
    try {
      let params: { tags?: string; contactListIds?: string } = {};
      if (segmentMode === 'tags' && selectedTags.length > 0) params.tags = selectedTags.join(',');
      if (segmentMode === 'lists' && selectedListIds.length > 0) params.contactListIds = selectedListIds.join(',');
      const { count } = await campaignsApi.previewRecipients(params);
      setRecipientCount(count);
    } catch {
      setRecipientCount(null);
    } finally {
      setRecipientLoading(false);
    }
  }, [segmentMode, selectedTags, selectedListIds]);

  useEffect(() => {
    const t = setTimeout(fetchRecipientCount, 500);
    return () => clearTimeout(t);
  }, [fetchRecipientCount]);

  const setField = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSavedTemplateSelect = (template: Template) => {
    setForm(prev => ({
      ...prev,
      name: prev.name || template.name,
      htmlContent: template.htmlContent,
      ...(template.subject ? { subject: template.subject } : {}),
      ...(template.preheader ? { preheader: template.preheader } : {}),
    }));
    setShowTemplates(false);
    toast.success(`Plantilla "${template.name}" cargada`);
  };

  const handleTemplateSelect = (template: EmailTemplate) => {
    const paragraphs = template.content.split('\n\n');
    let html = '';
    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) continue;
      html += `<p style="margin: 16px 0; font-size: 16px; line-height: 1.6;">${trimmed}</p>\n`;
    }
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px;">
              ${html}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

    setForm(prev => ({ ...prev, subject: template.subject, preheader: template.preheader, htmlContent: fullHtml }));
    setShowTemplates(false);
    toast.success(`Plantilla "${template.name}" cargada`);
  };

  const toggleListId = (listId: string) => {
    setSelectedListIds(prev => prev.includes(listId) ? prev.filter(id => id !== listId) : [...prev, listId]);
  };

  // Tag helpers
  const filteredTagSuggestions = allTags.filter(t =>
    !selectedTags.includes(t) &&
    (tagInput === '' || t.toLowerCase().includes(tagInput.toLowerCase()))
  );

  const addTag = (tag: string) => {
    const clean = tag.trim();
    if (clean && !selectedTags.includes(clean)) {
      setSelectedTags(prev => [...prev, clean]);
    }
    setTagInput('');
    tagInputRef.current?.focus();
  };

  const removeTag = (tag: string) => setSelectedTags(prev => prev.filter(t => t !== tag));

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1]);
    }
  };

  // Sender helpers
  const selectSender = (sender: SavedSender) => {
    setForm(prev => ({ ...prev, fromEmail: sender.email, fromName: sender.name }));
    setShowSenderDropdown(false);
  };

  const buildPayload = () => {
    const base = {
      name: form.name,
      subject: form.subject,
      preheader: form.preheader || undefined,
      htmlContent: form.htmlContent,
      fromEmail: form.fromEmail,
      fromName: form.fromName,
    };
    if (segmentMode === 'tags' && selectedTags.length > 0) {
      return { ...base, tags: selectedTags };
    }
    if (segmentMode === 'lists' && selectedListIds.length > 0) {
      return { ...base, contactListIds: selectedListIds };
    }
    return base;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('El nombre de la campaña es obligatorio'); return; }
    if (!form.subject.trim()) { toast.error('El asunto del email es obligatorio'); return; }
    if (!form.fromEmail.trim()) { toast.error('El email del remitente es obligatorio'); return; }
    if (!form.fromName.trim()) { toast.error('El nombre del remitente es obligatorio'); return; }
    if (!form.htmlContent.trim()) { toast.error('El contenido del email no puede estar vacío'); return; }
    if (segmentMode === 'lists' && selectedListIds.length === 0) { toast.error('Selecciona al menos una lista de contactos'); return; }
    if (segmentMode === 'tags' && selectedTags.length === 0) { toast.error('Agrega al menos una etiqueta para segmentar'); return; }
    setSubmitting(true);
    try {
      if (isEditing && id) {
        await campaignsApi.update(id, buildPayload());
        toast.success('Campaña actualizada correctamente');
      } else {
        await campaignsApi.create(buildPayload());
        toast.success('Campaña creada correctamente');
      }
      saveSender(form.fromEmail, form.fromName);
      navigate('/campaigns');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar la campaña');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedListNames = contactLists
    .filter(l => selectedListIds.includes(l.id))
    .map(l => l.name);

  return (
    <>
      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowPreview(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 flex flex-col" style={{ height: '85vh' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Vista previa del email</h3>
              <button onClick={() => setShowPreview(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden rounded-b-xl">
              <iframe
                ref={previewIframeRef}
                title="Email preview"
                className="w-full h-full border-0"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
      )}

      <div className="p-8">
        <div className="max-w-4xl mx-auto">

          {/* Back link */}
          <button
            onClick={() => navigate('/campaigns')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Volver a campañas
          </button>

          {/* Template picker */}
          {showTemplates && !isEditing && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Elige una plantilla</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Comienza con una plantilla prediseñada o una guardada</p>
                </div>
                <button type="button" onClick={() => setShowTemplates(false)}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                  Crear desde cero →
                </button>
              </div>

              {savedTemplates.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tus plantillas</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {savedTemplates.map(template => (
                      <div key={template.id} onClick={() => handleSavedTemplateSelect(template)}
                        className="border border-gray-200 rounded-lg p-4 hover:border-orange-400 hover:shadow-md cursor-pointer transition-all group">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mb-2">
                          <FileText size={15} className="text-orange-600" />
                        </div>
                        <h3 className="font-semibold text-sm text-gray-900 mb-1 group-hover:text-orange-600 transition-colors truncate">{template.name}</h3>
                        {template.description && <p className="text-xs text-gray-500 line-clamp-2">{template.description}</p>}
                        <p className="text-xs text-gray-400 mt-1.5 font-mono">{template.htmlContent.length.toLocaleString()} car. HTML</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Plantillas de ejemplo</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allTemplates.map(template => (
                  <div key={template.id} onClick={() => handleTemplateSelect(template)}
                    className="border border-gray-200 rounded-lg p-4 hover:border-orange-400 hover:shadow-md cursor-pointer transition-all group">
                    <div className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded inline-block mb-2">{template.category}</div>
                    <h3 className="font-semibold text-sm text-gray-900 mb-1.5 group-hover:text-orange-600 transition-colors">{template.name}</h3>
                    <p className="text-xs text-gray-600 mb-1.5 line-clamp-1">{template.subject}</p>
                    <p className="text-xs text-gray-500 italic line-clamp-2">{template.preheader}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
            {!showTemplates && !isEditing && (
              <button type="button" onClick={() => setShowTemplates(true)}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
                ← Ver plantillas
              </button>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre de la campaña <span className="text-red-500">*</span>
              </label>
              <input type="text" required value={form.name} onChange={setField('name')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition text-sm"
                placeholder="Ej: Campaña Nómina Mayo 2025" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Asunto del email <span className="text-red-500">*</span>
              </label>
              <input type="text" required value={form.subject} onChange={setField('subject')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition text-sm"
                placeholder="Ej: Seguridad privada para tu nómina 💼" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Preheader <span className="text-gray-400 font-normal">(texto de vista previa)</span>
              </label>
              <input type="text" value={form.preheader} onChange={setField('preheader')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition text-sm"
                placeholder="Ej: Automatiza pagos y contratos sin errores." />
              <p className="text-xs text-gray-500 mt-1.5">Texto que aparece junto al asunto en la bandeja de entrada.</p>
            </div>

            {/* Sender fields with saved senders */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">Remitente</label>
                {savedSenders.length > 0 && (
                  <div className="relative" ref={senderDropdownRef}>
                    <button type="button" onClick={() => setShowSenderDropdown(v => !v)}
                      className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-700 font-medium">
                      <Clock size={12} />Recientes
                      <ChevronDown size={12} />
                    </button>
                    {showSenderDropdown && (
                      <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg w-64">
                        {savedSenders.map((s, i) => (
                          <button key={i} type="button" onClick={() => selectSender(s)}
                            className="w-full text-left px-4 py-2.5 hover:bg-orange-50 transition-colors">
                            <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                            <p className="text-xs text-gray-500 truncate">{s.email}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input type="email" required value={form.fromEmail} onChange={setField('fromEmail')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition text-sm"
                    placeholder="contacto@tuempresa.com" />
                  <p className="text-xs text-gray-400 mt-1">Email</p>
                </div>
                <div>
                  <input type="text" required value={form.fromName} onChange={setField('fromName')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition text-sm"
                    placeholder="Tu Empresa" />
                  <p className="text-xs text-gray-400 mt-1">Nombre</p>
                </div>
              </div>
            </div>

            {/* Email content + preview button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-semibold text-gray-700">
                  Contenido del email <span className="text-red-500">*</span>
                </label>
                {form.htmlContent.trim() && (
                  <button type="button" onClick={() => setShowPreview(true)}
                    className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium">
                    <Eye size={14} />Vista previa
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-2">Variables: <code className="bg-gray-100 px-1 rounded">{'{{nombre}}'}</code> <code className="bg-gray-100 px-1 rounded">{'{{name}}'}</code> <code className="bg-gray-100 px-1 rounded">{'{{email}}'}</code> <code className="bg-gray-100 px-1 rounded">{'{{empresa}}'}</code> <code className="bg-gray-100 px-1 rounded">{'{{company}}'}</code></p>
              <EmailEditor value={form.htmlContent} onChange={html => setForm(prev => ({ ...prev, htmlContent: html }))} />
              {!form.htmlContent.trim() && (
                <p className="text-xs text-red-500 mt-1.5">El contenido del email es obligatorio.</p>
              )}
            </div>

            {/* Recipient segmentation */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Destinatarios</label>

              {/* Mode selector */}
              <div className="flex gap-2 mb-4">
                {[
                  { mode: 'all' as SegmentMode, label: 'Todos los contactos', icon: Users },
                  { mode: 'lists' as SegmentMode, label: 'Por lista', icon: List },
                  { mode: 'tags' as SegmentMode, label: 'Por etiquetas', icon: Tag },
                ].map(({ mode, label, icon: Icon }) => (
                  <button key={mode} type="button" onClick={() => setSegmentMode(mode)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      segmentMode === mode
                        ? 'bg-orange-600 text-white border-orange-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-orange-400 hover:text-orange-600'
                    }`}>
                    <Icon size={14} />{label}
                  </button>
                ))}
              </div>

              {/* Lists picker */}
              {segmentMode === 'lists' && (
                <div className="relative" ref={listDropdownRef}>
                  <button type="button" onClick={() => setShowListDropdown(v => !v)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-lg text-sm transition-colors text-left ${
                      selectedListIds.length > 0 ? 'border-orange-400 bg-orange-50' : 'border-gray-300 bg-white'
                    }`}>
                    <span className={selectedListIds.length > 0 ? 'text-orange-800' : 'text-gray-400'}>
                      {selectedListIds.length > 0 ? selectedListNames.join(', ') : 'Seleccionar listas...'}
                    </span>
                    <ChevronDown size={15} className="text-gray-400 flex-shrink-0 ml-2" />
                  </button>
                  {showListDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                      {contactLists.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">No hay listas disponibles</p>
                      ) : contactLists.map(list => (
                        <label key={list.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer">
                          <input type="checkbox" checked={selectedListIds.includes(list.id)}
                            onChange={() => toggleListId(list.id)}
                            className="accent-orange-600 w-4 h-4" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{list.name}</p>
                            <p className="text-xs text-gray-400">{list._count?.members ?? 0} contactos</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tags picker with chips + autocomplete */}
              {segmentMode === 'tags' && (
                <div ref={tagContainerRef}>
                  {/* Selected tags as chips */}
                  <div
                    className={`w-full min-h-[42px] flex flex-wrap gap-1.5 px-3 py-2 border rounded-lg cursor-text transition-colors ${
                      showTagSuggestions ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-gray-300'
                    }`}
                    onClick={() => { tagInputRef.current?.focus(); setShowTagSuggestions(true); }}
                  >
                    {selectedTags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-md">
                        {tag}
                        <button type="button" onClick={e => { e.stopPropagation(); removeTag(tag); }}
                          className="hover:text-orange-600 ml-0.5">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                    <input
                      ref={tagInputRef}
                      type="text"
                      value={tagInput}
                      onChange={e => { setTagInput(e.target.value); setShowTagSuggestions(true); }}
                      onKeyDown={handleTagKeyDown}
                      onFocus={() => setShowTagSuggestions(true)}
                      placeholder={selectedTags.length === 0 ? 'Escribe o selecciona etiquetas...' : ''}
                      className="flex-1 min-w-[120px] outline-none text-sm bg-transparent text-gray-700 placeholder-gray-400"
                    />
                  </div>

                  {/* Suggestions dropdown */}
                  {showTagSuggestions && filteredTagSuggestions.length > 0 && (
                    <div className="border border-gray-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto bg-white">
                      {filteredTagSuggestions.map(tag => (
                        <button key={tag} type="button"
                          onMouseDown={e => { e.preventDefault(); addTag(tag); }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors">
                          <Tag size={12} className="inline mr-2 text-gray-400" />{tag}
                        </button>
                      ))}
                    </div>
                  )}

                  {showTagSuggestions && filteredTagSuggestions.length === 0 && tagInput && (
                    <div className="border border-gray-200 rounded-xl shadow-lg mt-1 bg-white">
                      <button type="button"
                        onMouseDown={e => { e.preventDefault(); addTag(tagInput); }}
                        className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors">
                        + Agregar "{tagInput}"
                      </button>
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-1.5">Enter o coma para confirmar. Backspace para eliminar.</p>
                </div>
              )}

              {/* Recipient count preview */}
              <div className="flex items-center gap-2 mt-2">
                <Users size={14} className="text-gray-400" />
                {recipientLoading ? (
                  <span className="text-xs text-gray-400">Calculando destinatarios...</span>
                ) : recipientCount !== null ? (
                  <span className="text-xs text-gray-600">
                    <span className="font-semibold text-orange-600">{recipientCount.toLocaleString()}</span>{' '}
                    {recipientCount === 1 ? 'contacto' : 'contactos'}
                    {segmentMode === 'all' && ' (todos los contactos)'}
                    {segmentMode === 'lists' && selectedListIds.length === 0 && ' — selecciona al menos una lista'}
                    {segmentMode === 'tags' && selectedTags.length === 0 && ' (todos los contactos)'}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button type="submit" disabled={submitting}
                className="bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors">
                {submitting
                  ? isEditing ? 'Guardando...' : 'Creando...'
                  : isEditing ? 'Guardar cambios' : 'Crear campaña'}
              </button>
              <button type="button" onClick={() => navigate('/campaigns')}
                className="bg-white border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
