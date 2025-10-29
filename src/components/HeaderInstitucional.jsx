import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, ChevronDown, Menu, X, Search, Settings, Plus, Home, Bot, MoreVertical, FileText } from 'lucide-react';
import './HeaderInstitucional.css';

const HeaderInstitucional = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    // No redireccionar manualmente - ProtectedRoute se encarga automáticamente
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  // Opciones de navegación para el menú móvil
  const navigationItems = [
    {
      path: '/',
      label: 'Inicio',
      icon: Home,
      exact: true
    },
    {
      path: '/buscar-victimas',
      label: 'Buscar Víctimas',
      icon: Search
    },
      {
        path: '/nuevo-oficio',
        label: 'Nuevo Oficio',
        icon: FileText
      },
    {
      path: '/control-gestion',
      label: 'Control de Gestión',
      icon: Settings
    },
    {
      path: '/nuevo-registro',
      label: 'Nuevo Registro',
      icon: Plus
    },
    {
      path: '/relovia',
      label: 'RelovIA',
      icon: Bot
    }
  ];

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Bloque de marca integrado - Logo + Texto */}
          <div className="flex items-center space-x-3">
            <img 
              src="/logos/Logo_CEAVI.png" 
              alt="CEAVI" 
              className="h-8 w-auto"
            />
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-gray-900 leading-tight">CEAVI</h1>
              <p className="text-sm font-normal text-gray-600 -mt-1">Plataforma Informática del Registro de Víctimas</p>
            </div>
          </div>

          {/* Navegación de escritorio - Solo pantallas grandes (lg+) */}
          <nav className="hidden lg:flex items-center space-x-2">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = item.exact
                ? window.location.pathname === item.path
                : window.location.pathname.startsWith(item.path) && item.path !== '/';
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <IconComponent className="w-4 h-4 flex-shrink-0" />
                </button>
              );
            })}
          </nav>

          {/* Controles de la derecha */}
          <div className="flex items-center space-x-2">
            
            {/* Botón hamburguesa - Solo móvil y tablet (hasta lg) */}
            <div className="lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                aria-label="Menú de navegación"
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Usuario minimalista */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <User className="w-5 h-5" />
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">
                      {user.first_name && user.last_name 
                        ? `${user.first_name} ${user.last_name}`
                        : user.username
                      }
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown minimalista */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.username}</p>
                      <p className="text-xs text-gray-500">
                        {user.is_superuser ? 'Administrador' : 'Usuario'}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Cerrar Sesión
                    </button>
                  </div>
                )}

                {/* Overlay para cerrar dropdown */}
                {dropdownOpen && (
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Menú de navegación móvil - Solo hasta lg */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white">
            <div className="px-2 py-3 space-y-1">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = item.exact 
                  ? window.location.pathname === item.path
                  : window.location.pathname.startsWith(item.path) && item.path !== '/';
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center space-x-3 px-3 py-3 text-left rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-primary-50 text-primary-700 font-medium' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <IconComponent className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Overlay para cerrar menú */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-25 z-30"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </div>
    </header>
  );
};

export default HeaderInstitucional;
