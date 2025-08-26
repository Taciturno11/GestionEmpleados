import React, { useState, useEffect, useRef } from 'react';
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
  const [editingTarea, setEditingTarea] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [stats, setStats] = useState({});
  const [nuevaTarea, setNuevaTarea] = useState({
    titulo: '',
    responsable: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: '',
    prioridad: 'Media',
    estado: 'Pendiente',
    observaciones: ''
  });

  // Estados para el chat de observaciones
  const [chatAbierto, setChatAbierto] = useState(null);
  const [mensajes, setMensajes] = useState({});
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [cargandoMensajes, setCargandoMensajes] = useState({});
  const chatEndRef = useRef(null);

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

  // Auto-scroll del chat cuando se cargan mensajes
  useEffect(() => {
    if (chatEndRef.current && mensajes[chatAbierto]) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensajes, chatAbierto]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        cargarTareas(),
        cargarUsuarios(),
        cargarStats()
      ]);
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

  const cargarUsuarios = async () => {
    try {
      const response = await api.get('/auth/users');
      setUsuarios(response.data);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  };

  const cargarStats = async () => {
    try {
      const response = await api.get('/tareas/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
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
    setChatAbierto(null);
    setMensajes({});
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

  const actualizarTarea = async (id, datos) => {
    try {
      await api.put(`/tareas/${id}`, datos);
      cargarTareas();
      setEditingTarea(null);
    } catch (error) {
      console.error('Error actualizando tarea:', error);
    }
  };

  const eliminarTarea = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta tarea?')) return;
    
    try {
      await api.delete(`/tareas/${id}`);
      cargarTareas();
    } catch (error) {
      console.error('Error eliminando tarea:', error);
    }
  };

  // Funciones para el chat de observaciones
  const abrirChat = async (tareaId) => {
    setChatAbierto(tareaId);
    if (!mensajes[tareaId]) {
      await cargarMensajes(tareaId);
    }
    // Marcar mensajes como leídos solo si no es el Jefe Supremo
    if (!user.isSupremeBoss) {
      await marcarMensajesComoLeidos(tareaId);
    }
    
    // Auto-scroll después de cargar los mensajes
    setTimeout(() => {
      if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 300);
  };

  const cerrarChat = () => {
    setChatAbierto(null);
  };

  const cargarMensajes = async (tareaId) => {
    try {
      setCargandoMensajes(prev => ({ ...prev, [tareaId]: true }));
      const response = await api.get(`/tareas/${tareaId}/mensajes`);
      setMensajes(prev => ({ ...prev, [tareaId]: response.data }));
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    } finally {
      setCargandoMensajes(prev => ({ ...prev, [tareaId]: false }));
    }
  };

  const marcarMensajesComoLeidos = async (tareaId) => {
    try {
      const response = await api.put(`/tareas/${tareaId}/mensajes/leer`);
      console.log('✅ Mensajes marcados como leídos:', response.data);
      // Actualizar contador en las tareas
      await cargarTareas();
    } catch (error) {
      console.error('Error marcando mensajes como leídos:', error);
    }
  };

  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !chatAbierto) return;

    // Solo el Jefe Supremo puede enviar mensajes
    if (!user.isSupremeBoss) {
      alert('Solo el Jefe Supremo puede enviar observaciones');
      return;
    }

    try {
      const response = await api.post(`/tareas/${chatAbierto}/mensajes`, {
        mensaje: nuevoMensaje.trim()
      });
      
      setMensajes(prev => ({
        ...prev,
        [chatAbierto]: [...(prev[chatAbierto] || []), response.data]
      }));
      
      setNuevoMensaje('');
      // Actualizar contador en las tareas
      cargarTareas();
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (prioridad) => {
    switch (prioridad) {
      case 'Alta': return 'bg-red-100 text-red-800 border-red-200';
      case 'Media': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Baja': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'Pendiente': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'En Progreso': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Terminado': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <img 
                alt="Partner Design Thinking" 
                className="h-10 w-auto mr-4" 
                src="/partner.svg"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Partner Design Thinking</h1>
                <p className="text-gray-600 text-sm">Panel de Administración - Carlos Manuel Paucar Serra</p>
              </div>
            </div>
            <button 
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors font-medium"
              onClick={handleLogout}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8">
          <div className="flex flex-wrap gap-2">
            <button 
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'tareas' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setActiveTab('tareas')}
            >
              📋 Tareas
            </button>
            <button 
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'feedback' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => setActiveTab('feedback')}
            >
              💬 Feedback
            </button>
            <button 
              className="px-4 py-2 rounded-md font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              👥 Usuarios
            </button>
            <button 
              className="px-4 py-2 rounded-md font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              📊 Reporte de Empleados
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'tareas' && (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-3xl font-bold text-gray-900">{stats.TotalTareas || 0}</div>
                <div className="text-gray-600 text-sm font-medium">Total Tareas</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-3xl font-bold text-amber-600">{stats.Pendientes || 0}</div>
                <div className="text-gray-600 text-sm font-medium">Pendientes</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-3xl font-bold text-blue-600">{stats.EnProgreso || 0}</div>
                <div className="text-gray-600 text-sm font-medium">En Progreso</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-3xl font-bold text-green-600">{stats.Terminadas || 0}</div>
                <div className="text-gray-600 text-sm font-medium">Completadas</div>
              </div>
            </div>

            {/* Task Management */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex flex-wrap gap-2">
                  <button className="px-4 py-2 rounded-md font-medium transition-colors bg-blue-600 text-white">
                    Todas
                  </button>
                  <button className="px-4 py-2 rounded-md font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200">
                    Pendientes
                  </button>
                  <button className="px-4 py-2 rounded-md font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200">
                    En Progreso
                  </button>
                  <button className="px-4 py-2 rounded-md font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200">
                    Completadas
                  </button>
                </div>
                <button 
                  className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
                  onClick={() => setShowForm(!showForm)}
                >
                  + Nueva Tarea
                </button>
              </div>
            </div>

            {/* Form */}
            {showForm && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                <form onSubmit={crearTarea} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Título de la tarea
                      </label>
                      <input
                        type="text"
                        value={nuevaTarea.titulo}
                        onChange={(e) => setNuevaTarea({...nuevaTarea, titulo: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Responsable
                      </label>
                      {user.isSupremeBoss ? (
                        <select
                          value={nuevaTarea.responsable}
                          onChange={(e) => setNuevaTarea({...nuevaTarea, responsable: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          required
                        >
                          <option value="">Seleccionar responsable</option>
                          {usuarios.map(usuario => (
                            <option key={usuario.DNI} value={usuario.DNI}>
                              {usuario.Nombres} {usuario.ApellidoPaterno}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={user.nombre}
                          disabled
                          className="w-full px-4 py-3 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                        />
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prioridad
                      </label>
                      <select
                        value={nuevaTarea.prioridad}
                        onChange={(e) => setNuevaTarea({...nuevaTarea, prioridad: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="Alta">Alta</option>
                        <option value="Media">Media</option>
                        <option value="Baja">Baja</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de inicio
                      </label>
                      <input
                        type="date"
                        value={nuevaTarea.fechaInicio}
                        onChange={(e) => setNuevaTarea({...nuevaTarea, fechaInicio: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de fin
                      </label>
                      <input
                        type="date"
                        value={nuevaTarea.fechaFin}
                        onChange={(e) => setNuevaTarea({...nuevaTarea, fechaFin: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado
                      </label>
                      <select
                        value={nuevaTarea.estado}
                        onChange={(e) => setNuevaTarea({...nuevaTarea, estado: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="En Progreso">En Progreso</option>
                        <option value="Terminado">Terminado</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200 font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium"
                    >
                      Crear Tarea
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tasks Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Historial de Tareas</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Título de la Tarea
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha Inicio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha Fin
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prioridad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Responsable
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Observaciones
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-4 text-center">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <p className="mt-2 text-gray-600">Cargando tareas...</p>
                        </td>
                      </tr>
                    ) : tareas.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-4 text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay tareas</h3>
                          <p className="mt-1 text-sm text-gray-500">Comienza creando una nueva tarea.</p>
                        </td>
                      </tr>
                    ) : (
                      tareas.map((tarea) => (
                        <tr key={tarea.Id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{tarea.Titulo}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(tarea.FechaInicio)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(tarea.FechaFin)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(tarea.Prioridad)}`}>
                              {tarea.Prioridad}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {tarea.NombreResponsable || tarea.Responsable}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(tarea.Estado)}`}>
                              {tarea.Estado}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="relative">
                              <button
                                onClick={() => abrirChat(tarea.Id)}
                                className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
                                title="Ver observaciones"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                {tarea.MensajesNoLeidos > 0 && (
                                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold min-w-[24px]">
                                    {tarea.MensajesNoLeidos}
                                  </span>
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium pl-0 pr-2">
                            <div className="flex space-x-1 justify-start">
                              <button 
                                className="text-blue-600 hover:text-blue-900 px-1 py-1"
                                onClick={() => setEditingTarea(tarea.Id)}
                              >
                                ✏️ Editar
                              </button>
                              {user.isSupremeBoss && (
                                <button 
                                  className="text-red-600 hover:text-red-900 px-1 py-1"
                                  onClick={() => eliminarTarea(tarea.Id)}
                                >
                                  🗑️ Eliminar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Chat Popover */}
            {chatAbierto && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Observaciones</h3>
                    <button
                      onClick={cerrarChat}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
                    {cargandoMensajes[chatAbierto] ? (
                      <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">Cargando mensajes...</p>
                      </div>
                    ) : mensajes[chatAbierto]?.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p>No hay mensajes aún</p>
                        <p className="text-sm">Sé el primero en comentar</p>
                      </div>
                    ) : (
                      mensajes[chatAbierto]?.map((mensaje) => (
                        <div
                          key={mensaje.Id}
                          className={`flex ${mensaje.Emisor === user.dni ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              mensaje.Emisor === user.dni
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <div className="text-xs opacity-75 mb-1">
                              {mensaje.NombreEmisor || mensaje.Emisor}
                            </div>
                            <div className="text-sm">{mensaje.Mensaje}</div>
                            <div className="text-xs opacity-75 mt-1">
                              {formatDateTime(mensaje.FechaCreacion)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  
                  <form onSubmit={enviarMensaje} className="p-4 border-t border-gray-200">
                    {!user.isSupremeBoss && (
                      <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-700">
                          💡 Solo el Jefe Supremo puede enviar observaciones. Los empleados pueden ver las observaciones pero no pueden enviar mensajes.
                        </p>
                      </div>
                    )}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={nuevoMensaje}
                        onChange={(e) => setNuevoMensaje(e.target.value)}
                        placeholder={user.isSupremeBoss ? "Escribe tu observación..." : "Solo el Jefe Supremo puede enviar observaciones"}
                        className={`flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!user.isSupremeBoss ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        disabled={!user.isSupremeBoss}
                      />
                      <button
                        type="submit"
                        disabled={!nuevoMensaje.trim() || !user.isSupremeBoss}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        Enviar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'feedback' && <Feedback />}
      </div>
    </div>
  );
}

export default App;
