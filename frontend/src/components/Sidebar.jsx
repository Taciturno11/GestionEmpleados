import React from 'react';

const Sidebar = ({ vistaActiva, setVistaActiva, user }) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: user?.isSupremeBoss ? 'Dashboard General' : 'Mi Equipo',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
        </svg>
      )
    },
    {
      id: 'calendario',
      label: user?.isSupremeBoss ? 'Calendario General' : 'Calendario del Equipo',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'feedback-equipo',
      label: user?.isSupremeBoss ? 'Feedback General' : 'Feedback del Equipo',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 h-screen fixed left-0 top-0 z-40">
      {/* Logo y título */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620.79 618.96" className="h-8 w-auto mr-3">
            <defs>
              <style>{`.cls-1{fill:#fe7f2d;}.cls-2{fill:#297373;}`}</style>
            </defs>
            <g id="Capa_2" data-name="Capa 2">
              <g id="Capa_1-2" data-name="Capa 1">
                <path className="cls-1" d="M620.79,309.48A313,313,0,0,1,619,343.21q-1,9-2.45,17.85a308,308,0,0,1-37,103.16q-5.71,9.91-12.14,19.37a312.58,312.58,0,0,1-84.22,83.79q-9.24,6.2-18.94,11.75a308.4,308.4,0,0,1-103.16,36.62q-13.15,2.18-26.68,3.21h-48q-14.44-1.1-28.49-3.52a307.67,307.67,0,0,1-103.15-37.35Q146,573,137.62,567.38a311.79,311.79,0,0,1-86-86.5q-5.41-8.14-10.32-16.66a310,310,0,0,1-23.71-51.58h.37A225.7,225.7,0,0,0,46,464.22c1.8,2.49,3.67,4.94,5.58,7.36A228.12,228.12,0,0,0,98,515.8q2.53,1.83,5.13,3.55a225.73,225.73,0,0,0,103.16,37.33,228.21,228.21,0,0,0,51.58-.55A225.55,225.55,0,0,0,361.07,516l.27-.2a228.05,228.05,0,0,0,51.31-50.59c.25-.33.48-.67.72-1a225.83,225.83,0,0,0,41.25-103.16,228.3,228.3,0,0,0,2-30.11c0-7.24-.34-14.41-1-21.47a225.29,225.29,0,0,0-36.25-103.16q-3.23-4.89-6.7-9.62a227.79,227.79,0,0,0-40-42q-5.64-4.59-11.59-8.83-8.58-6.1-17.75-11.42a171.46,171.46,0,0,1,69.33-29.68q5.36-1,10.83-1.65a174.32,174.32,0,0,1,40.75,0v0h.43a170.74,170.74,0,0,1,51.15,14.39A172.62,172.62,0,0,1,567.39,154c.25.26.5.51.74.77a171.87,171.87,0,0,1,34.23,51.58A169.38,169.38,0,0,1,609.69,227l.42,1.52.69,2.59.54,2.17q3.09,12.15,5.18,24.67,1.49,8.84,2.45,17.84A313.31,313.31,0,0,1,620.79,309.48Z"/>
                <path className="cls-2" d="M603.24,206.32h-.88a171.87,171.87,0,0,0-34.23-51.58c-.24-.26-.49-.51-.74-.77a172.62,172.62,0,0,0-51.58-36.42,170.74,170.74,0,0,0-51.15-14.39l-.43,0a174.32,174.32,0,0,0-40.75,0q-5.48.65-10.83,1.65a171.46,171.46,0,0,0-69.33,29.68A172.8,172.8,0,0,0,320,154.74q-5.55,5.74-10.54,12a171.43,171.43,0,0,0-36.8,91.16q-.75,8-.75,16.18a172.67,172.67,0,0,0,3.64,35.4H275c.63,1.81,1.23,3.65,1.78,5.49a.07.07,0,0,1,0,.06c.64,2.61,1.33,5.19,2.09,7.75a138.37,138.37,0,0,1,3.79,32.27q0,3-.13,6a137.43,137.43,0,0,1-24.67,73.05,139.48,139.48,0,0,1-28.55,30.11A137.86,137.86,0,0,1,154.75,493c-3.43.26-6.9.39-10.38.39a137.72,137.72,0,0,1-85-29.17q-4-3.15-7.81-6.57a138.77,138.77,0,0,1-33-45,141.43,141.43,0,0,1-5.78-14.83l-.24-.76-.15-.54q-1.47-5-2.75-10a1.6,1.6,0,0,1-.05-.21c-.25-1-.5-2-.74-3-.11-.43-.21-.87-.31-1.29q-2.37-10.32-3.78-21H4.27a313.67,313.67,0,0,1,0-103.16,308,308,0,0,1,37-103.16q4.91-8.52,10.32-16.66a312.13,312.13,0,0,1,86-86.5q8.37-5.64,17.13-10.71A307.67,307.67,0,0,1,257.9,3.52q14-2.41,28.49-3.52h48q13.51,1,26.68,3.21A308.4,308.4,0,0,1,464.23,39.83q9.69,5.54,18.94,11.75a312.19,312.19,0,0,1,84.22,83.79q6.4,9.44,12.14,19.37A309.22,309.22,0,0,1,603.24,206.32Z"/>
              </g>
            </g>
          </svg>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Partner</h2>
            <p className="text-xs text-gray-500">Design Thinking</p>
          </div>
        </div>
      </div>

      {/* Información del usuario */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {user?.nombre?.charAt(0) || 'U'}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{user?.nombre || 'Usuario'}</p>
            <p className="text-xs text-blue-600 font-semibold">
              {user?.isSupremeBoss ? '👑 Jefe Supremo' : 
               user?.cargoNombre ? `📋 ${user.cargoNombre}` : '👤 Usuario'}
            </p>
          </div>
        </div>
      </div>

      {/* Menú de navegación */}
      <nav className="mt-6">
        <div className="px-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Navegación
          </h3>
        </div>
        <div className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setVistaActiva(item.id)}
              className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg mx-2 transition-colors ${
                vistaActiva === item.id
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={`mr-3 ${vistaActiva === item.id ? 'text-blue-700' : 'text-gray-400'}`}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Información adicional */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          <p>Sistema de Gestión</p>
          <p>v1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
