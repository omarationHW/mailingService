# Mailing Service - Documentación del Proyecto

## Resumen General

Plataforma de Email Marketing completa, similar a HubSpot o Mailchimp, con automatización de secuencias, tracking avanzado de opens/clicks y analytics detallados.

---

## Estructura de Carpetas

```
mailingService/
├── backend/
│   ├── src/
│   │   ├── config/          (env.ts, database.ts)
│   │   ├── controllers/     (auth, campaign, contact, template, sequence, tracking, analytics)
│   │   ├── routes/          (8 rutas principales)
│   │   ├── services/        (emailService.ts, sequenceService.ts)
│   │   ├── middleware/      (auth.ts, errorHandler.ts)
│   │   ├── types/           (express.d.ts)
│   │   ├── utils/
│   │   └── index.ts         (servidor principal)
│   ├── prisma/              (schema.prisma, migraciones)
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── api/             (auth, campaigns, contacts, templates, analytics)
│   │   ├── pages/           (13 páginas principales)
│   │   ├── components/      (EmailEditor.tsx, Layout.tsx, PrivateRoute.tsx)
│   │   ├── store/           (Zustand stores)
│   │   ├── types/
│   │   ├── data/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── vite.config.ts
│   ├── package.json
│   └── tsconfig.json
│
├── PROJECT_OVERVIEW.md      (Este archivo - documentación técnica)
├── SETUP.md                 (Guía de instalación y ejecución)
└── README.md
```

---

## Stack Tecnológico

### Backend
| Tecnología | Uso |
|------------|-----|
| Node.js + Express.js | Servidor HTTP |
| TypeScript | Tipado estático |
| Neon (PostgreSQL) | Base de datos en la nube |
| Prisma ORM | Gestión de BD y migraciones |
| Resend API | Servicio de envío de emails |
| JWT | Autenticación stateless |
| Bcryptjs | Hash de contraseñas |
| Zod | Validación de schemas |
| GeoIP-lite | Geolocalización por IP |
| UA-parser-js | Detección de dispositivos |
| Express Rate Limit | Control de abuso |
| Multer + CSV-parser | Importación de contactos |

### Frontend
| Tecnología | Uso |
|------------|-----|
| React 18 | Framework UI |
| Vite | Bundler y dev server |
| TypeScript | Tipado estático |
| TailwindCSS | Estilos CSS |
| Recharts | Gráficas de analytics |
| Zustand | State management global |
| React Router v6 | Enrutamiento SPA |
| Axios | Cliente HTTP |
| React Hot Toast | Notificaciones |
| Lucide React | Iconografía |

---

## Funcionalidades Principales

### 1. Autenticación y Usuarios
- Registro e inicio de sesión con JWT
- Roles: ADMIN, EDITOR, VIEWER
- Tokens con expiración de 7 días
- Rate limiting: 50 req/15min para auth

### 2. Gestión de Contactos
- CRUD completo (crear, leer, actualizar, eliminar)
- Importación masiva desde CSV
- Exportación de contactos
- Segmentación por tags
- Campos personalizados (JSON flexible)

### 3. Gestión de Campañas
- Crear campañas con HTML personalizado
- Sistema de templates reutilizables
- Variables dinámicas: `{{nombre}}`, `{{empresa}}`, `{{email}}`, etc.
- Envío inmediato o programado
- Estados: DRAFT, SCHEDULED, SENDING, COMPLETED, FAILED
- Límite de HTML: 10MB

### 4. Sistema de Secuencias (Email Automation)
- Crear secuencias de emails automatizadas
- **Triggers disponibles:**
  - MANUAL
  - CONTACT_CREATED
  - LIST_ADDED
  - TAG_ADDED
  - EMAIL_OPENED
  - LINK_CLICKED
- Múltiples pasos con delays configurables
- Worker de procesamiento cada 60 segundos
- Estados de enrollment: ACTIVE, PAUSED, ARCHIVED

### 5. Tracking Avanzado
**Open Tracking:**
- Pixel 1x1 invisible
- Timestamp de apertura (múltiples por contacto)
- IP y geolocalización (país, ciudad)
- User Agent, browser, OS y tipo de dispositivo

**Click Tracking:**
- Reescritura automática de URLs
- Registro de cada click con timestamp
- Preservación de anchors, mailto, tel

### 6. Dashboard y Analytics
- Vista general con KPIs (opens, clicks, bounce rate)
- Gráficas de engagement en tiempo
- Distribución por dispositivos (mobile/desktop)
- Top países y ciudades
- Links más clickeados
- Analytics detallados por campaña
- Exportación de reportes en CSV

### 7. Listas de Contactos
- Crear y gestionar listas
- Relaciones many-to-many con contactos
- Agregar/eliminar contactos de listas

---

## Modelos de Base de Datos (Prisma)

### User
```prisma
- id, email (único), passwordHash, name
- role: ADMIN | EDITOR | VIEWER
```

### Contact
```prisma
- id, email (único), name, company, phone
- tags (String[]), customFields (Json)
- Relaciones: campaignContacts, events, contactListMembers, sequenceEnrollments
```

### Campaign
```prisma
- id, name, subject, preheader, htmlContent
- fromEmail, fromName
- status: DRAFT | SCHEDULED | SENDING | COMPLETED | FAILED
- scheduledAt, sentAt
- createdBy (User)
```

### CampaignContact
```prisma
- trackToken (único por envío)
- status: PENDING | SENT | FAILED | BOUNCED
- sentAt
```

### Event
```prisma
- type: EMAIL_SENT | EMAIL_OPENED | LINK_CLICKED | EMAIL_BOUNCED | EMAIL_FAILED
- metadata (Json), ip, userAgent, country, city, device
- Relaciones: campaign, contact, sequence, sequenceStepExecution
```

### Template
```prisma
- id, name, htmlContent, thumbnail, description
```

### Sequence
```prisma
- id, name, description
- status: ACTIVE | PAUSED | ARCHIVED
- triggerType: MANUAL | CONTACT_CREATED | LIST_ADDED | TAG_ADDED | EMAIL_OPENED | LINK_CLICKED
- triggerValue, fromEmail, fromName
```

### SequenceStep
```prisma
- stepOrder, name, subject, htmlContent
- schedulingType: RELATIVE_DELAY | ABSOLUTE_DATE
- delayDays, delayHours, absoluteScheduleDate
```

### SequenceEnrollment
```prisma
- unique [sequenceId, contactId]
- status, enrolledAt, completedAt, pausedAt
```

### SequenceStepExecution
```prisma
- unique [enrollmentId, stepId]
- status: PENDING | SENT | FAILED | SKIPPED
- scheduledFor, sentAt, trackToken, error
```

### ContactList / ContactListMember
```prisma
- Listas de contactos con membresía many-to-many
```

---

## Scripts Disponibles

### Backend
```bash
npm run dev          # Desarrollo con hot reload (tsx watch)
npm run build        # Compilar TypeScript
npm run start        # Producción
npm run prisma:migrate  # Ejecutar migraciones
npm run prisma:studio   # GUI de BD
npm run lint         # ESLint
npm run format       # Prettier
```

### Frontend
```bash
npm run dev          # Vite dev server (puerto 5173)
npm run build        # Build optimizado
npm run preview      # Vista previa de build
npm run lint         # ESLint
```

---

## Configuración de Deployment

### Base de Datos (Neon)
- PostgreSQL serverless en la nube
- Connection string con `?sslmode=require`
- Dashboard: [neon.tech](https://neon.tech)

### Backend (Render)
- Trust proxy configurado
- Variables de entorno en el dashboard de Render
- Build command: `npm install && npm run build`
- Start command: `npm start`

### Frontend (Vercel)
- `vercel.json` configurado para SPA routing
- Build command: `npm run build`
- Output directory: `dist`
- Variable de entorno: `VITE_API_URL`

---

## Variables de Entorno Requeridas

### Backend (.env)
```env
DATABASE_URL=postgresql://usuario:password@host/database?sslmode=require
JWT_SECRET=tu_secreto_jwt_seguro
RESEND_API_KEY=re_xxxxxxxxxx
FRONTEND_URL=http://localhost:5173
PORT=3000
```

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Connection string de Neon (PostgreSQL en la nube) |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT |
| `RESEND_API_KEY` | API key de Resend para envío de emails |
| `FRONTEND_URL` | URL del frontend (para configuración de CORS) |
| `PORT` | Puerto del servidor (default: 3000) |

---

## Características de Seguridad

- Rate limiting: 100 req/15min (API), 50 req/15min (auth)
- JWT con expiración de 7 días
- Bcrypt con 10 salt rounds
- Validación con Zod en todos los endpoints
- CORS configurado para múltiples orígenes
- Middleware de autenticación y error handling

---

## Notas de Desarrollo

- Envíos de emails en lotes de 10 con delays de 1s
- Worker de secuencias ejecutándose cada 60 segundos
- Índices optimizados en BD para queries frecuentes
- Paginación en todos los listados
- Pixel tracking con encoding UTF-8
- Reescritura de URLs sin afectar anchors ni mailto

---

*Última actualización: Enero 2026*

---

> **Nota:** Para instrucciones detalladas de instalación y ejecución, consulta [SETUP.md](./SETUP.md)
