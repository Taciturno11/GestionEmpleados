# Sistema de Gestión Empresarial - Partner Design Thinking

Aplicación web empresarial para gestión de tareas y proyectos del equipo con interfaz formal y profesional.

## Características

- ✅ CRUD completo de tareas
- ✅ Estados: Pendiente, En Progreso, Terminado
- ✅ Asignación de responsables
- ✅ Fechas de entrega con validación
- ✅ Sistema de feedback y respuestas
- ✅ Reporte de empleados con tareas pendientes
- ✅ Interfaz formal y empresarial
- ✅ Sistema de roles y permisos
- ✅ Estadísticas en tiempo real

## Tecnologías

- **Backend**: Node.js + Express + MSSQL
- **Frontend**: React + TailwindCSS
- **Base de datos**: SQL Server Express
- **Autenticación**: JWT

## Estructura del Proyecto

```
Proyecto_Gestion/
├── client/          # React frontend
├── server/          # Node.js backend
├── database/        # Scripts SQL
└── README.md
```

## Instalación

### Backend
```bash
cd server
npm install
npm start
```

### Frontend
```bash
cd client
npm install
npm start
```

## Base de Datos

La aplicación utiliza las siguientes tablas:

### Tabla Tareas
```sql
CREATE TABLE Tareas (
  Id INT IDENTITY PRIMARY KEY,
  Titulo NVARCHAR(100) NOT NULL,
  Responsable NVARCHAR(50) NOT NULL,
  FechaEntrega DATE NOT NULL,
  Estado NVARCHAR(20) NOT NULL CHECK (Estado IN ('Pendiente','En Progreso','Terminado'))
);
```

### Tabla Feedback
```sql
CREATE TABLE Feedback (
  Id INT IDENTITY PRIMARY KEY,
  TareaId INT NOT NULL,
  EmisorDNI NVARCHAR(20) NOT NULL,
  ReceptorDNI NVARCHAR(20) NOT NULL,
  Comentario TEXT NOT NULL,
  FechaCreacion DATETIME DEFAULT GETDATE(),
  Leido BIT DEFAULT 0
);
```

### Tabla RespuestasFeedback
```sql
CREATE TABLE RespuestasFeedback (
  Id INT IDENTITY PRIMARY KEY,
  FeedbackId INT NOT NULL,
  EmisorDNI NVARCHAR(20) NOT NULL,
  Comentario TEXT NOT NULL,
  FechaCreacion DATETIME DEFAULT GETDATE(),
  Leido BIT DEFAULT 0
);
```

## Funcionalidades por Rol

### Jefe Supremo (DNI: 44991089)
- ✅ Ver todas las tareas
- ✅ Crear tareas para cualquier empleado
- ✅ Editar y eliminar cualquier tarea
- ✅ Ver reporte de empleados con tareas pendientes
- ✅ Enviar feedback a cualquier empleado
- ✅ Ver estadísticas completas

### Jefes (CargoID: 8)
- ✅ Ver tareas asignadas
- ✅ Crear tareas para sí mismos
- ✅ Editar sus tareas
- ✅ Recibir feedback

### Analistas (CargoID: 4)
- ✅ Ver tareas asignadas
- ✅ Crear tareas para sí mismos
- ✅ Editar sus tareas
- ✅ Recibir feedback

## Nuevas Funcionalidades

### Reporte de Empleados con Tareas Pendientes
- 📊 Vista detallada de empleados con tareas pendientes
- 📈 Estadísticas por empleado
- 📋 Lista de tareas pendientes por empleado
- 🎯 Ordenamiento por cantidad de tareas pendientes

### Interfaz Formal y Empresarial
- 🎨 Diseño limpio y profesional
- 📱 Responsive design
- 🎯 Colores empresariales (blancos, grises, azules)
- ⚡ Animaciones suaves y profesionales
- 📊 Dashboard con estadísticas

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener información del usuario
- `GET /api/auth/users` - Listar usuarios (solo jefe supremo)

### Tareas
- `GET /api/tareas` - Obtener tareas
- `GET /api/tareas/:id` - Obtener tarea específica
- `POST /api/tareas` - Crear tarea
- `PUT /api/tareas/:id` - Actualizar tarea
- `DELETE /api/tareas/:id` - Eliminar tarea (solo jefe supremo)
- `GET /api/tareas/stats` - Estadísticas de tareas
- `GET /api/tareas/reporte-empleados` - Reporte de empleados (solo jefe supremo)

### Feedback
- `POST /api/feedback` - Crear feedback (solo jefe supremo)
- `GET /api/feedback/received` - Feedback recibido
- `GET /api/feedback/sent` - Feedback enviado (solo jefe supremo)
- `PUT /api/feedback/:id/read` - Marcar como leído
- `GET /api/feedback/:id/responses` - Obtener respuestas
- `POST /api/feedback/:id/responses` - Crear respuesta
- `GET /api/feedback/stats` - Estadísticas de feedback

## Configuración

### Variables de Entorno (.env)
```env
DB_HOST=localhost
DB_PORT=1433
DB_NAME=Partner
DB_USER=anubis
DB_PASS=Tg7#kPz9@rLt2025
PORT=5000
NODE_ENV=development
JWT_SECRET=partner-design-thinking-secret-key
```

## Características de la Interfaz

### Diseño Formal
- 🎨 Paleta de colores empresarial
- 📐 Layout limpio y organizado
- 🎯 Tipografía profesional
- 📱 Diseño responsive
- ⚡ Transiciones suaves

### Componentes
- 📊 Dashboard con estadísticas
- 📋 Gestión de tareas
- 💬 Sistema de feedback
- 👥 Gestión de usuarios
- 📈 Reportes detallados

## Solución de Problemas

### Error de conexión a la base de datos:
- Verifica que SQL Server esté ejecutándose
- Confirma las credenciales en el archivo `.env`
- Asegúrate de que la base de datos existe

### Error de CORS:
- El backend ya tiene CORS configurado
- Si persiste, verifica que el frontend esté en el puerto 3000

### Error de dependencias:
- Ejecuta `npm install` en ambas carpetas
- Verifica que Node.js esté actualizado

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.
