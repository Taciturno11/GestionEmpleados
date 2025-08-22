const sql = require('mssql');
require('dotenv').config();

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

async function testTable() {
  try {
    console.log('🔍 Conectando a la base de datos...');
    const pool = await sql.connect(dbConfig);
    console.log('✅ Conexión exitosa');

    // Verificar la estructura de la tabla PRI.Empleados
    console.log('\n📋 Verificando estructura de la tabla PRI.Empleados...');
    const structureResult = await pool.request()
      .query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'PRI' AND TABLE_NAME = 'Empleados'
        ORDER BY ORDINAL_POSITION
      `);

    console.log('\n📊 Estructura de la tabla PRI.Empleados:');
    structureResult.recordset.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}) - Nullable: ${col.IS_NULLABLE}`);
    });

    // Verificar algunos registros de ejemplo
    console.log('\n👥 Registros de ejemplo:');
    const sampleResult = await pool.request()
      .query(`
        SELECT TOP 5 * FROM PRI.Empleados WHERE CargoID IN (4, 8)
      `);

    console.log('\n📋 Datos de ejemplo:');
    sampleResult.recordset.forEach((row, index) => {
      console.log(`  Registro ${index + 1}:`, row);
    });

    await pool.close();
    console.log('\n✅ Prueba completada');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testTable();
