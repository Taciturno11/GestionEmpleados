import React from 'react';

const EmployeeCards = ({ empleados, onSelectEmpleado, empleadoSeleccionado, tareas = [] }) => {
  const getPriorityColor = (tareasPendientes, tareasAltaPrioridad) => {
    if (tareasAltaPrioridad > 0) return 'from-red-500 to-red-600';
    if (tareasPendientes > 3) return 'from-orange-500 to-orange-600';
    if (tareasPendientes > 1) return 'from-yellow-500 to-yellow-600';
    return 'from-green-500 to-green-600';
  };

  const getPriorityIcon = (tareasPendientes, tareasAltaPrioridad) => {
    if (tareasAltaPrioridad > 0) return '🚨';
    if (tareasPendientes > 3) return '⚠️';
    if (tareasPendientes > 1) return '⏰';
    return '✅';
  };

  const getStatusText = (tareasPendientes, tareasAltaPrioridad) => {
    if (tareasAltaPrioridad > 0) return 'Urgente';
    if (tareasPendientes > 3) return 'Muchas pendientes';
    if (tareasPendientes > 1) return 'Algunas pendientes';
    return 'Bajo control';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <span className="text-3xl mr-3">👥</span>
          Equipo de Trabajo
        </h2>
        <div className="text-sm text-gray-500">
          {empleados.length} empleado{empleados.length !== 1 ? 's' : ''} con tareas asignadas
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {empleados.map((empleado) => {
          const isSelected = empleadoSeleccionado === empleado.DNI;
          const gradientClass = getPriorityColor(empleado.TareasPendientes, empleado.TareasAltaPrioridad);
          const priorityIcon = getPriorityIcon(empleado.TareasPendientes, empleado.TareasAltaPrioridad);
          const statusText = getStatusText(empleado.TareasPendientes, empleado.TareasAltaPrioridad);
          
          // Calcular progreso real basado en las tareas del empleado
          const tareasDelEmpleado = tareas.filter(tarea => tarea.Responsable === empleado.DNI);
          const progresoReal = tareasDelEmpleado.length > 0 
            ? Math.round(tareasDelEmpleado.reduce((sum, tarea) => sum + (tarea.Progreso || 0), 0) / tareasDelEmpleado.length)
            : 0;

          return (
            <div
              key={empleado.DNI}
              onClick={() => onSelectEmpleado(empleado.DNI)}
              className={`
                relative group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl
                ${isSelected ? 'ring-4 ring-blue-500 ring-opacity-50' : ''}
              `}
            >
              {/* Tarjeta principal */}
              <div className={`
                bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden
                ${isSelected ? 'border-blue-300' : 'hover:border-gray-300'}
                transition-all duration-300
              `}>
                {/* Header con gradiente */}
                <div className={`h-24 bg-gradient-to-r ${gradientClass} relative`}>
                  <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                  <div className="relative p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl">
                        👤
                      </div>
                      <div className="text-white">
                        <div className="font-bold text-lg">{empleado.NombreCompleto}</div>
                        <div className="text-sm opacity-90">{empleado.DNI}</div>
                      </div>
                    </div>
                    <div className="text-right text-white">
                      <div className="text-2xl">{priorityIcon}</div>
                      <div className="text-xs opacity-90">{statusText}</div>
                    </div>
                  </div>
                </div>

                {/* Contenido de la tarjeta */}
                <div className="p-6">
                  {/* Estadísticas principales */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{empleado.TareasPendientes}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Pendientes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{empleado.TareasEnProgreso}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">En Progreso</div>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progreso Real</span>
                      <span>{progresoReal}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          progresoReal >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                          progresoReal >= 50 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                          progresoReal >= 25 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                          'bg-gradient-to-r from-red-400 to-red-600'
                        }`}
                        style={{ width: `${progresoReal}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Total tareas:</span>
                      <span className="font-semibold">{empleado.TotalTareas}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completadas:</span>
                      <span className="font-semibold text-green-600">{empleado.TareasCompletadas}</span>
                    </div>
                    {empleado.TareasAltaPrioridad > 0 && (
                      <div className="flex justify-between">
                        <span>Alta prioridad:</span>
                        <span className="font-semibold text-red-600">{empleado.TareasAltaPrioridad}</span>
                      </div>
                    )}
                    {empleado.ProximaFechaVencimiento && (
                      <div className="flex justify-between">
                        <span>Próximo vencimiento:</span>
                        <span className="font-semibold">{formatDate(empleado.ProximaFechaVencimiento)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer con indicador de selección */}
                <div className={`
                  h-1 bg-gradient-to-r ${gradientClass}
                  ${isSelected ? 'h-2' : ''}
                  transition-all duration-300
                `}></div>
              </div>

              {/* Efecto de hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300"></div>
            </div>
          );
        })}
      </div>

      {empleados.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">¡Excelente trabajo!</h3>
          <p className="text-gray-500">Todos los empleados han completado sus tareas asignadas.</p>
        </div>
      )}
    </div>
  );
};

export default EmployeeCards;
