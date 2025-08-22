# Sistema de Gestión de Tareas

Aplicación web simple para gestión de tareas y proyectos del equipo.

## Características

- ✅ CRUD completo de tareas
- ✅ Estados: Pendiente, En Progreso, Terminado
- ✅ Asignación de responsables
- ✅ Fechas de entrega
- ✅ Interfaz moderna y responsive

## Tecnologías

- **Backend**: Node.js + Express + MSSQL
- **Frontend**: React + TailwindCSS
- **Base de datos**: SQL Server Express

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

La aplicación utiliza la tabla `Tareas` con la siguiente estructura:

```sql
CREATE TABLE Tareas (
  Id INT IDENTITY PRIMARY KEY,
  Titulo NVARCHAR(100) NOT NULL,
  Responsable NVARCHAR(50) NOT NULL,
  FechaEntrega DATE NOT NULL,
  Estado NVARCHAR(20) NOT NULL CHECK (Estado IN ('Pendiente','En Progreso','Terminado'))
);
```
