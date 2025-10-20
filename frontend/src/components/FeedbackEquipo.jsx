import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FeedbackEquipo = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [semanaSeleccionada, setSemanaSeleccionada] = useState('');
  const [comentarioModal, setComentarioModal] = useState({ show: false, feedback: null });

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
    const diaSemana = hoy.getDay();
    
    let lunes;
    if (diaSemana === 0) {
      lunes = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 6);
    } else {
      const diaLunes = hoy.getDate() - diaSemana + 1;
      lunes = new Date(hoy.getFullYear(), hoy.getMonth(), diaLunes);
    }
    
    const formatearFechaLocal = (fecha) => {
      const año = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const dia = String(fecha.getDate()).padStart(2, '0');
      return `${año}-${mes}-${dia}`;
    };

    return formatearFechaLocal(lunes);
  };

  // Formatear fecha para mostrar
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [año, mes, dia] = dateString.split('-');
    const date = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Cargar feedbacks del equipo
  const cargarFeedbacks = async (semana = null) => {
    try {
      setLoading(true);
      const semanaParam = semana || obtenerSemanaActual();
      const response = await api.get('/feedback/equipo', {
        params: { semana: semanaParam }
      });
      
      setFeedbacks(response.data);
      setSemanaSeleccionada(semanaParam);
    } catch (error) {
      console.error('Error cargando feedbacks del equipo:', error);
    } finally {
      setLoading(false);
    }
  };

  // Comentar feedback
  const comentarFeedback = async (id, comentario) => {
    try {
      await api.put(`/feedback/${id}/comentar`, { comentario });
      cargarFeedbacks(semanaSeleccionada); // Recargar feedbacks
      setComentarioModal({ show: false, feedback: null });
    } catch (error) {
      console.error('Error comentando feedback:', error);
    }
  };

  // Cargar feedbacks al montar el componente
  useEffect(() => {
    cargarFeedbacks();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="ml-3 text-gray-600">Cargando feedbacks del equipo...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl shadow-lg border border-slate-200 overflow-hidden mb-8">
        <div className="px-6 py-5 bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white">📊 Feedback del Equipo</h3>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-white/80 text-sm">
                Semana del {formatDate(semanaSeleccionada)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de feedbacks */}
      <div className="space-y-6">
        {feedbacks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay feedbacks esta semana</h3>
            <p className="text-gray-500">Los empleados aún no han enviado sus feedbacks semanales.</p>
          </div>
        ) : (
          feedbacks.map((feedback) => (
            <div key={feedback.Id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Header del feedback */}
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {feedback.NombreCompleto?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">{feedback.NombreCompleto}</h4>
                      <p className="text-sm text-slate-600">
                        Enviado: {feedback.FechaEnvio ? formatDate(feedback.FechaEnvio.split('T')[0]) : 'No enviado'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      feedback.Estado === 'Borrador' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                      feedback.Estado === 'Enviado' ? 'bg-green-100 text-green-800 border border-green-200' :
                      'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {feedback.Estado}
                    </span>
                    {feedback.Estado === 'Enviado' && (
                      <button
                        onClick={() => setComentarioModal({ show: true, feedback })}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Comentar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Contenido del feedback */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* EMPEZAR */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center mb-3">
                      <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center mr-2">
                        <span className="text-white text-sm">🚀</span>
                      </div>
                      <h5 className="font-semibold text-green-800">EMPEZAR</h5>
                    </div>
                    <p className="text-sm text-green-700 leading-relaxed">
                      {feedback.Empezar || 'Sin contenido'}
                    </p>
                  </div>

                  {/* DEJAR */}
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                    <div className="flex items-center mb-3">
                      <div className="w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center mr-2">
                        <span className="text-white text-sm">🛑</span>
                      </div>
                      <h5 className="font-semibold text-red-800">DEJAR</h5>
                    </div>
                    <p className="text-sm text-red-700 leading-relaxed">
                      {feedback.Dejar || 'Sin contenido'}
                    </p>
                  </div>

                  {/* MANTENER */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center mb-3">
                      <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center mr-2">
                        <span className="text-white text-sm">✅</span>
                      </div>
                      <h5 className="font-semibold text-blue-800">MANTENER</h5>
                    </div>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      {feedback.Mantener || 'Sin contenido'}
                    </p>
                  </div>
                </div>

                {/* Comentario del jefe */}
                {feedback.ComentarioJefe && (
                  <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center mb-2">
                      <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center mr-2">
                        <span className="text-white text-xs">💬</span>
                      </div>
                      <h6 className="font-semibold text-amber-800">Comentario del Jefe</h6>
                    </div>
                    <p className="text-sm text-amber-700 leading-relaxed">
                      {feedback.ComentarioJefe}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal para comentar */}
      {comentarioModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6 rounded-t-xl">
              <h3 className="text-lg font-bold">💬 Comentar Feedback</h3>
              <p className="text-white/80 text-sm mt-1">
                {comentarioModal.feedback?.NombreCompleto}
              </p>
            </div>
            
            <div className="p-6">
              <textarea
                id="comentario"
                rows={4}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Escribe tu comentario sobre el feedback del empleado..."
              />
            </div>
            
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-slate-200">
              <button
                onClick={() => setComentarioModal({ show: false, feedback: null })}
                className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const comentario = document.getElementById('comentario').value;
                  if (comentario.trim()) {
                    comentarFeedback(comentarioModal.feedback.Id, comentario);
                  }
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Enviar Comentario
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackEquipo;


