import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { campaignsApi } from '../api/campaigns';
import { contactsApi } from '../api/contacts';
import { templatesApi } from '../api/templates';
import toast from 'react-hot-toast';
import EmailEditor from '../components/EmailEditor';
import { allTemplates, EmailTemplate } from '../data/emailTemplates';

export default function NewCampaign() {
  const [, setContacts] = useState<any[]>([]);
  const [, setTemplates] = useState<any[]>([]);
  const [selectedContacts] = useState<string[]>([]);
  const [tags, setTags] = useState<string>('');
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [preheader, setPreheader] = useState<string>('');
  const [showTemplates, setShowTemplates] = useState<boolean>(true);
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

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSubject(template.subject);
    setPreheader(template.preheader);
    // Convert template content to HTML
    const paragraphs = template.content.split('\n\n');
    let html = '';
    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) continue;
      html += `<p style="margin: 16px 0; font-size: 16px; line-height: 1.6;">${trimmed}</p>\n`;
    }
    const fullHtml = `
<!DOCTYPE html>
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
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
                <p>Variables disponibles: {{nombre}}, {{empresa}}, {{email}}, {{telefono}}</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
    setHtmlContent(fullHtml);
    setShowTemplates(false);
    toast.success(`Plantilla "${template.name}" cargada`);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const data = {
      name: formData.get('name') as string,
      subject: subject,
      preheader: preheader || undefined,
      htmlContent: htmlContent,
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
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Crear Campaña</h1>
        <p className="text-gray-600 text-sm">Crea y programa campañas de email marketing</p>
      </div>

      {showTemplates && (
        <div className="bg-white rounded-xl shadow-card border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Plantillas Disponibles</h2>
              <p className="text-sm text-gray-500 mt-0.5">Comienza con una plantilla prediseñada</p>
            </div>
            <button
              type="button"
              onClick={() => setShowTemplates(false)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              Crear desde cero →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allTemplates.map((template) => (
              <div
                key={template.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary-400 hover:shadow-md cursor-pointer transition-all group"
                onClick={() => handleTemplateSelect(template)}
              >
                <div className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded inline-block mb-2">{template.category}</div>
                <h3 className="font-semibold text-sm text-gray-900 mb-1.5 group-hover:text-primary-600 transition">{template.name}</h3>
                <p className="text-xs text-gray-600 mb-1.5 line-clamp-1">{template.subject}</p>
                <p className="text-xs text-gray-500 italic line-clamp-2">{template.preheader}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-card border border-gray-200 p-6 space-y-6">
        {!showTemplates && (
          <button
            type="button"
            onClick={() => setShowTemplates(true)}
            className="text-sm text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Ver plantillas
          </button>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de la Campaña *</label>
          <input
            name="name"
            type="text"
            required
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            placeholder="Ej: Campaña Nómina Mayo 2025"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Asunto del Email *</label>
          <input
            name="subject"
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            placeholder="Ej: Seguridad privada para tu nómina 💼"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Preheader (texto de vista previa)</label>
          <input
            name="preheader"
            type="text"
            value={preheader}
            onChange={(e) => setPreheader(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            placeholder="Ej: Automatiza pagos y contratos sin errores."
          />
          <p className="text-xs text-gray-500 mt-1.5">Texto que aparece junto al asunto en la bandeja de entrada</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email del Remitente *</label>
            <input
              name="fromEmail"
              type="email"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              placeholder="contacto@tuempresa.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del Remitente *</label>
            <input
              name="fromName"
              type="text"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              placeholder="Tu Empresa"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Contenido del Email *</label>
          <EmailEditor
            value={htmlContent}
            onChange={setHtmlContent}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Destinatarios (filtrar por tags)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="vip,newsletter,clientes"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
          />
          <p className="text-xs text-gray-500 mt-1.5">Separados por comas. Dejar vacío para enviar a todos los contactos.</p>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            className="bg-primary-600 text-white px-6 py-2.5 rounded-lg hover:bg-primary-700 font-medium transition shadow-sm hover:shadow-md"
          >
            Crear Campaña
          </button>
          <button
            type="button"
            onClick={() => navigate('/campaigns')}
            className="bg-white border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-50 font-medium transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
