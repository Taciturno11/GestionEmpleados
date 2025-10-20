const sql = require('mssql');


const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME, 
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool;

const connectDB = async () => {
  try {
    if (!pool) {
      pool = await sql.connect(config);
      console.log('✅ Conexión a SQL Server establecida');
    }
    return pool;
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
    throw error;
  }
};

const closeDB = async () => {
  try {
    if (pool) {
      await pool.close();
      pool = null;
      console.log('✅ Conexión a SQL Server cerrada');
    }
  } catch (error) {
    console.error('❌ Error cerrando la conexión:', error);
  }
};

module.exports = { connectDB, closeDB };
