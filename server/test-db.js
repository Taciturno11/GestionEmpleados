const sql = require('mssql');
require('dotenv').config();

console.log('🔍 Variables de entorno cargadas:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASS:', process.env.DB_PASS ? '***' : 'undefined');
console.log('DB_NAME:', process.env.DB_NAME);

const dbConfig = {
  server: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME || 'Partner',
  user: process.env.DB_USER || 'anubis',
  password: process.env.DB_PASS || 'Tg7#kPz9@rLt2025',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

async function testConnection() {
  try {
    console.log('🔍 Probando conexión a la base de datos...');
    console.log('Configuración:', {
      server: dbConfig.server,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      password: dbConfig.password ? '***' : 'undefined'
    });

    const pool = await sql.connect(dbConfig);
    console.log('✅ Conexión exitosa a SQL Server');

    // Verificar si la tabla Tareas existe
    const result = await pool.request()
      .query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'Tareas'
      `);

    if (result.recordset.length > 0) {
      console.log('✅ Tabla "Tareas" encontrada');
      
      // Contar registros en la tabla
      const countResult = await pool.request()
        .query('SELECT COUNT(*) as total FROM Tareas');
      console.log(`📊 Total de tareas: ${countResult.recordset[0].total}`);
    } else {
      console.log('❌ Tabla "Tareas" NO encontrada');
      console.log('💡 Creando tabla Tareas...');
      
      await pool.request().query(`
        CREATE TABLE Tareas (
          Id INT IDENTITY PRIMARY KEY,
          Titulo NVARCHAR(100) NOT NULL,
          Responsable NVARCHAR(50) NOT NULL,
          FechaEntrega DATE NOT NULL,
          Estado NVARCHAR(20) NOT NULL CHECK (Estado IN ('Pendiente','En Progreso','Terminado'))
        )
      `);
      console.log('✅ Tabla "Tareas" creada exitosamente');
    }

    await pool.close();
    console.log('🔒 Conexión cerrada');
    
  } catch (error) {
    console.error('❌ Error en la conexión:', error.message);
    console.error('Detalles:', error);
  }
}

testConnection();
