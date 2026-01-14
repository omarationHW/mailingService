import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sequencesApi, CreateSequenceStep, SequenceTriggerType } from '../api/sequences';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, Zap, Clock, Mail, Calendar } from 'lucide-react';

export default function NewSequence() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<SequenceTriggerType>('MANUAL');
  const [triggerValue, setTriggerValue] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');
  const [steps, setSteps] = useState<CreateSequenceStep[]>([
    {
      name: 'Email 1',
      subject: '',
      htmlContent: '',
      schedulingType: 'RELATIVE_DELAY',
      delayDays: 0,
      delayHours: 0,
    },
  ]);

  const addStep = () => {
    setSteps([
      ...steps,
      {
        name: `Email ${steps.length + 1}`,
        subject: '',
        htmlContent: '',
        schedulingType: 'RELATIVE_DELAY',
        delayDays: steps.length === 0 ? 0 : 2,
        delayHours: 0,
      },
    ]);
  };

  const removeStep = (index: number) => {
    if (steps.length === 1) {
      toast.error('Debe haber al menos un paso');
      return;
    }
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof CreateSequenceStep, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !fromEmail || !fromName) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    if (steps.some(s => !s.subject || !s.htmlContent)) {
      toast.error('Todos los pasos deben tener asunto y contenido');
      return;
    }

    setLoading(true);
    try {
      await sequencesApi.create({
        name,
        description,
        triggerType,
        triggerValue: triggerValue || undefined,
        fromEmail,
        fromName,
        steps,
      });
      toast.success('Secuencia creada exitosamente');
      navigate('/sequences');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al crear secuencia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/sequences')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Nueva Secuencia de Emails</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Información Básica</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre de la Secuencia *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                  placeholder="Ej: Bienvenida a nuevos clientes"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descripción
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                  placeholder="Breve descripción de la secuencia"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email remitente *
                </label>
                <input
                  type="email"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                  placeholder="remitente@empresa.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre remitente *
                </label>
                <input
                  type="text"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                  placeholder="Tu Empresa"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tipo de activación *
                </label>
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value as SequenceTriggerType)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition bg-white"
                >
                  <option value="MANUAL">Manual</option>
                  <option value="CONTACT_CREATED">Contacto creado</option>
                  <option value="LIST_ADDED">Agregado a lista</option>
                  <option value="TAG_ADDED">Etiqueta agregada</option>
                  <option value="EMAIL_OPENED">Email abierto</option>
                  <option value="LINK_CLICKED">Link clickeado</option>
                </select>
              </div>

              {(triggerType === 'LIST_ADDED' || triggerType === 'TAG_ADDED') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Valor del trigger
                  </label>
                  <input
                    type="text"
                    value={triggerValue}
                    onChange={(e) => setTriggerValue(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                    placeholder={triggerType === 'LIST_ADDED' ? 'ID de la lista' : 'Nombre de la etiqueta'}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Steps */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Pasos de la Secuencia</h2>
              <button
                type="button"
                onClick={addStep}
                className="btn-secondary flex items-center gap-2"
              >
                <Plus size={16} />
                <span className="text-sm">Agregar Paso</span>
              </button>
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Mail className="w-4 h-4 text-indigo-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Paso {index + 1}</h3>
                    </div>
                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {index > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="text-gray-500" size={16} />
                        <span className="text-sm font-semibold text-gray-700">
                          Programación del paso:
                        </span>
                      </div>

                      {/* Scheduling Type Toggle */}
                      <div className="flex gap-2 mb-3">
                        <button
                          type="button"
                          onClick={() => updateStep(index, 'schedulingType', 'RELATIVE_DELAY')}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                            step.schedulingType === 'RELATIVE_DELAY'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <Clock className="w-4 h-4 inline mr-1.5" />
                          Delay Relativo
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStep(index, 'schedulingType', 'ABSOLUTE_DATE')}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                            step.schedulingType === 'ABSOLUTE_DATE'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <Calendar className="w-4 h-4 inline mr-1.5" />
                          Fecha Específica
                        </button>
                      </div>

                      {step.schedulingType === 'RELATIVE_DELAY' ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Días después del paso anterior</label>
                            <input
                              type="number"
                              min="0"
                              value={step.delayDays}
                              onChange={(e) => updateStep(index, 'delayDays', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Horas</label>
                            <input
                              type="number"
                              min="0"
                              max="23"
                              value={step.delayHours}
                              onChange={(e) => updateStep(index, 'delayHours', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Fecha y hora de envío</label>
                          <input
                            type="datetime-local"
                            value={step.absoluteScheduleDate || ''}
                            onChange={(e) => updateStep(index, 'absoluteScheduleDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre del paso
                    </label>
                    <input
                      type="text"
                      value={step.name}
                      onChange={(e) => updateStep(index, 'name', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                      placeholder="Ej: Email de bienvenida"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Asunto del email *
                    </label>
                    <input
                      type="text"
                      value={step.subject}
                      onChange={(e) => updateStep(index, 'subject', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                      placeholder="Asunto del email"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Contenido HTML *
                    </label>
                    <textarea
                      rows={8}
                      value={step.htmlContent}
                      onChange={(e) => updateStep(index, 'htmlContent', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition font-mono text-sm resize-none"
                      placeholder="<html>&#10;  <body>&#10;    Tu contenido aquí...&#10;  </body>&#10;</html>"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Puedes usar variables como {'{{nombre}}'}, {'{{email}}'}, etc.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando...' : 'Crear Secuencia'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/sequences')}
              className="flex-1 btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
