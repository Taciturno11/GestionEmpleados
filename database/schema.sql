-- SISTEMA DE GESTIÓN DE TAREAS - BASE DE DATOS COMPLETA
-- Ejecutar en SQL Server Express

-- 1. ELIMINAR TABLAS EXISTENTES SI EXISTEN
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MensajesObservaciones]') AND type in (N'U'))
    DROP TABLE [dbo].[MensajesObservaciones];

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RespuestasFeedback]') AND type in (N'U'))
    DROP TABLE [dbo].[RespuestasFeedback];

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Feedback]') AND type in (N'U'))
    DROP TABLE [dbo].[Feedback];

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Tareas]') AND type in (N'U'))
    DROP TABLE [dbo].[Tareas];

-- 2. CREAR TABLA TAREAS
CREATE TABLE Tareas (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Titulo NVARCHAR(100) NOT NULL,
    Responsable NVARCHAR(50) NOT NULL,
    FechaInicio DATE NOT NULL,
    FechaFin DATE NOT NULL,
    Prioridad NVARCHAR(20) NOT NULL CHECK (Prioridad IN ('Alta','Media','Baja')),
    Estado NVARCHAR(20) NOT NULL CHECK (Estado IN ('Pendiente','En Progreso','Terminado')),
    Observaciones NVARCHAR(500) NULL,
    FechaCreacion DATETIME DEFAULT GETDATE()
);

-- 3. CREAR TABLA MENSAJES (CHAT) - ESTRUCTURA SIMPLIFICADA
CREATE TABLE MensajesObservaciones (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    TareaId INT NOT NULL,
    EmisorDNI NVARCHAR(50) NOT NULL,
    EmisorNombre NVARCHAR(100) NOT NULL,
    ReceptorDNI NVARCHAR(50) NOT NULL,
    ReceptorNombre NVARCHAR(100) NOT NULL,
    Mensaje NVARCHAR(1000) NOT NULL,
    FechaCreacion DATETIME DEFAULT GETDATE(),
    Leido BIT DEFAULT 0,
    FOREIGN KEY (TareaId) REFERENCES Tareas(Id) ON DELETE CASCADE
);

-- 4. CREAR TABLA FEEDBACK
CREATE TABLE Feedback (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    TareaId INT NOT NULL,
    EmisorDNI NVARCHAR(50) NOT NULL,
    EmisorNombre NVARCHAR(100) NOT NULL,
    Mensaje TEXT NOT NULL,
    FechaCreacion DATETIME DEFAULT GETDATE(),
    Leido BIT DEFAULT 0,
    FOREIGN KEY (TareaId) REFERENCES Tareas(Id) ON DELETE CASCADE
);

-- 5. CREAR TABLA RESPUESTAS FEEDBACK
CREATE TABLE RespuestasFeedback (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    FeedbackId INT NOT NULL,
    EmisorDNI NVARCHAR(50) NOT NULL,
    EmisorNombre NVARCHAR(100) NOT NULL,
    Mensaje TEXT NOT NULL,
    FechaCreacion DATETIME DEFAULT GETDATE(),
    Leido BIT DEFAULT 0,
    FOREIGN KEY (FeedbackId) REFERENCES Feedback(Id) ON DELETE CASCADE
);

-- 6. CREAR ÍNDICES PARA RENDIMIENTO
CREATE INDEX IX_Tareas_Responsable ON Tareas(Responsable);
CREATE INDEX IX_Tareas_Estado ON Tareas(Estado);
CREATE INDEX IX_MensajesObservaciones_TareaId ON MensajesObservaciones(TareaId);
CREATE INDEX IX_MensajesObservaciones_EmisorDNI ON MensajesObservaciones(EmisorDNI);
CREATE INDEX IX_MensajesObservaciones_ReceptorDNI ON MensajesObservaciones(ReceptorDNI);
CREATE INDEX IX_MensajesObservaciones_FechaCreacion ON MensajesObservaciones(FechaCreacion);

-- 7. INSERTAR DATOS DE PRUEBA
INSERT INTO Tareas (Titulo, Responsable, FechaInicio, FechaFin, Prioridad, Estado, Observaciones) VALUES
('Desarrollo de API REST', '73766815', '2024-01-15', '2024-02-15', 'Alta', 'En Progreso', 'Implementar endpoints para usuarios'),
('Análisis de Requerimientos', '73766815', '2024-01-20', '2024-02-20', 'Media', 'Pendiente', 'Documentar funcionalidades'),
('Testing de Aplicación', '73766815', '2024-01-25', '2024-02-25', 'Baja', 'Pendiente', 'Pruebas unitarias y de integración');

-- 8. INSERTAR MENSAJES DE PRUEBA CON NOMBRES DIRECTOS
INSERT INTO MensajesObservaciones (TareaId, EmisorDNI, EmisorNombre, ReceptorDNI, ReceptorNombre, Mensaje) VALUES
(1, '44991089', 'Carlos Paucar Serra', '73766815', 'Martin Nauca Gamboa', '¿Cómo va el progreso de la API?'),
(1, '73766815', 'Martin Nauca Gamboa', '44991089', 'Carlos Paucar Serra', 'Muy bien jefe, ya tengo el 70% listo'),
(2, '44991089', 'Carlos Paucar Serra', '73766815', 'Martin Nauca Gamboa', 'Necesito que priorices el análisis de requerimientos');

-- 9. VERIFICAR ESTRUCTURA
SELECT 'TAREAS' as Tabla, COUNT(*) as Registros FROM Tareas
UNION ALL
SELECT 'MENSAJES' as Tabla, COUNT(*) as Registros FROM MensajesObservaciones
UNION ALL
SELECT 'FEEDBACK' as Tabla, COUNT(*) as Registros FROM Feedback;

-- 10. MOSTRAR ESTRUCTURA DE TABLAS
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME IN ('Tareas', 'MensajesObservaciones', 'Feedback', 'RespuestasFeedback')
ORDER BY TABLE_NAME, ORDINAL_POSITION;

PRINT '✅ SISTEMA DE GESTIÓN DE TAREAS CREADO EXITOSAMENTE!'
PRINT '📊 Tablas creadas: Tareas, MensajesObservaciones, Feedback, RespuestasFeedback'
PRINT '🔧 Índices creados para optimizar rendimiento'
PRINT '📝 Datos de prueba insertados con nombres directos'
PRINT '🎯 Sistema listo para usar!'
