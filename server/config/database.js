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

async function connectDB() {
  try {
    const pool = await sql.connect(dbConfig);
    console.log('✅ Conexión a SQL Server establecida');
    return pool;
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
    throw error;
  }
}

module.exports = { connectDB, sql };
