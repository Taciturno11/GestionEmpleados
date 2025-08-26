-- Script para crear la tabla MensajesObservaciones
-- Ejecutar en SQL Server Express

-- Crear tabla para mensajes del chat de observaciones
CREATE TABLE MensajesObservaciones (
  Id INT IDENTITY(1,1) PRIMARY KEY,
  TareaId INT NOT NULL,
  Emisor NVARCHAR(50) NOT NULL,
  Mensaje NVARCHAR(1000) NOT NULL,
  FechaCreacion DATETIME DEFAULT GETDATE(),
  Leido BIT DEFAULT 0,
  FOREIGN KEY (TareaId) REFERENCES Tareas(Id) ON DELETE CASCADE
);

-- Índices para mejorar el rendimiento de las consultas
CREATE INDEX IX_MensajesObservaciones_TareaId ON MensajesObservaciones(TareaId);
CREATE INDEX IX_MensajesObservaciones_FechaCreacion ON MensajesObservaciones(FechaCreacion);
CREATE INDEX IX_MensajesObservaciones_Leido ON MensajesObservaciones(Leido);

-- Insertar algunos mensajes de ejemplo (opcional)
-- INSERT INTO MensajesObservaciones (TareaId, Emisor, Mensaje) VALUES
-- (1, '44991089', 'Hola, ¿cómo va el progreso de esta tarea?'),
-- (1, '73766815', 'Estoy trabajando en ello, espero terminarlo pronto'),
-- (2, '44991089', 'Necesito que priorices este análisis');
