import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Feedback = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nuevoFeedback, setNuevoFeedback] = useState({
    tareaId: '',
    mensaje: ''
  });

  const cargarFeedback = async () => {
    try {
      setLoading(true);
      // Aquí cargarías el feedback desde la API
      // const response = await axios.get('/api/feedback');
      // setFeedback(response.data);
    } catch (error) {
      console.error('Error cargando feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const crearFeedback = async (e) => {
    e.preventDefault();
    if (!nuevoFeedback.tareaId || !nuevoFeedback.mensaje.trim()) {
      return;
    }

    try {
      await axios.post('/api/feedback', nuevoFeedback);
      setNuevoFeedback({ tareaId: '', mensaje: '' });
      cargarFeedback();
    } catch (error) {
      console.error('Error creando feedback:', error);
    }
  };

  useEffect(() => {
    cargarFeedback();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Sistema de Feedback</h3>
      
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Cargando feedback...</p>
        </div>
      ) : (
        <div>
          <form onSubmit={crearFeedback} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID de Tarea
              </label>
              <input
                type="number"
                value={nuevoFeedback.tareaId}
                onChange={(e) => setNuevoFeedback({...nuevoFeedback, tareaId: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ingresa el ID de la tarea"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje de Feedback
              </label>
              <textarea
                value={nuevoFeedback.mensaje}
                onChange={(e) => setNuevoFeedback({...nuevoFeedback, mensaje: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Escribe tu feedback aquí..."
              />
            </div>
            
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Enviar Feedback
            </button>
          </form>

          <div className="space-y-4">
            {feedback.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>No hay feedback aún</p>
                <p className="text-sm">Crea el primer feedback usando el formulario de arriba</p>
              </div>
            ) : (
              feedback.map((item) => (
                <div key={item.Id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">Tarea #{item.TareaId}</h4>
                    <span className="text-sm text-gray-500">
                      {new Date(item.FechaCreacion).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{item.Mensaje}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    Por: {item.EmisorNombre}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Feedback;
