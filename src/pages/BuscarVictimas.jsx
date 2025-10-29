import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, X, Users, Database, ChevronLeft, ChevronRight, BarChart3, Building, ClipboardList, Copy, UserCheck, AlertCircle, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
// Eliminado backend Django: consumo exclusivo de Supabase
import { listVictimas as supaListVictimas, statsVictimas as supaStatsVictimas } from '../services/victimasSupabase';
import { supabase } from '../services/supabaseClient';
import HeaderInstitucional from '../components/HeaderInstitucional';
import './BuscarVictimas.css';

const BuscarVictimas = () => {
  // Estados
  const { user } = useAuth();
  const [victimas, setVictimas] = useState([]);
  const [filteredVictimas, setFilteredVictimas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVictima, setSelectedVictima] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [detalleModalVisible, setDetalleModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  
  // Debug: Verificar que detalleModalVisible está definido
  console.log('Estado detalleModalVisible inicializado:', detalleModalVisible);

  // Función auxiliar para formatear fechas irregulares
  const formatearFecha = (fecha) => {
    if (!fecha || fecha === 'Cancelado' || fecha === 'NA' || fecha === 'N/A') {
      return '-';
    }
    
    try {
      // Si es una fecha ISO válida
      if (fecha.includes('T') || fecha.includes('-')) {
        return new Date(fecha).toLocaleDateString('es-MX');
      }
      
      // Si es formato DD/MM/YYYY o similar, retornarlo tal como está
      if (fecha.includes('/')) {
        return fecha;
      }
      
      // Intentar parsear otros formatos
      const parsed = new Date(fecha);
      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString('es-MX');
      }
      
      return fecha; // Retornar el string original si no se puede parsear
    } catch (error) {
      return fecha || '-';
    }
  };

  // Función auxiliar para formatear sexo
  const formatearSexo = (sexo) => {
    if (!sexo || sexo === 'NA' || sexo === 'N/A') {
      return 'No especificado';
    }
    
    switch(sexo) {
      case '1': return 'Masculino';
      case '2': return 'Femenino';
      case '3': return 'Otro';
      case 'M': case 'Masculino': case 'MASCULINO': case 'Hombre': case 'HOMBRE': return 'Masculino';
      case 'F': case 'Femenino': case 'FEMENINO': case 'Mujer': case 'MUJER': return 'Femenino';
      default: return sexo;
    }
  };
  const [estadisticas, setEstadisticas] = useState({
    total_victimas: 0,
    total_validos: 0,
    totalHombres: 0,
    totalMujeres: 0,
    totalOtros: 0,
    directas: 0,
    indirectas: 0
  });

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    tipo_victima: '',
    gap: '',
    nna: '',
    anio: '',
    alcaldia_hecho_victimizante: '',
  });

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, [currentPage, filtros]);

  // Función para buscar con debounce
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Efecto para manejar la búsqueda con delay
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      setCurrentPage(1); // Resetear a la primera página cuando se busca
      cargarDatos();
    }, 500); // Delay de 500ms para evitar demasiadas consultas

    setSearchTimeout(timeout);

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [searchTerm]);

  // Filtrar por término de búsqueda - ahora solo para mostrar resultados locales si no hay búsqueda
  useEffect(() => {
    if (!searchTerm) {
      setFilteredVictimas(victimas);
    } else {
      // Si hay término de búsqueda, mostramos todos los resultados que vienen del servidor
      setFilteredVictimas(victimas);
    }
  }, [victimas]);

  // Backend único: Supabase

  const cargarDatos = async () => {
    try {
      setLoading(true);
      console.log('🔵 Cargando datos...');
      
      // Cargar estadísticas
  const statsResponse = await supaStatsVictimas();
      console.log('📊 Estadísticas recibidas:', statsResponse);
      setEstadisticas(statsResponse);

      // Cargar víctimas con filtros, paginación y búsqueda
      const params = {
        page: currentPage,
        page_size: itemsPerPage,
        ...filtros
      };

      // Si hay término de búsqueda, agregarlo a los parámetros
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      console.log('📋 Parámetros de búsqueda:', params);
      const victimasResponse = await supaListVictimas({ ...params, excluir_cancelados: false });
      
      console.log('🎯 Víctimas recibidas:', victimasResponse);
      console.log('🔢 Número de víctimas:', victimasResponse.results?.length || 0);
      console.log('📋 Primera víctima (ejemplo):', victimasResponse.results?.[0]);
      console.log('📊 Campos disponibles:', victimasResponse.results?.map(v => ({ 
        alfanumerica_registro: v.alfanumerica_registro, 
        nombre_victima: v.nombre_victima,
        carpeta_investigacion: v.carpeta_investigacion,
        nombre_recomendacion: v.nombre_recomendacion,
        expediente_judicial: v.expediente_judicial,
      }))?.slice(0, 3));
      
      // Debug completo de estructura
      if (victimasResponse.results?.[0]) {
        console.log('🔍 Estructura real de víctima:', victimasResponse.results[0]);
        console.log('🔍 Campos disponibles:', Object.keys(victimasResponse.results[0]));
      }
      
      setVictimas(victimasResponse.results || []);
      setError(null);
    } catch (error) {
      console.error('❌ Error al cargar datos Supabase:', error);
      setError('Error consultando datos en Supabase. Verifique conexión, existencia de tabla o políticas RLS.');
    } finally {
      setLoading(false);
    }
  };

  // Suscripción realtime a inserciones/updates/deletes para refrescar automáticamente
  useEffect(() => {
    const channel = supabase
      .channel('realtime-padron-victimas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'padron_victimas' }, (payload) => {
        console.debug('[Realtime] Cambio detectado en padron_victimas:', payload.eventType);
        // Refrescar datos manteniendo página actual
        cargarDatos();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const aplicarFiltros = () => {
    setCurrentPage(1);
    cargarDatos();
    setFilterModalVisible(false);
  };

  const limpiarFiltros = () => {
    setFiltros({
      tipo_victima: '',
      gap: '',
      nna: '',
      anio: '',
      alcaldia_hecho_victimizante: '',
    });
    setCurrentPage(1);
  };

  const verDetalle = (victima) => {
    console.log('verDetalle llamado con:', victima);
    setSelectedVictima(victima);
    setDetalleModalVisible(true);
    console.log('Modal debería abrirse ahora');
  };

  const copiarAlPortapapeles = async (victima) => {
    try {
      const formatoWhatsApp = `
*Información de la Víctima*

*Número de Registro:* ${victima.numero_registro || 'N/A'}
*Registro Alfanumérico:* ${victima.alfanumerica_registro || 'N/A'}
*Nombre de la Víctima:* ${victima.nombre_victima || 'N/A'}
*Fecha de Registro:* ${formatearFecha(victima.fecha_registro)}
*Año:* ${victima.anio || 'N/A'}
*Sexo:* ${formatearSexo(victima.sexo)}
*Tipo de Víctima:* ${victima.tipo_victima || 'N/A'}
*Reconocimiento Víctima:* ${victima.reconocimiento_calidad_victima || 'N/A'}
*CURP:* ${victima.curp || 'N/A'}
*Teléfono:* ${victima.telefono || 'N/A'}
*Email:* ${victima.email || 'N/A'}
*Dirección:* ${victima.direccion || 'N/A'}
*Tipo de Delito/Violación DH:* ${victima.tipodelito_violaciondh || 'N/A'}
*Expediente Judicial:* ${victima.expediente_judicial || 'N/A'}
*Carpeta de Investigación:* ${victima.carpeta_investigacion || 'N/A'}
*Nombre Recomendación:* ${victima.nombre_recomendacion || 'N/A'}
*Derechos Humanos Violados:* ${victima.derechos_humanos_violados || 'N/A'}
*Clave Víctima Recomendación:* ${victima.clave_victima_recomendacion || 'N/A'}
*Alcaldía Hecho Victimizante:* ${victima.alcaldia_hecho_victimizante || 'N/A'}
*Tiempo Modo Lugar:* ${victima.tiempo_modo_lugar || 'N/A'}
*Parentesco:* ${victima.parentesco || 'N/A'}
*Post Mortem:* ${victima.post_mortem || 'N/A'}
*NNA:* ${victima.nna || 'N/A'}
*GAP:* ${victima.gap || 'N/A'}
*Fecha de Actualización:* ${victima.fecha_actualizacion ? new Date(victima.fecha_actualizacion).toLocaleDateString('es-MX') : 'N/A'}
      `.trim();

      await navigator.clipboard.writeText(formatoWhatsApp);
      
      // Mostrar notificación de éxito (opcional)
      alert('Información copiada al portapapeles');
    } catch (error) {
      console.error('Error al copiar al portapapeles:', error);
      alert('Error al copiar al portapapeles');
    }
  };

  const exportarDatos = async () => {
    try {
      const allData = await victimasAPI.getVictimas({ ...filtros });
      const csvContent = convertToCSV(allData.results || []);
      downloadCSV(csvContent, 'victimas_export.csv');
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar los datos');
    }
  };

  const convertToCSV = (data) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value || '';
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Calcular paginación - usar datos del servidor
  const totalItems = estadisticas?.total_victimas || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredVictimas; // Ya vienen paginados del servidor

  console.log('🔍 Datos para renderizar:', {
    filteredVictimas: filteredVictimas.length,
    currentItems: currentItems.length,
    currentPage,
    itemsPerPage,
    primeraVictima: currentItems[0]
  });

  if (loading && victimas.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <HeaderInstitucional />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl p-12 border border-gray-100">
              <div className="text-center space-y-8">
                <div className="relative">
                  <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary-burgundy border-t-transparent mx-auto"></div>
                  <div 
                    className="absolute inset-0 rounded-full h-20 w-20 border-4 border-primary-gold border-t-transparent mx-auto animate-spin" 
                    style={{ animationDirection: 'reverse', animationDuration: '3s' }}
                  ></div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-primary-burgundy">Cargando Padrón de Víctimas</h3>
                  <p className="text-gray-600 text-lg">Obteniendo información de la base de datos...</p>
                  <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto">
                    <div className="bg-gradient-to-r from-primary-burgundy to-primary-gold h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Estado del modal de detalles */}
      <HeaderInstitucional />
      <div className="contenedor-principal container mx-auto px-4 py-6 mb-8">
        {/* Header con degradado - más compacto */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-primary-burgundy via-primary-burgundy to-primary-gold rounded-3xl p-6 md:p-8 text-white shadow-2xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between">
              <div className="mb-4 lg:mb-0 flex-1">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">Padrón de Víctimas</h1>
                  <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                    <Database className="w-8 h-8 text-white" />
                  </div>
                </div>
                <p className="text-white/90 text-base md:text-lg">Búsqueda y consulta del Registro de Víctimas de la Ciudad de México</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Estadísticas - más compacta */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Estadísticas del Padrón</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="estadistica-button group bg-white p-4 rounded-3xl shadow-md border border-gray-100 hover:shadow-lg transition transform hover:-translate-y-1 text-left w-full">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Víctimas</h3>
                  <p className="text-3xl font-extrabold text-primary-burgundy leading-tight">{estadisticas.total_victimas.toLocaleString()}</p>
                  {estadisticas.total_victimas === 0 && !loading && !error && (
                    <p className="mt-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 inline-block">La tabla padron_victimas no contiene registros.</p>
                  )}
                </div>
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg border border-primary-burgundy bg-primary-burgundy/10">
                  <Users className="w-6 h-6 text-primary-burgundy" />
                </div>
              </div>
            </div>
            
            <div className="estadistica-button group bg-white p-4 rounded-3xl shadow-md border border-gray-100 hover:shadow-lg transition transform hover:-translate-y-1 text-left w-full">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Por Sexo</h3>
                  <p className="text-lg font-extrabold text-primary-burgundy leading-tight">♂ {estadisticas.totalHombres.toLocaleString()}</p>
                  <p className="text-lg font-extrabold text-pink-600 leading-tight">♀ {estadisticas.totalMujeres.toLocaleString()}</p>
                  {estadisticas.totalOtros > 0 && (
                    <p className="text-sm text-gray-500 mt-1">Otros: {estadisticas.totalOtros}</p>
                  )}
                </div>
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg border border-blue-500 bg-blue-500/10">
                  <UserCheck className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="estadistica-button group bg-white p-4 rounded-3xl shadow-md border border-gray-100 hover:shadow-lg transition transform hover:-translate-y-1 text-left w-full">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Víctimas Directas</h3>
                  <p className="text-3xl font-extrabold text-red-600 leading-tight">{estadisticas.directas.toLocaleString()}</p>
                </div>
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg border border-red-500 bg-red-500/10">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="estadistica-button group bg-white p-4 rounded-3xl shadow-md border border-gray-100 hover:shadow-lg transition transform hover:-translate-y-1 text-left w-full">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Víctimas Indirectas</h3>
                  <p className="text-3xl font-extrabold text-orange-600 leading-tight">{estadisticas.indirectas.toLocaleString()}</p>
                </div>
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg border border-orange-500 bg-orange-500/10">
                  <Heart className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Búsqueda - más compacta */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Búsqueda de Víctimas</h2>
          
          {/* Contenedor de búsqueda con fondo blanco y bordes redondeados */}
          <div className="contenedor-blanco bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <div className="mb-4 lg:mb-0">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Búsqueda Avanzada</h3>
                <p className="text-gray-600 text-sm">Encuentra víctimas por nombre, registro o cualquier criterio</p>
              </div>
              <div className="flex items-center space-x-3">
                {/* Removed advanced filters and export buttons - simplified UI */}
              </div>
            </div>

            {/* Barra de búsqueda principal - más compacta */}
            <div className="relative mb-4">
              <div className="search-bar flex items-center gap-3">
                <input
                  id="search"
                  name="search"
                  type="text"
                  placeholder="Buscar por nombre, alfanúmerica de Registro, Carpeta de Investigación, Expediente Judicial o Recomendación..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input flex-1 pl-4 pr-4 py-3 border border-gray-200 rounded-xl text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-burgundy/20 focus:border-primary-burgundy transition-all duration-300 bg-white"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Indicador de búsqueda activa */}
            {searchTerm && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Search className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-blue-800 font-medium">
                      Buscando: "<span className="font-bold">{searchTerm}</span>"
                    </span>
                  </div>
                  <span className="text-blue-600 text-sm">
                    {loading ? 'Buscando...' : `${filteredVictimas.length} resultado(s) encontrado(s)`}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sección de Resultados - más compacta */}
        <div className="contenedor-blanco bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header de la tabla */}
          <div className="contenedor-blanco bg-white p-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Resultados de la Búsqueda</h3>
                <p className="text-gray-600 text-sm">
                  {loading ? 'Cargando...' : `Mostrando ${filteredVictimas.length} de ${estadisticas?.total_victimas || 0} víctimas registradas`}
                </p>
              </div>
              {filteredVictimas.length > 0 && (
                <div className="mt-2 sm:mt-0 flex items-center space-x-2">
                  <span className="text-xs text-gray-500">
                    Página {currentPage} de {totalPages}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Contenido de la tabla */}
          {error && (
            <div className="p-8 bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 m-6 rounded-xl">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <X className="w-6 h-6 text-red-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-red-800">Error al cargar datos</h3>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {currentItems.length === 0 && !loading && !error ? (
            <div className="p-16 text-center">
              <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No se encontraron resultados</h3>
              <p className="text-gray-600 mb-6">
                {totalItems === 0 && !searchTerm
                  ? 'La tabla padron_victimas está vacía. Inserta registros para comenzar.'
                  : searchTerm
                    ? `No se encontraron víctimas que coincidan con "${searchTerm}"`
                    : currentPage > 1
                      ? `No hay registros en la página ${currentPage}.`
                      : 'Intenta ajustar los filtros o términos de búsqueda'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="inline-flex items-center px-4 py-2 bg-primary-burgundy text-white rounded-xl hover:bg-burgundy-dark transition-colors mr-3"
                >
                  Limpiar búsqueda
                </button>
              )}
              {currentPage > 1 && !searchTerm && (
                <button
                  onClick={() => setCurrentPage(1)}
                  className="inline-flex items-center px-4 py-2 bg-primary-burgundy text-white rounded-xl hover:bg-burgundy-dark transition-colors"
                >
                  Ir a página 1
                </button>
              )}
              {totalItems === 0 && (
                <div className="mt-8 max-w-md mx-auto text-left text-xs text-gray-500 space-y-1">
                  <p>Para poblar datos puedes:</p>
                  <ol className="list-decimal ml-4 space-y-1">
                    <li>Usar import CSV en Supabase (Table Editor &gt; padron_victimas &gt; Import).</li>
                    <li>Insertar manualmente una fila de prueba.</li>
                    <li>Crear un script usando supabase-js e insertar registros.</li>
                  </ol>
                </div>
              )}
            </div>
          ) : currentItems.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 border-b border-gray-200">
                        Registro Alfanumérico
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 border-b border-gray-200">
                        Nombre de la Víctima
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 border-b border-gray-200">
                        Fecha de Registro
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 border-b border-gray-200">
                        Tipo de Delito/Violación DH
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 border-b border-gray-200">
                        Tipo de Víctima
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-900 border-b border-gray-200">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {currentItems.map((victima, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors duration-200 bg-white">
                        <td className="px-4 py-3 text-xs font-medium text-gray-900 max-w-xs">
                          <div className="truncate">
                            {victima.alfanumerica_registro || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700">
                          {victima.nombre_victima || '-'}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700">
                          {formatearFecha(victima.fecha_registro)}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700 max-w-xs">
                          <div className="truncate">
                            {victima.tipodelito_violaciondh || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700">
                          {victima.tipo_victima || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button 
                              onClick={() => {
                                console.log('🔴 CLICK EN BOTÓN - Víctima:', victima);
                                verDetalle(victima);
                              }}
                              className="btn-ver-mas inline-flex items-center px-2 py-1 bg-gradient-to-r from-primary-burgundy to-burgundy-dark text-white text-xs font-medium rounded-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Ver Más
                            </button>
                            <button 
                              onClick={() => copiarAlPortapapeles(victima)}
                              className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-primary-gold to-gold-dark text-white text-xs font-medium rounded-lg hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                              title="Copiar información al portapapeles"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copiar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación mejorada */}
              <div className="px-8 py-6 bg-white border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                  <div className="text-sm text-gray-600">
                    Mostrando <span className="font-semibold text-gray-900">{currentItems.length > 0 ? startIndex + 1 : 0}</span> a{' '}
                    <span className="font-semibold text-gray-900">{currentItems.length > 0 ? startIndex + currentItems.length : 0}</span> de{' '}
                    <span className="font-semibold text-gray-900">{totalItems}</span> registros
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Anterior
                    </button>
                    
                    <div className="flex space-x-1">
                      {[...Array(10)].map((_, i) => {
                        const pageNumber = i + 1;
                        const displayNumber = pageNumber * 10;
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => setCurrentPage(pageNumber)}
                            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                              currentPage === pageNumber
                                ? 'bg-gradient-to-r from-primary-burgundy to-burgundy-dark text-white shadow-lg transform scale-105'
                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:shadow-md'
                            }`}
                          >
                            {displayNumber}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, 10))}
                      disabled={currentPage === 10}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-md"
                    >
                      Siguiente
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Modal de Filtros */}
      {filterModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Filtros de Búsqueda</h3>
                <button
                  onClick={() => setFilterModalVisible(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Víctima</label>
                  <select
                    id="tipo_victima"
                    name="tipo_victima"
                    value={filtros.tipo_victima}
                    onChange={(e) => setFiltros({...filtros, tipo_victima: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Todos</option>
                    <option value="DIRECTA">Víctima Directa</option>
                    <option value="INDIRECTA">Víctima Indirecta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GAP (Grupo de Atención Prioritaria)</label>
                  <input
                    id="gap"
                    name="gap"
                    type="text"
                    value={filtros.gap}
                    onChange={(e) => setFiltros({...filtros, gap: e.target.value})}
                    placeholder="Ej: Mujeres, LGBTI+, etc."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NNA (Niñas, Niños y Adolescentes)</label>
                  <select
                    id="nna"
                    name="nna"
                    value={filtros.nna}
                    onChange={(e) => setFiltros({...filtros, nna: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Todos</option>
                    <option value="SI">Sí</option>
                    <option value="NO">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                  <input
                    id="anio"
                    name="anio"
                    type="number"
                    value={filtros.anio}
                    onChange={(e) => setFiltros({...filtros, anio: e.target.value})}
                    placeholder="Ej: 2024"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alcaldía del Hecho Victimizante</label>
                  <input
                    id="alcaldia_hecho_victimizante"
                    name="alcaldia_hecho_victimizante"
                    type="text"
                    value={filtros.alcaldia_hecho_victimizante}
                    onChange={(e) => setFiltros({...filtros, alcaldia_hecho_victimizante: e.target.value})}
                    placeholder="Ej: Cuauhtémoc, Benito Juárez, etc."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={limpiarFiltros}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Limpiar
                </button>
                <button
                  onClick={aplicarFiltros}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Aplicar Filtros
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalle Completo */}
      {detalleModalVisible && selectedVictima && (
        <div className="modal-overlay">
          {console.log('Modal renderizándose con víctima:', selectedVictima)}
    <div className="modal-content animate-scale-in" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-desc">
            {/* Header del modal */}
            <div className="bg-gradient-to-r from-primary-burgundy to-burgundy-dark p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 id="modal-title" className="text-2xl font-bold mb-2">Información Completa de la Víctima</h3>
                  <p id="modal-desc" className="text-white/90 text-lg">{selectedVictima.nombre_victima || 'Nombre no disponible'}</p>
                  <p className="text-white/70 text-sm">{selectedVictima.alfanumerica_registro || 'Registro no disponible'}</p>
                </div>
                <button
                  onClick={() => setDetalleModalVisible(false)}
                  className="text-white/80 hover:text-white bg-white/20 hover:bg-white/30 rounded-xl p-2 transition-all duration-200"
                  aria-label="Cerrar modal"
                  title="Cerrar"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Contenido del modal - Todas las columnas organizadas */}
            <div className="p-6 overflow-y-auto max-h-[80vh]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Sección 1: Información Básica */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center border-b pb-3">
                    <Database className="w-5 h-5 mr-2 text-primary-burgundy" />
                    Datos Personales
                  </h4>
                  <div className="space-y-3 text-sm">
                    {Object.entries({
                      'Número de Registro': selectedVictima.numero_registro,
                      'Registro Alfanumérico': selectedVictima.alfanumerica_registro,
                      'Nombre de la Víctima': selectedVictima.nombre_victima,
                      'Fecha de Registro': formatearFecha(selectedVictima.fecha_registro),
                      'Año': selectedVictima.anio,
                      'Sexo': formatearSexo(selectedVictima.sexo),
                      'Tipo de Víctima': selectedVictima.tipo_victima,
                      'CURP': selectedVictima.curp,
                      'Parentesco con VD (Si aplica)': selectedVictima.parentesco,
                    }).map(([key, value]) => (
                      <div key={key} className="border-b border-gray-100 pb-2 last:border-b-0">
                        <label className="font-medium text-gray-600">{key}:</label>
                        <p className="text-gray-900 mt-1">{value || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sección 2: Datos Personales */}
                <div className="bg-white p-6 rounded-2xl border border-blue-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center border-b pb-3">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Información de Contacto
                  </h4>
                  <div className="space-y-3 text-sm">
                    {Object.entries({
                      'Teléfono': selectedVictima.telefono,
                      'Email': selectedVictima.correo_electronico,
                    }).map(([key, value]) => (
                      <div key={key} className="border-b border-gray-100 pb-2 last:border-b-0">
                        <label className="font-medium text-gray-600">{key}:</label>
                        <p className="text-gray-900 mt-1">{value || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sección 3: Información del Hecho Victimizante */}
                <div className="bg-white p-6 rounded-2xl border border-green-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center border-b pb-3">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Información del Hecho Victimizante
                  </h4>
                  <div className="space-y-3 text-sm">
                    {Object.entries({
                      'Reconocimiento Calidad Víctima': selectedVictima.reconocimiento_calidad_victima,
                      'Tipo de Delito': selectedVictima.tipodelito_violaciondh,
                      'Tipo de Violación a DH': selectedVictima.tipo_violacion_dh,
                      'Expediente Judicial': selectedVictima.expediente_judicial,
                      'Carpeta de Investigación': selectedVictima.carpeta_investigacion,
                      'Nombre Recomendación': selectedVictima.nombre_recomendacion,
                      'Derechos Humanos Violados': selectedVictima.derechos_humanos_violados,
                      'Clave Víctima Recomendación': selectedVictima.clave_victima_recomendacion,
                      'Tiempo Modo Lugar': selectedVictima.tiempo_modo_lugar,
                    }).map(([key, value]) => (
                      <div key={key} className="border-b border-gray-100 pb-2 last:border-b-0">
                        <label className="font-medium text-gray-600">{key}:</label>
                        <p className="text-gray-900 mt-1">{value || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sección 5: Información Adicional */}
                <div className="bg-white p-6 rounded-2xl border border-purple-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center border-b pb-3">
                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Información Adicional
                  </h4>
                  <div className="space-y-3 text-sm">
                    {Object.entries({
                      'Post Mortem': selectedVictima.post_mortem,
                      'NNA': selectedVictima.nna,
                      'GAP': selectedVictima.gap,
                      'CURP': selectedVictima.curp,
                    }).map(([key, value]) => (
                      <div key={key} className="border-b border-gray-100 pb-2 last:border-b-0">
                        <label className="font-medium text-gray-600">{key}:</label>
                        <p className="text-gray-900 mt-1">{value || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sección 6: Información Administrativa */}
                <div className="bg-white p-6 rounded-2xl border border-gray-300">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center border-b pb-3">
                    <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253z" />
                    </svg>
                    Información Administrativa
                  </h4>
                  <div className="space-y-3 text-sm">
                    {Object.entries({
                      'Fecha de Creación': selectedVictima.fecha_creacion ? new Date(selectedVictima.fecha_actualizacion).toLocaleDateString('es-MX') : null,
                      'Usuario que ingresó': selectedVictima.usuario_registro,
                    }).map(([key, value]) => (
                      <div key={key} className="border-b border-gray-100 pb-2 last:border-b-0">
                        <label className="font-medium text-gray-600">{key}:</label>
                        <p className="text-gray-900 mt-1 break-words">{value || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Footer del modal */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex justify-end">
                <button
                  onClick={() => setDetalleModalVisible(false)}
                  className="px-6 py-3 bg-gradient-to-r from-primary-burgundy to-burgundy-dark text-white rounded-xl font-medium hover:shadow-lg transition-all duration-300"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuscarVictimas;
