# Email Marketing Platform

Sistema completo de gestión de campañas de email marketing con tracking avanzado, similar a HubSpot o Mailchimp.

## Stack Tecnológico

### Backend
- **Node.js** + **Express** + **TypeScript**
- **PostgreSQL** con **Prisma ORM**
- **Resend API** para envío de emails
- **JWT** para autenticación
- **Bcrypt** para hash de contraseñas
- **Zod** para validación
- **GeoIP** para geolocalización
- **UA Parser** para detección de dispositivos

### Frontend
- **React** + **Vite** + **TypeScript**
- **TailwindCSS** para estilos
- **Recharts** para gráficas y analytics
- **Zustand** para estado global
- **React Router** para navegación
- **Axios** para peticiones HTTP
- **React Hot Toast** para notificaciones

## Características Principales

### 1. Gestión de Contactos
- CRUD completo de contactos
- Importación masiva desde CSV
- Exportación de contactos
- Segmentación por tags
- Campos personalizados (JSON)

### 2. Gestión de Campañas
- Crear campañas con HTML personalizado
- Sistema de templates reutilizables
- Variables dinámicas: `{{nombre}}`, `{{empresa}}`, etc.
- Envío inmediato o programado
- Estados: Draft, Scheduled, Sending, Completed, Failed

### 3. Sistema de Tracking Avanzado
- **Open Tracking**: Pixel invisible 1x1 que registra:
  - Timestamp de apertura
  - IP y geolocalización
  - User agent y tipo de dispositivo
  - Múltiples aperturas por contacto
- **Click Tracking**: Reescritura automática de URLs que registra:
  - URLs clickeadas
  - Timestamp de cada click
  - IP y datos del usuario

### 4. Dashboard & Analytics
- Vista general con métricas clave
- Tasa de apertura y clicks
- Engagement en el tiempo (gráficas)
- Contactos más activos
- Analytics detallados por campaña:
  - Opens y clicks por hora
  - Distribución por dispositivos
  - Top países
  - Links más clickeados
- Exportación de reportes en CSV

### 5. Autenticación
- Registro y login con JWT
- Roles: Admin, Editor, Viewer
- Middleware de autenticación y autorización

## Instalación

### Prerrequisitos
- Node.js 18+
- PostgreSQL 14+ (o Docker para ejecutar PostgreSQL)
- Cuenta en Resend.com (para envío de emails)

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd mailingService
```

### 2. Configurar PostgreSQL

**Opción A - Usando Docker (Recomendado):**
```bash
# Inicia PostgreSQL con Docker Compose
docker-compose up -d
```

**Opción B - Instalación local:**
- Instala PostgreSQL 14+ y créala base de datos `email_marketing`
- Ver [DATABASE_SETUP.md](./DATABASE_SETUP.md) para instrucciones detalladas

### 3. Configurar Backend

```bash
cd backend

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env
```

Editar `.env` con tus credenciales:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/email_marketing?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
RESEND_API_KEY="re_your_api_key_here"
APP_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:5173"
```

```bash
# Generar cliente de Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Iniciar servidor en modo desarrollo
npm run dev
```

El backend estará corriendo en `http://localhost:3000`

### 4. Configurar Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev
```

El frontend estará corriendo en `http://localhost:5173`

## Uso

### 1. Registro y Login
1. Abre `http://localhost:5173`
2. Crea una cuenta en `/register`
3. Inicia sesión

### 2. Agregar Contactos
Opción 1 - Manual:
- Ve a "Contacts"
- Click en "Add Contact"
- Completa el formulario

Opción 2 - CSV:
- Click en "Import CSV"
- Sube un archivo con columnas: `email,name,company,phone,tags`

Ejemplo CSV:
```csv
email,name,company,phone,tags
john@example.com,John Doe,Acme Inc,+1234567890,vip,newsletter
jane@example.com,Jane Smith,Tech Co,+0987654321,newsletter
```

### 3. Crear Templates
1. Ve a "Templates"
2. Click en "New Template"
3. Escribe HTML con variables:
```html
<h1>Hola {{nombre}}</h1>
<p>Gracias por ser parte de {{empresa}}</p>
<a href="https://example.com">Click aquí</a>
```

### 4. Crear Campaña
1. Ve a "Campaigns"
2. Click en "New Campaign"
3. Completa:
   - Nombre de campaña
   - Asunto del email
   - From Email y From Name
   - HTML Content (puedes usar variables)
   - Tags para filtrar destinatarios
4. Click en "Create Campaign"

### 5. Enviar Campaña
1. En la lista de campañas, click en el ícono de "Send" (avión)
2. Confirma el envío
3. La campaña cambiará a estado "SENDING" y luego "COMPLETED"

### 6. Ver Analytics
1. Click en el ícono de ojo en una campaña
2. Verás:
   - Métricas generales (opens, clicks, bounce rate)
   - Timeline de engagement
   - Opens por hora del día
   - Distribución de dispositivos
   - Top países
   - Links más clickeados
3. Exporta el reporte en CSV si necesitas

## API Endpoints

### Autenticación
```
POST   /api/auth/register  - Crear cuenta
POST   /api/auth/login     - Iniciar sesión
GET    /api/auth/me        - Obtener usuario actual
```

### Contactos
```
GET    /api/contacts              - Listar contactos
GET    /api/contacts/:id          - Obtener contacto
POST   /api/contacts              - Crear contacto
PUT    /api/contacts/:id          - Actualizar contacto
DELETE /api/contacts/:id          - Eliminar contacto
POST   /api/contacts/import       - Importar CSV
GET    /api/contacts/export       - Exportar CSV
```

### Templates
```
GET    /api/templates         - Listar templates
GET    /api/templates/:id     - Obtener template
POST   /api/templates         - Crear template
PUT    /api/templates/:id     - Actualizar template
DELETE /api/templates/:id     - Eliminar template
```

### Campañas
```
GET    /api/campaigns         - Listar campañas
GET    /api/campaigns/:id     - Obtener campaña
POST   /api/campaigns         - Crear campaña
PUT    /api/campaigns/:id     - Actualizar campaña
DELETE /api/campaigns/:id     - Eliminar campaña
POST   /api/campaigns/:id/send - Enviar campaña
```

### Tracking
```
GET    /api/track/open/:token  - Tracking pixel (1x1 PNG)
GET    /api/track/click/:token - Redirect con tracking
```

### Analytics
```
GET    /api/analytics/dashboard       - Métricas generales
GET    /api/analytics/campaigns/:id   - Analytics de campaña
GET    /api/analytics/campaigns/:id/export - Exportar reporte
```

## Base de Datos - Schema

```prisma
User          - Usuarios del sistema
Contact       - Contactos/destinatarios
Campaign      - Campañas de email
CampaignContact - Relación campaña-contacto con token único
Event         - Eventos de tracking (sent, opened, clicked, bounced)
Template      - Templates de HTML reutilizables
```

## Tracking - Cómo Funciona

### Open Tracking
1. Al enviar un email, se genera un token único por contacto
2. Se inyecta un pixel 1x1 transparente al final del HTML:
   ```html
   <img src="http://localhost:3000/api/track/open/TOKEN" />
   ```
3. Cuando el usuario abre el email, el navegador carga el pixel
4. El backend registra:
   - Timestamp
   - IP → geolocalización (país, ciudad)
   - User Agent → tipo de dispositivo (mobile/desktop)
   - Browser y OS

### Click Tracking
1. Todas las URLs del HTML son reescritas automáticamente:
   ```
   Original: <a href="https://example.com">Link</a>
   Reescrito: <a href="http://localhost:3000/api/track/click/TOKEN?url=https%3A%2F%2Fexample.com">Link</a>
   ```
2. Cuando el usuario hace click:
   - Se registra el evento con metadata
   - Se redirige al URL original
   - Se guarda qué URL fue clickeada

## Seguridad

- **Rate Limiting**: 100 requests por 15 minutos
- **JWT Tokens**: 7 días de expiración
- **Bcrypt**: Hash de contraseñas con salt rounds = 10
- **Validación**: Zod schemas en todos los endpoints
- **CORS**: Configurado para frontend específico
- **Roles**: Authorization middleware por rol

## Escalabilidad

El sistema está diseñado para crecer:

- **Envíos en lotes**: Los emails se envían en chunks de 10 con delay de 1s
- **Background processing**: Envío de campañas en background con `setImmediate`
- **Índices de BD**: Índices en campos frecuentemente consultados
- **Paginación**: Todos los endpoints soportan paginación
- **Rate limiting**: Protección contra abuso

Para producción, considera:
- Usar una cola de mensajes (Bull, RabbitMQ)
- Escalar horizontalmente con PM2 o Kubernetes
- Usar Redis para caché
- CDN para assets estáticos
- Logs centralizados (Winston + ELK)

## Scripts Útiles

### Backend
```bash
npm run dev          # Desarrollo con hot reload
npm run build        # Compilar TypeScript
npm run start        # Producción
npm run prisma:studio # Abrir Prisma Studio (GUI de BD)
npm run lint         # Linter
npm run format       # Format code
```

### Frontend
```bash
npm run dev          # Desarrollo
npm run build        # Build para producción
npm run preview      # Preview del build
npm run lint         # Linter
```

## Troubleshooting

### Error de conexión a PostgreSQL
**⚠️ See the detailed [DATABASE_SETUP.md](./DATABASE_SETUP.md) guide for complete setup instructions!**

Quick fixes:
- Verifica que PostgreSQL esté corriendo
- Revisa el `DATABASE_URL` en `.env`
- **Opción recomendada**: Usa Docker: `docker-compose up -d`
- Crea la base de datos manualmente si no existe:
  ```sql
  CREATE DATABASE email_marketing;
  ```

### Emails no se envían
- Verifica tu API key de Resend en `.env`
- Revisa la consola del backend para errores
- Asegúrate de tener un dominio verificado en Resend

### Frontend no se conecta al backend
- Verifica que el backend esté corriendo en puerto 3000
- Revisa `FRONTEND_URL` en backend `.env`
- Revisa el proxy en `frontend/vite.config.ts`

## Contribuir

1. Fork el proyecto
2. Crea un branch para tu feature
3. Commit tus cambios
4. Push al branch
5. Abre un Pull Request

## Licencia

MIT