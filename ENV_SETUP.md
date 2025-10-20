# Configuración de Variables de Entorno

## 📋 Variables de Entorno Requeridas

Para que el proyecto funcione correctamente, necesitas crear los siguientes archivos `.env`:

### 🎨 Frontend (.env en la carpeta `frontend/`)

```env
# Configuración del Frontend
VITE_FRONTEND_PORT=5173
VITE_FRONTEND_HOST=0.0.0.0

# Configuración del Backend
VITE_BACKEND_URL=http://10.8.2.56:3000
VITE_BACKEND_HOST=10.8.2.56
VITE_BACKEND_PORT=3000

# Configuración de la API
VITE_API_TIMEOUT=10000

# Configuración de la aplicación
VITE_APP_NAME=Sistema de Gestión de Tareas
VITE_APP_VERSION=1.0.0
```

### 🚀 Backend (.env en la carpeta `server/`)

```env
# Configuración del Backend
PORT=3000
BACKEND_HOST=10.8.2.56
BACKEND_PORT=3000

# Configuración de la Base de Datos
DB_HOST=10.8.2.56
DB_PORT=1433
DB_USER=sa
DB_PASS=tu_password_aqui
DB_NAME=GestionTareas

# Configuración JWT
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui
JWT_EXPIRES_IN=24h

# Configuración de la aplicación
APP_NAME=Sistema de Gestión de Tareas
APP_VERSION=1.0.0
APP_ENV=development
```

## 🔧 Instrucciones de Configuración

### 1. Crear archivos .env

Crea los archivos `.env` en las siguientes ubicaciones:
- `frontend/.env`
- `server/.env`

### 2. Configurar variables

Copia el contenido correspondiente de arriba y ajusta los valores según tu entorno:

#### Para Frontend:
- `VITE_BACKEND_URL`: URL completa del backend (ej: `http://192.168.1.100:3000`)
- `VITE_FRONTEND_PORT`: Puerto del frontend (por defecto: `5173`)

#### Para Backend:
- `PORT`: Puerto del backend (por defecto: `3000`)
- `BACKEND_HOST`: IP del servidor backend
- `DB_HOST`: IP del servidor de base de datos
- `DB_USER`: Usuario de la base de datos
- `DB_PASS`: Contraseña de la base de datos
- `DB_NAME`: Nombre de la base de datos
- `JWT_SECRET`: Clave secreta para JWT (debe ser muy segura)

### 3. Ejecutar el proyecto

```bash
# Terminal 1 - Backend
cd server
npm install
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

## 🌐 Configuración para Diferentes Entornos

### Desarrollo Local
```env
# Frontend
VITE_BACKEND_URL=http://localhost:3000

# Backend
BACKEND_HOST=localhost
DB_HOST=localhost
```

### Producción
```env
# Frontend
VITE_BACKEND_URL=https://tu-dominio.com

# Backend
BACKEND_HOST=0.0.0.0
DB_HOST=tu-servidor-db.com
APP_ENV=production
```

## ⚠️ Notas Importantes

1. **Nunca subas los archivos `.env` al repositorio** (ya están en `.gitignore`)
2. **Cambia todas las contraseñas por defecto** antes de usar en producción
3. **Usa JWT_SECRET muy seguro** en producción
4. **Verifica que los puertos no estén en uso** por otras aplicaciones
5. **Ajusta las IPs según tu red local**

## 🔍 Verificación

Después de configurar las variables, verifica que:

1. El backend muestre las variables cargadas en la consola
2. El frontend se conecte correctamente al backend
3. No haya errores de conexión en la consola del navegador
4. Las peticiones API funcionen correctamente
