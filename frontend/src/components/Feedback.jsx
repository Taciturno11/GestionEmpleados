import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = '/api/feedback';

function Feedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newFeedback, setNewFeedback] = useState({
    destinatario: '',
    mensaje: '',
    prioridad: 'Normal'
  });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    cargarFeedbacks();
  }, []);

  const cargarFeedbacks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedbacks(response.data);
    } catch (error) {
      console.error('Error cargando feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const enviarFeedback = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(API_URL, newFeedback, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewFeedback({ destinatario: '', mensaje: '', prioridad: 'Normal' });
      setShowForm(false);
      cargarFeedbacks();
    } catch (error) {
      console.error('Error enviando feedback:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Cargando feedbacks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Sistema de Feedback</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Cancelar' : 'Nuevo Feedback'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={enviarFeedback} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destinatario
                </label>
                <input
                  type="text"
                  value={newFeedback.destinatario}
                  onChange={(e) => setNewFeedback({...newFeedback, destinatario: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridad
                </label>
                <select
                  value={newFeedback.prioridad}
                  onChange={(e) => setNewFeedback({...newFeedback, prioridad: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Baja">Baja</option>
                  <option value="Normal">Normal</option>
                  <option value="Alta">Alta</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensaje
              </label>
              <textarea
                value={newFeedback.mensaje}
                onChange={(e) => setNewFeedback({...newFeedback, mensaje: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
                required
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Enviar Feedback
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {feedbacks.map((feedback) => (
            <div key={feedback.Id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-gray-900">{feedback.Destinatario}</h3>
                  <p className="text-sm text-gray-600">{feedback.Mensaje}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  feedback.Prioridad === 'Alta' ? 'bg-red-100 text-red-800' :
                  feedback.Prioridad === 'Normal' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {feedback.Prioridad}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {new Date(feedback.FechaCreacion).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Feedback;
