-- Script para mejorar la tabla MensajesObservaciones
-- Ejecutar en SQL Server Express

-- 1. Agregar columna Receptor a la tabla existente
ALTER TABLE MensajesObservaciones ADD Receptor NVARCHAR(50) NULL;

-- 2. Actualizar los registros existentes para que el receptor sea el responsable de la tarea
UPDATE m 
SET m.Receptor = t.Responsable
FROM MensajesObservaciones m
INNER JOIN Tareas t ON m.TareaId = t.Id
WHERE m.Receptor IS NULL;

-- 3. Hacer la columna Receptor NOT NULL después de actualizar
ALTER TABLE MensajesObservaciones ALTER COLUMN Receptor NVARCHAR(50) NOT NULL;

-- 4. Agregar índice para mejorar el rendimiento
CREATE INDEX IX_MensajesObservaciones_Receptor ON MensajesObservaciones(Receptor);

-- 5. Agregar comentarios para documentar la tabla
EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Tabla para mensajes del chat de observaciones. Emisor es quien envía (Jefe Supremo), Receptor es quien recibe (Trabajador responsable de la tarea)', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'MensajesObservaciones';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'DNI del trabajador que recibe el mensaje (responsable de la tarea)', 
    @level0type = N'SCHEMA', @level0name = N'dbo', 
    @level1type = N'TABLE', @level1name = N'MensajesObservaciones', 
    @level2type = N'COLUMN', @level2name = N'Receptor';

-- 6. Verificar la estructura final
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'MensajesObservaciones'
ORDER BY ORDINAL_POSITION;

