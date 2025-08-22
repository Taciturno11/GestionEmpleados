-- Script de creación de la tabla Tareas
-- Ejecutar en SQL Server Express

CREATE TABLE Tareas (
  Id INT IDENTITY PRIMARY KEY,
  Titulo NVARCHAR(100) NOT NULL,
  Responsable NVARCHAR(50) NOT NULL,
  FechaEntrega DATE NOT NULL,
  Estado NVARCHAR(20) NOT NULL CHECK (Estado IN ('Pendiente','En Progreso','Terminado'))
);

-- Datos de ejemplo (opcional)
INSERT INTO Tareas (Titulo, Responsable, FechaEntrega, Estado) VALUES
('Crear diseño de página web', 'Juan Pérez', '2024-01-15', 'Pendiente'),
('Revisar documentación técnica', 'María García', '2024-01-10', 'En Progreso'),
('Implementar funcionalidad de login', 'Carlos López', '2024-01-20', 'Pendiente'),
('Testing de la aplicación', 'Ana Martínez', '2024-01-25', 'Pendiente');
