# Instrucciones para Ejecutar el Proyecto

## 1. Configurar la Base de Datos

1. Asegúrate de tener SQL Server Express instalado
2. Ejecuta el script `database/schema.sql` en tu base de datos
3. Crea un archivo `.env` en la carpeta `server` con la configuración de tu base de datos:

```
DB_SERVER=localhost
DB_NAME=ProyectoGestion
DB_USER=sa
DB_PASSWORD=tu_password
PORT=5000
NODE_ENV=development
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

- ✅ Crear nuevas tareas
- ✅ Ver lista de tareas
- ✅ Editar tareas existentes
- ✅ Cambiar estado de tareas
- ✅ Eliminar tareas
- ✅ Filtros por estado
- ✅ Interfaz responsive

## 5. Estructura de la Base de Datos

La tabla `Tareas` debe tener la siguiente estructura:

```sql
CREATE TABLE Tareas (
  Id INT IDENTITY PRIMARY KEY,
  Titulo NVARCHAR(100) NOT NULL,
  Responsable NVARCHAR(50) NOT NULL,
  FechaEntrega DATE NOT NULL,
  Estado NVARCHAR(20) NOT NULL CHECK (Estado IN ('Pendiente','En Progreso','Terminado'))
);
```

## 6. Solución de Problemas

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
