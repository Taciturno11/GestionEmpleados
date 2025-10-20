import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

const Login = ({ onLogin }) => {
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!dni.trim() || !password.trim()) {
      setError('Por favor ingresa usuario y contraseña');
      return;
    }

    if (dni.trim() !== password.trim()) {
      setError('El usuario y la contraseña deben ser iguales (DNI)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Limpiar localStorage antes del login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/auth/login`, { 
        dni: dni.trim(), 
        password: password.trim() 
      });
      
      const { token, user } = response.data;
      
      // Guardar en localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      onLogin(user, token);
    } catch (error) {
      console.error('Error en login:', error);
      setError(error.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-logo">
          <img src="/partnerlogo.svg" alt="Partner Logo" />
        </div>
        
        <h1>Sistema de Gestión de Tareas</h1>
        <p className="login-subtitle">Ingresa con tu DNI</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="dni">DNI</label>
            <input
              type="text"
              id="dni"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="Ingresa tu DNI"
              required
              maxLength="12"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu DNI como contraseña"
              required
              maxLength="12"
            />
          </div>

          {error && (
            <div className="login-error">
              ⚠️ {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-login"
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="login-footer">
          <p>Partner - Sistema de Gestión de Tareas</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
