import React, { useState, useEffect } from 'react';

const Calendar = ({ tareas, empleados, userDNI }) => {
  console.log('🚀 CALENDAR COMPONENT RENDERIZANDO - Props recibidas:', { tareas: tareas?.length, empleados: empleados?.length, userDNI });
  
  const [fechaActual, setFechaActual] = useState(new Date());
  const [vistaMes, setVistaMes] = useState(true); // true = mensual, false = semanal
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [diaExpandido, setDiaExpandido] = useState(null);
  const [empleadoExpandido, setEmpleadoExpandido] = useState(null); // {dia: X, empleadoDNI: 'Y'}
  const [diaSeleccionado, setDiaSeleccionado] = useState(null); // Para mostrar popup de tareas del día

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

  // Funciones para vista semanal
  const obtenerDiasDeLaSemana = (fecha) => {
    const dias = [];
    const lunes = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    // Ir al lunes de la semana (restar días hasta llegar al lunes)
    const diaSemana = lunes.getDay();
    const diasHastaLunes = diaSemana === 0 ? -6 : 1 - diaSemana; // Si es domingo, ir 6 días atrás
    lunes.setDate(lunes.getDate() + diasHastaLunes);
    
    // Generar los 7 días de la semana (Lunes a Domingo)
    for (let i = 0; i < 7; i++) {
      const dia = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + i);
      dias.push(dia);
    }
    return dias; // Ya está en orden Lunes a Domingo
  };

  const diasDeLaSemana = obtenerDiasDeLaSemana(fechaActual);

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
  const obtenerTareasDelDia = (dia, fechaEspecifica = null) => {
    let año, mes, diaNum;
    
    if (fechaEspecifica) {
      // Para vista semanal, usar la fecha específica
      año = fechaEspecifica.getFullYear();
      mes = fechaEspecifica.getMonth() + 1;
      diaNum = fechaEspecifica.getDate();
    } else {
      // Para vista mensual, usar la fecha actual del calendario
      año = fechaActual.getFullYear();
      mes = fechaActual.getMonth() + 1;
      diaNum = dia;
    }
    
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
      const estaEnRango = (año === añoInicio && mes === mesInicio && diaNum >= diaInicio && diaNum <= diaFin);
      
      return estaEnRango;
    });
  };

  // Función para agrupar tareas por empleado
  const agruparTareasPorEmpleado = (tareasDelDia) => {
    const agrupadas = {};
    tareasDelDia.forEach(tarea => {
      const empleadoDNI = tarea.Responsable;
      const esPropia = empleadoDNI === userDNI;
      
      if (!agrupadas[empleadoDNI]) {
        agrupadas[empleadoDNI] = {
          empleado: empleados.find(e => e.DNI === empleadoDNI),
          tareas: [],
          esPropia: esPropia
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

  // Función para obtener el estilo de la tarea según si es propia o de subordinado
  const obtenerEstiloTarea = (tarea, esPropia, esVistaSemanal = false) => {
    const baseStyle = esVistaSemanal 
      ? 'text-xs p-3 rounded border-l-3 cursor-pointer transition-all duration-200 hover:shadow-sm hover:scale-102' 
      : 'text-xs p-1.5 rounded border-l-3 cursor-pointer transition-all duration-200 hover:shadow-sm hover:scale-102';
    const estadoStyle = obtenerColorEstado(tarea.Estado);
    const prioridadStyle = obtenerColorPrioridad(tarea.Prioridad);
    
    if (esPropia) {
      // Tarea propia - estilo más prominente
      return `${baseStyle} ${estadoStyle} ${prioridadStyle} bg-blue-50 border-blue-200 shadow-sm`;
    } else {
      // Tarea de subordinado - estilo normal
      return `${baseStyle} ${estadoStyle} ${prioridadStyle}`;
    }
  };

  // Función para obtener el icono según el tipo de tarea
  const obtenerIconoTarea = (esPropia) => {
    return esPropia ? '👤' : '👥';
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

  // Navegación para vista semanal
  const semanaAnterior = () => {
    const nuevaFecha = new Date(fechaActual);
    nuevaFecha.setDate(nuevaFecha.getDate() - 7);
    setFechaActual(nuevaFecha);
    setDiaExpandido(null);
    setEmpleadoExpandido(null);
  };

  const semanaSiguiente = () => {
    const nuevaFecha = new Date(fechaActual);
    nuevaFecha.setDate(nuevaFecha.getDate() + 7);
    setFechaActual(nuevaFecha);
    setDiaExpandido(null);
    setEmpleadoExpandido(null);
  };

  const irAHoy = () => {
    setFechaActual(new Date());
    setDiaExpandido(null); // Cerrar día expandido al ir a hoy
    setEmpleadoExpandido(null); // Cerrar empleado expandido al ir a hoy
    setDiaSeleccionado(null); // Cerrar popup de día seleccionado
  };

  return (
    <div className="space-y-3 h-screen overflow-hidden">
      {/* Header del calendario con estadísticas */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl shadow-lg p-4 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold">
                {vistaMes 
                  ? `${meses[fechaActual.getMonth()]} ${fechaActual.getFullYear()}`
                  : `Semana del ${diasDeLaSemana[0].getDate()} al ${diasDeLaSemana[6].getDate()} de ${meses[diasDeLaSemana[0].getMonth()]} ${diasDeLaSemana[0].getFullYear()}`
                }
              </h2>
            </div>
            
            {/* Toggle de vista */}
            <div className="flex items-center bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setVistaMes(true)}
                className={`px-4 py-2 rounded-md transition-all duration-200 font-medium ${
                  vistaMes 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                📅 Mensual
              </button>
              <button
                onClick={() => {
                  setVistaMes(false);
                  // Al cambiar a vista semanal, ir a la semana actual
                  setFechaActual(new Date());
                }}
                className={`px-4 py-2 rounded-md transition-all duration-200 font-medium ${
                  !vistaMes 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                📊 Semanal
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              {vistaMes ? (
                <>
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
                    onClick={mesSiguiente}
                    className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-105"
                    title="Mes siguiente"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={semanaAnterior}
                    className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-105"
                    title="Semana anterior"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={semanaSiguiente}
                    className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-105"
                    title="Semana siguiente"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
              
              <button
                onClick={irAHoy}
                className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all duration-200 hover:scale-105 font-medium"
              >
                📅 Hoy
              </button>
              
              {vistaMes && (
                <button
                  onClick={() => setFechaActual(new Date(2025, 8, 1))} // Septiembre 2025 (mes 8 porque es 0-indexado)
                  className="px-4 py-2 bg-green-500/80 text-white rounded-lg hover:bg-green-500 transition-all duration-200 hover:scale-105 font-medium"
                >
                  🎯 Sep 2025
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Estadísticas del mes */}
        <div className="grid grid-cols-5 gap-3">
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">📋</span>
              </div>
              <div>
                <div className="text-xl font-bold">{estadisticas.total}</div>
                <div className="text-sm text-white/80">Total</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">⏳</span>
              </div>
              <div>
                <div className="text-xl font-bold">{estadisticas.pendientes}</div>
                <div className="text-sm text-white/80">Pendientes</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🔄</span>
              </div>
              <div>
                <div className="text-xl font-bold">{estadisticas.enProgreso}</div>
                <div className="text-sm text-white/80">En Progreso</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">✅</span>
              </div>
              <div>
                <div className="text-xl font-bold">{estadisticas.completadas}</div>
                <div className="text-sm text-white/80">Completadas</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🚨</span>
              </div>
              <div>
                <div className="text-xl font-bold">{estadisticas.altaPrioridad}</div>
                <div className="text-sm text-white/80">Alta Prioridad</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendario */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl shadow-lg border border-slate-200 overflow-hidden flex-1">
        {/* Header del calendario */}
        <div className="bg-gradient-to-r from-slate-100 to-slate-200 border-b border-slate-300">
          <div className="grid grid-cols-7">
            {vistaMes ? (
              // Vista mensual: Domingo a Sábado
              diasSemana.map((dia) => (
                <div key={dia} className="p-3 text-center text-sm font-bold text-slate-700 border-r border-slate-300 last:border-r-0">
                  {dia}
                </div>
              ))
            ) : (
              // Vista semanal: Lunes a Domingo
              ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia) => (
                <div key={dia} className="p-3 text-center text-sm font-bold text-slate-700 border-r border-slate-300 last:border-r-0">
                  {dia}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Días del calendario */}
        <div className="grid grid-cols-7">
          {vistaMes ? (
            <>
              {/* Días vacíos del mes anterior */}
              {Array.from({ length: diaInicioSemana }, (_, i) => (
                <div key={`empty-${i}`} className="h-36 border-r border-b border-slate-300 bg-slate-100/50"></div>
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
                    className={`h-36 border-r border-b border-slate-300 p-3 group transition-all duration-200 cursor-pointer ${
                      esHoy 
                        ? 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-400' 
                        : esFinDeSemana 
                        ? 'bg-slate-50/80' 
                        : 'bg-white hover:bg-slate-50'
                    }`}
                    onClick={() => {
                      if (tareasDelDia.length > 0) {
                        setDiaSeleccionado({ dia, tareas: tareasDelDia, fecha: new Date(fechaActual.getFullYear(), fechaActual.getMonth(), dia) });
                      }
                    }}
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
                      {tareasDelDia.length > 0 && (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          esHoy 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          {tareasDelDia.length} tarea{tareasDelDia.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 max-h-24 overflow-hidden">
                      {empleadosConTareas.map((empleadoDNI) => {
                        const grupo = tareasAgrupadas[empleadoDNI];
                        const primeraTarea = grupo.tareas[0];
                        const estaExpandido = empleadoExpandido?.dia === dia && empleadoExpandido?.empleadoDNI === empleadoDNI;
                        
                        return (
                          <div key={empleadoDNI}>
                            {/* Tarea principal del empleado */}
                            <div
                              className={obtenerEstiloTarea(primeraTarea, grupo.esPropia)}
                              title={`${obtenerIconoTarea(grupo.esPropia)} ${primeraTarea.Titulo} - ${primeraTarea.Estado} - ${primeraTarea.Prioridad} - Progreso: ${primeraTarea.Progreso || 0}%`}
                              onClick={(e) => {
                                e.stopPropagation(); // Evitar que se abra el popup del día
                                setEmpleadoExpandido(estaExpandido ? null : { dia, empleadoDNI });
                              }}
                            >
                              <div className="flex items-center space-x-1">
                                <span className="text-xs">{obtenerIconoTarea(grupo.esPropia)}</span>
                                <div className="truncate font-medium text-slate-800 leading-tight flex-1">
                                  {primeraTarea.Titulo}
                                </div>
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <div className="text-xs opacity-75 truncate flex-1 leading-tight">
                                  {grupo.esPropia ? 'Mi tarea' : (grupo.empleado?.NombreCompleto || empleadoDNI)}
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
                                className={`${obtenerEstiloTarea(tarea, grupo.esPropia)} ml-2`}
                                title={`${obtenerIconoTarea(grupo.esPropia)} ${tarea.Titulo} - ${tarea.Estado} - ${tarea.Prioridad} - Progreso: ${tarea.Progreso || 0}%`}
                                onClick={(e) => {
                                  e.stopPropagation(); // Evitar que se abra el popup del día
                                  setTareaSeleccionada(tarea);
                                }}
                              >
                                <div className="flex items-center space-x-1">
                                  <span className="text-xs">{obtenerIconoTarea(grupo.esPropia)}</span>
                                  <div className="truncate font-medium text-slate-800 leading-tight flex-1">
                                    {tarea.Titulo}
                                  </div>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <div className="text-xs opacity-75 truncate flex-1 leading-tight">
                                    {grupo.esPropia ? 'Mi tarea' : (grupo.empleado?.NombreCompleto || empleadoDNI)}
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
            </>
          ) : (
            /* Vista semanal */
            diasDeLaSemana.map((dia, index) => {
              const tareasDelDia = obtenerTareasDelDia(null, dia);
              const tareasAgrupadas = agruparTareasPorEmpleado(tareasDelDia);
              const empleadosConTareas = Object.keys(tareasAgrupadas);
              const esHoy = new Date().toDateString() === dia.toDateString();
              const esFinDeSemana = [0, 6].includes(dia.getDay());

              return (
                <div
                  key={index}
                  className={`h-[calc(100vh-200px)] border-r border-b border-slate-300 p-2 group transition-all duration-200 cursor-pointer ${
                    esHoy 
                      ? 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-400' 
                      : esFinDeSemana 
                      ? 'bg-slate-50/80' 
                      : 'bg-white hover:bg-slate-50'
                  }`}
                  onClick={() => {
                    if (tareasDelDia.length > 0) {
                      console.log('🔍 DEBUG Vista Semanal - Día clickeado:', {
                        fecha: dia,
                        diaSemana: dia.getDay(),
                        nombreDia: dia.toLocaleDateString('es-ES', { weekday: 'long' }),
                        diaNumero: dia.getDate()
                      });
                      setDiaSeleccionado({ dia: dia.getDate(), tareas: tareasDelDia, fecha: dia });
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className={`text-sm font-bold ${
                        esHoy 
                          ? 'text-blue-800' 
                          : esFinDeSemana 
                          ? 'text-slate-500' 
                          : 'text-slate-800'
                      }`}>
                        {dia.getDate()}
                      </span>
                      <div className={`text-xs ${
                        esHoy 
                          ? 'text-blue-600' 
                          : esFinDeSemana 
                          ? 'text-slate-400' 
                          : 'text-slate-500'
                      }`}>
                        {diasSemana[dia.getDay()]}
                      </div>
                    </div>
                    {tareasDelDia.length > 0 && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        esHoy 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {tareasDelDia.length} tarea{tareasDelDia.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
                    {empleadosConTareas.map((empleadoDNI) => {
                      const grupo = tareasAgrupadas[empleadoDNI];
                      
                      return (
                        <div key={empleadoDNI} className="space-y-1">
                          {/* Header del empleado */}
                          <div className="flex items-center space-x-1 mb-1">
                            <span className="text-xs font-semibold text-slate-600">
                              {obtenerIconoTarea(grupo.esPropia)}
                            </span>
                            <span className="text-xs font-medium text-slate-700 truncate">
                              {grupo.esPropia ? 'Mis tareas' : (grupo.empleado?.NombreCompleto || empleadoDNI)}
                            </span>
                            <span className="text-xs text-slate-500">
                              ({grupo.tareas.length})
                            </span>
                          </div>
                          
                          {/* Tareas del empleado */}
                          <div className="space-y-1 ml-3">
                            {grupo.tareas.map((tarea) => (
                              <div
                                key={tarea.Id}
                                className={obtenerEstiloTarea(tarea, grupo.esPropia, true)}
                                title={`${tarea.Titulo} - ${tarea.Estado} - ${tarea.Prioridad} - Progreso: ${tarea.Progreso || 0}%`}
                                onClick={(e) => {
                                  e.stopPropagation(); // Evitar que se abra el popup del día
                                  setTareaSeleccionada(tarea);
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-slate-800 truncate">
                                      {tarea.Titulo}
                                    </div>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full ${
                                        tarea.Estado === 'Pendiente' ? 'bg-amber-100 text-amber-800' :
                                        tarea.Estado === 'En Progreso' ? 'bg-blue-100 text-blue-800' :
                                        'bg-green-100 text-green-800'
                                      }`}>
                                        {tarea.Estado}
                                      </span>
                                      <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full ${
                                        tarea.Prioridad === 'Alta' ? 'bg-red-100 text-red-800' :
                                        tarea.Prioridad === 'Media' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-green-100 text-green-800'
                                      }`}>
                                        {tarea.Prioridad}
                                      </span>
                                    </div>
                                  </div>
                                  {tarea.Progreso !== undefined && (
                                    <div className="ml-2 flex-shrink-0">
                                      <div className="text-xs font-bold text-slate-700">
                                        {tarea.Progreso}%
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>


      {/* Modal de tareas del día */}
      {diaSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">📅 Tareas del {diaSeleccionado.fecha.toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</h3>
                  <p className="text-white/80 mt-1">{diaSeleccionado.tareas.length} tarea{diaSeleccionado.tareas.length > 1 ? 's' : ''} programada{diaSeleccionado.tareas.length > 1 ? 's' : ''}</p>
                </div>
                <button
                  onClick={() => setDiaSeleccionado(null)}
                  className="text-white/80 hover:text-white text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {diaSeleccionado.tareas.map((tarea) => {
                  const esPropia = tarea.Responsable === userDNI;
                  const empleado = empleados.find(e => e.DNI === tarea.Responsable);
                  
                  return (
                    <div
                      key={tarea.Id}
                      className={`p-4 rounded-lg border-l-4 cursor-pointer transition-all duration-200 hover:shadow-md ${obtenerColorEstado(tarea.Estado)} ${obtenerColorPrioridad(tarea.Prioridad)} ${esPropia ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}
                      onClick={() => {
                        setTareaSeleccionada(tarea);
                        setDiaSeleccionado(null);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-lg">{obtenerIconoTarea(esPropia)}</span>
                            <h4 className="font-semibold text-slate-800">{tarea.Titulo}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${obtenerColorEstado(tarea.Estado)}`}>
                              {tarea.Estado}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-slate-600">Responsable:</span>
                              <p className="text-slate-800">
                                {esPropia ? '👤 Mi tarea' : `👥 ${empleado?.NombreCompleto || tarea.Responsable}`}
                              </p>
                            </div>
                            
                            <div>
                              <span className="font-medium text-slate-600">Prioridad:</span>
                              <p className="text-slate-800">{tarea.Prioridad}</p>
                            </div>
                            
                            <div>
                              <span className="font-medium text-slate-600">Progreso:</span>
                              <div className="flex items-center space-x-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${tarea.Progreso || 0}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium text-slate-700">
                                  {tarea.Progreso || 0}%
                                </span>
                              </div>
                            </div>
                            
                            <div>
                              <span className="font-medium text-slate-600">Horario:</span>
                              <p className="text-slate-800">
                                {formatDate(tarea.FechaInicio)} - {formatDate(tarea.FechaFin)}
                              </p>
                            </div>
                          </div>
                          
                          {tarea.Observaciones && (
                            <div className="mt-3">
                              <span className="font-medium text-slate-600 text-sm">Observaciones:</span>
                              <p className="text-slate-700 text-sm bg-slate-50 p-2 rounded mt-1">
                                {tarea.Observaciones}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

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
