import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FeedbackSemanal = ({ empleadoDNI }) => {
  const [feedback, setFeedback] = useState({
    Empezar: '',
    Dejar: '',
    Mantener: '',
    Estado: 'Borrador',
    SemanaInicio: '',
    SemanaFin: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [ultimaEdicion, setUltimaEdicion] = useState(null);

  // Configurar axios
  const api = axios.create({
    baseURL: `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api`,
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  // Obtener semana actual (lunes a domingo)
  const obtenerSemanaActual = () => {
    const hoy = new Date();
    const diaSemana = hoy.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
    
    // Calcular el lunes de la semana actual
    let lunes;
    if (diaSemana === 0) {
      // Si es domingo, el lunes es 6 días atrás
      lunes = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 6);
    } else {
      // Si es lunes a sábado, calcular el lunes de esta semana
      const diaLunes = hoy.getDate() - diaSemana + 1;
      lunes = new Date(hoy.getFullYear(), hoy.getMonth(), diaLunes);
    }
    
    const domingo = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + 6);

    // Formatear fechas en formato YYYY-MM-DD usando fechas locales
    const formatearFechaLocal = (fecha) => {
      const año = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const dia = String(fecha.getDate()).padStart(2, '0');
      return `${año}-${mes}-${dia}`;
    };

    return {
      inicio: formatearFechaLocal(lunes),
      fin: formatearFechaLocal(domingo)
    };
  };

  // Formatear fecha para mostrar
  const formatDate = (dateString) => {
    if (!dateString) return '';
    // Parsear la fecha como fecha local para evitar problemas de zona horaria
    const [año, mes, dia] = dateString.split('-');
    const date = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Cargar feedback semanal
  const cargarFeedback = async () => {
    try {
      setLoading(true);
      const semana = obtenerSemanaActual();
      const response = await api.get('/feedback/semanal', {
        params: { semana: semana.inicio }
      });
      
      setFeedback({
        ...response.data,
        SemanaInicio: semana.inicio,
        SemanaFin: semana.fin
      });
    } catch (error) {
      console.error('Error cargando feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  // Guardar feedback (auto-guardado)
  const guardarFeedback = async (nuevoFeedback = null) => {
    try {
      setSaving(true);
      const feedbackAGuardar = nuevoFeedback || feedback;
      
      await api.post('/feedback/semanal', {
        semanaInicio: feedbackAGuardar.SemanaInicio,
        semanaFin: feedbackAGuardar.SemanaFin,
        empezar: feedbackAGuardar.Empezar,
        dejar: feedbackAGuardar.Dejar,
        mantener: feedbackAGuardar.Mantener,
        estado: feedbackAGuardar.Estado
      });

      setUltimaEdicion(new Date());
    } catch (error) {
      console.error('Error guardando feedback:', error);
    } finally {
      setSaving(false);
    }
  };

  // Enviar feedback al jefe
  const enviarAlJefe = async () => {
    try {
      setSaving(true);
      await api.put('/feedback/semanal/enviar', {
        semanaInicio: feedback.SemanaInicio
      });

      setFeedback(prev => ({ ...prev, Estado: 'Enviado' }));
      alert('✅ Feedback enviado al jefe exitosamente');
    } catch (error) {
      console.error('Error enviando feedback:', error);
      alert('❌ Error enviando feedback');
    } finally {
      setSaving(false);
    }
  };

  // Auto-guardado cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (feedback.Estado === 'Borrador' && (feedback.Empezar || feedback.Dejar || feedback.Mantener)) {
        guardarFeedback();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [feedback]);

  // Cargar feedback al montar el componente
  useEffect(() => {
    cargarFeedback();
  }, []);

  // Manejar cambios en los campos
  const handleChange = (campo, valor) => {
    setFeedback(prev => ({ ...prev, [campo]: valor }));
  };

  // Guardar manualmente
  const handleGuardar = () => {
    guardarFeedback();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-3 text-gray-600">Cargando feedback semanal...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Botón de Feedback Semanal */}
      <div className="mb-8">
        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-gradient-to-br from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 text-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 p-6 flex items-center justify-between group border border-slate-200"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl flex items-center justify-center group-hover:from-slate-700 group-hover:to-slate-600 transition-colors">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-bold text-slate-800">Feedback Semanal</h3>
              <p className="text-slate-600 text-sm">
                Semana del {formatDate(feedback.SemanaInicio)} al {formatDate(feedback.SemanaFin)}
              </p>
            </div>
          </div>
          
          {/* Visualización Start, Stop, Continue */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-green-50 px-2 py-1 rounded-full border border-green-200">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-xs font-medium text-green-700">START</span>
            </div>
            <div className="flex items-center space-x-1 bg-red-50 px-2 py-1 rounded-full border border-red-200">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
              <span className="text-xs font-medium text-red-700">STOP</span>
            </div>
            <div className="flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span className="text-xs font-medium text-blue-700">CONTINUE</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {feedback.ComentarioJefe && (
              <div className="relative">
                <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-600 rounded-full"></div>
              </div>
            )}
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              feedback.Estado === 'Borrador' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
              feedback.Estado === 'Enviado' ? 'bg-green-100 text-green-800 border border-green-200' :
              'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              {feedback.Estado}
            </span>
            <svg className="w-5 h-5 text-slate-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>

      {/* Modal de edición completa */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">🔄 Feedback Semanal</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/80 hover:text-white text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <p className="text-white/80 mt-2">
                Semana del {formatDate(feedback.SemanaInicio)} al {formatDate(feedback.SemanaFin)}
              </p>
            </div>
            
            {/* Contenido en columnas */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna EMPEZAR */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white text-xl">🚀</span>
                    </div>
                    <h4 className="text-lg font-bold text-green-800">EMPEZAR</h4>
                  </div>
                  <p className="text-sm text-green-700 mb-4">
                    Qué debería comenzar a hacer
                  </p>
                  <textarea
                    value={feedback.Empezar}
                    onChange={(e) => handleChange('Empezar', e.target.value)}
                    className="w-full p-4 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors bg-white"
                    rows={8}
                    placeholder="Ej: Mejorar comunicación con el equipo, implementar nuevas herramientas, tomar más iniciativa en proyectos..."
                  />
                </div>
                
                {/* Columna DEJAR */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white text-xl">🛑</span>
                    </div>
                    <h4 className="text-lg font-bold text-red-800">DEJAR</h4>
                  </div>
                  <p className="text-sm text-red-700 mb-4">
                    Qué debería dejar de hacer
                  </p>
                  <textarea
                    value={feedback.Dejar}
                    onChange={(e) => handleChange('Dejar', e.target.value)}
                    className="w-full p-4 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors bg-white"
                    rows={8}
                    placeholder="Ej: Llegar tarde a las reuniones, procrastinar en tareas importantes, interrumpir a los compañeros..."
                  />
                </div>
                
                {/* Columna MANTENER */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white text-xl">✅</span>
                    </div>
                    <h4 className="text-lg font-bold text-blue-800">MANTENER</h4>
                  </div>
                  <p className="text-sm text-blue-700 mb-4">
                    Qué está funcionando bien
                  </p>
                  <textarea
                    value={feedback.Mantener}
                    onChange={(e) => handleChange('Mantener', e.target.value)}
                    className="w-full p-4 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                    rows={8}
                    placeholder="Ej: Puntualidad en la entrega de tareas, buena comunicación con clientes, trabajo en equipo efectivo..."
                  />
                </div>
              </div>
            </div>
            
            {/* Comentario del jefe */}
            {feedback.ComentarioJefe && (
              <div className="mx-6 mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center mr-2">
                    <span className="text-white text-sm">💬</span>
                  </div>
                  <h6 className="font-semibold text-amber-800">Comentario del Jefe</h6>
                </div>
                <p className="text-sm text-amber-700 leading-relaxed">
                  {feedback.ComentarioJefe}
                </p>
              </div>
            )}

            {/* Botones del modal */}
            <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50 rounded-b-xl">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleGuardar}
                  disabled={saving}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium disabled:opacity-50"
                >
                  {saving ? '💾 Guardando...' : '💾 Guardar'}
                </button>
                {ultimaEdicion && (
                  <span className="text-xs text-slate-500">
                    Última edición: {ultimaEdicion.toLocaleTimeString()}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                >
                  Cerrar
                </button>
                <button
                  onClick={enviarAlJefe}
                  disabled={feedback.Estado === 'Enviado' || saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  📤 Enviar al Jefe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackSemanal;
