import React, { useState, useEffect } from 'react';
import { 
  EyeIcon, 
  CheckCircleIcon, 
  XMarkIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  CalendarIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import HeaderInstitucional from '../components/HeaderInstitucional';
import api from '../services/api';
import '../styles/RegistrosMejorado.css';

const Registros = () => {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [accionModal, setAccionModal] = useState(''); // 'aprobar' o 'rechazar'
  const [comentarios, setComentarios] = useState('');
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    cargarRegistros();
  }, []);

  const cargarRegistros = async () => {
    try {
      setLoading(true);
      const response = await api.get('/padron-victimas/temporal/');
      setRegistros(response.data.results || response.data);
    } catch (err) {
      setError('Error al cargar los registros');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const registrosFiltrados = registros.filter(registro => {
    const coincideBusqueda = busqueda === '' || 
      registro.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      registro.apellido_paterno.toLowerCase().includes(busqueda.toLowerCase()) ||
      registro.numero_registro.toLowerCase().includes(busqueda.toLowerCase());
    
    const coincideEstado = filtroEstado === '' || registro.estado === filtroEstado;
    
    return coincideBusqueda && coincideEstado;
  });

  const abrirModal = (registro, accion) => {
    setRegistroSeleccionado(registro);
    setAccionModal(accion);
    setComentarios('');
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setRegistroSeleccionado(null);
    setAccionModal('');
    setComentarios('');
  };

  const procesarRegistro = async () => {
    if (!registroSeleccionado || !accionModal) return;
    
    if (accionModal === 'rechazar' && !comentarios.trim()) {
      alert('Los comentarios son obligatorios para rechazar un registro');
      return;
    }

    try {
      setProcesando(true);
      
      const endpoint = accionModal === 'aprobar' ? 'aprobar' : 'rechazar';
      await api.post(`/padron-victimas/temporal/${registroSeleccionado.id}/${endpoint}/`, {
        comentarios: comentarios.trim()
      });

      // Recargar la lista
      await cargarRegistros();
      cerrarModal();
      
      alert(`Registro ${accionModal === 'aprobar' ? 'aprobado' : 'rechazado'} exitosamente`);
    } catch (err) {
      alert(`Error al ${accionModal} el registro`);
      console.error(err);
    } finally {
      setProcesando(false);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'estado-badge estado-pendiente';
      case 'APROBADO':
        return 'estado-badge estado-aprobado';
      case 'RECHAZADO':
        return 'estado-badge estado-rechazado';
      case 'EN_REVISION':
        return 'estado-badge estado-revision';
      default:
        return 'estado-badge bg-gray-100 text-gray-800';
    }
  };

  const getTipoVictimaColor = (tipo) => {
    return tipo === 'Víctima directa' 
      ? 'tipo-badge tipo-victima-directa' 
      : 'tipo-badge tipo-victima-indirecta';
  };

  return (
    <div className="registros-container">
      <HeaderInstitucional />
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header mejorado */}
        <div className="registros-header">
          <div className="flex items-center mb-4">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-primary-600 to-primary-700 rounded-full mr-4 shadow-lg">
              <DocumentTextIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1>Registros Temporales</h1>
              <p>Revisión y aprobación de registros de víctimas</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-xl p-4 border border-primary-200">
              <div className="flex items-center">
                <UserGroupIcon className="w-8 h-8 text-primary-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Total Registros</p>
                  <p className="text-2xl font-bold text-primary-800">{registros.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-dorado-200">
              <div className="flex items-center">
                <ClockIcon className="w-8 h-8 text-dorado-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-dorado-800">
                    {registros.filter(r => r.estado === 'PENDIENTE').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-primary-200">
              <div className="flex items-center">
                <CheckCircleIcon className="w-8 h-8 text-primary-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Aprobados</p>
                  <p className="text-2xl font-bold text-primary-800">
                    {registros.filter(r => r.estado === 'APROBADO').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-red-200">
              <div className="flex items-center">
                <ExclamationCircleIcon className="w-8 h-8 text-red-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Rechazados</p>
                  <p className="text-2xl font-bold text-red-800">
                    {registros.filter(r => r.estado === 'RECHAZADO').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros y búsqueda mejorados */}
        <div className="filtros-card">
          <div className="flex items-center mb-4">
            <FunnelIcon className="w-6 h-6 text-primary-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Filtros y Búsqueda</h3>
          </div>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar registro
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="search-icon absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="search-input w-full"
                  placeholder="Buscar por nombre, apellido o número de registro..."
                />
              </div>
            </div>
            
            {/* Filtro por estado */}
            <div className="lg:w-64">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado del registro
              </label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="filter-select w-full"
              >
                <option value="">Todos los estados</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="EN_REVISION">En Revisión</option>
                <option value="APROBADO">Aprobado</option>
                <option value="RECHAZADO">Rechazado</option>
              </select>
            </div>
          </div>
          
          {/* Resultados de filtros */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Mostrando <span className="font-semibold text-primary-700">{registrosFiltrados.length}</span> de{' '}
              <span className="font-semibold text-primary-700">{registros.length}</span> registros
            </p>
          </div>
        </div>

        {/* Lista de registros */}
        {loading ? (
          <div className="empty-state">
            <div className="loading-spinner animate-spin rounded-full h-16 w-16 border-4 mx-auto mb-4"></div>
            <p className="empty-state-text">Cargando registros...</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <ExclamationCircleIcon className="empty-state-icon" />
            <p className="empty-state-text text-red-600 mb-4">{error}</p>
            <button 
              onClick={cargarRegistros}
              className="btn-aprobar inline-flex items-center"
            >
              <ClockIcon className="w-4 h-4 mr-2" />
              Reintentar
            </button>
          </div>
        ) : registrosFiltrados.length === 0 ? (
          <div className="empty-state">
            <UserGroupIcon className="empty-state-icon" />
            <p className="empty-state-text">
              {busqueda || filtroEstado ? 'No se encontraron registros con los filtros aplicados' : 'No hay registros disponibles'}
            </p>
            {(busqueda || filtroEstado) && (
              <button 
                onClick={() => { setBusqueda(''); setFiltroEstado(''); }}
                className="mt-4 text-primary-600 hover:text-primary-800 font-medium"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {registrosFiltrados.map((registro) => (
              <div key={registro.id} className="registro-card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-6">
                      <h3 className="registro-nombre">
                        {registro.nombre} {registro.apellido_paterno} {registro.apellido_materno}
                      </h3>
                      <span className={getEstadoColor(registro.estado)}>
                        {registro.estado}
                      </span>
                      <span className={getTipoVictimaColor(registro.tipo_victima)}>
                        {registro.tipo_victima}
                      </span>
                    </div>
                    
                    <div className="registro-info-grid">
                      <div className="registro-info-item">
                        <div className="flex items-center mb-2">
                          <DocumentTextIcon className="w-4 h-4 text-primary-600 mr-2" />
                          <p className="registro-info-label">Número de Registro</p>
                        </div>
                        <p className="registro-info-value">{registro.numero_registro}</p>
                      </div>
                      <div className="registro-info-item">
                        <div className="flex items-center mb-2">
                          <ExclamationCircleIcon className="w-4 h-4 text-red-600 mr-2" />
                          <p className="registro-info-label">Delito Principal</p>
                        </div>
                        <p className="registro-info-value">{registro.delito_principal}</p>
                      </div>
                      <div className="registro-info-item">
                        <div className="flex items-center mb-2">
                          <CalendarIcon className="w-4 h-4 text-dorado-600 mr-2" />
                          <p className="registro-info-label">Fecha de Creación</p>
                        </div>
                        <p className="registro-info-value">
                          {new Date(registro.fecha_creacion).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>

                    {registro.comentarios && (
                      <div className="comentarios-section">
                        <div className="comentarios-header">
                          <ChatBubbleLeftRightIcon className="comentarios-icon" />
                          <span className="comentarios-title">Comentarios</span>
                        </div>
                        <p className="comentarios-text">{registro.comentarios}</p>
                        {registro.usuario_revisor && (
                          <p className="text-xs text-gray-500 mt-2">
                            Por: <span className="font-medium">{registro.usuario_revisor}</span> el{' '}
                            {new Date(registro.fecha_revision).toLocaleDateString('es-ES')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Acciones mejoradas */}
                  <div className="flex flex-col space-y-3 ml-6">
                    {registro.estado === 'PENDIENTE' && (
                      <>
                        <button
                          onClick={() => abrirModal(registro, 'aprobar')}
                          className="btn-aprobar flex items-center space-x-2"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          <span>Aprobar</span>
                        </button>
                        <button
                          onClick={() => abrirModal(registro, 'rechazar')}
                          className="btn-rechazar flex items-center space-x-2"
                        >
                          <XMarkIcon className="h-4 w-4" />
                          <span>Rechazar</span>
                        </button>
                      </>
                    )}
                    {(registro.estado === 'APROBADO' || registro.estado === 'RECHAZADO') && (
                      <div className="text-center">
                        <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${
                          registro.estado === 'APROBADO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {registro.estado === 'APROBADO' ? (
                            <>
                              <CheckCircleIcon className="w-4 h-4 mr-1" />
                              Procesado
                            </>
                          ) : (
                            <>
                              <XMarkIcon className="w-4 h-4 mr-1" />
                              Procesado
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de confirmación mejorado */}
        {mostrarModal && (
          <div className="modal-overlay fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="modal-content max-w-md w-full p-8">
              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                  accionModal === 'aprobar' 
                    ? 'bg-gradient-to-r from-primary-100 to-primary-200' 
                    : 'bg-gradient-to-r from-red-100 to-red-200'
                }`}>
                  {accionModal === 'aprobar' ? (
                    <CheckCircleIcon className="w-8 h-8 text-primary-600" />
                  ) : (
                    <XMarkIcon className="w-8 h-8 text-red-600" />
                  )}
                </div>
                <h3 className="modal-title mb-2">
                  {accionModal === 'aprobar' ? 'Aprobar Registro' : 'Rechazar Registro'}
                </h3>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-gray-700 text-center">
                  ¿Estás seguro de que deseas <span className="font-semibold text-primary-700">{accionModal}</span> el registro de
                </p>
                <p className="text-center font-bold text-primary-800 text-lg mt-1">
                  {registroSeleccionado?.nombre} {registroSeleccionado?.apellido_paterno}
                </p>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <ChatBubbleLeftRightIcon className="w-4 h-4 inline mr-2 text-primary-600" />
                  Comentarios {accionModal === 'rechazar' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={comentarios}
                  onChange={(e) => setComentarios(e.target.value)}
                  rows={4}
                  className="modal-textarea w-full"
                  placeholder={accionModal === 'rechazar' ? 'Explica el motivo del rechazo...' : 'Comentarios adicionales (opcional)'}
                />
                {accionModal === 'rechazar' && !comentarios.trim() && (
                  <p className="text-red-500 text-xs mt-1">Los comentarios son obligatorios para rechazar</p>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={cerrarModal}
                  disabled={procesando}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={procesarRegistro}
                  disabled={procesando || (accionModal === 'rechazar' && !comentarios.trim())}
                  className={`flex-1 px-4 py-3 text-white rounded-lg disabled:opacity-50 font-medium transition-all ${
                    accionModal === 'aprobar' 
                      ? 'btn-aprobar' 
                      : 'btn-rechazar'
                  }`}
                >
                  {procesando ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Procesando...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      {accionModal === 'aprobar' ? (
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                      ) : (
                        <XMarkIcon className="w-4 h-4 mr-2" />
                      )}
                      {accionModal === 'aprobar' ? 'Aprobar' : 'Rechazar'}
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Registros;
