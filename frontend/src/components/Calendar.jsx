import React, { useState, useEffect } from 'react';

const Calendar = ({ tareas, empleados }) => {
  const [fechaActual, setFechaActual] = useState(new Date());
  const [vistaMes, setVistaMes] = useState(true);

  // Obtener el primer día del mes y el número de días
  const primerDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
  const ultimoDiaMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);
  const diasEnMes = ultimoDiaMes.getDate();
  const diaInicioSemana = primerDiaMes.getDay();

  // Nombres de los días y meses
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Función para obtener tareas de un día específico
  const obtenerTareasDelDia = (dia) => {
    const fecha = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), dia);
    return tareas.filter(tarea => {
      const fechaInicio = new Date(tarea.FechaInicio);
      const fechaFin = new Date(tarea.FechaFin);
      return fecha >= fechaInicio && fecha <= fechaFin;
    });
  };

  // Función para obtener el color según el estado
  const obtenerColorEstado = (estado) => {
    switch (estado) {
      case 'Pendiente': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'En Progreso': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Completada': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Función para obtener el color según la prioridad
  const obtenerColorPrioridad = (prioridad) => {
    switch (prioridad) {
      case 'Alta': return 'border-l-4 border-red-500';
      case 'Media': return 'border-l-4 border-yellow-500';
      case 'Baja': return 'border-l-4 border-green-500';
      default: return 'border-l-4 border-gray-300';
    }
  };

  // Navegación del calendario
  const mesAnterior = () => {
    setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1));
  };

  const mesSiguiente = () => {
    setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 1));
  };

  const irAHoy = () => {
    setFechaActual(new Date());
  };

  return (
    <div className="space-y-6">
      {/* Header del calendario */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {meses[fechaActual.getMonth()]} {fechaActual.getFullYear()}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={mesAnterior}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Mes anterior"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={irAHoy}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Hoy
              </button>
              <button
                onClick={mesSiguiente}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Mes siguiente"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-600">
              {tareas.length} tareas en total
            </div>
          </div>
        </div>
      </div>

      {/* Calendario */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Días de la semana */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {diasSemana.map((dia) => (
            <div key={dia} className="p-4 text-center text-sm font-medium text-gray-700">
              {dia}
            </div>
          ))}
        </div>

        {/* Días del mes */}
        <div className="grid grid-cols-7">
          {/* Días vacíos del mes anterior */}
          {Array.from({ length: diaInicioSemana }, (_, i) => (
            <div key={`empty-${i}`} className="h-32 border-r border-b border-gray-200 bg-gray-50"></div>
          ))}

          {/* Días del mes actual */}
          {Array.from({ length: diasEnMes }, (_, i) => {
            const dia = i + 1;
            const tareasDelDia = obtenerTareasDelDia(dia);
            const esHoy = new Date().toDateString() === new Date(fechaActual.getFullYear(), fechaActual.getMonth(), dia).toDateString();

            return (
              <div
                key={dia}
                className={`h-32 border-r border-b border-gray-200 p-2 ${
                  esHoy ? 'bg-blue-50' : 'bg-white'
                } hover:bg-gray-50 transition-colors`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${esHoy ? 'text-blue-700' : 'text-gray-900'}`}>
                    {dia}
                  </span>
                  {tareasDelDia.length > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {tareasDelDia.length}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {tareasDelDia.slice(0, 3).map((tarea) => (
                    <div
                      key={tarea.Id}
                      className={`text-xs p-1 rounded border-l-2 ${obtenerColorEstado(tarea.Estado)} ${obtenerColorPrioridad(tarea.Prioridad)}`}
                      title={`${tarea.Titulo} - ${tarea.Estado} - ${tarea.Prioridad}`}
                    >
                      <div className="truncate font-medium">{tarea.Titulo}</div>
                      <div className="text-xs opacity-75">
                        {empleados.find(e => e.DNI === tarea.Responsable)?.NombreCompleto || tarea.Responsable}
                      </div>
                    </div>
                  ))}
                  {tareasDelDia.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{tareasDelDia.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leyenda */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Leyenda</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Estados</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-amber-100 border border-amber-200 rounded"></div>
                <span className="text-sm text-gray-600">Pendiente</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
                <span className="text-sm text-gray-600">En Progreso</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
                <span className="text-sm text-gray-600">Completada</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Prioridades</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-l-4 border-red-500 bg-gray-100 rounded"></div>
                <span className="text-sm text-gray-600">Alta</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-l-4 border-yellow-500 bg-gray-100 rounded"></div>
                <span className="text-sm text-gray-600">Media</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-l-4 border-green-500 bg-gray-100 rounded"></div>
                <span className="text-sm text-gray-600">Baja</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
