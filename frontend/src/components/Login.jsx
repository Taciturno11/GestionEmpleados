import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usuario.trim() || !contrasena.trim()) {
      setError('Por favor ingresa usuario y contraseña');
      return;
    }

    if (usuario.trim() !== contrasena.trim()) {
      setError('El usuario y la contraseña deben ser iguales (DNI)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Debug: Mostrar variables de entorno
      console.log('🔍 Variables de entorno:', {
        VITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
        VITE_FRONTEND_HOST: import.meta.env.VITE_FRONTEND_HOST,
        VITE_FRONTEND_PORT: import.meta.env.VITE_FRONTEND_PORT
      });

      // Limpiar localStorage antes del login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://10.8.2.56:3000'}/api/auth/login`, { 
        dni: usuario.trim(), 
        password: contrasena.trim() 
      });
      
      const { token, user } = response.data;
      
      // Guardar en localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      onLogin(user, token);
    } catch (error) {
      console.error('Error en login:', error);
      setError(error.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-pulse"></div>
      </div>
      
      <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-full shadow-lg ring-1 ring-gray-200">
            <img 
              src="/partner.svg" 
              alt="Partner Design Thinking" 
              className="h-10 w-10"
            />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Sistema de Gestión
        </h2>
        <p className="mt-2 text-center text-lg text-gray-600">
          Partner Design Thinking
        </p>
        <p className="mt-1 text-center text-sm text-gray-500">
          Inicia sesión para continuar
        </p>
      </div>

      <div className="relative mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/80 backdrop-blur-sm py-8 px-6 shadow-xl sm:rounded-xl sm:px-10 border border-white/20">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="usuario" className="block text-sm font-medium text-gray-700 mb-2">
                DNI
              </label>
              <input
                id="usuario"
                name="usuario"
                type="text"
                required
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                placeholder="Ingresa tu DNI"
              />
            </div>

            <div>
              <label htmlFor="contrasena" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                id="contrasena"
                name="contrasena"
                type="password"
                required
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
                placeholder="Ingresa tu contraseña"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Iniciando sesión...
                  </div>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default Login;
