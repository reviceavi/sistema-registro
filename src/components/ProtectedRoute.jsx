import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Login from './Login';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-burgundy via-burgundy-dark to-primary-gold flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-white border-t-transparent mx-auto"></div>
            <div 
              className="absolute inset-0 rounded-full h-20 w-20 border-4 border-primary-gold border-t-transparent mx-auto animate-spin" 
              style={{ animationDirection: 'reverse', animationDuration: '3s' }}
            ></div>
          </div>
          <div className="mt-8 space-y-4">
            <h3 className="text-2xl font-bold text-white">Verificando acceso...</h3>
            <p className="text-white/80 text-lg">Sistema de Registro - Ciudad de México</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return children;
};

export default ProtectedRoute;
