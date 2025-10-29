import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError('Por favor, completa todos los campos');
      setLoading(false);
      return;
    }

    try {
      const result = await login(formData.email, formData.password);
      if (!result.success) {
        setError(result.error || 'Error al autenticar');
        setLoading(false);
        return;
      }

      // Login exitoso — redirigir a inicio
      setLoading(false);
      window.location.href = '/';
    } catch (err) {
      setError('Error de red o servidor');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" 
         style={{background: 'linear-gradient(135deg, #b28e5c 0%, #9d2148 100%)'}}>
      
      {/* Contenedor principal 33% más amplio */}
      <div className="w-full max-w-md">
        
        {/* Logo y título compacto */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-28 h-28 bg-white rounded-full mb-4 shadow-2xl overflow-hidden border-4 border-white/20 backdrop-blur-sm">
            <img 
              src="/logos/Logo_CEAVI.png" 
              alt="Logo CEAVI" 
              className="w-18 h-18 object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-xl font-bold text-white mb-2 drop-shadow-lg">
            Sistema de Registro de Víctimas
          </h1>
          <p className="text-white/80 text-sm drop-shadow-md">
            Ingresa tus credenciales para acceder
          </p>
        </div>

        {/* Contenedor del formulario - más compacto */}
        <div className="login-form-container bg-white rounded-xl shadow-xl p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50/90 border-2 border-red-200 rounded-xl backdrop-blur-sm">
              <div className="flex items-center">
                <AlertCircle className="login-icon h-4 w-4 text-red-500 mr-3 flex-shrink-0" />
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2 tracking-wide">
                CORREO ELECTRÓNICO
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="login-icon h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="login-input w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl 
                           focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 
                           transition-all duration-300 text-gray-900 text-base font-medium"
                  placeholder="Ingresa tu correo"
                />
              </div>
            </div>

            {/* Campo Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2 tracking-wide">
                CONTRASEÑA
              </label>
              <div className="relative z-0">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="login-icon h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="login-input w-full pl-12 pr-14 py-3 border-2 border-gray-200 rounded-xl 
                           focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 
                           transition-all duration-300 text-gray-900 text-base font-medium"
                  placeholder="•••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle-btn absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 z-10"
                >
                  {showPassword ? <EyeOff className="login-icon h-5 w-5" /> : <Eye className="login-icon h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Botón de login compacto */}
            <button
              type="submit"
              disabled={loading}
              className="login-button w-full py-4 px-6 rounded-xl 
                       focus:outline-none focus:ring-4 focus:ring-primary-500/30 
                       transition-all duration-400 font-bold text-base mt-6
                       disabled:opacity-60 disabled:cursor-not-allowed shadow-2xl"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent"></div>
                  <span className="tracking-wide">Verificando...</span>
                </div>
              ) : (
                <span className="tracking-wide">Iniciar Sesión</span>
              )}
            </button>
          </form>

          {/* Información de seguridad muy compacta */}
          <div className="mt-6 pt-4 border-t border-gray-200/50 space-y-2">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Lock className="login-icon w-4 h-4" />
              <span className="font-medium">Sistema seguro JWT</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <span className="text-base">🔒</span>
              <span className="font-medium">Conexión SSL/TLS</span>
            </div>
          </div>
        </div>

        {/* Footer compacto */}
        <div className="text-center mt-6">
          <p className="text-white/90 text-sm font-medium drop-shadow-md">
            ¿Problemas para acceder? Contacta al administrador
          </p>
          <p className="text-white/70 text-sm mt-2 drop-shadow-sm">
            Ciudad de México • CEAVI
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
