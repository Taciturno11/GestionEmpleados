// Configuración centralizada de la API
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// Información de la aplicación
const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'Partner Design Thinking',
  version: '1.0.0',
  description: 'Sistema de Gestión de Tareas'
};

export { API_CONFIG, APP_CONFIG };
export default API_CONFIG;

