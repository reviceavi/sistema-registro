import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Search, FileText, Plus, Home, Settings, Bot } from 'lucide-react';
import logoCDMX from '../assets/logos/Logo_CDMX.png';

const Navigation = () => {
  const navigate = useNavigate();

  const navItems = [
    {
      to: '/',
      icon: Home,
      label: 'Inicio',
      exact: true
    },
    {
      to: '/buscar-victimas',
      icon: Search,
      label: 'Buscar Víctimas'
    },
    {
      to: '/control-gestion',
      icon: Settings,
      label: 'Control de Gestión'
    },
    {
      to: '/nuevo-registro',
      icon: Plus,
      label: 'Nuevo Registro'
    },
    {
      to: '/relovia',
      icon: Bot,
      label: 'RelovIA'
    }
  ];

  return (
    <nav className="nav hidden md:block" style={{backgroundColor: '#9d2148', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}>
      <div className="container mx-auto px-2">
        <div className="flex items-center justify-between h-8">
          
          {/* Logo clickeable más compacto */}
          <div className="flex items-center space-x-1.5">
            <button 
              onClick={() => navigate('/')}
              className="bg-gradient-to-br from-primary-burgundy to-primary-gold rounded flex items-center justify-center p-0.5 hover:opacity-90 transition-opacity cursor-pointer border-0"
              style={{ border: 'none', boxShadow: 'none' }}
            >
              <img 
                src={logoCDMX} 
                alt="Logo CDMX" 
                className="w-4 h-4 object-contain"
                style={{ border: 'none', boxShadow: 'none' }}
              />
            </button>
            <span className="text-xs font-medium truncate" style={{color: '#ffffff'}}>
              Plataforma Informática del Registro de Víctimas
            </span>
          </div>

          {/* Navigation Links más compacto */}
          <div className="flex items-center space-x-0.5">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                  end={item.exact}
                >
                  <IconComponent className="w-3 h-3" />
                  <span className="hidden lg:inline text-xs">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
