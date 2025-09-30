-- SISTEMA DE SOLICITUDES ENTRE JEFES Y ANALISTAS
-- Ejecutar en SQL Server Express

-- 1. CREAR TABLA DE SOLICITUDES
CREATE TABLE SolicitudesTareas (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Titulo NVARCHAR(100) NOT NULL,
    Descripcion NVARCHAR(500) NOT NULL,
    SolicitanteDNI NVARCHAR(50) NOT NULL, -- Quien solicita
    SolicitadoDNI NVARCHAR(50) NOT NULL,  -- A quien se solicita
    FechaSolicitud DATETIME DEFAULT GETDATE(),
    Estado NVARCHAR(20) NOT NULL CHECK (Estado IN ('Pendiente','Aceptada','Rechazada','Cancelada')),
    FechaRespuesta DATETIME NULL,
    Observaciones NVARCHAR(500) NULL,
    FechaInicio DATE NULL, -- Fecha propuesta para la tarea
    FechaFin DATE NULL,    -- Fecha límite propuesta
    Prioridad NVARCHAR(20) NULL CHECK (Prioridad IN ('Alta','Media','Baja')),
    TareaCreadaId INT NULL -- ID de la tarea creada si se acepta
);

-- 2. CREAR TABLA DE NOTIFICACIONES
CREATE TABLE Notificaciones (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioDNI NVARCHAR(50) NOT NULL,
    Tipo NVARCHAR(50) NOT NULL, -- 'solicitud_tarea', 'solicitud_aceptada', 'solicitud_rechazada'
    Titulo NVARCHAR(100) NOT NULL,
    Mensaje NVARCHAR(500) NOT NULL,
    Leida BIT DEFAULT 0,
    FechaCreacion DATETIME DEFAULT GETDATE(),
    SolicitudId INT NULL, -- Referencia a la solicitud relacionada
    DatosExtra NVARCHAR(MAX) NULL -- JSON con datos adicionales
);

-- 3. CREAR ÍNDICES PARA RENDIMIENTO
CREATE INDEX IX_SolicitudesTareas_SolicitanteDNI ON SolicitudesTareas(SolicitanteDNI);
CREATE INDEX IX_SolicitudesTareas_SolicitadoDNI ON SolicitudesTareas(SolicitadoDNI);
CREATE INDEX IX_SolicitudesTareas_Estado ON SolicitudesTareas(Estado);
CREATE INDEX IX_SolicitudesTareas_FechaSolicitud ON SolicitudesTareas(FechaSolicitud);

CREATE INDEX IX_Notificaciones_UsuarioDNI ON Notificaciones(UsuarioDNI);
CREATE INDEX IX_Notificaciones_Leida ON Notificaciones(Leida);
CREATE INDEX IX_Notificaciones_FechaCreacion ON Notificaciones(FechaCreacion);
CREATE INDEX IX_Notificaciones_Tipo ON Notificaciones(Tipo);

-- 4. INSERTAR DATOS DE PRUEBA
INSERT INTO SolicitudesTareas (Titulo, Descripcion, SolicitanteDNI, SolicitadoDNI, Estado, FechaInicio, FechaFin, Prioridad) VALUES
('Análisis de datos de capacitación', 'Necesito un análisis detallado de los datos de capacitación del último trimestre', '76157106', '73766815', 'Pendiente', '2024-02-01', '2024-02-15', 'Alta'),
('Revisión de procesos operativos', 'Solicito revisión de los procesos operativos de mi área', '002702515', '44991089', 'Pendiente', '2024-02-05', '2024-02-20', 'Media');

-- 5. INSERTAR NOTIFICACIONES DE PRUEBA
INSERT INTO Notificaciones (UsuarioDNI, Tipo, Titulo, Mensaje, SolicitudId) VALUES
('73766815', 'solicitud_tarea', 'Nueva Solicitud', 'La Jefa de Capacitación te ha enviado una solicitud de tarea', 1),
('44991089', 'solicitud_tarea', 'Nueva Solicitud', 'El Jefe de Área te ha enviado una solicitud de tarea', 2);

-- 6. VERIFICAR ESTRUCTURA
SELECT 'SOLICITUDES' as Tabla, COUNT(*) as Registros FROM SolicitudesTareas
UNION ALL
SELECT 'NOTIFICACIONES' as Tabla, COUNT(*) as Registros FROM Notificaciones;

PRINT '✅ SISTEMA DE SOLICITUDES CREADO EXITOSAMENTE!'
PRINT '📊 Tablas creadas: SolicitudesTareas, Notificaciones'
PRINT '🔧 Índices creados para optimizar rendimiento'
PRINT '📝 Datos de prueba insertados'
PRINT '🎯 Sistema listo para usar!'

