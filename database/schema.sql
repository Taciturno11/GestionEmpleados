-- Script de creación de la tabla Tareas
-- Ejecutar en SQL Server Express

-- Eliminar tablas existentes en orden correcto
DROP TABLE IF EXISTS RespuestasFeedback;
DROP TABLE IF EXISTS Feedback;
DROP TABLE IF EXISTS Tareas;

-- Crear tabla Tareas con la nueva estructura
CREATE TABLE Tareas (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Titulo NVARCHAR(100) NOT NULL,
    Responsable NVARCHAR(50) NOT NULL,
    FechaInicio DATE NOT NULL,
    FechaFin DATE NOT NULL,
    Prioridad NVARCHAR(20) NOT NULL CHECK (Prioridad IN ('Alta','Media','Baja')),
    Estado NVARCHAR(20) NOT NULL CHECK (Estado IN ('Pendiente','En Progreso','Terminado')),
    Observaciones NVARCHAR(500) NULL
);

-- Crear tabla Feedback
CREATE TABLE Feedback (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    TareaId INT NOT NULL,
    Emisor NVARCHAR(50) NOT NULL,
    Mensaje TEXT NOT NULL,
    FechaCreacion DATETIME DEFAULT GETDATE(),
    Leido BIT DEFAULT 0,
    FOREIGN KEY (TareaId) REFERENCES Tareas(Id) ON DELETE CASCADE
);

-- Crear tabla RespuestasFeedback
CREATE TABLE RespuestasFeedback (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    FeedbackId INT NOT NULL,
    Emisor NVARCHAR(50) NOT NULL,
    Mensaje TEXT NOT NULL,
    FechaCreacion DATETIME DEFAULT GETDATE(),
    Leido BIT DEFAULT 0,
    FOREIGN KEY (FeedbackId) REFERENCES Feedback(Id) ON DELETE CASCADE
);

-- Tabla para mensajes del chat de observaciones

CREATE TABLE MensajesObservaciones (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  TareaId INT NOT NULL,
  Emisor NVARCHAR(50) NOT NULL,
  Mensaje NVARCHAR(1000) NOT NULL,
  FechaCreacion DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (TareaId) REFERENCES Tareas(Id) ON DELETE CASCADE
);

-- Índice para mejorar el rendimiento de las consultas
CREATE INDEX IX_MensajesObservaciones_TareaId ON MensajesObservaciones(TareaId);
CREATE INDEX IX_MensajesObservaciones_FechaCreacion ON MensajesObservaciones(FechaCreacion);

-- Insertar datos de ejemplo
INSERT INTO Tareas (Titulo, Responsable, FechaInicio, FechaFin, Prioridad, Estado, Observaciones) VALUES
('Script ETL - Grafana', '73766815', '2024-01-15', '2025-08-27', 'Media', 'Pendiente', 'Revisar la configuración de conexión a la base de datos'),
('Análisis de Datos', '44991089', '2024-01-20', '2024-02-15', 'Alta', 'En Progreso', 'Priorizar los reportes de ventas'),
('Documentación API', '12345678', '2024-01-25', '2024-03-01', 'Baja', 'Terminado', 'Completado satisfactoriamente');
