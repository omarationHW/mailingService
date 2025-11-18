# 🚂 Deployment en Railway - Guía Paso a Paso

## Paso 1: Crear cuenta en Railway

1. Ve a [Railway.app](https://railway.app)
2. Haz clic en "Start a New Project"
3. Conecta tu cuenta de GitHub

## Paso 2: Crear nuevo proyecto

1. Click en "New Project"
2. Selecciona "Deploy from GitHub repo"
3. Selecciona tu repositorio `mailingService`
4. Railway detectará automáticamente que es un proyecto Node.js

## Paso 3: Configurar PostgreSQL

1. En tu proyecto de Railway, haz click en "+ New"
2. Selecciona "Database" → "Add PostgreSQL"
3. Railway creará automáticamente la base de datos
4. La variable `DATABASE_URL` se configurará automáticamente

## Paso 4: Configurar Variables de Entorno

En Railway, ve a tu servicio backend → Variables → Raw Editor y pega esto:

```env
# JWT
JWT_SECRET=tu-super-secreto-jwt-muy-largo-y-aleatorio-cambialo-en-produccion
JWT_EXPIRES_IN=7d

# Server
NODE_ENV=production
PORT=3001

# Resend API
RESEND_API_KEY=""

# App URLs (IMPORTANTE: Cambiar cuando tengas el dominio de Railway)
# Primero usa la URL temporal de Railway, luego cámbiala a tu dominio custom
APP_URL=https://tu-app-nombre.railway.app
FRONTEND_URL=https://tu-frontend-url.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**IMPORTANTE:**

- `DATABASE_URL` se configura automáticamente por Railway, NO la agregues manualmente
- Después del primer deploy, Railway te dará una URL como `https://mailingservice-production-xxxx.up.railway.app`
- Actualiza `APP_URL` con esa URL de Railway

## Paso 5: Configurar Dominio Personalizado (Opcional pero Recomendado)

1. En Railway, ve a Settings → Networking
2. Click en "Generate Domain" (obtendrás algo como `mailingservice-production.up.railway.app`)
3. O agrega tu dominio custom `api.campaigns.xy.tech`:
   - Click en "Custom Domain"
   - Ingresa `api.campaigns.xy.tech`
   - Railway te dará un registro CNAME
   - Ve a tu proveedor DNS (donde compraste `xy.tech`)
   - Agrega el registro CNAME:
     ```
     Type: CNAME
     Name: api.campaigns
     Value: [el valor que Railway te dio]
     ```
4. Espera 5-10 minutos para que el DNS se propague
5. Actualiza `APP_URL` en las variables de entorno a `https://api.campaigns.xy.tech`

## Paso 6: Deploy

1. Railway detectará el `nixpacks.toml` y usará la configuración correcta
2. El deploy se iniciará automáticamente
3. Espera a que termine (puedes ver los logs en tiempo real)
4. Si todo sale bien, verás "Deployment successful"

## Paso 7: Ejecutar Migraciones

Las migraciones se ejecutan automáticamente durante el build gracias a:

```
npm run build → incluye "npx prisma migrate deploy"
```

Si necesitas ejecutarlas manualmente:

1. Ve a tu servicio en Railway
2. Settings → Deploy → Command
3. Ejecuta: `npx prisma migrate deploy`

## Paso 8: Verificar que funciona

Prueba tu API:

```bash
curl https://api.campaigns.xy.tech/health
```

Deberías recibir:

```json
{
  "status": "ok",
  "timestamp": "..."
}
```

## Paso 9: Actualizar Frontend

Una vez que tu backend esté en Railway, actualiza el frontend:

En `frontend/src/api/client.ts`, cambia:

```typescript
baseURL: 'https://api.campaigns.xy.tech/api'
```

## Troubleshooting

### Error: "Cannot find module"

- Asegúrate de que todas las dependencias estén en `dependencies` (no en `devDependencies`)
- Ejecuta `npm install` localmente y haz commit del `package-lock.json`

### Error: "Database connection failed"

- Verifica que Railway haya creado la base de datos PostgreSQL
- Verifica que `DATABASE_URL` esté configurada automáticamente

### Error: "Prisma migrations failed"

- Ve a Railway → Settings → Deploy Command
- Ejecuta manualmente: `npx prisma migrate deploy`

## Variables de Entorno Completas (Referencia)

```env
# Automático (Railway lo configura)
DATABASE_URL=postgresql://...

# Debes configurar manualmente
JWT_SECRET=un-secreto-muy-largo-y-aleatorio
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=3001
RESEND_API_KEY=tu_api_key_de_resend
APP_URL=https://api.campaigns.xy.tech
FRONTEND_URL=https://tu-frontend.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Costos

- **PostgreSQL**: ~$5 USD/mes (incluido en créditos gratuitos)
- **Backend**: ~$5 USD/mes (incluido en créditos gratuitos)
- **Total**: $0 USD/mes con los créditos gratuitos de Railway

Railway te da $5 USD de créditos gratis cada mes, suficiente para este proyecto.
