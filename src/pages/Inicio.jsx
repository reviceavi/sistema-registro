import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Search, FileText, Plus, AlertCircle, MessageSquare, ClipboardList, FileSignature } from 'lucide-react';
import HeaderInstitucional from '../components/HeaderInstitucional';
import LogoCEAVI from '../components/LogoCEAVI';
import './Inicio.css';



const Inicio = () => {
  const navigate = useNavigate();
  // Botones principales estáticos
  const mainFunctionalities = [
    {
      title: 'Padrón de Víctimas',
      description: 'Consulta el Padrón de Víctimas de la Ciudad de México',
      icon: Search,
      route: '/buscar-victimas',
      color: 'from-primary-600 to-primary-700'
    },
    {
      title: 'Control de Gestión',
      description: 'Gestiona expedientes, oficios y solicitudes',
      icon: FileText,
      route: '/control-gestion',
      color: 'from-dorado-600 to-dorado-700'
    },
    {
      title: 'Nuevo Registro',
      description: 'Registra nuevas víctimas y oficios',
      icon: Plus,
      route: '/nuevo-registro',
      color: 'from-primary-600 to-dorado-600'
    },
    {
      title: 'RelovIA',
      description: 'Agente de IA para asistencia y consulta normativa',
      icon: MessageSquare,
      route: '/relovia',
      color: 'from-indigo-600 to-purple-700'
    },
    {
      title: 'Registros',
      description: 'En desarrollo...',
      icon: ClipboardList,
      route: '/registros',
      color: 'from-green-600 to-emerald-700'
    },
    {
      title: 'Nuevo Oficio',
      description: 'Genera nuevos oficios con un editor simplificado',
      icon: FileSignature,
      route: '/nuevo-oficio',
      color: 'from-orange-600 to-red-700'
    }
  ];

  return (
    <div className="inicio-container min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <HeaderInstitucional />
      {/* Main Content - premium */}
      <main className="inicio-main max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-1">
        {/* Welcome Section - premium */}
        <div className="inicio-welcome mb-4 text-center">
          <h2 className="text-2xl font-bold text-primary-800 mb-2">
            Bienvenido a la Plataforma Informática
          </h2>
          <p className="text-base text-primary-600 mb-3">
            Selecciona una opción para comenzar
          </p>
        </div>
        {/* Botones principales premium */}
        <div className="inicio-buttons-container flex flex-wrap justify-center gap-3 mb-1">
          {/* Botón accesible sólo para usuarios autenticados (abre la ruta /buscar-victimas-nosql) */}
          {/** useAuth está disponible desde el contexto AuthProvider en la app raíz **/}
          {(() => {
            try {
              const { isAuthenticated } = useAuth();
              if (isAuthenticated) {
                return (
                  <>
                    <a
                      href="/buscar-cie"
                      target="_blank"
                      rel="noreferrer"
                      className="inicio-button bg-white rounded-xl shadow-lg border border-primary-200 p-4 hover:shadow-xl hover:scale-105 transition-all duration-200 text-left w-64"
                      style={{ height: '140px' }}
                    >
                      <div className="inicio-button-icon-container flex items-center mb-2">
                        <div className={`inicio-button-icon w-10 h-10 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 flex items-center justify-center shadow-md`}>
                          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M2 12h20"/></svg>
                        </div>
                      </div>
                      <h3 className="text-base font-semibold text-primary-800 mb-2">
                        Datos CIE
                      </h3>
                      <p className="text-primary-600 text-xs leading-relaxed">
                        Consulta los datos de reparación del CIE
                      </p>
                    </a>

                    <a
                      href="/buscar-victimas-nosql"
                      target="_blank"
                      rel="noreferrer"
                      className="inicio-button bg-white rounded-xl shadow-lg border border-primary-200 p-4 hover:shadow-xl hover:scale-105 transition-all duration-200 text-left w-64"
                      style={{ height: '140px' }}
                    >
                      <div className="inicio-button-icon-container flex items-center mb-2">
                        <div className={`inicio-button-icon w-10 h-10 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-700 flex items-center justify-center shadow-md`}>
                          {/* Icono simple */}
                          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
                        </div>
                      </div>
                      <h3 className="text-base font-semibold text-primary-800 mb-2">
                        Datos UPC
                      </h3>
                      <p className="text-primary-600 text-xs leading-relaxed">
                        Busca en la base de datos de atención a víctimas de UPC
                      </p>
                    </a>
                  </>
                );
              }
            } catch (e) {
              // Si el contexto no está disponible, no mostrar el botón
              return null;
            }
            return null;
          })()}
          {mainFunctionalities.map((func, index) => (
            <button
              key={index}
              onClick={() => navigate(func.route)}
              className="inicio-button bg-white rounded-xl shadow-lg border border-primary-200 p-4 hover:shadow-xl hover:scale-105 transition-all duration-200 text-left w-64"
              style={{ height: '140px' }}
            >
              <div className="inicio-button-icon-container flex items-center mb-2">
                <div className={`inicio-button-icon w-10 h-10 rounded-lg bg-gradient-to-r ${func.color} flex items-center justify-center shadow-md`}>
                  <func.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <h3 className="text-base font-semibold text-primary-800 mb-2">
                {func.title}
              </h3>
              <p className="text-primary-600 text-xs leading-relaxed">
                {func.description}
              </p>
            </button>
          ))}
        </div>

        {/* ...sin estadísticas ni estados... */}
      </main>
    </div>
  );
};

export default Inicio;
