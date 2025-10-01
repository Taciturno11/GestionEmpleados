import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL}/api`,
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

const Notificaciones = ({ user }) => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Cargar notificaciones
  const cargarNotificaciones = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notificaciones');
      setNotificaciones(response.data);
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar contador de no leídas
  const cargarContadorNoLeidas = async () => {
    try {
      const response = await api.get('/notificaciones/no-leidas');
      setNotificacionesNoLeidas(response.data.totalNoLeidas);
    } catch (error) {
      console.error('Error cargando contador de notificaciones:', error);
    }
  };

  // Marcar notificación como leída
  const marcarComoLeida = async (notificacionId) => {
    try {
      await api.put(`/notificaciones/${notificacionId}/leer`);
      setNotificaciones(prev => 
        prev.map(notif => 
          notif.Id === notificacionId ? { ...notif, Leida: true } : notif
        )
      );
      setNotificacionesNoLeidas(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
    }
  };

  // Marcar todas como leídas
  const marcarTodasComoLeidas = async () => {
    try {
      await api.put('/notificaciones/marcar-todas-leidas');
      setNotificaciones(prev => prev.map(notif => ({ ...notif, Leida: true })));
      setNotificacionesNoLeidas(0);
    } catch (error) {
      console.error('Error marcando todas las notificaciones como leídas:', error);
    }
  };

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMostrarDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cargar datos al montar el componente
  useEffect(() => {
    if (user) {
      cargarNotificaciones();
      cargarContadorNoLeidas();
    }
  }, [user]);

  // Función para obtener el icono según el tipo de notificación
  const obtenerIcono = (tipo) => {
    switch (tipo) {
      case 'solicitud_tarea':
        return '📋';
      case 'solicitud_aceptada':
        return '✅';
      case 'solicitud_rechazada':
        return '❌';
      default:
        return '🔔';
    }
  };

  // Función para obtener el color según el tipo de notificación
  const obtenerColor = (tipo) => {
    switch (tipo) {
      case 'solicitud_tarea':
        return 'text-blue-600';
      case 'solicitud_aceptada':
        return 'text-green-600';
      case 'solicitud_rechazada':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Función para formatear fecha
  const formatearFecha = (fecha) => {
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
    <div className="relative" ref={dropdownRef}>
      {/* Botón de notificaciones */}
      <button
        onClick={() => setMostrarDropdown(!mostrarDropdown)}
        className="relative p-3 text-gray-600 hover:text-gray-900 transition-all duration-200 hover:bg-gray-100 rounded-full">
            
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        
        {/* Badge de notificaciones no leídas */}
        {notificacionesNoLeidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse shadow-lg">
            {notificacionesNoLeidas > 99 ? '99+' : notificacionesNoLeidas}
          </span>
        )}
      </button>

      {/* Dropdown de notificaciones */}
      {mostrarDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header del dropdown */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Notificaciones</h3>
              {notificacionesNoLeidas > 0 && (
                <button
                  onClick={marcarTodasComoLeidas}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-600">Cargando notificaciones...</p>
              </div>
            ) : notificaciones.length === 0 ? (
              <div className="p-4 text-center">
                <div className="text-4xl mb-2">🔔</div>
                <p className="text-gray-500">No hay notificaciones</p>
              </div>
            ) : (
              notificaciones.map((notificacion) => (
                <div
                  key={notificacion.Id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors duration-200 ${
                    !notificacion.Leida ? 'bg-blue-50 border-l-4 border-l-blue-400' : ''
                  }`}
                  onClick={() => !notificacion.Leida && marcarComoLeida(notificacion.Id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`text-xl ${obtenerColor(notificacion.Tipo)}`}>
                      {obtenerIcono(notificacion.Tipo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-medium ${!notificacion.Leida ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notificacion.Titulo}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {formatearFecha(notificacion.FechaCreacionISO || notificacion.FechaCreacion)}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 ${!notificacion.Leida ? 'text-gray-800' : 'text-gray-600'}`}>
                        {notificacion.Mensaje}
                      </p>
                      {notificacion.SolicitudTitulo && (
                        <div className="mt-2 text-xs text-gray-500 bg-gray-100 rounded px-2 py-1 inline-block">
                          📋 {notificacion.SolicitudTitulo}
                        </div>
                      )}
                    </div>
                    {!notificacion.Leida && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer del dropdown */}
          {notificaciones.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
              <button
                onClick={cargarNotificaciones}
                className="text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                Actualizar notificaciones
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notificaciones;
