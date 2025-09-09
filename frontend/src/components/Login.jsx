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
      // 🔥 LIMPIAR LOCALSTORAGE ANTES DEL LOGIN
      console.log('🧹 FRONTEND - Limpiando localStorage antes del login');
      console.log('🧹 FRONTEND - Token anterior:', localStorage.getItem('token') ? localStorage.getItem('token').substring(0, 20) + '...' : 'null');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log('🧹 FRONTEND - localStorage limpiado, token actual:', localStorage.getItem('token') || 'null');
      
      const response = await axios.post('/api/auth/login', { dni: usuario.trim() });
      
      const { token, user } = response.data;
      
      console.log('✅ FRONTEND - Login exitoso:', {
        usuario: user.dni,
        nombre: user.nombre,
        isSupremeBoss: user.isSupremeBoss
      });
      
      // Guardar en localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      console.log('💾 FRONTEND - Token guardado en localStorage:', {
        token: token.substring(0, 20) + '...',
        usuario: user.dni
      });
      
      onLogin(user, token);
    } catch (error) {
      console.error('Error en login:', error);
      setError(error.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img 
            alt="Partner Design Thinking" 
            className="h-12 w-auto" 
            src="/partner.svg"
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sistema de Gestión de Tareas
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Partner Design Thinking
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="usuario" className="block text-sm font-medium text-gray-700">
                Usuario (DNI)
              </label>
              <div className="mt-1">
                <input
                  id="usuario"
                  name="usuario"
                  type="text"
                  required
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Ingresa tu DNI"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contrasena" className="block text-sm font-medium text-gray-700">
                Contraseña (DNI)
              </label>
              <div className="mt-1">
                <input
                  id="contrasena"
                  name="contrasena"
                  type="password"
                  required
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Ingresa tu DNI"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Usuarios de prueba</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-600">
                  <strong>Jefe Supremo:</strong>
                </p>
                <p className="text-xs text-gray-500">Usuario: 44991089</p>
                <p className="text-xs text-gray-500">Contraseña: 44991089</p>
                <p className="text-xs text-gray-500">Carlos Paucar Serra</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-600">
                  <strong>Trabajador:</strong>
                </p>
                <p className="text-xs text-gray-500">Usuario: 73766815</p>
                <p className="text-xs text-gray-500">Contraseña: 73766815</p>
                <p className="text-xs text-gray-500">Martin Nauca Gamboa</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
