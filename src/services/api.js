// services/api.js

// Configuración para producción
const API_BASE_URL = 'https://backend-registro-sa7u.onrender.com/api';
const AUTH_URL = 'https://backend-registro-sa7u.onrender.com/api/auth/jwt/create/';
const MEDIA_URL = 'https://backend-registro-sa7u.onrender.com/media';

// Configuración para desarrollo local (comentado para producción)
// const API_BASE_URL = 'http://localhost:8000/api';
// const AUTH_URL = 'http://localhost:8000/api/auth/jwt/create/';
// const MEDIA_URL = 'http://localhost:8000/media';

class APIService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.authURL = AUTH_URL;
    this.mediaURL = MEDIA_URL;
    this.token = localStorage.getItem('api_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('api_token', token);
    } else {
      localStorage.removeItem('api_token');
    }
  }

  getToken() {
    return this.token;
  }

  isAuthenticated() {
    return !!this.token;
  }

  async authenticate(email, password) {
    try {
      const response = await fetch(this.authURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error de autenticación');
      }

      const data = await response.json();
      
      // Almacenar el token
      this.setToken(data.access);
      
      // Obtener datos del usuario
      const userResponse = await this.request('/auth/users/me/');
      
      return {
        token: data.access,
        user: userResponse
      };
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  async request(endpoint, options = {}) {
    if (!endpoint) {
      throw new Error('Endpoint is required');
    }
    
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // If the caller provided a FormData body, remove the JSON content-type
    // so the browser can set the correct multipart/form-data boundary header.
    if (options && options.body && typeof FormData !== 'undefined' && options.body instanceof FormData) {
      delete defaultOptions.headers['Content-Type'];
    }

    if (this.token) {
      defaultOptions.headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401) {
        this.setToken(null);
        throw new Error('No autorizado. Por favor, inicie sesión nuevamente.');
      }

      if (!response.ok) {
        // Intentar obtener el error - solo una lectura del stream
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorData.message || errorMessage;
          } else {
            const errorText = await response.text();
            // Si es HTML de error de Django, extraer el título del error
            if (errorText.includes('<title>') && errorText.includes('</title>')) {
              const titleMatch = errorText.match(/<title>(.*?)<\/title>/);
              if (titleMatch) {
                errorMessage = titleMatch[1].replace(/\s+/g, ' ').trim();
              }
            }
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          // Usar el mensaje por defecto si falla el parsing
        }
        throw new Error(errorMessage);
      }

      // Verificar si la respuesta tiene contenido
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return response;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  get(endpoint, params = {}) {
    if (!endpoint || typeof endpoint !== 'string') {
      throw new Error('Invalid endpoint provided to get method');
    }
    
    const query = new URLSearchParams(params).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return this.request(url);
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Método especial para descargar PDFs
  async downloadPDF(oficioId, filename) {
    try {
      const response = await fetch(
        `${this.baseURL}/control-gestion/oficios-entrada/${oficioId}/archivo/`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'documento.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw new Error('Error al descargar el archivo. Intente nuevamente.');
    }
  }

  // Keep alive para evitar cold starts
  async keepAlive() {
    try {
      await this.get('/control-gestion/expedientes/');
      console.log('✅ API keep-alive successful');
    } catch (error) {
      console.log('⚠️ API keep-alive failed:', error);
    }
  }

  // Función para cerrar sesión
  logout() {
    this.setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('api_token');
    console.log('Usuario deslogueado exitosamente');
  }
}

// Cache simple para estadísticas
class StatsCache {
  constructor() {
    this.data = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutos
  }

  async get(key, fetcher) {
    const now = Date.now();
    const cached = this.data.get(key);
    
    if (!cached || (now - cached.timestamp) > this.ttl) {
      const data = await fetcher();
      this.data.set(key, { data, timestamp: now });
      return data;
    }
    
    return cached.data;
  }

  clear() {
    this.data.clear();
  }
}

// Instancia única de APIService
const api = new APIService();

// Auto-login para desarrollo/testing
const autoLogin = async () => {
  if (!api.isAuthenticated()) {
    try {
      console.log('Attempting auto-login...');
      const result = await api.authenticate('mcano.ceavi@gmail.com', 'TWAecKaA2');
      console.log('Auto-login successful:', result.user);
      
      // Guardar usuario en localStorage
      localStorage.setItem('user', JSON.stringify(result.user));
      
      return result;
    } catch (error) {
      console.error('Auto-login failed:', error);
      return null;
    }
  }
  return { token: api.getToken(), user: JSON.parse(localStorage.getItem('user') || '{}') };
};

// Ejecutar auto-login al cargar
if (typeof window !== 'undefined') {
  const ENABLE_DJANGO_AUTOLOGIN = false; // Flag desactivado en migración a Supabase
  if (ENABLE_DJANGO_AUTOLOGIN) {
    autoLogin();
    setInterval(() => api.keepAlive(), 10 * 60 * 1000);
  }
}

// Servicios específicos con endpoints correctos
export const controlGestionService = {
  expedientes: {
    getAll: (params) => api.get('/control-gestion/expedientes/', params),
    getById: (id) => api.get(`/control-gestion/expedientes/${id}/`),
    create: (data) => api.post('/control-gestion/expedientes/', data),
    update: (id, data) => api.put(`/control-gestion/expedientes/${id}/`, data),
    delete: (id) => api.delete(`/control-gestion/expedientes/${id}/`)
  },
  oficiosEntrada: {
    getAll: (params) => api.get('/control-gestion/oficios-entrada/', params),
    getById: (id) => api.get(`/control-gestion/oficios-entrada/${id}/`),
    create: (data) => api.post('/control-gestion/oficios-entrada/', data),
    update: (id, data) => api.put(`/control-gestion/oficios-entrada/${id}/`, data),
    delete: (id) => api.delete(`/control-gestion/oficios-entrada/${id}/`),
    downloadPDF: (id, filename) => api.downloadPDF(id, filename)
  },
  oficiosSalida: {
    getAll: (params) => api.get('/control-gestion/oficios-salida/', params),
    getById: (id) => api.get(`/control-gestion/oficios-salida/${id}/`),
    create: (data) => api.post('/control-gestion/oficios-salida/', data),
    update: (id, data) => api.put(`/control-gestion/oficios-salida/${id}/`, data),
    delete: (id) => api.delete(`/control-gestion/oficios-salida/${id}/`),
    downloadPDF: (id, filename) => api.downloadPDF(id, filename)
  },
  solicitudesRegistro: {
    getAll: (params) => api.get('/control-gestion/solicitudes-registro/', params),
    getById: (id) => api.get(`/control-gestion/solicitudes-registro/${id}/`),
    create: (data) => api.post('/control-gestion/solicitudes-registro/', data),
    update: (id, data) => api.put(`/control-gestion/solicitudes-registro/${id}/`, data),
    delete: (id) => api.delete(`/control-gestion/solicitudes-registro/${id}/`)
  },
  turnoCie: {
    getAll: (params) => api.get('/control-gestion/turno-cie/', params),
    getById: (id) => api.get(`/control-gestion/turno-cie/${id}/`),
    create: (data) => api.post('/control-gestion/turno-cie/', data),
    update: (id, data) => api.put(`/control-gestion/turno-cie/${id}/`, data),
    delete: (id) => api.delete(`/control-gestion/turno-cie/${id}/`)
  },
  notificaciones: {
    getAll: (params) => api.get('/control-gestion/notificaciones/', params),
    getById: (id) => api.get(`/control-gestion/notificaciones/${id}/`),
    create: (data) => api.post('/control-gestion/notificaciones/', data),
    update: (id, data) => api.put(`/control-gestion/notificaciones/${id}/`, data),
    delete: (id) => api.delete(`/control-gestion/notificaciones/${id}/`)
  }
};

// Servicio para padrón de víctimas (endpoint verificado funcionando)
export const padronVictimasService = {
  getAll: (params) => api.get('/padron-victimas/victimas/', params),
  getById: (id) => api.get(`/padron-victimas/victimas/${id}/`),
  create: (data) => api.post('/padron-victimas/victimas/', data),
  update: (id, data) => api.put(`/padron-victimas/victimas/${id}/`, data),
  delete: (id) => api.delete(`/padron-victimas/victimas/${id}/`)
};

// Servicio de víctimas para compatibilidad
const victimasService = {
  getVictimas: (params) => api.get('/padron-victimas/victimas/', params),
  getEstadisticas: async () => {
    try {
      // Intentar obtener estadísticas específicas del endpoint
      return await api.get('/padron-victimas/victimas/estadisticas/');
    } catch (error) {
      // Si no existe el endpoint de estadísticas, calcular básicas
      console.warn('Endpoint de estadísticas no disponible, calculando básicas...');
      try {
        const victimasResponse = await api.get('/padron-victimas/victimas/', { page_size: 1000 });
        const victimas = victimasResponse.results || [];
        
        return {
          totalVictimas: victimas.length,
          totalHombres: victimas.filter(v => v.sexo === 'M' || v.sexo === 'Masculino').length,
          totalMujeres: victimas.filter(v => v.sexo === 'F' || v.sexo === 'Femenino').length,
          porTipoVictima: victimas.reduce((acc, v) => {
            acc[v.tipo_victima || 'Sin especificar'] = (acc[v.tipo_victima || 'Sin especificar'] || 0) + 1;
            return acc;
          }, {}),
          porAnio: victimas.reduce((acc, v) => {
            const anio = v.anio || new Date(v.fecha_hechos || v.fecha_registro).getFullYear() || 'Sin especificar';
            acc[anio] = (acc[anio] || 0) + 1;
            return acc;
          }, {})
        };
      } catch (fallbackError) {
        console.error('Error calculando estadísticas básicas:', fallbackError);
        return {
          totalVictimas: 0,
          totalHombres: 0,
          totalMujeres: 0,
          porTipoVictima: {},
          porAnio: {}
        };
      }
    }
  },
  createVictima: (data) => api.post('/padron-victimas/victimas/', data),
  updateVictima: (id, data) => api.put(`/padron-victimas/victimas/${id}/`, data),
  deleteVictima: (id) => api.delete(`/padron-victimas/victimas/${id}/`)
};

// Agregar servicios a la instancia principal de API
api.victimas = victimasService;
api.controlGestion = controlGestionService;

export const apiService = new APIService();
export const statsCache = new StatsCache();
export default api;
