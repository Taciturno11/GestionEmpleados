import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './components/Login';
import Feedback from './components/Feedback';

// Configurar axios para usar rutas relativas
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tareas');
  const [showForm, setShowForm] = useState(false);
  const [nuevaTarea, setNuevaTarea] = useState({
    titulo: '',
    responsable: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: '',
    prioridad: 'Media',
    estado: 'Pendiente',
    observaciones: ''
  });

  // Configurar interceptores de axios
  useEffect(() => {
    api.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          handleLogout();
        }
        return Promise.reject(error);
      }
    );
  }, [token]);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const loadData = async () => {
    try {
      setLoading(true);
      await cargarTareas();
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarTareas = async () => {
    try {
      const response = await api.get('/tareas');
      setTareas(response.data);
    } catch (error) {
      console.error('Error cargando tareas:', error);
    }
  };

  const handleLogin = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setTareas([]);
  };

  const crearTarea = async (e) => {
    e.preventDefault();
    try {
      const tareaData = user.isSupremeBoss ? nuevaTarea : {
        ...nuevaTarea,
        responsable: user.dni
      };
      
      await api.post('/tareas', tareaData);
      setNuevaTarea({
        titulo: '',
        responsable: user?.dni || '',
        fechaInicio: new Date().toISOString().split('T')[0],
        fechaFin: '',
        prioridad: 'Media',
        estado: 'Pendiente',
        observaciones: ''
      });
      setShowForm(false);
      cargarTareas();
    } catch (error) {
      console.error('Error creando tarea:', error);
    }
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img src="/partner.svg" alt="Logo" className="h-8 w-auto mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Sistema de Gestión</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Bienvenido, {user.nombre}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('tareas')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'tareas'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Tareas ({tareas.length})
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'feedback'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Feedback
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'tareas' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Gestión de Tareas</h2>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {showForm ? 'Cancelar' : 'Nueva Tarea'}
                </button>
              </div>
            </div>

            {/* Form */}
            {showForm && (
              <div className="px-6 py-4 border-b border-gray-200">
                <form onSubmit={crearTarea} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Título de la tarea
                      </label>
                      <input
                        type="text"
                        value={nuevaTarea.titulo}
                        onChange={(e) => setNuevaTarea({...nuevaTarea, titulo: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Responsable
                      </label>
                      <input
                        type="text"
                        value={nuevaTarea.responsable}
                        onChange={(e) => setNuevaTarea({...nuevaTarea, responsable: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de inicio
                      </label>
                      <input
                        type="date"
                        value={nuevaTarea.fechaInicio}
                        onChange={(e) => setNuevaTarea({...nuevaTarea, fechaInicio: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de fin
                      </label>
                      <input
                        type="date"
                        value={nuevaTarea.fechaFin}
                        onChange={(e) => setNuevaTarea({...nuevaTarea, fechaFin: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prioridad
                      </label>
                      <select
                        value={nuevaTarea.prioridad}
                        onChange={(e) => setNuevaTarea({...nuevaTarea, prioridad: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Alta">Alta</option>
                        <option value="Media">Media</option>
                        <option value="Baja">Baja</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Crear Tarea
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tasks List */}
            <div className="p-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Cargando tareas...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tareas.map((tarea) => (
                    <div key={tarea.Id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{tarea.Titulo}</h3>
                          <p className="text-sm text-gray-600">
                            Responsable: {tarea.NombreResponsable || tarea.Responsable} | Fecha fin: {new Date(tarea.FechaFin).toLocaleDateString()}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              tarea.Prioridad === 'Alta' ? 'bg-red-100 text-red-800' :
                              tarea.Prioridad === 'Media' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {tarea.Prioridad}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              tarea.Estado === 'Pendiente' ? 'bg-amber-100 text-amber-800' :
                              tarea.Estado === 'En Progreso' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {tarea.Estado}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'feedback' && <Feedback />}
      </main>
    </div>
  );
}

export default App;
