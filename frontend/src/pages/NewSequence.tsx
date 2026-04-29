import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sequencesApi, CreateSequenceStep, SequenceTriggerType } from '../api/sequences';
import toast from 'react-hot-toast';
import { ChevronLeft, Plus, Trash2, Clock, Calendar } from 'lucide-react';
import EmailEditor from '../components/EmailEditor';
import api from '../api/client';

interface ContactList {
  id: string;
  name: string;
}

export default function NewSequence() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<SequenceTriggerType>('MANUAL');
  const [triggerValue, setTriggerValue] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [steps, setSteps] = useState<CreateSequenceStep[]>([
    { name: 'Email 1', subject: '', htmlContent: '', schedulingType: 'RELATIVE_DELAY', delayDays: 0, delayHours: 0 },
  ]);

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
        setSteps(seq.steps.map((s: any) => ({
          name: s.name,
          subject: s.subject,
          htmlContent: s.htmlContent,
          schedulingType: s.schedulingType,
          delayDays: s.delayDays,
          delayHours: s.delayHours,
          absoluteScheduleDate: s.absoluteScheduleDate
            ? new Date(s.absoluteScheduleDate).toISOString().slice(0, 16)
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
    api.get('/contact-lists', { params: { limit: 100 } })
      .then(r => setContactLists(r.data.lists ?? []))
      .catch(() => {});
    if (isEdit) loadSequence();
  }, [isEdit, loadSequence]);

  const addStep = () => {
    setSteps(prev => [
      ...prev,
      { name: `Email ${prev.length + 1}`, subject: '', htmlContent: '', schedulingType: 'RELATIVE_DELAY', delayDays: 2, delayHours: 0 },
    ]);
  };

  const removeStep = (index: number) => {
    if (steps.length === 1) { toast.error('Debe haber al menos un paso'); return; }
    setSteps(prev => prev.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof CreateSequenceStep, value: any) => {
    setSteps(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (steps.some(s => !s.subject || !s.htmlContent?.trim())) {
      toast.error('Todos los pasos deben tener asunto y contenido');
      return;
    }
    setLoading(true);
    try {
      if (isEdit && id) {
        await sequencesApi.update(id, { name, description, triggerType, triggerValue: triggerValue || undefined, fromEmail, fromName });
        await sequencesApi.updateSteps(id, steps);
        toast.success('Secuencia actualizada exitosamente');
        navigate(`/sequences/${id}`);
      } else {
        await sequencesApi.create({ name, description, triggerType, triggerValue: triggerValue || undefined, fromEmail, fromName, steps });
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
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
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

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email remitente <span className="text-red-500">*</span></label>
                <input type="email" value={fromEmail} onChange={e => setFromEmail(e.target.value)} required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                  placeholder="remitente@empresa.com" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre remitente <span className="text-red-500">*</span></label>
                <input type="text" value={fromName} onChange={e => setFromName(e.target.value)} required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                  placeholder="Tu Empresa" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de activación <span className="text-red-500">*</span></label>
                <select value={triggerType} onChange={e => { setTriggerType(e.target.value as SequenceTriggerType); setTriggerValue(''); }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-white">
                  <option value="MANUAL">Manual</option>
                  <option value="CONTACT_CREATED">Contacto creado</option>
                  <option value="LIST_ADDED">Agregado a lista</option>
                  <option value="TAG_ADDED">Etiqueta agregada</option>
                  <option value="EMAIL_OPENED">Email abierto</option>
                  <option value="LINK_CLICKED">Link clicado</option>
                </select>
              </div>

              {triggerType === 'LIST_ADDED' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Lista de contactos</label>
                  {contactLists.length > 0 ? (
                    <select value={triggerValue} onChange={e => setTriggerValue(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition bg-white">
                      <option value="">Selecciona una lista...</option>
                      {contactLists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">No hay listas disponibles. <button type="button" onClick={() => navigate('/contact-lists')} className="text-orange-600 hover:underline">Crear una lista →</button></p>
                  )}
                </div>
              )}

              {triggerType === 'TAG_ADDED' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Etiqueta (tag)</label>
                  <input type="text" value={triggerValue} onChange={e => setTriggerValue(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                    placeholder="Ej: vip" />
                </div>
              )}
            </div>
          </div>

          {/* Steps */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Pasos de la secuencia</h2>
              <button type="button" onClick={addStep}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
                <Plus size={15} />
                Agregar paso
              </button>
            </div>

            {isEdit && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                Al guardar, los pasos actuales serán reemplazados por los que configures aquí.
              </div>
            )}

            <div className="space-y-6">
              {steps.map((step, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-5 space-y-4">
                  {/* Step header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-orange-600">{index + 1}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm">Paso {index + 1}</h3>
                    </div>
                    {steps.length > 1 && (
                      <button type="button" onClick={() => removeStep(index)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  {/* Scheduling — solo desde paso 2 */}
                  {index > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
                      <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5"><Clock size={13} />Programación</p>
                      <div className="flex gap-2">
                        {(['RELATIVE_DELAY', 'ABSOLUTE_DATE'] as const).map(type => (
                          <button key={type} type="button" onClick={() => updateStep(index, 'schedulingType', type)}
                            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                              step.schedulingType === type ? 'bg-orange-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                            }`}>
                            {type === 'RELATIVE_DELAY' ? <><Clock size={12} />Delay relativo</> : <><Calendar size={12} />Fecha específica</>}
                          </button>
                        ))}
                      </div>
                      {step.schedulingType === 'RELATIVE_DELAY' ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Días después del paso anterior</label>
                            <input type="number" min="0" value={step.delayDays}
                              onChange={e => updateStep(index, 'delayDays', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Horas</label>
                            <input type="number" min="0" max="23" value={step.delayHours}
                              onChange={e => updateStep(index, 'delayHours', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Fecha y hora de envío</label>
                          <input type="datetime-local" value={step.absoluteScheduleDate || ''}
                            onChange={e => updateStep(index, 'absoluteScheduleDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del paso</label>
                    <input type="text" value={step.name} onChange={e => updateStep(index, 'name', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                      placeholder="Ej: Email de bienvenida" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Asunto del email <span className="text-red-500">*</span></label>
                    <input type="text" value={step.subject} onChange={e => updateStep(index, 'subject', e.target.value)} required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                      placeholder="Asunto del email" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Contenido <span className="text-red-500">*</span></label>
                    <EmailEditor
                      value={step.htmlContent}
                      onChange={html => updateStep(index, 'htmlContent', html)}
                    />
                    {!step.htmlContent?.trim() && (
                      <p className="text-xs text-red-500 mt-1.5">El contenido del paso es obligatorio.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
  );
}
