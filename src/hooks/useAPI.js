import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';

export const useAPI = (endpoint, params = {}, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(endpoint, params);
      setData(response);
    } catch (err) {
      setError(err);
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (api.isAuthenticated()) {
      fetchData();
    } else {
      setLoading(false);
      setError(new Error('No authentication token available'));
    }
  }, dependencies);

  return { data, loading, error, refetch: fetchData };
};

export const usePagination = (endpoint, initialParams = {}) => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    count: 0,
    page: 1,
    pageSize: 20,
    hasNext: false,
    hasPrevious: false
  });
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState(initialParams);

  // Sincronizar el estado de los parámetros con los que vienen de las props
  const initialParamsKey = useMemo(() => JSON.stringify(initialParams), [initialParams]);
  useEffect(() => {
    setParams(initialParams);
  }, [initialParamsKey]);

  const loadPage = async (page = 1) => {
    if (!endpoint) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const requestParams = {
        ...params,
        page,
        page_size: pagination.pageSize
      };
      const response = await api.get(endpoint, requestParams);

      if (response && typeof response === 'object') {
        const results = response.results || response.data || [];
        setData(Array.isArray(results) ? results : []);
        setPagination({
          ...pagination,
          count: response.count || 0,
          page,
          hasNext: !!response.next,
          hasPrevious: !!response.previous
        });
      } else {
        setData([]);
        setPagination({
          count: 0,
          page: 1,
          hasNext: false,
          hasPrevious: false,
          pageSize: pagination.pageSize
        });
      }
    } catch (error) {
      console.error('Pagination error for', endpoint, ':', error.message);
      setData([]);
      setPagination({
        count: 0,
        page: 1,
        hasNext: false,
        hasPrevious: false,
        pageSize: pagination.pageSize
      });
    } finally {
      setLoading(false);
    }
  };

  const updateParams = (newParams) => {
    setParams(prevParams => ({ ...prevParams, ...newParams }));
  };

  const nextPage = () => {
    if (pagination.hasNext) {
      loadPage(pagination.page + 1);
    }
  };

  const previousPage = () => {
    if (pagination.hasPrevious) {
      loadPage(pagination.page - 1);
    }
  };

  const paramsKey = useMemo(() => JSON.stringify(params), [params]);

  useEffect(() => {
    if (api.isAuthenticated() && endpoint) {
      loadPage(1);
    }
  }, [endpoint, paramsKey]);

  return {
    data,
    pagination,
    loading,
    updateParams,
    nextPage,
    previousPage,
    refetch: () => loadPage(pagination.page)
  };
};

// Hook para debounce en búsquedas
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Hook para estadísticas con cache - versión individual
export const useStats = (endpoint, cacheKey) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const retryRef = { timer: null };

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get(endpoint);
        if (response && typeof response === 'object') {
          const keys = Object.keys(response);
          const hasMetrics = keys.some(k => k.startsWith('total_') || k.startsWith('por_') || ['con_archivo', 'sin_archivo', 'porcentaje_con_archivo'].includes(k));

          if (hasMetrics) {
            setStats(response);
          } else {
            const statsData = {
              count: response.count || (Array.isArray(response.results) ? response.results.length : 0),
              results: response.results || response
            };
            setStats(statsData);
          }
        } else {
          setStats({ count: 0, results: [] });
        }
      } catch (err) {
        console.error(`Stats Error for ${endpoint}:`, err.message);
        setError(err);
        setStats({ count: 0, results: [] });
      } finally {
        setLoading(false);
      }
    };

    // Solo cargar si tenemos un endpoint válido
    if (endpoint) {
      loadStats();

      // Si no estamos autenticados, el frontend hace auto-login en segundo plano;
      // reintentar brevemente si aparece el token en los siguientes segundos.
      if (!api.isAuthenticated()) {
        let attempts = 0;
        retryRef.timer = setInterval(() => {
          attempts += 1;
          if (api.isAuthenticated()) {
            clearInterval(retryRef.timer);
            loadStats();
          } else if (attempts >= 5) { // 5 segundos
            clearInterval(retryRef.timer);
          }
        }, 1000);
      }
    } else {
      setLoading(false);
      setStats({ count: 0, results: [] });
    }

    return () => {
      if (retryRef.timer) clearInterval(retryRef.timer);
    };
  }, [endpoint, cacheKey]);

  // Devolver `data` para compatibilidad con destructuring existente en componentes
  return { data: stats, stats, loading, error };
};

export default useAPI;
