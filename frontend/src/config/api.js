import dotenv from "dotenv";
dotenv.config();
// ya no usar el operador || porque te vas a confundir
const API_CONFIG = {
  baseURL: process.env.API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json"
  }
};

const APP_CONFIG = {
  name: process.env.APP_NAME,
  version: "1.0.0",
  description: "Sistema de Gestión de Tareas"
};

export { API_CONFIG, APP_CONFIG };
export default API_CONFIG;
