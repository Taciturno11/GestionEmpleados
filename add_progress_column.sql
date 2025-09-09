-- AGREGAR COLUMNA DE PROGRESO A LA TABLA TAREAS
-- Ejecutar en SQL Server Express

-- Verificar si la columna ya existe
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Tareas]') AND name = 'Progreso')
BEGIN
    -- Agregar columna de progreso
    ALTER TABLE Tareas 
    ADD Progreso INT NOT NULL DEFAULT 0 CHECK (Progreso >= 0 AND Progreso <= 100);
    
    PRINT 'Columna Progreso agregada exitosamente a la tabla Tareas';
END
ELSE
BEGIN
    PRINT 'La columna Progreso ya existe en la tabla Tareas';
END

-- Verificar la estructura actualizada
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Tareas' 
ORDER BY ORDINAL_POSITION;


