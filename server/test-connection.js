const sql = require('mssql');

const config = {
  user: 'anubis',
  password: 'Tg7#kPz9@rLt2025',
  server: '172.16.248.48',
  port: 1433,
  database: 'Partner',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

async function testConnection() {
  try {
    console.log('🔍 Intentando conectar a la base de datos...');
    console.log('📋 Configuración:', {
      server: config.server,
      port: config.port,
      database: config.database,
      user: config.user
    });
    
    const pool = await sql.connect(config);
    console.log('✅ Conexión exitosa a SQL Server!');
    
    // Probar una consulta simple
    const result = await pool.request().query('SELECT COUNT(*) as TotalTareas FROM Tareas');
    console.log('📊 Total de tareas en la base de datos:', result.recordset[0].TotalTareas);
    
    await pool.close();
    console.log('✅ Conexión cerrada correctamente');
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error('🔍 Código de error:', error.code);
  }
}

testConnection();
