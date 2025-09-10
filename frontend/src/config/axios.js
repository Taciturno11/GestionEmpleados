import axios from 'axios';
import { API_CONFIG } from './api';

// Crear instancia de Axios con configuración centralizada
const api = axios.create(API_CONFIG);

// Interceptor para manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Error en API:', error);
    return Promise.reject(error);
  }
);

export default api;

