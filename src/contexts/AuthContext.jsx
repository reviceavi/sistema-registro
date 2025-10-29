import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Cargar sesión inicial desde localStorage (tabla users personalizada)
    const init = async () => {
      const storedUser = localStorage.getItem('ceavi_user');
      const storedToken = localStorage.getItem('ceavi_token');
      
      if (storedUser && storedToken) {
        try {
          const userData = JSON.parse(storedUser);
          // Verificar que el usuario sigue siendo válido en la tabla users
          const { data: userExists } = await supabase
            .from('users')
            .select('id, email, username, is_active')
            .eq('email', userData.email)
            .eq('is_active', true)
            .single();
            
          if (userExists) {
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            // Limpiar datos inválidos
            localStorage.removeItem('ceavi_user');
            localStorage.removeItem('ceavi_token');
          }
        } catch (error) {
          console.log('Sesión expirada o inválida');
          localStorage.removeItem('ceavi_user');
          localStorage.removeItem('ceavi_token');
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  // Eliminado verifyUser legado (Django)

  const login = async (email, password) => {
    try {
      console.log('🔐 Intentando login (proxy fallback si está configurado)...');

      const proxyUrl = import.meta.env.VITE_AUTH_PROXY_URL || process.env.VITE_AUTH_PROXY_URL;
      let remoteUser = null;

      if (proxyUrl) {
        // Llamar al proxy server-side (recomendado)
        try {
          const resp = await fetch(proxyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          if (!resp.ok) {
            const errBody = await resp.json().catch(() => ({}));
            console.error('Auth proxy error', resp.status, errBody);
            return { success: false, error: errBody.error || 'Error al autenticar' };
          }
          const body = await resp.json();
          remoteUser = body.user;
        } catch (err) {
          console.error('Error llamando al proxy', err);
          return { success: false, error: 'Error de red al autenticar' };
        }
      } else {
        // Llamada RPC centralizada: authenticate_user
        const { data, error } = await supabase.rpc('authenticate_user', { p_email: email, p_password: password });

        if (error) {
          console.error('RPC error', error);
          // Mensaje genérico para no filtrar información
          return { success: false, error: 'Error al autenticar' };
        }

        if (!data || data.length === 0) {
          console.log('❌ Usuario no encontrado o contraseña inválida (RPC devolvió vacío)');
          return { success: false, error: 'Email o contraseña incorrectos' };
        }

        remoteUser = data[0];
      }

      // Crear sesión local
      const userSession = {
        id: remoteUser.id,
        email: remoteUser.email,
        username: remoteUser.username
      };

      // Generar token simple (en producción usar JWT)
      const sessionToken = btoa(`${remoteUser.id}:${Date.now()}`);

      // Guardar en localStorage
      localStorage.setItem('ceavi_user', JSON.stringify(userSession));
      localStorage.setItem('ceavi_token', sessionToken);

      setUser(userSession);
      setIsAuthenticated(true);
      console.log('✅ Login RPC exitoso');
      return { success: true, user: userSession };
    } catch (error) {
      console.error('❌ Error en login:', error);
      return { success: false, error: 'Error de autenticación' };
    }
  };

  // Función para verificar contraseña (simplificada para compatibilidad)
  const verifyPassword = async (plainPassword, hashedPassword) => {
    // Si el hash parece ser bcrypt, intentar comparación directa como fallback
    if (hashedPassword.startsWith('$2') || hashedPassword.startsWith('pbkdf2_sha256')) {
      // Hash de Django/bcrypt - comparación directa por ahora
      // En producción implementar verificación apropiada
      console.log('🔍 Verificando hash de Django...');
      return false; // Por ahora retornar false para forzar actualización
    }
    
    // Hash simple para desarrollo/transición
    const simpleHash = btoa(plainPassword);
    return simpleHash === hashedPassword;
  };

  const logout = async () => {
    console.log('🚪 Cerrando sesión...');
    localStorage.removeItem('ceavi_user');
    localStorage.removeItem('ceavi_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Función para refrescar el token (adaptada para tabla users)
  const refreshToken = async () => {
    const storedUser = localStorage.getItem('ceavi_user');
    const storedToken = localStorage.getItem('ceavi_token');
    
    if (!storedUser || !storedToken) return false;
    
    try {
      const userData = JSON.parse(storedUser);
      const { data: userExists } = await supabase
        .from('users')
        .select('id, is_active')
        .eq('id', userData.id)
        .eq('is_active', true)
        .single();
        
      return !!userExists;
    } catch {
      return false;
    }
  };

  // Función utilitaria para hacer peticiones autenticadas (usando la nueva API)
  const authenticatedFetch = async (_url, _options = {}) => {
    throw new Error('authenticatedFetch legacy no disponible: backend Django retirado');
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    authenticatedFetch
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
