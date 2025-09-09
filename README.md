# Sistema de Gestión de Tareas - Partner Design Thinking

Un sistema completo de gestión de tareas desarrollado con Node.js, React y SQL Server.

## 🚀 Características

- **Gestión de Tareas**: Crear, editar, eliminar y asignar tareas
- **Sistema de Chat**: Observaciones entre jefe supremo y trabajadores
- **Autenticación**: Sistema de login con JWT
- **Roles**: Jefe Supremo y Trabajadores con permisos diferenciados
- **Feedback**: Sistema de comentarios y respuestas
- **Estadísticas**: Dashboard con métricas en tiempo real

## 🛠️ Tecnologías

### Backend
- **Node.js** con Express
- **SQL Server** como base de datos
- **JWT** para autenticación
- **MSSQL** para conexión a base de datos

### Frontend
- **React** con Vite
- **TailwindCSS** para estilos
- **Axios** para peticiones HTTP

## 📋 Estructura del Proyecto

```
Proyecto_Gestion/
├── database/
│   └── schema.sql          # Script de base de datos
├── server/
│   ├── config/
│   │   └── database.js     # Configuración de BD
│   ├── middleware/
│   │   └── auth.js         # Middleware de autenticación
│   ├── routes/
│   │   ├── auth.js         # Rutas de autenticación
│   │   ├── tareas.js       # Rutas de tareas
│   │   └── feedback.js     # Rutas de feedback
│   ├── index.js            # Servidor principal
│   └── package.json        # Dependencias del backend
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx   # Componente de login
│   │   │   └── Feedback.jsx # Componente de feedback
│   │   ├── App.jsx         # Componente principal
│   │   ├── main.jsx        # Punto de entrada
│   │   └── index.css       # Estilos globales
│   ├── index.html          # HTML principal
│   └── package.json        # Dependencias del frontend
├── package.json            # Scripts principales
└── README.md              # Este archivo
```

## 🗄️ Base de Datos

### Tablas Principales

- **Tareas**: Almacena las tareas del sistema
- **MensajesObservaciones**: Chat entre jefe y trabajadores
- **Feedback**: Sistema de comentarios
- **RespuestasFeedback**: Respuestas a feedback

### Usuarios de Prueba

- **Jefe Supremo**: DNI `44991089` (Carlos Paucar Serra)
- **Trabajador**: DNI `73766815` (Martin Nauca Gamboa)

## 🚀 Instalación y Configuración

### 1. Instalar Dependencias

```bash
npm run install-all
```

### 2. Configurar Base de Datos

1. Ejecutar el script `database/schema.sql` en SQL Server
2. Configurar las variables de entorno en `server/.env`:

```env
DB_USER=sa
DB_PASSWORD=123456
DB_SERVER=localhost
DB_NAME=PartnerDesignThinking
JWT_SECRET=tu_clave_secreta_super_segura_2024
```

### 3. Ejecutar el Sistema

```bash
npm run dev
```

Esto iniciará:
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:3000

## 📱 Uso del Sistema

### Login
1. Abrir http://localhost:3000
2. Ingresar DNI del usuario
3. El sistema detectará automáticamente el rol

### Jefe Supremo (DNI: 44991089)
- Ve todas las tareas de todos los trabajadores
- Puede crear tareas para cualquier trabajador
- Puede enviar observaciones a cualquier tarea
- Ve todas las respuestas de los trabajadores

### Trabajadores (DNI: 73766815)
- Ve solo sus tareas asignadas
- Puede crear tareas para sí mismo
- Puede responder a observaciones del jefe supremo
- No puede iniciar conversaciones

## 🔧 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener información del usuario
- `GET /api/auth/users` - Listar usuarios

### Tareas
- `GET /api/tareas` - Obtener tareas
- `POST /api/tareas` - Crear tarea
- `PUT /api/tareas/:id` - Actualizar tarea
- `DELETE /api/tareas/:id` - Eliminar tarea
- `GET /api/tareas/stats` - Obtener estadísticas

### Chat
- `GET /api/tareas/:id/mensajes` - Obtener mensajes
- `POST /api/tareas/:id/mensajes` - Enviar mensaje
- `PUT /api/tareas/:id/mensajes/leer` - Marcar como leído

### Feedback
- `GET /api/feedback/:tareaId` - Obtener feedback
- `POST /api/feedback` - Crear feedback
- `POST /api/feedback/:id/respuestas` - Responder feedback

## 🎨 Características de la UI

- **Diseño Responsivo**: Funciona en desktop y móvil
- **Tema Moderno**: Interfaz limpia con TailwindCSS
- **Indicadores Visuales**: Colores para prioridades y estados
- **Chat en Tiempo Real**: Interfaz de chat intuitiva
- **Estadísticas**: Dashboard con métricas visuales

## 🔒 Seguridad

- **Autenticación JWT**: Tokens seguros con expiración
- **Autorización por Roles**: Permisos diferenciados
- **Validación de Datos**: Validación en frontend y backend
- **CORS Configurado**: Seguridad en peticiones cross-origin

## 🐛 Solución de Problemas

### Error de Conexión a BD
- Verificar que SQL Server esté ejecutándose
- Comprobar credenciales en variables de entorno
- Verificar que la base de datos existe

### Error de Puerto en Uso
- Cambiar puerto en `server/index.js` o `frontend/vite.config.js`
- Matar procesos que usen los puertos 3000 o 5000

### Error de Dependencias
- Ejecutar `npm run install-all` nuevamente
- Verificar versiones de Node.js (recomendado v18+)

## 📄 Licencia

MIT License - Partner Design Thinking

## 👥 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

---

**Desarrollado con ❤️ por Partner Design Thinking**
