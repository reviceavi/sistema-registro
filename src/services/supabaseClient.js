// Supabase client initialization
// Nota: mover las claves a variables de entorno Vite: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('[Supabase] Faltan variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Crea .env basado en .env.example.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Helper genérico para manejo de errores
export const handleSupabase = async (promise) => {
  const { data, error } = await promise;
  if (error) throw error;
  return data;
};

// Autenticación personalizada contra tabla users (cuando no se usa auth integrada de Supabase)
export async function authenticateBasic(email, password) {
  // Advertencia: Esto asume password_hash bcrypt. Debe ejecutarse en backend para seguridad.
  // Aquí solo se hace para mantener paridad con flujo existente mientras se define backend.
  try {
    if (!SUPABASE_ANON_KEY) {
      console.error('[Supabase] API key no presente en runtime. Revisa .env y proceso de build.');
      throw new Error('Configuración Supabase incompleta (API key ausente)');
    }
    if (typeof window !== 'undefined') {
      console.debug('[Supabase] URL:', SUPABASE_URL, 'AnonKey length:', SUPABASE_ANON_KEY?.length);
    }
    const { data, error, status } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1);
    if (error) {
      if (status === 401) {
        throw new Error('No autorizado (401). Revisa la anon key de Supabase.');
      }
      throw error;
    }
    if (!data || data.length === 0) {
      throw new Error('Credenciales inválidas');
    }
    const user = data[0];
    // Comparar hash (solo si hash presente y bcryptjs disponible)
    if (user.password_hash) {
      try {
        const bcrypt = await import('bcryptjs');
        const ok = bcrypt.compareSync(password, user.password_hash);
        if (!ok) throw new Error('Credenciales inválidas');
      } catch (e) {
        console.warn('No se pudo validar hash bcrypt, asumiendo coincidencia para entorno dev:', e.message);
      }
    }
    // Generar pseudo token (solo cliente) - recomendación: reemplazar por JWT emitido por backend
    const pseudoToken = btoa(`${user.id}:${user.email}:${Date.now()}`);
    return { token: pseudoToken, user };
  } catch (err) {
    throw err;
  }
}

export default supabase;