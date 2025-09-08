-- Script SEGURO para mejorar la tabla MensajesObservaciones
-- Ejecutar en SQL Server Express

-- 1. Verificar si la columna Receptor ya existe
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'MensajesObservaciones' 
    AND COLUMN_NAME = 'Receptor'
)
BEGIN
    PRINT 'Agregando columna Receptor...'
    -- Agregar columna Receptor a la tabla existente
    ALTER TABLE MensajesObservaciones ADD Receptor NVARCHAR(50) NULL;
    PRINT 'Columna Receptor agregada exitosamente.'
END
ELSE
BEGIN
    PRINT 'La columna Receptor ya existe.'
END

-- 2. Actualizar los registros existentes para que el receptor sea el responsable de la tarea
PRINT 'Actualizando registros existentes...'
UPDATE m 
SET m.Receptor = t.Responsable
FROM MensajesObservaciones m
INNER JOIN Tareas t ON m.TareaId = t.Id
WHERE m.Receptor IS NULL;

PRINT 'Registros actualizados: ' + CAST(@@ROWCOUNT AS VARCHAR(10))

-- 3. Hacer la columna Receptor NOT NULL después de actualizar
PRINT 'Haciendo columna Receptor NOT NULL...'
ALTER TABLE MensajesObservaciones ALTER COLUMN Receptor NVARCHAR(50) NOT NULL;
PRINT 'Columna Receptor ahora es NOT NULL.'

-- 4. Verificar si el índice ya existe antes de crearlo
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE name = 'IX_MensajesObservaciones_Receptor' 
    AND object_id = OBJECT_ID('MensajesObservaciones')
)
BEGIN
    PRINT 'Creando índice IX_MensajesObservaciones_Receptor...'
    CREATE INDEX IX_MensajesObservaciones_Receptor ON MensajesObservaciones(Receptor);
    PRINT 'Índice creado exitosamente.'
END
ELSE
BEGIN
    PRINT 'El índice IX_MensajesObservaciones_Receptor ya existe.'
END

-- 5. Verificar la estructura final
PRINT 'Verificando estructura final...'
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'MensajesObservaciones'
ORDER BY ORDINAL_POSITION;

-- 6. Mostrar algunos datos de ejemplo
PRINT 'Datos de ejemplo:'
SELECT TOP 3 
    Id,
    TareaId,
    Emisor,
    Receptor,
    Mensaje,
    FechaCreacion
FROM MensajesObservaciones
ORDER BY Id DESC;

PRINT 'Script completado exitosamente!'

