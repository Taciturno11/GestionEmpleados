require('dotenv').config();

console.log('🔍 Variables de entorno cargadas:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASS:', process.env.DB_PASS ? '***' : 'undefined');
console.log('DB_NAME:', process.env.DB_NAME);

console.log('\n📁 Verificando archivo .env:');
const fs = require('fs');
if (fs.existsSync('.env')) {
  console.log('✅ Archivo .env existe');
  const content = fs.readFileSync('.env', 'utf8');
  console.log('📄 Contenido del archivo:');
  console.log(content);
} else {
  console.log('❌ Archivo .env NO existe');
}
