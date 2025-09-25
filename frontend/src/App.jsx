import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Login from './components/Login';
import EmployeeCards from './components/EmployeeCards';
import Sidebar from './components/Sidebar';
import Calendar from './components/Calendar';
import FeedbackSemanal from './components/FeedbackSemanal';
import FeedbackEquipo from './components/FeedbackEquipo';

// Configurar axios para usar variables de entorno
const api = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL || 'http://10.8.2.56:3000'}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [tareas, setTareas] = useState([]);
  const [tareasPropias, setTareasPropias] = useState([]);
  const [tareasEquipo, setTareasEquipo] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tareas');
  const [showForm, setShowForm] = useState(false);
  const [editingTarea, setEditingTarea] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [stats, setStats] = useState({});
  const [subordinados, setSubordinados] = useState([]);
  const [nivelUsuario, setNivelUsuario] = useState(0);
  const [empleadosConTareas, setEmpleadosConTareas] = useState([]);
  const [puedeVerDashboard, setPuedeVerDashboard] = useState(false);
  const [vistaTareasActiva, setVistaTareasActiva] = useState('propias'); // 'propias' o 'equipo'
  const [nuevaTarea, setNuevaTarea] = useState({
    titulo: '',
    responsable: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: '',
    prioridad: 'Media',
    estado: 'Pendiente',
    observaciones: '',
    progreso: 0
  });

  // Estados para el chat de observaciones
  const [chatAbierto, setChatAbierto] = useState(null);
  const [mensajes, setMensajes] = useState({});
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [cargandoMensajes, setCargandoMensajes] = useState({});
  const [empleados, setEmpleados] = useState([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [vistaActiva, setVistaActiva] = useState('dashboard');
  const chatEndRef = useRef(null);

  // Inicializar usuario desde localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setToken(savedToken);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Configurar interceptores de axios
  useEffect(() => {
    // Limpiar interceptores anteriores
    api.interceptors.request.clear();
    
    api.interceptors.request.use(
      (config) => {
        // Obtener el token actual del localStorage en cada request
        const currentToken = localStorage.getItem('token');
        if (currentToken) {
          config.headers.Authorization = `Bearer ${currentToken}`;
          console.log('🔍 FRONTEND - Enviando token:', {
            url: config.url,
            token: currentToken.substring(0, 20) + '...',
            usuario: user?.dni,
            tokenFromState: token ? token.substring(0, 20) + '...' : 'null'
          });
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
      const promises = [
        cargarTareas(),
        cargarUsuarios(),
        cargarStats()
      ];
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarTareas = async () => {
    try {
      let url = '/tareas';
      // Si hay un empleado seleccionado, agregar filtro
      if (empleadoSeleccionado) {
        url += `?empleado=${empleadoSeleccionado}`;
      }
      const response = await api.get(url);
      
      // Manejar nueva estructura de respuesta
      if (response.data.tareasPropias !== undefined) {
        setTareasPropias(response.data.tareasPropias || []);
        setTareasEquipo(response.data.tareasEquipo || []);
        const todasLasTareas = [...response.data.tareasPropias, ...response.data.tareasEquipo];
        setTareas(todasLasTareas); // Para compatibilidad
        
        console.log('🔍 FRONTEND - Tareas cargadas:', {
          tareasPropias: response.data.tareasPropias?.length || 0,
          tareasEquipo: response.data.tareasEquipo?.length || 0,
          totalTareas: todasLasTareas.length,
          vistaTareasActiva,
          tareasPropiasDetalle: response.data.tareasPropias?.map(t => ({ id: t.Id, titulo: t.Titulo, responsable: t.Responsable })) || [],
          tareasEquipoDetalle: response.data.tareasEquipo?.map(t => ({ id: t.Id, titulo: t.Titulo, responsable: t.Responsable })) || []
        });
        setSubordinados(response.data.subordinados || []);
        setNivelUsuario(response.data.nivelUsuario || 0);
        
        // Determinar si puede ver dashboard (tiene subordinados o es jefe supremo)
        const puedeVer = user?.isSupremeBoss || 
          (response.data.subordinados && response.data.subordinados.length > 0);
        setPuedeVerDashboard(puedeVer);
        
        // Cargar empleados si puede ver dashboard
        if (puedeVer) {
          cargarEmpleados();
        }
      } else if (response.data.tareas) {
        // Estructura anterior
        setTareas(response.data.tareas);
        setTareasPropias(response.data.tareas.filter(t => t.Responsable === user?.dni));
        setTareasEquipo(response.data.tareas.filter(t => t.Responsable !== user?.dni));
        setSubordinados(response.data.subordinados || []);
        setNivelUsuario(response.data.nivelUsuario || 0);
        
        const puedeVer = user?.isSupremeBoss || 
          (response.data.subordinados && response.data.subordinados.length > 0);
        setPuedeVerDashboard(puedeVer);
        
        // Cargar empleados si puede ver dashboard
        if (puedeVer) {
          cargarEmpleados();
        }
      } else {
        // Compatibilidad con estructura anterior
        setTareas(response.data);
        setTareasPropias(response.data.filter(t => t.Responsable === user?.dni));
        setTareasEquipo(response.data.filter(t => t.Responsable !== user?.dni));
      }
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

  const cargarEmpleados = async () => {
    try {
      console.log('🔍 FRONTEND - Cargando empleados con tareas...');
      const response = await api.get('/tareas/empleados-con-tareas');
      console.log('🔍 FRONTEND - Empleados recibidos:', response.data.length, 'empleados');
      console.log('🔍 FRONTEND - Empleados:', response.data.map(e => ({ DNI: e.DNI, Nombre: e.NombreCompleto, Tareas: e.TotalTareas })));
      setEmpleados(response.data);
      setEmpleadosConTareas(response.data);
    } catch (error) {
      console.error('❌ FRONTEND - Error cargando empleados:', error);
    }
  };

  const seleccionarEmpleado = (dni) => {
    setEmpleadoSeleccionado(dni);
    setActiveTab('tareas');
    // Filtrar tareas por empleado seleccionado
    cargarTareas();
  };

  const handleLogin = (userData, userToken) => {
    console.log('🔍 FRONTEND - handleLogin llamado:', {
      nuevoUsuario: userData.dni,
      nuevoNombre: userData.nombre,
      nuevoToken: userToken.substring(0, 20) + '...',
      tokenAnterior: token ? token.substring(0, 20) + '...' : 'null'
    });
    
    // Limpiar estado anterior antes de establecer nuevo usuario
    setTareas([]);
    setChatAbierto(null);
    setMensajes({});
    setNuevoMensaje('');
    setActiveTab('tareas');
    setShowForm(false);
    setEditingTarea(null);
    setEditingField(null);
    setStats({});
    
    // Establecer nuevo usuario
    setUser(userData);
    setToken(userToken);
  };

  const handleLogout = () => {
    console.log('🧹 FRONTEND - Cerrando sesión, limpiando todo el estado');
    
    // Limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Limpiar estado de React
    setUser(null);
    setToken(null);
    setTareas([]);
    setChatAbierto(null);
    setMensajes({});
    setNuevoMensaje('');
    setActiveTab('tareas');
    setShowForm(false);
    setEditingTarea(null);
    setEditingField(null);
    setStats({});
  };

  const crearTarea = async (e) => {
    e.preventDefault();
    try {
      const tareaData = nuevaTarea;
      
      console.log('🔍 FRONTEND - Creando tarea:', {
        tareaData,
        usuario: user.dni,
        isSupremeBoss: user.isSupremeBoss
      });
      
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
      await Promise.all([
        cargarTareas(),
        cargarStats()
      ]);
    } catch (error) {
      console.error('Error creando tarea:', error);
    }
  };

  const iniciarEdicionInline = (tareaId, field) => {
    setEditingTarea(tareaId);
    setEditingField(field);
  };

  const cancelarEdicionInline = () => {
    setEditingTarea(null);
    setEditingField(null);
  };

  const activarModoEdicion = (tareaId) => {
    setEditingTarea(tareaId);
    setEditingField('modoEdicion');
  };

  const actualizarCampo = async (tareaId, field, newValue) => {
    try {
      const tareaActual = tareas.find(t => t.Id === tareaId);
      if (!tareaActual) return;

      const datosActualizacion = {
        titulo: tareaActual.Titulo,
        responsable: tareaActual.Responsable,
        fechaInicio: tareaActual.FechaInicio ? tareaActual.FechaInicio.split('T')[0] : '',
        fechaFin: tareaActual.FechaFin ? tareaActual.FechaFin.split('T')[0] : '',
        prioridad: tareaActual.Prioridad,
        estado: tareaActual.Estado,
        observaciones: tareaActual.Observaciones || ''
      };

      datosActualizacion[field] = newValue;

      if (!user.isSupremeBoss) {
        datosActualizacion.responsable = tareaActual.Responsable;
        datosActualizacion.observaciones = '';
      }

      await api.put(`/tareas/${tareaId}`, datosActualizacion);
      await Promise.all([
        cargarTareas(),
        cargarStats()
      ]);
      cancelarEdicionInline();
    } catch (error) {
      console.error('Error actualizando campo:', error);
      cancelarEdicionInline();
    }
  };

  // Debounce para actualizar progreso - solo envía al servidor cuando el usuario termine de mover
  const [progresoTimeouts, setProgresoTimeouts] = useState({});

  // Cleanup de timeouts cuando el componente se desmonte
  useEffect(() => {
    return () => {
      // Limpiar todos los timeouts pendientes
      Object.values(progresoTimeouts).forEach(timeoutId => {
        if (timeoutId) clearTimeout(timeoutId);
      });
    };
  }, [progresoTimeouts]);

  const actualizarProgreso = async (tareaId, progreso) => {
    const progresoNum = parseInt(progreso);
    
    // Actualizar inmediatamente en el estado local para una experiencia fluida
    setTareas(tareas.map(tarea => 
      tarea.Id === tareaId 
        ? { ...tarea, Progreso: progresoNum }
        : tarea
    ));

    // También actualizar en tareasPropias y tareasEquipo si existen
    setTareasPropias(prev => prev.map(tarea => 
      tarea.Id === tareaId 
        ? { ...tarea, Progreso: progresoNum }
        : tarea
    ));
    setTareasEquipo(prev => prev.map(tarea => 
      tarea.Id === tareaId 
        ? { ...tarea, Progreso: progresoNum }
        : tarea
    ));
    
    // Cancelar timeout anterior si existe
    if (progresoTimeouts[tareaId]) {
      clearTimeout(progresoTimeouts[tareaId]);
    }
    
    // Crear nuevo timeout para enviar al servidor después de 500ms de inactividad
    const timeoutId = setTimeout(async () => {
      try {
        const response = await api.put(`/tareas/${tareaId}/progreso`, {
          progreso: progresoNum
        });
        
        if (response.status === 200) {
          console.log('✅ Progreso actualizado en servidor:', response.data);
        }
      } catch (error) {
        console.error('❌ Error actualizando progreso:', error);
        // Revertir el cambio local si hay error
        setTareas(tareas.map(tarea => 
          tarea.Id === tareaId 
            ? { ...tarea, Progreso: tarea.Progreso || 0 }
            : tarea
        ));
        setTareasPropias(prev => prev.map(tarea => 
          tarea.Id === tareaId 
            ? { ...tarea, Progreso: tarea.Progreso || 0 }
            : tarea
        ));
        setTareasEquipo(prev => prev.map(tarea => 
          tarea.Id === tareaId 
            ? { ...tarea, Progreso: tarea.Progreso || 0 }
            : tarea
        ));
      }
      
      // Limpiar el timeout del estado
      setProgresoTimeouts(prev => {
        const newTimeouts = { ...prev };
        delete newTimeouts[tareaId];
        return newTimeouts;
      });
    }, 500);
    
    // Guardar el timeout en el estado
    setProgresoTimeouts(prev => ({
      ...prev,
      [tareaId]: timeoutId
    }));
  };

  const eliminarTarea = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta tarea?')) return;
    
    try {
      await api.delete(`/tareas/${id}`);
      await Promise.all([
        cargarTareas(),
        cargarStats()
      ]);
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
    
    // Marcar mensajes como leídos para ambos tipos de usuario
      await marcarMensajesComoLeidos(tareaId);
    
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
      console.log('📖 FRONTEND - Marcando mensajes como leídos para tarea:', tareaId);
      const response = await api.put(`/tareas/${tareaId}/mensajes/leer`);
      console.log('✅ FRONTEND - Mensajes marcados como leídos:', response.data);
      await cargarTareas();
    } catch (error) {
      console.error('❌ FRONTEND - Error marcando mensajes como leídos:', error);
    }
  };

  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !chatAbierto) return;

    console.log('🔍 FRONTEND - Enviando mensaje:', {
      usuario: user?.dni,
      nombre: user?.nombre,
      isSupremeBoss: user?.isSupremeBoss,
      mensaje: nuevoMensaje.trim(),
      tareaId: chatAbierto
    });

    try {
      const response = await api.post(`/tareas/${chatAbierto}/mensajes`, {
        mensaje: nuevoMensaje.trim()
      });
      
      console.log('✅ FRONTEND - Mensaje enviado exitosamente:', response.data);
      
      setMensajes(prev => ({
        ...prev,
        [chatAbierto]: [...(prev[chatAbierto] || []), response.data]
      }));
      
      setNuevoMensaje('');
      cargarTareas();
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // Si la fecha viene como "YYYY-MM-DD", agregamos "T00:00:00" para evitar problemas de zona horaria
    let dateToFormat = dateString;
    if (dateString && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      dateToFormat = dateString + 'T00:00:00';
    }
    
    const date = new Date(dateToFormat);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC' // Forzamos UTC para evitar problemas de zona horaria
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC' // Forzamos UTC para evitar problemas de zona horaria
    });
  };

  // Función helper para renderizar filas de tareas
  const renderTareaRow = (tarea, showResponsable = false) => {
    console.log('🔍 FRONTEND - Renderizando fila de tarea:', { id: tarea.Id, titulo: tarea.Titulo, responsable: tarea.Responsable, showResponsable });
    return (
    <tr key={tarea.Id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 group transition-all duration-200 border-l-4 border-transparent hover:border-blue-400">
      <td className="px-4 py-3 w-48">
        <div>
          <div className="text-sm font-semibold text-slate-800 truncate">{tarea.Titulo}</div>
          <div className="text-xs text-slate-500 truncate">{tarea.Descripcion}</div>
        </div>
      </td>
      {showResponsable && (
        <td className="px-3 py-3 w-32">
          <div className="text-sm text-slate-700 truncate font-medium">{tarea.NombreResponsable}</div>
        </td>
      )}
      <td className="px-3 py-3 w-24">
        <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
          tarea.Estado === 'Completada' ? 'bg-green-100 text-green-800 border border-green-200' :
          tarea.Estado === 'En Progreso' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
          'bg-amber-100 text-amber-800 border border-amber-200'
        }`}>
          {tarea.Estado}
        </span>
      </td>
      <td className="px-3 py-3 w-20">
        <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${
          tarea.Prioridad === 'Alta' ? 'bg-red-100 text-red-800 border border-red-200' :
          tarea.Prioridad === 'Media' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
          'bg-green-100 text-green-800 border border-green-200'
        }`}>
          {tarea.Prioridad}
        </span>
      </td>
      <td className="px-4 py-3 w-32">
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="0"
            max="100"
            value={tarea.Progreso || 0}
            onChange={(e) => actualizarProgreso(tarea.Id, e.target.value)}
            className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, ${
                (tarea.Progreso || 0) >= 80 ? '#10b981' :
                (tarea.Progreso || 0) >= 50 ? '#3b82f6' :
                (tarea.Progreso || 0) >= 25 ? '#f59e0b' :
                '#ef4444'
              } 0%, ${
                (tarea.Progreso || 0) >= 80 ? '#10b981' :
                (tarea.Progreso || 0) >= 50 ? '#3b82f6' :
                (tarea.Progreso || 0) >= 25 ? '#f59e0b' :
                '#ef4444'
              } ${tarea.Progreso || 0}%, #e5e7eb ${tarea.Progreso || 0}%, #e5e7eb 100%)`
            }}
          />
          <span className="text-xs font-medium text-gray-700 min-w-[2.5rem] text-center">
            {tarea.Progreso || 0}%
          </span>
        </div>
      </td>
      <td className="px-3 py-3 w-28">
        <div className="text-xs text-slate-600 space-y-1">
          <div className="truncate font-medium">📅 {formatDate(tarea.FechaInicio)}</div>
          <div className="truncate">⏰ {formatDate(tarea.FechaFin)}</div>
        </div>
      </td>
      <td className="px-3 py-3 w-20">
        <div className="flex space-x-1">
          <button
            onClick={() => eliminarTarea(tarea.Id)}
            className="text-red-600 hover:text-red-800 text-xs font-medium"
          >
            🗑️
          </button>
        </div>
      </td>
    </tr>
    );
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
      {/* Sidebar - Para jefes con subordinados */}
      {puedeVerDashboard && <Sidebar vistaActiva={vistaActiva} setVistaActiva={setVistaActiva} user={user} />}

      {/* Header */}
      <div className={`bg-white shadow-sm border-b border-gray-200 ${puedeVerDashboard ? 'ml-64' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620.79 618.96" className="h-10 w-auto mr-4">
                <defs>
                  <style>{`.cls-1{fill:#fe7f2d;}.cls-2{fill:#297373;}`}</style>
                </defs>
                <g id="Capa_2" data-name="Capa 2">
                  <g id="Capa_1-2" data-name="Capa 1">
                    <path className="cls-1" d="M620.79,309.48A313,313,0,0,1,619,343.21q-1,9-2.45,17.85a308,308,0,0,1-37,103.16q-5.71,9.91-12.14,19.37a312.58,312.58,0,0,1-84.22,83.79q-9.24,6.2-18.94,11.75a308.4,308.4,0,0,1-103.16,36.62q-13.15,2.18-26.68,3.21h-48q-14.44-1.1-28.49-3.52a307.67,307.67,0,0,1-103.15-37.35Q146,573,137.62,567.38a311.79,311.79,0,0,1-86-86.5q-5.41-8.14-10.32-16.66a310,310,0,0,1-23.71-51.58h.37A225.7,225.7,0,0,0,46,464.22c1.8,2.49,3.67,4.94,5.58,7.36A228.12,228.12,0,0,0,98,515.8q2.53,1.83,5.13,3.55a225.73,225.73,0,0,0,103.16,37.33,228.21,228.21,0,0,0,51.58-.55A225.55,225.55,0,0,0,361.07,516l.27-.2a228.05,228.05,0,0,0,51.31-50.59c.25-.33.48-.67.72-1a225.83,225.83,0,0,0,41.25-103.16,228.3,228.3,0,0,0,2-30.11c0-7.24-.34-14.41-1-21.47a225.29,225.29,0,0,0-36.25-103.16q-3.23-4.89-6.7-9.62a227.79,227.79,0,0,0-40-42q-5.64-4.59-11.59-8.83-8.58-6.1-17.75-11.42a171.46,171.46,0,0,1,69.33-29.68q5.36-1,10.83-1.65a174.32,174.32,0,0,1,40.75,0v0h.43a170.74,170.74,0,0,1,51.15,14.39A172.62,172.62,0,0,1,567.39,154c.25.26.5.51.74.77a171.87,171.87,0,0,1,34.23,51.58A169.38,169.38,0,0,1,609.69,227l.42,1.52.69,2.59.54,2.17q3.09,12.15,5.18,24.67,1.49,8.84,2.45,17.84A313.31,313.31,0,0,1,620.79,309.48Z"/>
                    <path className="cls-2" d="M603.24,206.32h-.88a171.87,171.87,0,0,0-34.23-51.58c-.24-.26-.49-.51-.74-.77a172.62,172.62,0,0,0-51.58-36.42,170.74,170.74,0,0,0-51.15-14.39l-.43,0a174.32,174.32,0,0,0-40.75,0q-5.48.65-10.83,1.65a171.46,171.46,0,0,0-69.33,29.68A172.8,172.8,0,0,0,320,154.74q-5.55,5.74-10.54,12a171.43,171.43,0,0,0-36.8,91.16q-.75,8-.75,16.18a172.67,172.67,0,0,0,3.64,35.4H275c.63,1.81,1.23,3.65,1.78,5.49a.07.07,0,0,1,0,.06c.64,2.61,1.33,5.19,2.09,7.75a138.37,138.37,0,0,1,3.79,32.27q0,3-.13,6a137.43,137.43,0,0,1-24.67,73.05,139.48,139.48,0,0,1-28.55,30.11A137.86,137.86,0,0,1,154.75,493c-3.43.26-6.9.39-10.38.39a137.72,137.72,0,0,1-85-29.17q-4-3.15-7.81-6.57a138.77,138.77,0,0,1-33-45,141.43,141.43,0,0,1-5.78-14.83l-.24-.76-.15-.54q-1.47-5-2.75-10a1.6,1.6,0,0,1-.05-.21c-.25-1-.5-2-.74-3-.11-.43-.21-.87-.31-1.29q-2.37-10.32-3.78-21H4.27a313.67,313.67,0,0,1,0-103.16,308,308,0,0,1,37-103.16q4.91-8.52,10.32-16.66a312.13,312.13,0,0,1,86-86.5q8.37-5.64,17.13-10.71A307.67,307.67,0,0,1,257.9,3.52q14-2.41,28.49-3.52h48q13.51,1,26.68,3.21A308.4,308.4,0,0,1,464.23,39.83q9.69,5.54,18.94,11.75a312.19,312.19,0,0,1,84.22,83.79q6.4,9.44,12.14,19.37A309.22,309.22,0,0,1,603.24,206.32Z"/>
                  </g>
                </g>
              </svg>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Partner Design Thinking</h1>
                <p className="text-gray-600 text-sm">
                  Panel de Administración - {user?.nombre || 'Usuario'}
                  {user?.isSupremeBoss && <span className="ml-2 text-blue-600 font-semibold">👑 Jefe Supremo</span>}
                  {!user?.isSupremeBoss && puedeVerDashboard && <span className="ml-2 text-green-600 font-semibold">👥 Jefe de Equipo</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              {/* KPI en el header */}
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{stats.TotalTareas || 0}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-600">{stats.Pendientes || 0}</div>
                  <div className="text-xs text-gray-500">Pendientes</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{stats.EnProgreso || 0}</div>
                  <div className="text-xs text-gray-500">En Progreso</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{stats.Terminadas || 0}</div>
                  <div className="text-xs text-gray-500">Completadas</div>
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
      </div>

      {/* Main Content */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${puedeVerDashboard ? 'ml-64' : ''}`}>

        {/* Content */}
        <div>
          {/* Vista Dashboard - Para jefes con subordinados */}
          {puedeVerDashboard && vistaActiva === 'dashboard' && (
            <>
              {/* Employee Cards */}
              <EmployeeCards 
                empleados={empleadosConTareas}
                onSelectEmpleado={seleccionarEmpleado}
                empleadoSeleccionado={empleadoSeleccionado}
                tareas={tareas}
              />

              {/* Filtro de empleado seleccionado */}
              {empleadoSeleccionado && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-blue-600 font-medium">
                      📋 Mostrando tareas de: {empleadosConTareas.find(e => e.DNI === empleadoSeleccionado)?.NombreCompleto}
                    </span>
                  </div>
            <button 
                    onClick={() => {
                      setEmpleadoSeleccionado(null);
                      cargarTareas();
                    }}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    ✕ Ver todas las tareas
            </button>
                </div>
              </div>
              )}

              {/* Tasks Table - Pizarra Moderna */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-white">📋 Gestión de Tareas</h3>
                      </div>
                      
                      {/* Toggle para cambiar entre vistas */}
                      {!user.isSupremeBoss && (
                        <div className="flex bg-slate-600 rounded-lg p-1">
                          <button
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              vistaTareasActiva === 'propias'
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-200 hover:text-white'
                            }`}
                            onClick={() => setVistaTareasActiva('propias')}
                          >
                            📋 Mis Tareas
                          </button>
                          <button
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              vistaTareasActiva === 'equipo'
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-200 hover:text-white'
                            }`}
                            onClick={() => setVistaTareasActiva('equipo')}
                          >
                            👥 Equipo
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <button 
                      className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      onClick={() => {
                        setShowForm(!showForm);
                        if (!showForm && user) {
                          setNuevaTarea(prev => ({
                            ...prev,
                            responsable: user.dni
                          }));
                        }
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Nueva Tarea</span>
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  {/* Vista única que cambia según el toggle */}
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="px-6 py-4 bg-gradient-to-r border-b border-gray-200" style={{
                      background: user.isSupremeBoss 
                        ? 'linear-gradient(to right, #f0f9ff, #e0f2fe)' 
                        : vistaTareasActiva === 'propias' 
                          ? 'linear-gradient(to right, #eff6ff, #dbeafe)' 
                          : 'linear-gradient(to right, #f0fdf4, #dcfce7)'
                    }}>
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          user.isSupremeBoss 
                            ? 'bg-blue-500' 
                            : vistaTareasActiva === 'propias' 
                              ? 'bg-blue-500' 
                              : 'bg-green-500'
                        }`}>
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {user.isSupremeBoss ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            ) : vistaTareasActiva === 'propias' ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            )}
                          </svg>
                        </div>
                        <h4 className={`text-lg font-bold ${
                          user.isSupremeBoss 
                            ? 'text-blue-800' 
                            : vistaTareasActiva === 'propias' 
                              ? 'text-blue-800' 
                              : 'text-green-800'
                        }`}>
                          {user.isSupremeBoss 
                            ? '🏢 Todas las Tareas' 
                            : vistaTareasActiva === 'propias' 
                              ? '📋 Mis Tareas' 
                              : '👥 Tareas del Equipo'
                          }
                        </h4>
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                          user.isSupremeBoss 
                            ? 'bg-blue-100 text-blue-800' 
                            : vistaTareasActiva === 'propias' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                        }`}>
                          {user.isSupremeBoss 
                            ? `${tareasEquipo.length} tareas` 
                            : vistaTareasActiva === 'propias' 
                              ? `${tareasPropias.length} tareas` 
                              : `${tareasEquipo.length} tareas`
                          }
                        </span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-48">
                              📝 Tarea
                            </th>
                            {(!user.isSupremeBoss && vistaTareasActiva === 'equipo') || user.isSupremeBoss ? (
                              <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32">
                                👤 Responsable
                              </th>
                            ) : null}
                            <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-24">
                              📊 Estado
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-20">
                              ⚡ Prioridad
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-32">
                              📈 Progreso
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-28">
                              📅 Fechas
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-20">
                              ⚙️ Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(() => {
                            console.log('🔍 FRONTEND - Iniciando renderizado de tabla');
                            
                            const tareasAMostrar = user.isSupremeBoss 
                              ? tareasEquipo 
                              : vistaTareasActiva === 'propias' 
                                ? tareasPropias 
                                : tareasEquipo;
                            
                            const mostrarResponsable = user.isSupremeBoss || vistaTareasActiva === 'equipo';
                            
                            console.log('🔍 FRONTEND - Renderizando tareas:', {
                              vistaTareasActiva,
                              userIsSupremeBoss: user.isSupremeBoss,
                              tareasAMostrar: tareasAMostrar.length,
                              tareasAMostrarDetalle: tareasAMostrar.map(t => ({ id: t.Id, titulo: t.Titulo, responsable: t.Responsable })),
                              mostrarResponsable
                            });
                            
                            if (tareasAMostrar.length > 0) {
                              console.log('🔍 FRONTEND - Mapeando tareas para renderizar:', tareasAMostrar.length);
                              return tareasAMostrar.map((tarea) => renderTareaRow(tarea, mostrarResponsable));
                            } else {
                              const colSpan = mostrarResponsable ? 7 : 6;
                              return (
                                <tr>
                                  <td colSpan={colSpan} className="px-4 py-8 text-center text-gray-500">
                                    <div className="flex flex-col items-center">
                                      <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                      </svg>
                                      <p>
                                        {user.isSupremeBoss 
                                          ? 'No hay tareas en el sistema' 
                                          : vistaTareasActiva === 'propias' 
                                            ? 'No tienes tareas asignadas' 
                                            : 'No hay tareas del equipo'
                                        }
                                      </p>
                                    </div>
                                  </td>
                                </tr>
                              );
                            }
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Formulario de Nueva Tarea */}
              {showForm && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                  <form onSubmit={crearTarea} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Título
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
                        {(user.isSupremeBoss || subordinados.length > 0) ? (
                          <select
                            value={nuevaTarea.responsable}
                            onChange={(e) => setNuevaTarea({...nuevaTarea, responsable: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            required
                          >
                            <option value="">Seleccionar responsable</option>
                            <option value={user.dni}>Yo mismo - {user.nombre}</option>
                            {subordinados.map(subordinado => (
                              <option key={subordinado.DNI} value={subordinado.DNI}>
                                {subordinado.Nombres} {subordinado.ApellidoPaterno} - {subordinado.NombreCargo}
                              </option>
                            ))}
                            {user.isSupremeBoss && usuarios.map(usuario => (
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
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium"
                      >
                        Crear Tarea
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}

          {/* Vista Calendario - Para jefes con subordinados */}
          {puedeVerDashboard && vistaActiva === 'calendario' && (
            <Calendar tareas={tareas} empleados={empleados} />
          )}

          {/* Vista Feedback del Equipo - Para jefes con subordinados */}
          {puedeVerDashboard && vistaActiva === 'feedback-equipo' && (
            <FeedbackEquipo />
          )}

          {/* Vista para trabajadores sin subordinados */}
          {!puedeVerDashboard && (
            <>
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
                    onClick={() => {
                      setShowForm(!showForm);
                      if (!showForm && user) {
                        setNuevaTarea(prev => ({
                          ...prev,
                          responsable: user.dni
                        }));
                      }
                    }}
                >
                  + Nueva Tarea
                </button>
              </div>
            </div>

            {/* Feedback Semanal */}
            <FeedbackSemanal empleadoDNI={user.dni} />
            


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
                      {(user.isSupremeBoss || subordinados.length > 0) ? (
                        <select
                          value={nuevaTarea.responsable}
                          onChange={(e) => setNuevaTarea({...nuevaTarea, responsable: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          required
                        >
                          <option value="">Seleccionar responsable</option>
                          <option value={user.dni}>Yo mismo - {user.nombre}</option>
                          {subordinados.map(subordinado => (
                            <option key={subordinado.DNI} value={subordinado.DNI}>
                              {subordinado.Nombres} {subordinado.ApellidoPaterno} - {subordinado.NombreCargo}
                            </option>
                          ))}
                          {user.isSupremeBoss && usuarios.map(usuario => (
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

            {/* Tasks Table - Pizarra Moderna */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="px-6 py-5 bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-300">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">📋 Mis Tareas</h3>
                </div>
              </div>
              <div className="overflow-x-auto bg-white">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-slate-100 to-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-48">
                        📝 Tarea
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-28">
                        📅 Fechas
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-20">
                        ⚡ Prioridad
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-32">
                        📈 Progreso
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-24">
                        📊 Estado
                      </th>
                      {!editingTarea && (
                        <th className="px-3 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-24">
                          💬 Chat
                        </th>
                      )}
                      <th className="px-3 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider w-20">
                        ⚙️ Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {loading ? (
                      <tr>
                        <td colSpan={editingTarea ? "6" : "7"} className="px-6 py-4 text-center">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <p className="mt-2 text-gray-600">Cargando tareas...</p>
                        </td>
                      </tr>
                    ) : tareas.length === 0 ? (
                      <tr>
                        <td colSpan={editingTarea ? "6" : "7"} className="px-6 py-4 text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay tareas</h3>
                          <p className="mt-1 text-sm text-gray-500">Comienza creando una nueva tarea.</p>
                        </td>
                      </tr>
                    ) : (
                      tareas.map((tarea) => (
                        <tr key={tarea.Id} className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 group transition-all duration-200 border-l-4 border-transparent hover:border-blue-400 ${editingTarea === tarea.Id ? 'bg-blue-50 border-l-4 border-blue-400' : ''}`}>
                          <td className="px-4 py-3 w-48">
                            {editingTarea === tarea.Id && editingField === 'modoEdicion' ? (
                              <input
                                type="text"
                                defaultValue={tarea.Titulo}
                                className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                onBlur={(e) => actualizarCampo(tarea.Id, 'titulo', e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    actualizarCampo(tarea.Id, 'titulo', e.target.value);
                                  }
                                }}
                              />
                            ) : (
                              <div className="text-sm font-semibold text-slate-800 truncate">
                                {tarea.Titulo}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3 w-28">
                            {editingTarea === tarea.Id && editingField === 'modoEdicion' ? (
                              <div className="space-y-1">
                                <input
                                  type="date"
                                  defaultValue={tarea.FechaInicio ? tarea.FechaInicio.split('T')[0] : ''}
                                  className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  onBlur={(e) => actualizarCampo(tarea.Id, 'fechaInicio', e.target.value)}
                                />
                                <input
                                  type="date"
                                  defaultValue={tarea.FechaFin ? tarea.FechaFin.split('T')[0] : ''}
                                  className="w-full px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  onBlur={(e) => actualizarCampo(tarea.Id, 'fechaFin', e.target.value)}
                                />
                              </div>
                            ) : (
                              <div className="text-xs text-slate-600 space-y-1">
                                <div className="truncate font-medium">📅 {formatDate(tarea.FechaInicio)}</div>
                                <div className="truncate">⏰ {formatDate(tarea.FechaFin)}</div>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3 w-20">
                            {editingTarea === tarea.Id && editingField === 'modoEdicion' ? (
                              <select
                                defaultValue={tarea.Prioridad}
                                className="px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                onBlur={(e) => actualizarCampo(tarea.Id, 'prioridad', e.target.value)}
                                onChange={(e) => actualizarCampo(tarea.Id, 'prioridad', e.target.value)}
                              >
                                <option value="Alta">Alta</option>
                                <option value="Media">Media</option>
                                <option value="Baja">Baja</option>
                              </select>
                            ) : (
                              <span 
                                className={`inline-flex px-2 py-1 text-xs font-bold rounded-full border ${getPriorityColor(tarea.Prioridad)}`}
                              >
                                {tarea.Prioridad}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 w-32">
                            <div className="flex items-center space-x-2">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={tarea.Progreso || 0}
                                onChange={(e) => actualizarProgreso(tarea.Id, e.target.value)}
                                className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                style={{
                                  background: `linear-gradient(to right, ${
                                    (tarea.Progreso || 0) >= 80 ? '#10b981' :
                                    (tarea.Progreso || 0) >= 50 ? '#3b82f6' :
                                    (tarea.Progreso || 0) >= 25 ? '#f59e0b' :
                                    '#ef4444'
                                  } 0%, ${
                                    (tarea.Progreso || 0) >= 80 ? '#10b981' :
                                    (tarea.Progreso || 0) >= 50 ? '#3b82f6' :
                                    (tarea.Progreso || 0) >= 25 ? '#f59e0b' :
                                    '#ef4444'
                                  } ${tarea.Progreso || 0}%, #e5e7eb ${tarea.Progreso || 0}%, #e5e7eb 100%)`
                                }}
                              />
                              <span className="text-xs font-medium text-gray-700 min-w-[2.5rem] text-center">
                                {tarea.Progreso || 0}%
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3 w-24">
                            {editingTarea === tarea.Id && editingField === 'modoEdicion' ? (
                              <select
                                defaultValue={tarea.Estado}
                                className="px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                onBlur={(e) => actualizarCampo(tarea.Id, 'estado', e.target.value)}
                                onChange={(e) => actualizarCampo(tarea.Id, 'estado', e.target.value)}
                              >
                                <option value="Pendiente">Pendiente</option>
                                <option value="En Progreso">En Progreso</option>
                                <option value="Terminado">Terminado</option>
                              </select>
                            ) : (
                              <span 
                                className={`inline-flex px-2 py-1 text-xs font-bold rounded-full border ${getStatusColor(tarea.Estado)}`}
                              >
                                {tarea.Estado}
                              </span>
                            )}
                          </td>
                          {!editingTarea && (
                            <td className="px-3 py-3 w-24">
                              <div className="relative">
                                {(tarea.TotalMensajes > 0 || user.isSupremeBoss) && (
                                  <button
                                    onClick={() => abrirChat(tarea.Id)}
                                    className="relative p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-200"
                                    title={user.isSupremeBoss ? "Ver observaciones" : "Responder a observación del jefe"}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    {tarea.MensajesNoLeidos > 0 && (
                                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold min-w-[20px]">
                                        {tarea.MensajesNoLeidos}
                                      </span>
                                    )}
                                  </button>
                                )}
                                {!user.isSupremeBoss && tarea.TotalMensajes === 0 && (
                                  <div className="text-gray-400 text-xs text-center px-1 py-1" title="Esperando observación del jefe supremo">
                                    ⏳
                                  </div>
                                )}
                              </div>
                            </td>
                          )}
                          <td className="px-3 py-3 w-20">
                            <div className="flex space-x-1 justify-start">
                              <button 
                                className={`p-1.5 text-xs rounded-lg transition-all duration-200 ${editingTarea === tarea.Id ? 'text-green-600 hover:text-green-800 hover:bg-green-100' : 'text-blue-600 hover:text-blue-800 hover:bg-blue-100'}`}
                                onClick={() => editingTarea === tarea.Id ? cancelarEdicionInline() : activarModoEdicion(tarea.Id)}
                                title={editingTarea === tarea.Id ? "Haz clic para cancelar edición" : "Haz clic para editar"}
                              >
                                {editingTarea === tarea.Id ? '✓' : '✏️'}
                              </button>
                              <button 
                                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-all duration-200 text-xs"
                                onClick={() => eliminarTarea(tarea.Id)}
                                title="Eliminar tarea"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            </>
          )}

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
                          className={`flex ${mensaje.EmisorDNI === user.dni ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              mensaje.EmisorDNI === user.dni
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <div className="text-xs opacity-75 mb-1">
                              {mensaje.EmisorNombre}
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
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={nuevoMensaje}
                        onChange={(e) => setNuevoMensaje(e.target.value)}
                        placeholder={user.isSupremeBoss ? "Escribe tu observación..." : "Responde a la observación del jefe..."}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={!nuevoMensaje.trim()}
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
      </div>
    </div>
  );
}

export default App;