import React, { useState, useEffect } from 'react';

const Calendar = ({ tareas, empleados }) => {
  console.log('🚀 CALENDAR COMPONENT RENDERIZANDO - Props recibidas:', { tareas: tareas?.length, empleados: empleados?.length });
  
  const [fechaActual, setFechaActual] = useState(new Date());
  const [vistaMes, setVistaMes] = useState(true);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [diaExpandido, setDiaExpandido] = useState(null);
  const [empleadoExpandido, setEmpleadoExpandido] = useState(null); // {dia: X, empleadoDNI: 'Y'}

  // Debug: Log para ver las tareas que recibe el calendario
  console.log('🔍 DEBUG Calendar - Tareas recibidas:', tareas.length, 'tareas');
  console.log('🔍 DEBUG Calendar - Empleados recibidos:', empleados.length, 'empleados');
  console.log('🔍 DEBUG Calendar - Fecha actual:', fechaActual.toDateString());
  console.log('🔍 DEBUG Calendar - Mes actual:', fechaActual.getMonth() + 1, 'Año actual:', fechaActual.getFullYear());
  if (tareas.length > 0) {
    console.log('🔍 DEBUG Calendar - Primera tarea:', {
      titulo: tareas[0].Titulo,
      fechaInicio: tareas[0].FechaInicio,
      fechaFin: tareas[0].FechaFin,
      responsable: tareas[0].Responsable
    });
    console.log('🔍 DEBUG Calendar - Todas las tareas:', tareas.map(t => ({
      titulo: t.Titulo,
      fechaInicio: t.FechaInicio,
      fechaFin: t.FechaFin
    })));
  } else {
    console.log('❌ DEBUG Calendar - NO HAY TAREAS');
  }

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

  // Función para formatear fechas (corrige zona horaria)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    let dateToFormat = dateString;
    if (dateString && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      dateToFormat = dateString + 'T00:00:00';
    }
    const date = new Date(dateToFormat);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC'
    });
  };

  // Función para obtener tareas de un día específico (LÓGICA CORREGIDA)
  const obtenerTareasDelDia = (dia) => {
    const año = fechaActual.getFullYear();
    const mes = fechaActual.getMonth() + 1; // getMonth() devuelve 0-11, necesitamos 1-12
    
    return tareas.filter(tarea => {
      const fechaInicioStr = tarea.FechaInicio;
      const fechaFinStr = tarea.FechaFin;
      
      if (!fechaInicioStr || !fechaFinStr) return false;
      
      // Extraer fecha directamente del string ISO (SIN conversión a Date)
      const fechaInicioPartes = fechaInicioStr.split('T')[0].split('-');
      const fechaFinPartes = fechaFinStr.split('T')[0].split('-');
      
      const añoInicio = parseInt(fechaInicioPartes[0]);
      const mesInicio = parseInt(fechaInicioPartes[1]);
      const diaInicio = parseInt(fechaInicioPartes[2]);
      
      const añoFin = parseInt(fechaFinPartes[0]);
      const mesFin = parseInt(fechaFinPartes[1]);
      const diaFin = parseInt(fechaFinPartes[2]);
      
      // LÓGICA ULTRA SIMPLE: Verificar si el día actual está dentro del rango
      const estaEnRango = (año === añoInicio && mes === mesInicio && dia >= diaInicio && dia <= diaFin);
      
      // Debug: Log para entender qué está pasando
      if (dia >= 24 && dia <= 28) { // Log para los días relevantes
        console.log('🔍 DEBUG Calendario CORREGIDO:', {
          dia,
          año,
          mes,
          tarea: tarea.Titulo,
          fechaInicioStr,
          fechaFinStr,
          fechaInicioPartes,
          fechaFinPartes,
          añoInicio, mesInicio, diaInicio,
          añoFin, mesFin, diaFin,
          estaEnRango,
          CONDICION: `Año: ${año} === ${añoInicio} && Mes: ${mes} === ${mesInicio} && Dia: ${dia} >= ${diaInicio} && ${dia} <= ${diaFin}`
        });
      }
      
      return estaEnRango;
    });
  };

  // Función para agrupar tareas por empleado
  const agruparTareasPorEmpleado = (tareasDelDia) => {
    const agrupadas = {};
    tareasDelDia.forEach(tarea => {
      const empleadoDNI = tarea.Responsable;
      if (!agrupadas[empleadoDNI]) {
        agrupadas[empleadoDNI] = {
          empleado: empleados.find(e => e.DNI === empleadoDNI),
          tareas: []
        };
      }
      agrupadas[empleadoDNI].tareas.push(tarea);
    });
    return agrupadas;
  };

  // Calcular estadísticas del mes (lógica ULTRA SIMPLE)
  const calcularEstadisticas = () => {
    const año = fechaActual.getFullYear();
    const mes = fechaActual.getMonth() + 1; // getMonth() devuelve 0-11, necesitamos 1-12
    
    const tareasDelMes = tareas.filter(tarea => {
      const fechaInicioStr = tarea.FechaInicio;
      const fechaFinStr = tarea.FechaFin;
      
      if (!fechaInicioStr || !fechaFinStr) return false;
      
      // Convertir fechas ISO a formato YYYY-MM-DD
      const fechaInicio = new Date(fechaInicioStr);
      const fechaFin = new Date(fechaFinStr);
      
      const añoInicio = fechaInicio.getFullYear();
      const mesInicio = fechaInicio.getMonth() + 1;
      const añoFin = fechaFin.getFullYear();
      const mesFin = fechaFin.getMonth() + 1;
      
      // Verificar si la tarea se superpone con el mes actual
      return (añoInicio < año || (añoInicio === año && mesInicio <= mes)) &&
             (añoFin > año || (añoFin === año && mesFin >= mes));
    });

    return {
      total: tareasDelMes.length,
      pendientes: tareasDelMes.filter(t => t.Estado === 'Pendiente').length,
      enProgreso: tareasDelMes.filter(t => t.Estado === 'En Progreso').length,
      completadas: tareasDelMes.filter(t => t.Estado === 'Completada').length,
      altaPrioridad: tareasDelMes.filter(t => t.Prioridad === 'Alta').length
    };
  };

  const estadisticas = calcularEstadisticas();

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
    setDiaExpandido(null); // Cerrar día expandido al cambiar de mes
    setEmpleadoExpandido(null); // Cerrar empleado expandido al cambiar de mes
  };

  const mesSiguiente = () => {
    setFechaActual(new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 1));
    setDiaExpandido(null); // Cerrar día expandido al cambiar de mes
    setEmpleadoExpandido(null); // Cerrar empleado expandido al cambiar de mes
  };

  const irAHoy = () => {
    setFechaActual(new Date());
    setDiaExpandido(null); // Cerrar día expandido al ir a hoy
    setEmpleadoExpandido(null); // Cerrar empleado expandido al ir a hoy
  };

  return (
    <div className="space-y-6">
      {/* Header del calendario con estadísticas */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold">
                {meses[fechaActual.getMonth()]} {fechaActual.getFullYear()}
              </h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={mesAnterior}
                className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-105"
                title="Mes anterior"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={irAHoy}
                className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all duration-200 hover:scale-105 font-medium"
              >
                📅 Hoy
              </button>
              <button
                onClick={() => setFechaActual(new Date(2025, 8, 1))} // Septiembre 2025 (mes 8 porque es 0-indexado)
                className="px-4 py-2 bg-green-500/80 text-white rounded-lg hover:bg-green-500 transition-all duration-200 hover:scale-105 font-medium"
              >
                🎯 Sep 2025
              </button>
              <button
                onClick={mesSiguiente}
                className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-105"
                title="Mes siguiente"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas del mes */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">📋</span>
              </div>
              <div>
                <div className="text-2xl font-bold">{estadisticas.total}</div>
                <div className="text-sm text-white/80">Total</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">⏳</span>
              </div>
              <div>
                <div className="text-2xl font-bold">{estadisticas.pendientes}</div>
                <div className="text-sm text-white/80">Pendientes</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🔄</span>
              </div>
              <div>
                <div className="text-2xl font-bold">{estadisticas.enProgreso}</div>
                <div className="text-sm text-white/80">En Progreso</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">✅</span>
              </div>
              <div>
                <div className="text-2xl font-bold">{estadisticas.completadas}</div>
                <div className="text-sm text-white/80">Completadas</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🚨</span>
              </div>
              <div>
                <div className="text-2xl font-bold">{estadisticas.altaPrioridad}</div>
                <div className="text-sm text-white/80">Alta Prioridad</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendario */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Header del calendario */}
        <div className="bg-gradient-to-r from-slate-100 to-slate-200 border-b border-slate-300">
          <div className="grid grid-cols-7">
            {diasSemana.map((dia) => (
              <div key={dia} className="p-4 text-center text-sm font-bold text-slate-700 border-r border-slate-300 last:border-r-0">
                {dia}
              </div>
            ))}
          </div>
        </div>

        {/* Días del mes */}
        <div className="grid grid-cols-7">
          {/* Días vacíos del mes anterior */}
          {Array.from({ length: diaInicioSemana }, (_, i) => (
            <div key={`empty-${i}`} className="h-40 border-r border-b border-slate-300 bg-slate-100/50"></div>
          ))}

          {/* Días del mes actual */}
          {Array.from({ length: diasEnMes }, (_, i) => {
            const dia = i + 1;
            const tareasDelDia = obtenerTareasDelDia(dia);
            const tareasAgrupadas = agruparTareasPorEmpleado(tareasDelDia);
            const empleadosConTareas = Object.keys(tareasAgrupadas);
            const esHoy = new Date().toDateString() === new Date(fechaActual.getFullYear(), fechaActual.getMonth(), dia).toDateString();
            const esFinDeSemana = [0, 6].includes(new Date(fechaActual.getFullYear(), fechaActual.getMonth(), dia).getDay());

            return (
              <div
                key={dia}
                className={`h-40 border-r border-b border-slate-300 p-2.5 group transition-all duration-200 ${
                  esHoy 
                    ? 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-400' 
                    : esFinDeSemana 
                    ? 'bg-slate-50/80' 
                    : 'bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-bold ${
                    esHoy 
                      ? 'text-blue-800' 
                      : esFinDeSemana 
                      ? 'text-slate-500' 
                      : 'text-slate-800'
                  }`}>
                    {dia}
                  </span>
                  {empleadosConTareas.length > 0 && (
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      esHoy 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {empleadosConTareas.length} empleado{empleadosConTareas.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="space-y-0.5 max-h-28 overflow-hidden">
                  {empleadosConTareas.map((empleadoDNI) => {
                    const grupo = tareasAgrupadas[empleadoDNI];
                    const primeraTarea = grupo.tareas[0];
                    const estaExpandido = empleadoExpandido?.dia === dia && empleadoExpandido?.empleadoDNI === empleadoDNI;
                    
                    return (
                      <div key={empleadoDNI}>
                        {/* Tarea principal del empleado */}
                        <div
                          className={`text-xs p-1.5 rounded border-l-3 cursor-pointer transition-all duration-200 hover:shadow-sm hover:scale-102 ${obtenerColorEstado(primeraTarea.Estado)} ${obtenerColorPrioridad(primeraTarea.Prioridad)}`}
                          title={`${primeraTarea.Titulo} - ${primeraTarea.Estado} - ${primeraTarea.Prioridad} - Progreso: ${primeraTarea.Progreso || 0}%`}
                          onClick={() => setEmpleadoExpandido(estaExpandido ? null : { dia, empleadoDNI })}
                        >
                          <div className="truncate font-medium text-slate-800 leading-tight">{primeraTarea.Titulo}</div>
                          <div className="flex items-center justify-between mt-0.5">
                            <div className="text-xs opacity-75 truncate flex-1 leading-tight">
                              {grupo.empleado?.NombreCompleto || empleadoDNI}
                            </div>
                            <div className="flex items-center space-x-1">
                              {primeraTarea.Progreso !== undefined && (
                                <div className="text-xs font-medium text-slate-600">
                                  {primeraTarea.Progreso}%
                                </div>
                              )}
                              {grupo.tareas.length > 1 && (
                                <div className="text-xs text-slate-500">
                                  +{grupo.tareas.length - 1}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Tareas adicionales del empleado (si está expandido) */}
                        {estaExpandido && grupo.tareas.slice(1).map((tarea) => (
                          <div
                            key={tarea.Id}
                            className={`text-xs p-1.5 rounded border-l-3 cursor-pointer transition-all duration-200 hover:shadow-sm hover:scale-102 ml-2 ${obtenerColorEstado(tarea.Estado)} ${obtenerColorPrioridad(tarea.Prioridad)}`}
                            title={`${tarea.Titulo} - ${tarea.Estado} - ${tarea.Prioridad} - Progreso: ${tarea.Progreso || 0}%`}
                            onClick={() => setTareaSeleccionada(tarea)}
                          >
                            <div className="truncate font-medium text-slate-800 leading-tight">{tarea.Titulo}</div>
                            <div className="flex items-center justify-between mt-0.5">
                              <div className="text-xs opacity-75 truncate flex-1 leading-tight">
                                {grupo.empleado?.NombreCompleto || empleadoDNI}
                              </div>
                              {tarea.Progreso !== undefined && (
                                <div className="text-xs font-medium text-slate-600">
                                  {tarea.Progreso}%
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leyenda mejorada */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl shadow-lg border border-slate-200 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <div className="p-2 bg-slate-200 rounded-lg">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800">Guía de Colores</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center">
              <span className="mr-2">📊</span> Estados
            </h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-amber-100 border-2 border-amber-300 rounded-lg flex items-center justify-center">
                  <span className="text-xs">⏳</span>
                </div>
                <span className="text-sm font-medium text-slate-700">Pendiente</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-blue-100 border-2 border-blue-300 rounded-lg flex items-center justify-center">
                  <span className="text-xs">🔄</span>
                </div>
                <span className="text-sm font-medium text-slate-700">En Progreso</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-100 border-2 border-green-300 rounded-lg flex items-center justify-center">
                  <span className="text-xs">✅</span>
                </div>
                <span className="text-sm font-medium text-slate-700">Completada</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center">
              <span className="mr-2">⚡</span> Prioridades
            </h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-l-4 border-red-500 bg-red-50 rounded-lg flex items-center justify-center">
                  <span className="text-xs">🚨</span>
                </div>
                <span className="text-sm font-medium text-slate-700">Alta</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-l-4 border-yellow-500 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <span className="text-xs">⚠️</span>
                </div>
                <span className="text-sm font-medium text-slate-700">Media</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-l-4 border-green-500 bg-green-50 rounded-lg flex items-center justify-center">
                  <span className="text-xs">✅</span>
                </div>
                <span className="text-sm font-medium text-slate-700">Baja</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center">
              <span className="mr-2">💡</span> Consejos
            </h4>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-start space-x-2">
                <span className="text-blue-500">•</span>
                <span>Haz clic en una tarea para ver detalles</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-500">•</span>
                <span>El día actual se resalta en azul</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-amber-500">•</span>
                <span>Los fines de semana aparecen atenuados</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-purple-500">•</span>
                <span>El número muestra tareas por día</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de detalles de tarea */}
      {tareaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Detalles de la Tarea</h3>
                <button
                  onClick={() => setTareaSeleccionada(null)}
                  className="text-white/80 hover:text-white text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">📝 Título</h4>
                <p className="text-slate-700">{tareaSeleccionada.Titulo}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">👤 Responsable</h4>
                  <p className="text-slate-700">
                    {empleados.find(e => e.DNI === tareaSeleccionada.Responsable)?.NombreCompleto || tareaSeleccionada.Responsable}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">📊 Estado</h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${obtenerColorEstado(tareaSeleccionada.Estado)}`}>
                    {tareaSeleccionada.Estado}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">⚡ Prioridad</h4>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${obtenerColorPrioridad(tareaSeleccionada.Prioridad)}`}>
                    {tareaSeleccionada.Prioridad}
                  </span>
                </div>
                
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">📈 Progreso</h4>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${tareaSeleccionada.Progreso || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      {tareaSeleccionada.Progreso || 0}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">📅 Fecha Inicio</h4>
                  <p className="text-slate-700">{formatDate(tareaSeleccionada.FechaInicio)}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">📅 Fecha Fin</h4>
                  <p className="text-slate-700">{formatDate(tareaSeleccionada.FechaFin)}</p>
                </div>
              </div>
              
              {tareaSeleccionada.Observaciones && (
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">💬 Observaciones</h4>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-lg">
                    {tareaSeleccionada.Observaciones}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
