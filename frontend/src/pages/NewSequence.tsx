import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sequencesApi, CreateSequenceStep, SequenceTriggerType } from '../api/sequences';
import { templatesApi } from '../api/templates';
import { Template } from '../types';
import toast from 'react-hot-toast';
import {
  ChevronLeft, Plus, Trash2, Clock, Calendar, FileText, X, ChevronDown, CheckCircle, Lock, Eye,
} from 'lucide-react';
import EmailEditor from '../components/EmailEditor';
import { allTemplates } from '../data/emailTemplates';

interface SavedSender { email: string; name: string; }

const SENDERS_KEY = 'mailing_saved_senders';
const MAX_SENDERS = 5;

function loadSenders(): SavedSender[] {
  try { return JSON.parse(localStorage.getItem(SENDERS_KEY) || '[]'); } catch { return []; }
}
function saveSender(email: string, name: string) {
  if (!email || !name) return;
  const existing = loadSenders().filter(s => s.email !== email);
  localStorage.setItem(SENDERS_KEY, JSON.stringify([{ email, name }, ...existing].slice(0, MAX_SENDERS)));
}

interface StepWithPreheader extends CreateSequenceStep {
  preheader?: string;
  _stepId?: string; // original DB id, used for execution tracking
}

export default function NewSequence() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);

  // Basic info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<SequenceTriggerType>('MANUAL');
  const [triggerValue, setTriggerValue] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');

  // Saved senders
  const [savedSenders, setSavedSenders] = useState<SavedSender[]>([]);
  const [showSenderDropdown, setShowSenderDropdown] = useState(false);
  const senderDropdownRef = useRef<HTMLDivElement>(null);

  // Templates
  const [savedTemplates, setSavedTemplates] = useState<Template[]>([]);
  const [showTemplatePicker, setShowTemplatePicker] = useState<number | null>(null); // step index

  // Preview
  const [previewStepIndex, setPreviewStepIndex] = useState<number | null>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  // Steps
  const [steps, setSteps] = useState<StepWithPreheader[]>([
    { name: '', subject: '', preheader: '', htmlContent: '', schedulingType: 'RELATIVE_DELAY', delayDays: 0, delayHours: 0 },
  ]);
  // Step IDs that already have at least one SENT execution — locked in edit mode
  const [executedStepIds, setExecutedStepIds] = useState<Set<string>>(new Set());

  const loadSequence = useCallback(async () => {
    if (!id) return;
    try {
      const data = await sequencesApi.getById(id);
      const seq = data.sequence ?? data;
      setName(seq.name);
      setDescription(seq.description ?? '');
      setTriggerType(seq.triggerType);
      setTriggerValue(seq.triggerValue ?? '');
      setFromEmail(seq.fromEmail);
      setFromName(seq.fromName);
      if (seq.steps?.length) {
        // Collect step IDs that have at least one SENT execution across all enrollments
        const sentIds = new Set<string>();
        (seq.enrollments ?? []).forEach((enr: any) => {
          (enr.executions ?? []).forEach((ex: any) => {
            if (ex.status === 'SENT') sentIds.add(ex.stepId);
          });
        });
        setExecutedStepIds(sentIds);

        const pad = (n: number) => String(n).padStart(2, '0');
        setSteps(seq.steps.map((s: any) => ({
          _stepId: s.id,
          name: s.name,
          subject: s.subject,
          preheader: s.preheader ?? '',
          htmlContent: s.htmlContent,
          schedulingType: s.schedulingType,
          delayDays: s.delayDays,
          delayHours: s.delayHours,
          absoluteScheduleDate: s.absoluteScheduleDate
            ? (() => { const d = new Date(s.absoluteScheduleDate); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; })()
            : undefined,
        })));
      }
    } catch {
      toast.error('Error al cargar la secuencia');
      navigate('/sequences');
    } finally {
      setInitialLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    setSavedSenders(loadSenders());
templatesApi.getAll().then(r => setSavedTemplates(r.templates ?? [])).catch(() => {});
    if (isEdit) loadSequence();
  }, [isEdit, loadSequence]);

  // Close sender dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (senderDropdownRef.current && !senderDropdownRef.current.contains(e.target as Node)) {
        setShowSenderDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Write preview iframe when step preview opens
  useEffect(() => {
    if (previewStepIndex !== null && previewIframeRef.current) {
      const html = steps[previewStepIndex]?.htmlContent;
      if (html) {
        const doc = previewIframeRef.current.contentDocument;
        if (doc) { doc.open(); doc.write(html); doc.close(); }
      }
    }
  }, [previewStepIndex, steps]);

  const addStep = () => {
    setSteps(prev => [
      ...prev,
      { name: '', subject: '', preheader: '', htmlContent: '', schedulingType: 'RELATIVE_DELAY', delayDays: 2, delayHours: 0 },
    ]);
  };

  const removeStep = (index: number) => {
    if (steps.length === 1) { toast.error('Debe haber al menos un paso'); return; }
    setSteps(prev => prev.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof StepWithPreheader, value: any) => {
    setSteps(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const applyTemplate = (stepIndex: number, template: Template | { subject?: string; preheader?: string; htmlContent: string; name?: string }) => {
    setSteps(prev => {
      const next = [...prev];
      next[stepIndex] = {
        ...next[stepIndex],
        htmlContent: template.htmlContent,
        ...('subject' in template && template.subject ? { subject: template.subject } : {}),
        ...('preheader' in template && template.preheader ? { preheader: template.preheader } : {}),
        ...('name' in template && template.name && !next[stepIndex].name ? { name: template.name } : {}),
      };
      return next;
    });
    setShowTemplatePicker(null);
    toast.success('Plantilla aplicada al paso');
  };

  const normalizeSteps = (raw: StepWithPreheader[]) => raw.map(({ _stepId, ...s }, i) => ({
    ...s,
    name: s.name.trim() || `Paso ${i + 1}`,
    _stepId, // preserved so backend can identify protected (already-sent) steps
    absoluteScheduleDate: s.absoluteScheduleDate
      ? new Date(s.absoluteScheduleDate).toISOString()
      : undefined,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (steps.some(s => !s.subject || !s.htmlContent?.trim())) {
      toast.error('Todos los pasos deben tener asunto y contenido');
      return;
    }

    // Validate absolute dates on pending steps
    const now = new Date();
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      const isExecuted = s._stepId && executedStepIds.has(s._stepId);
      if (isExecuted) continue;
      if (s.schedulingType === 'ABSOLUTE_DATE') {
        if (!s.absoluteScheduleDate) {
          toast.error(`El paso ${i + 1} requiere una fecha de envío`);
          return;
        }
        const d = new Date(s.absoluteScheduleDate);
        if (d <= now) {
          toast.error(`La fecha del paso ${i + 1} debe ser futura`);
          return;
        }
        // Must be after the previous step's date if it also has ABSOLUTE_DATE
        if (i > 0 && steps[i - 1].schedulingType === 'ABSOLUTE_DATE' && steps[i - 1].absoluteScheduleDate) {
          const prev = new Date(steps[i - 1].absoluteScheduleDate!);
          if (d <= prev) {
            toast.error(`La fecha del paso ${i + 1} debe ser posterior a la del paso ${i}`);
            return;
          }
        }
      }
    }
    setLoading(true);
    saveSender(fromEmail, fromName);
    try {
      if (isEdit && id) {
        await sequencesApi.update(id, { name, description, triggerType, triggerValue: triggerValue || undefined, fromEmail, fromName });
        await sequencesApi.updateSteps(id, normalizeSteps(steps));
        toast.success('Secuencia actualizada exitosamente');
        navigate(`/sequences/${id}`);
      } else {
        await sequencesApi.create({ name, description, triggerType, triggerValue: triggerValue || undefined, fromEmail, fromName, steps: normalizeSteps(steps) });
        toast.success('Secuencia creada exitosamente');
        navigate('/sequences');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || (isEdit ? 'Error al actualizar secuencia' : 'Error al crear secuencia'));
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
      </div>
    );
  }


  return (
    <>
      {/* Preview Modal */}
      {previewStepIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setPreviewStepIndex(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 flex flex-col" style={{ height: '85vh' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Vista previa — Paso {previewStepIndex + 1}</h3>
                {steps[previewStepIndex]?.subject && (
                  <p className="text-xs text-gray-500 mt-0.5">Asunto: {steps[previewStepIndex].subject}</p>
                )}
              </div>
              <button onClick={() => setPreviewStepIndex(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden rounded-b-xl">
              <iframe ref={previewIframeRef} title="Email preview" className="w-full h-full border-0" sandbox="allow-same-origin" />
            </div>
          </div>
        </div>
      )}

    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        <button onClick={() => navigate(isEdit && id ? `/sequences/${id}` : '/sequences')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <ChevronLeft size={16} />
          {isEdit ? 'Volver a la secuencia' : 'Volver a secuencias'}
        </button>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Editar secuencia' : 'Nueva secuencia'}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{isEdit ? 'Modifica la información y los pasos de la secuencia.' : 'Configura los pasos y condiciones de tu secuencia de emails.'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Información básica</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre <span className="text-red-500">*</span></label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                  placeholder="Ej: Bienvenida a nuevos clientes" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                  placeholder="Breve descripción de la secuencia" />
              </div>

              {/* Sender fields with saved senders — same pattern as NewCampaign */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700">Remitente <span className="text-red-500">*</span></label>
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
                            <button key={i} type="button"
                              onClick={() => { setFromEmail(s.email); setFromName(s.name); setShowSenderDropdown(false); }}
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
                    <input type="email" required value={fromEmail} onChange={e => setFromEmail(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                      placeholder="contacto@tuempresa.com" />
                    <p className="text-xs text-gray-400 mt-1">Email</p>
                  </div>
                  <div>
                    <input type="text" required value={fromName} onChange={e => setFromName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                      placeholder="Tu Empresa" />
                    <p className="text-xs text-gray-400 mt-1">Nombre</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de activación</label>
                <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">Manual — los contactos se inscriben manualmente.</p>
                <p className="text-xs text-gray-400 mt-1.5">Las activaciones automáticas estarán disponibles próximamente.</p>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Pasos de la secuencia</h2>
              <p className="text-xs text-gray-500 mt-0.5">Variables: <code className="bg-gray-100 px-1 rounded">{'{{nombre}}'}</code> <code className="bg-gray-100 px-1 rounded">{'{{name}}'}</code> <code className="bg-gray-100 px-1 rounded">{'{{email}}'}</code> <code className="bg-gray-100 px-1 rounded">{'{{empresa}}'}</code> <code className="bg-gray-100 px-1 rounded">{'{{company}}'}</code></p>
            </div>

            {isEdit && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                Los pasos ya enviados son de solo lectura. Los pasos pendientes se actualizarán al guardar.
              </div>
            )}

            <div className="space-y-6">
              {steps.map((step, index) => {
                const isExecuted = isEdit && step._stepId ? executedStepIds.has(step._stepId) : false;
                return (
                <div key={index} className={`border rounded-xl p-5 space-y-4 ${isExecuted ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}`}>

                  {/* Step header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isExecuted ? 'bg-green-100' : 'bg-orange-100'}`}>
                        {isExecuted
                          ? <CheckCircle size={16} className="text-green-600" />
                          : <span className="text-sm font-bold text-orange-600">{index + 1}</span>}
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm">Paso {index + 1}</h3>
                      {isExecuted && <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full flex items-center gap-1"><Lock size={10} />Ya enviado — solo lectura</span>}
                      {!isExecuted && index === 0 && <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full">Se envía inmediatamente al inscribir</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {step.htmlContent?.trim() && (
                        <button type="button" onClick={() => setPreviewStepIndex(index)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors">
                          <Eye size={13} />
                          Preview
                        </button>
                      )}
                      {!isExecuted && (
                        <button type="button" onClick={() => setShowTemplatePicker(showTemplatePicker === index ? null : index)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors">
                          <FileText size={13} />
                          Plantilla
                        </button>
                      )}
                      {steps.length > 1 && !isExecuted && (
                        <button type="button" onClick={() => removeStep(index)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Template picker */}
                  {showTemplatePicker === index && (
                    <div className="border border-gray-200 rounded-xl bg-gray-50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-700">Seleccionar plantilla</p>
                        <button type="button" onClick={() => setShowTemplatePicker(null)} className="text-gray-400 hover:text-gray-600">
                          <X size={15} />
                        </button>
                      </div>

                      {savedTemplates.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-2">Plantillas guardadas</p>
                          <div className="grid grid-cols-2 gap-2">
                            {savedTemplates.map(t => (
                              <button key={t.id} type="button" onClick={() => applyTemplate(index, t)}
                                className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors">
                                <p className="text-sm font-medium text-gray-800 truncate">{t.name}</p>
                                {t.subject && <p className="text-xs text-gray-500 truncate">{t.subject}</p>}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-2">Plantillas de ejemplo</p>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                          {allTemplates.map(t => (
                            <button key={t.id} type="button" onClick={() => applyTemplate(index, { htmlContent: t.content, subject: t.subject, name: t.name })}
                              className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors">
                              <p className="text-sm font-medium text-gray-800 truncate">{t.name}</p>
                              <p className="text-xs text-gray-500 truncate">{t.category}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scheduling — solo desde paso 2 */}
                  {index > 0 && (
                    <div className={`rounded-lg p-4 border space-y-3 ${isExecuted ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5"><Clock size={13} />Programación</p>
                      <div className="flex gap-2">
                        {(['RELATIVE_DELAY', 'ABSOLUTE_DATE'] as const).map(type => (
                          <button key={type} type="button" disabled={isExecuted} onClick={() => updateStep(index, 'schedulingType', type)}
                            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                              step.schedulingType === type ? 'bg-orange-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                            } ${isExecuted ? 'opacity-60 cursor-not-allowed' : ''}`}>
                            {type === 'RELATIVE_DELAY' ? <><Clock size={12} />Delay relativo</> : <><Calendar size={12} />Fecha específica</>}
                          </button>
                        ))}
                      </div>
                      {step.schedulingType === 'RELATIVE_DELAY' ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Días después del paso anterior</label>
                            <input type="number" min="0" disabled={isExecuted} value={step.delayDays}
                              onChange={e => updateStep(index, 'delayDays', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Horas</label>
                            <input type="number" min="0" max="23" disabled={isExecuted} value={step.delayHours}
                              onChange={e => updateStep(index, 'delayHours', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed" />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Fecha y hora de envío</label>
                          <input type="datetime-local" disabled={isExecuted} value={step.absoluteScheduleDate || ''}
                            onChange={e => updateStep(index, 'absoluteScheduleDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed" />
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del paso</label>
                    <input type="text" disabled={isExecuted} value={step.name} onChange={e => updateStep(index, 'name', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="Ej: Email de bienvenida" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Asunto del email <span className="text-red-500">*</span></label>
                      <input type="text" disabled={isExecuted} value={step.subject} onChange={e => updateStep(index, 'subject', e.target.value)} required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Asunto del email" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Preheader <span className="text-xs font-normal text-gray-400">(texto de vista previa)</span></label>
                      <input type="text" disabled={isExecuted} value={step.preheader || ''} onChange={e => updateStep(index, 'preheader', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Breve descripción visible en la bandeja..." />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Contenido <span className="text-red-500">*</span></label>
                    {isExecuted ? (
                      <div className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed min-h-[80px]">
                        El contenido no se puede editar porque este paso ya fue enviado.
                      </div>
                    ) : (
                      <>
                        <EmailEditor
                          value={step.htmlContent}
                          onChange={html => updateStep(index, 'htmlContent', html)}
                        />
                        {!step.htmlContent?.trim() && (
                          <p className="text-xs text-red-500 mt-1.5">El contenido del paso es obligatorio.</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
                );
              })}
            </div>

            <button type="button" onClick={addStep}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 border border-dashed border-orange-300 rounded-lg transition-colors">
              <Plus size={15} />
              Agregar paso
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors">
              {loading ? (isEdit ? 'Guardando...' : 'Creando...') : (isEdit ? 'Guardar cambios' : 'Crear secuencia')}
            </button>
            <button type="button" onClick={() => navigate(isEdit && id ? `/sequences/${id}` : '/sequences')}
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
