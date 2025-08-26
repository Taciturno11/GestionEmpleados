# Instrucciones para Ejecutar el Proyecto

## 1. Configurar la Base de Datos

1. Asegúrate de tener SQL Server Express instalado
2. Ejecuta el script `database/schema.sql` en tu base de datos
3. Crea un archivo `.env` en la carpeta `server` con la configuración de tu base de datos:

```
DB_HOST=localhost
DB_PORT=1433
DB_NAME=Partner
DB_USER=anubis
DB_PASS=Tg7#kPz9@rLt2025
PORT=5000
NODE_ENV=development
JWT_SECRET=partner-design-thinking-secret-key
```

## 2. Ejecutar el Backend

```bash
cd server
npm install
npm run dev
```

El servidor estará disponible en: http://localhost:5000

## 3. Ejecutar el Frontend

En otra terminal:

```bash
cd client
npm install
npm start
```

La aplicación estará disponible en: http://localhost:3000

## 4. Funcionalidades Disponibles

### Para Todos los Usuarios:
- ✅ Crear nuevas tareas
- ✅ Ver lista de tareas asignadas
- ✅ Editar tareas propias
- ✅ Cambiar estado de tareas
- ✅ Recibir y responder feedback
- ✅ Interfaz formal y responsive

### Para el Jefe Supremo (DNI: 44991089):
- ✅ Ver todas las tareas del equipo
- ✅ Crear tareas para cualquier empleado
- ✅ Editar y eliminar cualquier tarea
- ✅ Ver reporte de empleados con tareas pendientes
- ✅ Enviar feedback a cualquier empleado
- ✅ Ver estadísticas completas del equipo
- ✅ Gestión de usuarios

## 5. Estructura de la Base de Datos

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

## 6. Nuevas Funcionalidades

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

## 7. Sistema de Roles

### Jefe Supremo (DNI: 44991089)
- Acceso completo a todas las funcionalidades
- Puede ver reportes de empleados
- Puede gestionar usuarios
- Puede enviar feedback a cualquier empleado

### Jefes (CargoID: 8)
- Pueden ver y gestionar sus tareas
- Pueden recibir feedback
- Acceso limitado a funcionalidades

### Analistas (CargoID: 4)
- Pueden ver y gestionar sus tareas
- Pueden recibir feedback
- Acceso básico a funcionalidades

## 8. Solución de Problemas

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

### Error de autenticación:
- Verifica que el DNI y contraseña sean iguales
- Asegúrate de que el usuario existe en la tabla PRI.Empleados
- Confirma que el usuario tiene los permisos correctos (CargoID 4 u 8)

## 9. Características de la Interfaz

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

## 10. Comandos Útiles

### Ejecutar todo el proyecto:
```bash
npm run dev
```

### Instalar todas las dependencias:
```bash
npm run install-all
```

### Ejecutar solo el servidor:
```bash
npm run server
```

### Ejecutar solo el cliente:
```bash
npm run client
```
