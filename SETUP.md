# Mailing Service - Guía de Instalación y Ejecución

## Requisitos Previos

- Node.js v18 o superior
- npm
- Cuenta en [Neon](https://neon.tech) (base de datos PostgreSQL)

---

## 1. Clonar el Repositorio

```bash
git clone https://github.com/omarationHW/mailingService.git
cd mailingService
```

---

## 2. Configurar Variables de Entorno

### Backend

Crear el archivo `backend/.env`:

```env
DATABASE_URL="postgresql://usuario:password@host/database?sslmode=require"
JWT_SECRET="tu_secreto_jwt_seguro"
RESEND_API_KEY="re_xxxxxxxxxx"
FRONTEND_URL="http://localhost:5173"
PORT=3000
```

| Variable           | Descripción                            |
| ------------------ | --------------------------------------- |
| `DATABASE_URL`   | Connection string de Neon (PostgreSQL)  |
| `JWT_SECRET`     | Clave secreta para tokens JWT           |
| `RESEND_API_KEY` | API key de Resend para envío de emails |
| `FRONTEND_URL`   | URL del frontend (para CORS)            |
| `PORT`           | Puerto del servidor (default: 3000)     |

> **Nota:** La `DATABASE_URL` la obtienes desde el dashboard de Neon en tu proyecto.

---

## 3. Instalar Dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

## 4. Configurar Base de Datos

Desde la carpeta `backend`, ejecutar las migraciones de Prisma:

```bash
cd backend
npm run prisma:migrate
```

Esto creará todas las tablas necesarias en tu base de datos de Neon.

---

## 5. Ejecutar el Proyecto

### Opción A: Dos terminales separadas

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

El servidor corre en `http://localhost:3000`

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

La aplicación corre en `http://localhost:5173`

### Opción B: Comandos rápidos desde la raíz

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

---

## 6. Verificar que Todo Funciona

1. Abre `http://localhost:5173` en tu navegador
2. Regístrate con un nuevo usuario
3. Crea un contacto de prueba
4. Crea y envía una campaña

---

## Scripts Disponibles

### Backend

| Script                     | Descripción                             |
| -------------------------- | ---------------------------------------- |
| `npm run dev`            | Ejecutar en modo desarrollo (hot reload) |
| `npm run build`          | Compilar TypeScript                      |
| `npm run start`          | Ejecutar en producción                  |
| `npm run prisma:migrate` | Ejecutar migraciones de BD               |
| `npm run prisma:studio`  | Abrir GUI de Prisma (visualizar BD)      |
| `npm run lint`           | Ejecutar ESLint                          |
| `npm run format`         | Formatear código con Prettier           |

### Frontend

| Script              | Descripción                |
| ------------------- | --------------------------- |
| `npm run dev`     | Ejecutar en modo desarrollo |
| `npm run build`   | Build de producción        |
| `npm run preview` | Vista previa del build      |
| `npm run lint`    | Ejecutar ESLint             |

---

## Deployment

### Backend (Render)

1. Crear nuevo Web Service en Render
2. Conectar el repositorio
3. Configurar:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Root Directory:** `backend`
4. Agregar variables de entorno en Render

### Frontend (Vercel)

1. Importar proyecto en Vercel
2. Configurar:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Agregar variable de entorno `VITE_API_URL` con la URL del backend

---

## Troubleshooting

### Error de conexión a base de datos

Verificar que:

- La `DATABASE_URL` en `.env` es correcta
- El proyecto en Neon está activo
- Incluye `?sslmode=require` al final de la URL

### Error de CORS

Verificar que `FRONTEND_URL` en el backend coincide con la URL donde corre el frontend.

### Prisma no genera el cliente

Ejecutar manualmente:

```bash
cd backend
npx prisma generate
```

---

## Estructura del Proyecto

```
mailingService/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Lógica de negocio
│   │   ├── routes/         # Endpoints de la API
│   │   ├── services/       # Servicios (email, sequences)
│   │   ├── middleware/     # Auth, error handling
│   │   └── index.ts        # Entry point
│   └── prisma/
│       └── schema.prisma   # Esquema de BD
│
├── frontend/
│   ├── src/
│   │   ├── pages/          # Páginas de la app
│   │   ├── components/     # Componentes React
│   │   ├── api/            # Llamadas al backend
│   │   └── store/          # Estado global (Zustand)
│   └── ...
│
└── PROJECT_OVERVIEW.md     # Documentación completa
```
