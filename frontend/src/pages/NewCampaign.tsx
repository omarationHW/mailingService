import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { campaignsApi } from '../api/campaigns';
import { templatesApi } from '../api/templates';
import { Template } from '../types';
import toast from 'react-hot-toast';
import EmailEditor from '../components/EmailEditor';
import { allTemplates, EmailTemplate } from '../data/emailTemplates';
import { Users, ArrowLeft, FileText } from 'lucide-react';

interface FormState {
  name: string;
  subject: string;
  preheader: string;
  fromEmail: string;
  fromName: string;
  tags: string;
  htmlContent: string;
}

const EMPTY_FORM: FormState = {
  name: '', subject: '', preheader: '', fromEmail: '', fromName: '', tags: '', htmlContent: '',
};

export default function NewCampaign() {
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showTemplates, setShowTemplates] = useState(!isEditing);
  const [savedTemplates, setSavedTemplates] = useState<Template[]>([]);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [recipientLoading, setRecipientLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load existing campaign when editing
  useEffect(() => {
    if (!isEditing || !id) return;
    campaignsApi.getOne(id).then(({ campaign }) => {
      setForm({
        name: campaign.name,
        subject: campaign.subject,
        preheader: campaign.preheader ?? '',
        fromEmail: campaign.fromEmail,
        fromName: campaign.fromName,
        tags: (campaign as any).tags?.join(', ') ?? '',
        htmlContent: campaign.htmlContent,
      });
    }).catch(() => {
      toast.error('Error al cargar la campaña');
      navigate('/campaigns');
    });
  }, [id, isEditing, navigate]);

  // Load saved templates for the picker
  useEffect(() => {
    if (isEditing) return;
    templatesApi.getAll({ limit: 100 }).then(data => {
      setSavedTemplates(data.templates);
    }).catch(() => {});
  }, [isEditing]);

  // Debounced preview of recipient count
  const fetchRecipientCount = useCallback(async (tags: string) => {
    setRecipientLoading(true);
    try {
      const { count } = await campaignsApi.previewRecipients(tags || undefined);
      setRecipientCount(count);
    } catch {
      setRecipientCount(null);
    } finally {
      setRecipientLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecipientCount(form.tags);
    }, 500);
    return () => clearTimeout(timer);
  }, [form.tags, fetchRecipientCount]);

  const setField = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSavedTemplateSelect = (template: Template) => {
    setForm(prev => ({ ...prev, htmlContent: template.htmlContent }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.htmlContent.trim()) {
      toast.error('El contenido del email no puede estar vacío');
      return;
    }

    setSubmitting(true);
    const payload = {
      name: form.name,
      subject: form.subject,
      preheader: form.preheader || undefined,
      htmlContent: form.htmlContent,
      fromEmail: form.fromEmail,
      fromName: form.fromName,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
    };

    try {
      if (isEditing && id) {
        await campaignsApi.update(id, payload);
        toast.success('Campaña actualizada correctamente');
      } else {
        await campaignsApi.create(payload);
        toast.success('Campaña creada correctamente');
      }
      navigate('/campaigns');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar la campaña');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">

        {/* Back link */}
        <button
          onClick={() => navigate('/campaigns')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors group"
        >
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
              <button
                type="button"
                onClick={() => setShowTemplates(false)}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                Crear desde cero →
              </button>
            </div>

            {/* Saved templates from DB */}
            {savedTemplates.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tus plantillas</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {savedTemplates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => handleSavedTemplateSelect(template)}
                      className="border border-gray-200 rounded-lg p-4 hover:border-orange-400 hover:shadow-md cursor-pointer transition-all group"
                    >
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mb-2">
                        <FileText size={15} className="text-orange-600" />
                      </div>
                      <h3 className="font-semibold text-sm text-gray-900 mb-1 group-hover:text-orange-600 transition-colors truncate">
                        {template.name}
                      </h3>
                      {template.description && (
                        <p className="text-xs text-gray-500 line-clamp-2">{template.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1.5 font-mono">
                        {template.htmlContent.length.toLocaleString()} car. HTML
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Built-in example templates */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Plantillas de ejemplo</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="border border-gray-200 rounded-lg p-4 hover:border-orange-400 hover:shadow-md cursor-pointer transition-all group"
                >
                  <div className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded inline-block mb-2">
                    {template.category}
                  </div>
                  <h3 className="font-semibold text-sm text-gray-900 mb-1.5 group-hover:text-orange-600 transition-colors">
                    {template.name}
                  </h3>
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
            <button
              type="button"
              onClick={() => setShowTemplates(true)}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
            >
              ← Ver plantillas
            </button>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre de la campaña <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={setField('name')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition text-sm"
              placeholder="Ej: Campaña Nómina Mayo 2025"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Asunto del email <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.subject}
              onChange={setField('subject')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition text-sm"
              placeholder="Ej: Seguridad privada para tu nómina 💼"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Preheader <span className="text-gray-400 font-normal">(texto de vista previa)</span>
            </label>
            <input
              type="text"
              value={form.preheader}
              onChange={setField('preheader')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition text-sm"
              placeholder="Ej: Automatiza pagos y contratos sin errores."
            />
            <p className="text-xs text-gray-500 mt-1.5">
              Texto que aparece junto al asunto en la bandeja de entrada del destinatario.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email del remitente <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={form.fromEmail}
                onChange={setField('fromEmail')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition text-sm"
                placeholder="contacto@tuempresa.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre del remitente <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.fromName}
                onChange={setField('fromName')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition text-sm"
                placeholder="Tu Empresa"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contenido del email <span className="text-red-500">*</span>
            </label>
            <EmailEditor value={form.htmlContent} onChange={html => setForm(prev => ({ ...prev, htmlContent: html }))} />
            {!form.htmlContent.trim() && (
              <p className="text-xs text-red-500 mt-1.5">El contenido del email es obligatorio.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Destinatarios <span className="text-gray-400 font-normal">(filtrar por tags)</span>
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={setField('tags')}
              placeholder="vip, newsletter, clientes"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition text-sm"
            />
            <div className="flex items-center gap-2 mt-2">
              <Users size={14} className="text-gray-400" />
              {recipientLoading ? (
                <span className="text-xs text-gray-400">Calculando destinatarios...</span>
              ) : recipientCount !== null ? (
                <span className="text-xs text-gray-600">
                  <span className="font-semibold text-orange-600">{recipientCount}</span>{' '}
                  {recipientCount === 1 ? 'contacto coincide' : 'contactos coinciden'} con estos tags
                  {!form.tags.trim() && ' (se enviaría a todos los contactos)'}
                </span>
              ) : null}
            </div>
            {isEditing ? (
              <p className="text-xs text-gray-400 mt-1">
                Los destinatarios originales ya están asignados. Dejar vacío para mantenerlos sin cambios.
              </p>
            ) : (
              <p className="text-xs text-gray-400 mt-1">
                Separados por comas. Dejar vacío para enviar a todos los contactos.
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={submitting}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors"
            >
              {submitting
                ? isEditing ? 'Guardando...' : 'Creando...'
                : isEditing ? 'Guardar cambios' : 'Crear campaña'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/campaigns')}
              className="bg-white border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
