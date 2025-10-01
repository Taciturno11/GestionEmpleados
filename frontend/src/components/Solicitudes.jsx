import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL || 'http://10.8.2.56:3000'}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar el token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const Solicitudes = ({ user, onTareaCreada }) => {
  const [vista, setVista] = useState('recibidas'); // 'recibidas' o 'enviadas'
  const [solicitudes, setSolicitudes] = useState([]);
  const [usuariosElegibles, setUsuariosElegibles] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formulario, setFormulario] = useState({
    titulo: '',
    descripcion: '',
    solicitadoDNI: '',
    fechaInicio: '',
    fechaFin: '',
    prioridad: 'Media'
  });

  // Cargar solicitudes
  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      const endpoint = vista === 'recibidas' ? '/solicitudes/recibidas' : '/solicitudes/enviadas';
      const response = await api.get(endpoint);
      setSolicitudes(response.data);
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar usuarios elegibles
  const cargarUsuariosElegibles = async () => {
    try {
      const response = await api.get('/solicitudes/usuarios-elegibles');
      setUsuariosElegibles(response.data);
    } catch (error) {
      console.error('Error cargando usuarios elegibles:', error);
    }
  };

  // Responder a una solicitud
  const responderSolicitud = async (solicitudId, accion, observaciones = '') => {
    try {
      const response = await api.put(`/solicitudes/${solicitudId}/responder`, {
        accion,
        observaciones
      });
      
      if (accion === 'aceptar' && response.data.tareaCreadaId) {
        // Notificar al componente padre que se creó una tarea
        if (onTareaCreada) {
          onTareaCreada();
        }
      }
      
      // Recargar solicitudes
      cargarSolicitudes();
    } catch (error) {
      console.error('Error respondiendo solicitud:', error);
    }
  };

  // Enviar nueva solicitud
  const enviarSolicitud = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/solicitudes', formulario);
      
      // Limpiar formulario y cerrar modal
      setFormulario({
        titulo: '',
        descripcion: '',
        solicitadoDNI: '',
        fechaInicio: '',
        fechaFin: '',
        prioridad: 'Media'
      });
      setMostrarFormulario(false);
      
      // Recargar solicitudes
      cargarSolicitudes();
    } catch (error) {
      console.error('Error enviando solicitud:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    if (user) {
      cargarSolicitudes();
      cargarUsuariosElegibles();
    }
  }, [user, vista]);

  // Función para obtener el color del estado
  const obtenerColorEstado = (estado) => {
    switch (estado) {
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'Aceptada':
        return 'bg-green-100 text-green-800';
      case 'Rechazada':
        return 'bg-red-100 text-red-800';
      case 'Cancelada':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Función para obtener el color de la prioridad
  const obtenerColorPrioridad = (prioridad) => {
    switch (prioridad) {
      case 'Alta':
        return 'bg-red-100 text-red-800';
      case 'Media':
        return 'bg-yellow-100 text-yellow-800';
      case 'Baja':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Función para formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return 'No especificada';
    
    // Si la fecha viene como string ISO, parsearla correctamente
    let dateToFormat = fecha;
    if (typeof fecha === 'string' && fecha.includes('T')) {
      // Es una fecha ISO, usar directamente
      dateToFormat = fecha;
    } else if (typeof fecha === 'string' && fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Es una fecha en formato YYYY-MM-DD, agregar T00:00:00 para evitar problemas de zona horaria
      dateToFormat = fecha + 'T00:00:00';
    }
    
    const date = new Date(dateToFormat);
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    
    // Usar UTC para evitar problemas de zona horaria
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    
    return `${day}/${month}/${year}`;
  };

  // Función para formatear fecha y hora (para FechaSolicitud)
  const formatearFechaHora = (fecha) => {
    if (!fecha) return 'No especificada';
    
    let dateToFormat = fecha;
    if (typeof fecha === 'string' && fecha.includes('T')) {
      dateToFormat = fecha;
    } else if (typeof fecha === 'string' && fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
      dateToFormat = fecha + 'T00:00:00';
    }
    
    const date = new Date(dateToFormat);
    
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    
    // Calcular tiempo relativo de forma más simple
    const ahora = new Date();
    const diferencia = ahora - date;
    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    
    // Si la diferencia es negativa (fecha futura), mostrar fecha completa
    if (diferencia < 0) {
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    if (minutos < 1) {
      return 'Hace un momento';
    } else if (minutos < 60) {
      return `Hace ${minutos}m`;
    } else if (horas < 24) {
      return `Hace ${horas}h`;
    } else if (dias < 7) {
      return `Hace ${dias}d`;
    } else {
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con botones de navegación */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-4">
          <button
            onClick={() => setVista('recibidas')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              vista === 'recibidas'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📥 Solicitudes Recibidas
          </button>
          <button
            onClick={() => setVista('enviadas')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              vista === 'enviadas'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📤 Solicitudes Enviadas
          </button>
        </div>
        
        <button
          onClick={() => setMostrarFormulario(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nueva Solicitud</span>
        </button>
      </div>

      {/* Lista de solicitudes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Cargando solicitudes...</p>
          </div>
        ) : solicitudes.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-gray-500">
              {vista === 'recibidas' ? 'No tienes solicitudes recibidas' : 'No has enviado solicitudes'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {solicitudes.map((solicitud) => (
              <div key={solicitud.Id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{solicitud.Titulo}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${obtenerColorEstado(solicitud.Estado)}`}>
                        {solicitud.Estado}
                      </span>
                      {solicitud.Prioridad && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${obtenerColorPrioridad(solicitud.Prioridad)}`}>
                          {solicitud.Prioridad}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-3">{solicitud.Descripcion}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>
                          {vista === 'recibidas' ? solicitud.SolicitanteNombre : solicitud.SolicitadoNombre}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatearFechaHora(solicitud.FechaSolicitudISO || solicitud.FechaSolicitud)}</span>
                      </div>
                      {solicitud.FechaInicio && (
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{formatearFecha(solicitud.FechaInicio)} - {formatearFecha(solicitud.FechaFin)}</span>
                        </div>
                      )}
                    </div>
                    
                    {solicitud.Observaciones && (
                      <div className="mt-3 p-3 bg-gray-100 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>Observaciones:</strong> {solicitud.Observaciones}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Botones de acción para solicitudes recibidas pendientes */}
                  {vista === 'recibidas' && solicitud.Estado === 'Pendiente' && (
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => responderSolicitud(solicitud.Id, 'aceptar')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Aceptar</span>
                      </button>
                      <button
                        onClick={() => {
                          const observaciones = prompt('Motivo del rechazo (opcional):');
                          responderSolicitud(solicitud.Id, 'rechazar', observaciones || '');
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center space-x-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Rechazar</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de nueva solicitud */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Nueva Solicitud de Tarea</h2>
                <button
                  onClick={() => setMostrarFormulario(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={enviarSolicitud} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título de la solicitud *
                </label>
                <input
                  type="text"
                  value={formulario.titulo}
                  onChange={(e) => setFormulario({ ...formulario, titulo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Análisis de datos de capacitación"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción *
                </label>
                <textarea
                  value={formulario.descripcion}
                  onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Describe detalladamente qué necesitas..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirigido a *
                </label>
                <select
                  value={formulario.solicitadoDNI}
                  onChange={(e) => setFormulario({ ...formulario, solicitadoDNI: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Seleccionar destinatario</option>
                  {usuariosElegibles.map((usuario) => (
                    <option key={usuario.DNI} value={usuario.DNI}>
                      {usuario.NombreCompleto} - {usuario.TipoUsuario}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de inicio (opcional)
                  </label>
                  <input
                    type="date"
                    value={formulario.fechaInicio}
                    onChange={(e) => setFormulario({ ...formulario, fechaInicio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha límite (opcional)
                  </label>
                  <input
                    type="date"
                    value={formulario.fechaFin}
                    onChange={(e) => setFormulario({ ...formulario, fechaFin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridad
                </label>
                <select
                  value={formulario.prioridad}
                  onChange={(e) => setFormulario({ ...formulario, prioridad: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setMostrarFormulario(false)}
                  className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>Enviar Solicitud</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Solicitudes;
