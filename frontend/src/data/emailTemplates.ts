export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  preheader: string;
  content: string;
  category: string;
}

export const harwebTemplates: EmailTemplate[] = [
  {
    id: 'harweb-1',
    name: 'MAIL 1 - Presentación general de Harweb DBO',
    subject: 'Seguridad privada para tu nómina 💼',
    preheader: 'Automatiza pagos y contratos sin errores.',
    category: 'Harweb',
    content: `Hola {{nombre}},

Sabemos que dirigir una empresa de seguridad privada no es tarea fácil: turnos, altas y bajas constantes, cálculos de nómina, reportes… y todo sin margen de error.

Por eso existe Harweb DBO, una plataforma en la nube que pone orden y seguridad en tu operación interna, automatizando toda tu gestión de personal:

🔹 Nómina precisa: CFDI, IMSS, ISR, PTU, finiquitos… sin errores.
🔹 Contratación digital: con firma electrónica válida y datos verificados (INE, CURP, RFC).
🔹 Pagos automatizados: con conciliación bancaria y sin Excel.
🔹 Y hasta un asistente inteligente: SofIA®, que timbra, valida y te avisa todo en tiempo real.

☑️ ¿Lo vemos en acción?
👉 [Reservar cita](https://calendar.app.google/yo7U5WtkejdFciy3A)

Más de 170,000 empleados ya operan con Harweb DBO.

Tu empresa de seguridad merece una nómina a prueba de errores.

Un saludo,
El equipo de Harweb`
  },
  {
    id: 'harweb-2',
    name: 'MAIL 2 - Nómina sin errores ni multas',
    subject: 'Evita multas en tu nómina 🧾',
    preheader: 'Cumple con IMSS, ISR y timbrado sin errores.',
    category: 'Harweb',
    content: `Hola {{nombre}},

En una empresa de seguridad privada, donde el movimiento de personal es alto, un error en nómina no solo genera reprocesos... también puede terminar en multas o demandas.

Con Harweb DBO te olvidas de eso:

🔹 Calculamos automáticamente IMSS, ISR, PTU, finiquitos.
🔹 Timbrado de CFDI y cancelaciones sin errores.
🔹 Siempre actualizados con la ley.
🔹 Con soporte incluido y SLA real.

Cumplimiento, tranquilidad y cero reprocesos.

👉 [Agendar demo sin compromiso](https://calendar.app.google/yo7U5WtkejdFciy3A)

Evita multas por errores evitables. Haz que tu nómina sea tan segura como tus guardias.

Un saludo,
El equipo de Harweb`
  },
  {
    id: 'harweb-3',
    name: 'MAIL 3 - Onboarding digital + firma electrónica',
    subject: 'Contrata sin papel, 100% legal ✍️',
    preheader: 'Digitaliza altas con verificación oficial y firma válida.',
    category: 'Harweb',
    content: `Hola {{nombre}},

Imagina dar de alta a un nuevo guardia en minutos, sin papeles, sin errores, y con todos los datos legales validados.

Con Harweb DBO puedes:

🔹 Firmar contratos digitalmente con validez NOM-151.
🔹 Verificar automáticamente INE, CURP, RFC, NSS.
🔹 Generar expediente digital con un clic.
🔹 Reducir tiempo de contratación y errores humanos.

Digitaliza tu onboarding y mantente 100% en regla.

👉 [Solicitar demo rápida](https://calendar.app.google/yo7U5WtkejdFciy3A)

Un saludo,
El equipo de Harweb`
  },
  {
    id: 'harweb-4',
    name: 'MAIL 4 - Pagos y tesorería automática',
    subject: 'Dispersa pagos sin Excel 🧲',
    preheader: 'Automatiza tesorería y conciliación bancaria.',
    category: 'Harweb',
    content: `Hola {{nombre}},

🔢 Olvídate de los errores de dispersión y del Excel eterno. Harweb DBO automatiza la parte crítica:

🔹 Pagos automáticos desde tu banco a cada empleado.
🔹 Conciliación bancaria diaria.
🔹 Control de fondeos, saldos y dispersión.
🔹 Integrado con sistemas contables y fiscales.

Maneja tu nómina como una empresa grande, aunque tengas mil elementos operativos.

👉 [Ver Harweb en acción](https://calendar.app.google/yo7U5WtkejdFciy3A)

Un saludo,
El equipo de Harweb`
  },
  {
    id: 'harweb-5',
    name: 'MAIL 5 - Conoce a SofIA®, tu asistente digital',
    subject: 'Tu asistente digital trabaja por ti 🤖',
    preheader: 'SofIA® valida, timbra, notifica y ahorra tiempo.',
    category: 'Harweb',
    content: `Hola {{nombre}},

🤖 Te presentamos a SofIA®, nuestra IA para tu nómina:

🔹 Valida información y documentos.
🔹 Timbra automáticamente la nómina.
🔹 Monitorea fondeo y movimientos.
🔹 Envía alertas y reportes en tiempo real.

Deja que tu asistente digital trabaje por ti. Y tú enfócate en lo estratégico.

👉 [Agendar demo con SofIA](https://calendar.app.google/yo7U5WtkejdFciy3A)

Un saludo,
El equipo de Harweb`
  },
  {
    id: 'harweb-6',
    name: 'MAIL 6 - Testimonios + cierre de ciclo',
    subject: 'Lo que opinan empresas como la tuya ⭐',
    preheader: 'Historias reales con resultados reales.',
    category: 'Harweb',
    content: `Hola {{nombre}},

Muchos pensaban que cambiar su sistema de nómina iba a ser difícil. Hoy, dicen que fue la mejor decisión del año.

🔹 Empresas de seguridad ya usan Harweb DBO.
🔹 Cero errores, cero multas, más tiempo para crecer.
🔹 Con soporte personalizado y mejoras continuas.

🎉 Aprovecha este mes: onboarding sin costo + acompañamiento 1 a 1.

👉 [Agenda tu demo](https://calendar.app.google/yo7U5WtkejdFciy3A)

Gracias por acompañarnos en esta serie.

Esperamos tener pronto la oportunidad de ayudarte a transformar tu nómina con Harweb DBO.

Un saludo,
El equipo de Harweb`
  }
];

export const genericTemplates: EmailTemplate[] = [
  {
    id: 'generic-1',
    name: 'Bienvenida',
    subject: '¡Bienvenido/a a nuestra comunidad! 👋',
    preheader: 'Estamos felices de tenerte aquí.',
    category: 'General',
    content: `Hola {{nombre}},

¡Bienvenido/a! Estamos muy felices de tenerte en nuestra comunidad.

Aquí encontrarás [descripción de beneficios o servicios].

Si tienes alguna pregunta, no dudes en contactarnos.

Un saludo,
{{empresa}}`
  },
  {
    id: 'generic-2',
    name: 'Anuncio de Producto/Servicio',
    subject: 'Tenemos algo nuevo para ti 🎉',
    preheader: 'Descubre nuestra última novedad.',
    category: 'General',
    content: `Hola {{nombre}},

Nos complace anunciarte [nombre del producto/servicio].

🔹 Característica 1
🔹 Característica 2
🔹 Característica 3

👉 [Conoce más](https://tu-link.com)

Un saludo,
{{empresa}}`
  },
  {
    id: 'generic-3',
    name: 'Invitación a Evento',
    subject: 'Estás invitado/a a [nombre del evento] 📅',
    preheader: 'Reserva tu lugar ahora.',
    category: 'General',
    content: `Hola {{nombre}},

Nos encantaría contar con tu presencia en [nombre del evento].

📅 Fecha: [fecha]
🕒 Hora: [hora]
📍 Lugar: [ubicación o link]

👉 [Confirmar asistencia](https://tu-link.com)

¡Te esperamos!

Un saludo,
{{empresa}}`
  }
];

export const allTemplates = [...harwebTemplates, ...genericTemplates];
