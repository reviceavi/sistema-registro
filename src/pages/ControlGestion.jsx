import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService, statsCache } from '../services/api';
import { useAPI, usePagination, useDebounce, useStats } from '../hooks/useAPI';
import HeaderInstitucional from '../components/HeaderInstitucional';
import './ControlGestion.css';

// Componente para Vista de Oficios de Entrada - Extraído para evitar recreaciones
const OficiosEntradaView = React.memo(({ 
  oficios, 
  oficiosPagination, 
  oficiosLoading, 
  searchTerm, 
  onSearchChange, 
  onPrevPage, 
  onNextPage, 
  onVistaPrevia, 
  onDescargarPDF 
}) => (
  <div className="oficios-view">
    <div className="view-header">
      <h2>📥 Oficios de Entrada</h2>
      <div className="header-info">
        <span>Total: {oficiosPagination.count.toLocaleString()}</span>
        <span>Página {oficiosPagination.page} de {Math.ceil(oficiosPagination.count / oficiosPagination.pageSize)}</span>
      </div>
    </div>

    {/* Solo búsqueda */}
    <div className="search-section">
      <input
        type="text"
        placeholder="Buscar oficios..."
        value={searchTerm}
        onChange={onSearchChange}
        className="search-input"
      />
    </div>

    {/* Lista de oficios */}
    {oficiosLoading ? (
      <div className="loading">
        <span>Cargando oficios...</span>
      </div>
    ) : oficios.length === 0 ? (
      <div className="empty-state">
        <div className="empty-state-icon">📥</div>
        <h3>No se encontraron oficios</h3>
        <p>No hay oficios que coincidan con los filtros seleccionados</p>
      </div>
    ) : (
      <div className="oficios-table">
        {oficios.map((oficio, index) => (
          <div key={oficio.id} className="data-card" style={{'--delay': `${index * 0.05}s`}}>
            <div className="card-header">
              <div className="card-id">#{oficio.id}</div>
              <div className="oficio-badges">
                {oficio.tiene_archivo && (
                  <span className="badge-success">📄 PDF</span>
                )}
                <span className="badge-info">📅 {oficio.anio}</span>
              </div>
            </div>
            
            <div className="card-content">
              <h4 className="card-title">{oficio.alfanumerica_entrada || `Oficio ${oficio.id}`}</h4>
              <div className="info-grid-2">
                <p><strong>Fecha de recepción:</strong> {oficio.recepcion_relovi}</p>
                <p><strong>Autoridad:</strong> {oficio.autoridad_dependencia}</p>
                <p><strong>Remitente:</strong> {oficio.remitente}</p>
                <p><strong>Cargo:</strong> {oficio.cargo}</p>
              </div>
              <p className="card-description"><strong>Asunto:</strong> {oficio.asunto}</p>
              <p><strong>Formato:</strong> <span className="format-badge">{oficio.formato}</span></p>
            </div>

            <div className="action-buttons">
              <button className="btn-primary" onClick={() => {/* Ver detalles */}}>
                👁️ Ver Detalles
              </button>
              {oficio.tiene_archivo && (
                <>
                  <button
                    onClick={() => onVistaPrevia(oficio.id, `Oficio ${oficio.numero}`, 'entrada')}
                    className="btn-preview"
                  >
                    👁️ Vista Previa
                  </button>
                  <button
                    onClick={() => onDescargarPDF(oficio.id, `oficio-${oficio.numero}.pdf`, 'entrada')}
                    className="btn-download"
                  >
                    ⬇️ Descargar
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Paginación */}
    <div className="pagination-controls">
      <button
        disabled={!oficiosPagination.hasPrevious}
        onClick={onPrevPage}
        className="pagination-btn"
      >
        ← Anterior
      </button>
      
      <span className="pagination-info">
        Página {oficiosPagination.page} de {Math.ceil(oficiosPagination.count / oficiosPagination.pageSize)}
      </span>
      
      <button
        disabled={!oficiosPagination.hasNext}
        onClick={onNextPage}
        className="pagination-btn"
      >
        Siguiente →
      </button>
    </div>
  </div>
));

// Componente para Vista de Expedientes - Extraído para evitar recreaciones
const ExpedientesView = React.memo(({ 
  expedientes, 
  expedientesPagination, 
  expedientesLoading, 
  searchTerm, 
  onSearchChange, 
  onPrevPage, 
  onNextPage 
}) => (
  <div className="expedientes-view">
    <div className="view-header">
      <h2>📁 Expedientes</h2>
      <div className="header-info">
        <span>Total: {expedientesPagination.count.toLocaleString()}</span>
      </div>
    </div>

    {/* Búsqueda */}
    <div className="search-section">
      <input
        type="text"
        placeholder="Buscar expedientes..."
        value={searchTerm}
        onChange={onSearchChange}
        className="search-input"
      />
    </div>

    {/* Lista de expedientes */}
    {expedientesLoading ? (
      <div className="loading">Cargando expedientes...</div>
    ) : (
      <div className="expedientes-list">
        {expedientes.map(expediente => (
          <div key={expediente.id} className="expediente-card">
            <div className="expediente-header">
              <h3>{expediente.victimas_directas}</h3>
              <span className={`status-badge status-${expediente.estatus?.toLowerCase()}`}>
                {expediente.estatus}
              </span>
            </div>
            
            <div className="expediente-info">
              <p><strong>Víctimas Indirectas:</strong> {expediente.victimas_indirectas}</p>
              <p><strong>Números:</strong> {expediente.numeros_registro}</p>
              <p><strong>Carpeta/Recomendación:</strong> {expediente.num_reco_carpeta}</p>
              <p><strong>Ubicación:</strong> {expediente.ubicacion}</p>
              <p><strong>Hecho:</strong> {expediente.hecho_victimizante}</p>
              <p><strong>Resguardo:</strong> {expediente.resguardo}</p>
              {expediente.fecha_turno_cie && (
                <p><strong>Fecha Turno CIE:</strong> {new Date(expediente.fecha_turno_cie).toLocaleDateString()}</p>
              )}
            </div>

            <div className="expediente-actions">
              <button className="btn-secondary">👁️ Ver</button>
              <button className="btn-secondary">✏️ Editar</button>
              <button className="btn-danger">🗑️ Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Paginación */}
    <div className="pagination">
      <button
        disabled={!expedientesPagination.hasPrevious}
        onClick={onPrevPage}
        className="pagination-btn"
      >
        ← Anterior
      </button>
      
      <span className="pagination-info">
        Página {expedientesPagination.page}
      </span>
      
      <button
        disabled={!expedientesPagination.hasNext}
        onClick={onNextPage}
        className="pagination-btn"
      >
        Siguiente →
      </button>
    </div>
  </div>
));

// Componente para Vista de Oficios de Salida - Extraído para evitar recreaciones
const OficiosSalidaView = React.memo(({ 
  oficiosSalida, 
  oficiosSalidaPagination, 
  oficiosSalidaLoading, 
  searchTerm, 
  onSearchChange, 
  onPrevPage, 
  onNextPage 
}) => (
  <div className="oficios-salida-view">
    <h2>📤 Oficios de Salida ({oficiosSalida?.length || 0})</h2>
    
    {/* Solo búsqueda */}
    <div className="search-section">
      <input
        type="text"
        placeholder="Buscar oficios de salida..."
        value={searchTerm}
        onChange={onSearchChange}
        className="search-input"
      />
    </div>
    
    {oficiosSalidaLoading ? (
      <div className="loading">Cargando oficios de salida...</div>
    ) : (
      <div className="oficios-grid">
        {oficiosSalida.map(oficio => (
          <div key={oficio.id} className="oficio-card">
            <div className="oficio-header">
              <h3>{oficio.numero_oficio || 'S/N'}</h3>
              <div className="oficio-badges">
                <span className="year-badge">{oficio.id}</span>
              </div>
            </div>
            
            <div className="oficio-info">
              <p><strong>Número:</strong> {oficio.numero_oficio}</p>
              <p><strong>Alfanumérica:</strong> {oficio.alfanumerica_oficio}</p>
              <p><strong>Destinatario:</strong> {oficio.destinatario}</p>
              <p><strong>Solicitante:</strong> {oficio.solicitante}</p>
              <p><strong>Asunto:</strong> {oficio.asunto}</p>
              <p><strong>Tipo Envío:</strong> {oficio.tipo_envio}</p>
              <p><strong>Fecha:</strong> {oficio.fecha}</p>
            </div>

            <div className="oficio-actions">
              <button className="btn-secondary">👁️ Ver</button>
              <button className="btn-secondary">✏️ Editar</button>
            </div>
          </div>
        ))}
      </div>
    )}
    
    {/* Paginación */}
    <div className="pagination">
      <button
        disabled={!oficiosSalidaPagination.hasPrevious}
        onClick={onPrevPage}
        className="pagination-btn"
      >
        ← Anterior
      </button>
      <span className="pagination-info">Página {oficiosSalidaPagination.page}</span>
      <button
        disabled={!oficiosSalidaPagination.hasNext}
        onClick={onNextPage}
        className="pagination-btn"
      >
        Siguiente →
      </button>
    </div>
  </div>
));

// Componente de Turno CIE extraído para evitar re-creación
const TurnoCieView = React.memo(({
  turnoCie,
  turnoCieLoading,
  turnoCiePagination,
  searchTermTurnoCie,
  handleSearchTurnoCie,
  prevTurnoCiePage,
  nextTurnoCiePage
}) => (
  <div className="turno-cie-view">
    <h2>🔄 Turno CIE ({turnoCie?.length || 0})</h2>
    
    {/* Búsqueda */}
    <div className="search-section">
      <input
        type="text"
        placeholder="Buscar turnos CIE..."
        value={searchTermTurnoCie}
        onChange={handleSearchTurnoCie}
        className="search-input"
      />
    </div>
    
    {turnoCieLoading ? (
      <div className="loading">Cargando turnos CIE...</div>
    ) : (
      <div className="turnos-grid">
        {turnoCie.map(turno => (
          <div key={turno.id} className="turno-card">
            <div className="turno-header">
              <h3>Registro: {turno.num_registro}</h3>
              <span className="year-badge">{turno.anio}</span>
            </div>
            
            <div className="turno-info">
              <p><strong>Año:</strong> {turno.anio}</p>
              <p><strong>Víctimas Relacionadas:</strong> {turno.victimas_relacionadas}</p>
              <p><strong>Fecha Recepción CIE:</strong> {turno.fecha_recepcion_cie}</p>
              <p><strong>Núm. Registro:</strong> {turno.num_registro}</p>
              <p><strong>Acuse CIE:</strong> {turno.acuse_cie}</p>
              <p><strong>Núm. Sol:</strong> {turno.num_sol}</p>
              <p><strong>Oficio Salida:</strong> {turno.oficio_salida}</p>
              <p><strong>Usuaria:</strong> {turno.usuaria}</p>
              <p><strong>Tipo:</strong> {turno.tipo}</p>
              {turno.fecha_creacion && (
                <p><strong>Fecha Creación:</strong> {new Date(turno.fecha_creacion).toLocaleDateString()}</p>
              )}
              {turno.fecha_actualizacion && (
                <p><strong>Última Actualización:</strong> {new Date(turno.fecha_actualizacion).toLocaleDateString()}</p>
              )}
            </div>

            <div className="turno-actions">
              <button className="btn-secondary">👁️ Ver</button>
              <button className="btn-secondary">✏️ Editar</button>
              <button className="btn-primary">📋 Gestionar</button>
            </div>
          </div>
        ))}
      </div>
    )}
    
    <div className="pagination">
      <button
        disabled={!turnoCiePagination.hasPrevious}
        onClick={prevTurnoCiePage}
        className="pagination-btn"
      >
        ← Anterior
      </button>
      <span className="pagination-info">Página {turnoCiePagination.page}</span>
      <button
        disabled={!turnoCiePagination.hasNext}
        onClick={nextTurnoCiePage}
        className="pagination-btn"
      >
        Siguiente →
      </button>
    </div>
  </div>
));

// Componente de Solicitudes de Registro extraído para evitar re-creación
const SolicitudesRegistroView = React.memo(({
  solicitudes,
  solicitudesLoading,
  solicitudesPagination,
  searchTermSolicitudes,
  handleSearchSolicitudes,
  prevSolicitudesPage,
  nextSolicitudesPage
}) => (
  <div className="solicitudes-view">
    <h2>📝 Solicitudes de Registro ({solicitudes?.length || 0})</h2>
    
    {/* Búsqueda */}
    <div className="search-section">
      <input
        type="text"
        placeholder="Buscar solicitudes..."
        value={searchTermSolicitudes}
        onChange={handleSearchSolicitudes}
        className="search-input"
      />
    </div>
    
    {solicitudesLoading ? (
      <div className="loading">Cargando solicitudes...</div>
    ) : (
      <div className="solicitudes-grid">
        {solicitudes.map(solicitud => (
          <div key={solicitud.id} className="solicitud-card">
            <div className="solicitud-header">
              <h3>Solicitud: {solicitud.numero_solicitud || solicitud.solicitud}</h3>
              <span className="status-badge">{solicitud.estatus_solicitud}</span>
            </div>
            
            <div className="solicitud-info">
              <p><strong>Año:</strong> {solicitud.anio}</p>
              <p><strong>Fecha Solicitud:</strong> {solicitud.fecha_solicitud}</p>
              <p><strong>Solicitante:</strong> {solicitud.solicitante}</p>
              <p><strong>Persona Usuaria:</strong> {solicitud.persona_usuaria}</p>
              <p><strong>CURP:</strong> {solicitud.curp}</p>
              <p><strong>Delito:</strong> {solicitud.delito}</p>
              <p><strong>Recomendación:</strong> {solicitud.recomendacion}</p>
              <p><strong>Tipo Resolución:</strong> {solicitud.tipo_resolucion}</p>
              <p><strong>Reconocimiento Víctima:</strong> {solicitud.reconocimiento_victima}</p>
              <p><strong>Fecha Resolución:</strong> {solicitud.fecha_resolucion}</p>
              <p><strong>Tiempo Resolución:</strong> {solicitud.tiempo_resolucion} días</p>
              <p><strong>Aceptación:</strong> {solicitud.aceptacion}</p>
              {solicitud.fecha_completo && (
                <p><strong>Fecha Completo:</strong> {solicitud.fecha_completo}</p>
              )}
              {solicitud.identificaciones && (
                <p><strong>Identificaciones:</strong> {solicitud.identificaciones}</p>
              )}
              {solicitud.actas && (
                <p><strong>Actas:</strong> {solicitud.actas}</p>
              )}
              {solicitud.fuds && (
                <p><strong>FUDS:</strong> {solicitud.fuds}</p>
              )}
            </div>

            <div className="solicitud-actions">
              <button className="btn-secondary">👁️ Ver</button>
              <button className="btn-secondary">✏️ Editar</button>
              <button className="btn-primary">📋 Procesar</button>
            </div>
          </div>
        ))}
      </div>
    )}
    
    <div className="pagination">
      <button
        disabled={!solicitudesPagination.hasPrevious}
        onClick={prevSolicitudesPage}
        className="pagination-btn"
      >
        ← Anterior
      </button>
      <span className="pagination-info">Página {solicitudesPagination.page}</span>
      <button
        disabled={!solicitudesPagination.hasNext}
        onClick={nextSolicitudesPage}
        className="pagination-btn"
      >
        Siguiente →
      </button>
    </div>
  </div>
));

// Componente de vista de Notificaciones extraído para evitar re-creación
const NotificacionesView = React.memo(({ 
  notificacionesLoading, 
  notificaciones, 
  notificacionesPagination, 
  searchTermNotificaciones,
  handleSearchNotificaciones,
  handleNextPageNotificaciones,
  handlePrevPageNotificaciones
}) => (
  <div className="notificaciones-view">
    <div className="view-header">
      <h2>🔔 Notificaciones</h2>
      <div className="header-info">
        <span>Total: {notificacionesPagination.count.toLocaleString()}</span>
      </div>
    </div>

    {/* Filtros de búsqueda */}
    <div className="filters-section">
      <input
        type="text"
        placeholder="Buscar notificaciones..."
        value={searchTermNotificaciones}
        onChange={handleSearchNotificaciones}
        className="search-input"
      />
    </div>

    {/* Lista de notificaciones */}
    {notificacionesLoading ? (
      <div className="loading">
        <span>Cargando notificaciones...</span>
      </div>
    ) : notificaciones.length === 0 ? (
      <div className="empty-state">
        <div className="empty-state-icon">🔔</div>
        <h3>No se encontraron notificaciones</h3>
        <p>No hay notificaciones que coincidan con los filtros seleccionados</p>
      </div>
    ) : (
      <div className="notificaciones-list">
        {notificaciones.map(notificacion => (
          <div key={notificacion.id} className="notificacion-card">
            <div className="notificacion-header">
              <h4>📋 Notificación #{notificacion.id}</h4>
              <span className={`status status-${notificacion.tipo?.toLowerCase()}`}>
                {notificacion.tipo}
              </span>
            </div>
            <div className="notificacion-content">
              <p><strong>Asunto:</strong> {notificacion.asunto}</p>
              <p><strong>Destinatario:</strong> {notificacion.destinatario}</p>
              <p><strong>Descripción:</strong> {notificacion.descripcion}</p>
              <p><strong>Fecha:</strong> {new Date(notificacion.fecha_creacion).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    )}

    {/* Paginación */}
    <div className="pagination">
      <button 
        onClick={handlePrevPageNotificaciones}
        disabled={!notificacionesPagination.previous}
      >
        ← Anterior
      </button>
      <span>
        Página {Math.ceil((notificacionesPagination.count - notificacionesPagination.count + (notificaciones.length > 0 ? 1 : 0)))} de {Math.ceil(notificacionesPagination.count / 20)}
      </span>
      <button 
        onClick={handleNextPageNotificaciones}
        disabled={!notificacionesPagination.next}
      >
        Siguiente →
      </button>
    </div>
  </div>
));

// Componente de Dashboard extraído para evitar re-creación
const DashboardView = React.memo(({
  statsLoading,
  expedientesStats,
  oficiosEntradaStats,
  oficiosSalidaStats,
  solicitudesStats,
  turnoCieStats,
  notificacionesStats,
  StatsCard
}) => {
  // Debug de estadísticas
  console.log('🔍 Debug Estadísticas Dashboard:');
  console.log('📁 expedientesStats:', expedientesStats);
  console.log('📥 oficiosEntradaStats:', oficiosEntradaStats);
  console.log('📤 oficiosSalidaStats:', oficiosSalidaStats);
  console.log('📝 solicitudesStats:', solicitudesStats);
  console.log('🔄 turnoCieStats:', turnoCieStats);
  console.log('🔔 notificacionesStats:', notificacionesStats);
  
  return (
    <div className="dashboard-view">
      <h2>📊 Panel de Control</h2>
      
      {statsLoading ? (
        <div className="loading">Cargando estadísticas...</div>
      ) : (
        <div className="stats-grid">
          <StatsCard
            title="Total Expedientes"
            value={expedientesStats?.total_expedientes}
            icon="📁"
          />
          <StatsCard
            title="Oficios de Entrada"
            value={oficiosEntradaStats?.total_oficios}
            percentage={oficiosEntradaStats?.porcentaje_con_archivo}
            trend="positive"
            icon="📥"
          />
          <StatsCard
            title="Oficios de Salida"
            value={oficiosSalidaStats?.total_oficios}
            percentage={oficiosSalidaStats?.porcentaje_con_archivo}
            trend="positive"
            icon="📤"
          />
          <StatsCard
            title="Solicitudes"
            value={solicitudesStats?.total_solicitudes}
            icon="📝"
          />
          <StatsCard
            title="Turno CIE"
            value={turnoCieStats?.total_turnos}
            icon="🔄"
          />
          <StatsCard
            title="Notificaciones"
            value={notificacionesStats?.total_notificaciones}
            icon="🔔"
          />
        </div>
      )}

      {/* Gráfico por año */}
      {oficiosEntradaStats?.por_anio && (
        <div className="chart-section">
          <h3>📈 Oficios por Año</h3>
          <div className="chart-bars">
            {oficiosEntradaStats.por_anio.map(item => (
              <div key={item.anio} className="chart-bar">
                <div className="bar-value" style={{ height: `${(item.total / Math.max(...oficiosEntradaStats.por_anio.map(x => x.total))) * 100}%` }}>
                  <span>{item.total}</span>
                </div>
                <div className="bar-label">Año {item.anio}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estadísticas por autoridad */}
      {oficiosEntradaStats?.por_autoridad && (
        <div className="authority-stats">
          <h3>🏛️ Por Autoridad/Dependencia</h3>
          <div className="authority-list">
            {oficiosEntradaStats.por_autoridad.slice(0, 10).map(item => (
              <div key={item.autoridad_dependencia} className="authority-item">
                <span className="authority-name">{item.autoridad_dependencia}</span>
                <span className="authority-count">{item.cantidad}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

// Componente principal
const ControlGestion = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Estados de búsqueda separados para cada sección
  const [searchTermOficiosEntrada, setSearchTermOficiosEntrada] = useState('');
  const [searchTermOficiosSalida, setSearchTermOficiosSalida] = useState('');
  const [searchTermExpedientes, setSearchTermExpedientes] = useState('');
  const [searchTermSolicitudes, setSearchTermSolicitudes] = useState('');
  const [searchTermTurnoCie, setSearchTermTurnoCie] = useState('');
  const [searchTermNotificaciones, setSearchTermNotificaciones] = useState('');

  // Estados para modal de vista previa PDF
  const [modalVistaPrevia, setModalVistaPrevia] = useState({
    isOpen: false,
    pdfUrl: '',
    titulo: ''
  });

  // Debounce para búsquedas
  const debouncedSearchOficiosEntrada = useDebounce(searchTermOficiosEntrada, 300);
  const debouncedSearchOficiosSalida = useDebounce(searchTermOficiosSalida, 300);
  const debouncedSearchExpedientes = useDebounce(searchTermExpedientes, 300);
  const debouncedSearchSolicitudes = useDebounce(searchTermSolicitudes, 300);
  const debouncedSearchTurnoCie = useDebounce(searchTermTurnoCie, 300);
  const debouncedSearchNotificaciones = useDebounce(searchTermNotificaciones, 300);

  // Handlers de búsqueda estables
  const handleSearchOficiosEntrada = useCallback((e) => {
    setSearchTermOficiosEntrada(e.target.value);
  }, []);

  const handleSearchOficiosSalida = useCallback((e) => {
    setSearchTermOficiosSalida(e.target.value);
  }, []);

  const handleSearchExpedientes = useCallback((e) => {
    setSearchTermExpedientes(e.target.value);
  }, []);

  const handleSearchSolicitudes = useCallback((e) => {
    setSearchTermSolicitudes(e.target.value);
  }, []);

  const handleSearchTurnoCie = useCallback((e) => {
    setSearchTermTurnoCie(e.target.value);
  }, []);

  const handleSearchNotificaciones = useCallback((e) => {
    setSearchTermNotificaciones(e.target.value);
  }, []);

  // Hook de paginación para oficios de entrada
  const {
    data: oficios,
    loading: oficiosLoading,
    pagination: oficiosPagination,
    updateParams: updateOficiosParams,
    nextPage: nextOficiosPage,
    previousPage: prevOficiosPage
  } = usePagination('/control-gestion/oficios-entrada/', {
    search: debouncedSearchOficiosEntrada
  });

  // Hook de paginación para expedientes
  const {
    data: expedientes,
    loading: expedientesLoading,
    pagination: expedientesPagination,
    updateParams: updateExpedientesParams,
    nextPage: nextExpedientesPage,
    previousPage: prevExpedientesPage
  } = usePagination('/control-gestion/expedientes/', {
    search: debouncedSearchExpedientes
  });

  // Hook de paginación para oficios de salida
  const {
    data: oficiosSalida,
    loading: oficiosSalidaLoading,
    pagination: oficiosSalidaPagination,
    updateParams: updateOficiosSalidaParams,
    nextPage: nextOficiosSalidaPage,
    previousPage: prevOficiosSalidaPage
  } = usePagination('/control-gestion/oficios-salida/', {
    search: debouncedSearchOficiosSalida
  });

  // Hook de paginación para solicitudes
  const {
    data: solicitudes,
    loading: solicitudesLoading,
    pagination: solicitudesPagination,
    updateParams: updateSolicitudesParams,
    nextPage: nextSolicitudesPage,
    previousPage: prevSolicitudesPage
  } = usePagination('/control-gestion/solicitudes-registro/', {
    search: debouncedSearchSolicitudes
  });

  // Hook de paginación para turno CIE
  const {
    data: turnoCie,
    loading: turnoCieLoading,
    pagination: turnoCiePagination,
    updateParams: updateTurnoCieParams,
    nextPage: nextTurnoCiePage,
    previousPage: prevTurnoCiePage
  } = usePagination('/control-gestion/turno-cie/', {
    search: debouncedSearchTurnoCie
  });

  // Hook de paginación para notificaciones
  const {
    data: notificaciones,
    loading: notificacionesLoading,
    pagination: notificacionesPagination,
    updateParams: updateNotificacionesParams,
    nextPage: nextNotificacionesPage,
    previousPage: prevNotificacionesPage
  } = usePagination('/control-gestion/notificaciones/', {
    search: debouncedSearchNotificaciones
  });

  // Stats hooks
  const {
    data: expedientesStats,
    loading: expedientesStatsLoading
  } = useStats('/control-gestion/expedientes/estadisticas/');

  const {
    data: oficiosEntradaStats,
    loading: oficiosEntradaStatsLoading
  } = useStats('/control-gestion/oficios-entrada/estadisticas/');

  const {
    data: oficiosSalidaStats,
    loading: oficiosSalidaStatsLoading
  } = useStats('/control-gestion/oficios-salida/estadisticas/');

  const {
    data: solicitudesStats,
    loading: solicitudesStatsLoading
  } = useStats('/control-gestion/solicitudes-registro/estadisticas/');

  const {
    data: turnoCieStats,
    loading: turnoCieStatsLoading
  } = useStats('/control-gestion/turno-cie/estadisticas/');

  const {
    data: notificacionesStats,
    loading: notificacionesStatsLoading
  } = useStats('/control-gestion/notificaciones/estadisticas/');

  const statsLoading = expedientesStatsLoading || oficiosEntradaStatsLoading || 
                     oficiosSalidaStatsLoading || solicitudesStatsLoading || 
                     turnoCieStatsLoading || notificacionesStatsLoading;

  // Función para vista previa de PDF
  const handleVistaPrevia = async (oficioId, titulo, tipo = 'entrada') => {
    try {
      const token = localStorage.getItem('api_token');
      if (!token) {
        alert('No hay token de autenticación. Por favor, inicia sesión nuevamente.');
        return;
      }

      const endpoint = tipo === 'entrada' 
        ? `/api/control-gestion/oficios-entrada/${oficioId}/descargar_pdf/`
        : `/api/control-gestion/oficios-salida/${oficioId}/descargar_pdf/`;

      const response = await fetch(`https://backend-registro-sa7u.onrender.com${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Abrir modal en lugar de ventana emergente
      setModalVistaPrevia({
        isOpen: true,
        pdfUrl: url,
        titulo: titulo
      });

    } catch (error) {
      console.error('Error al cargar vista previa:', error);
      alert('Error al cargar la vista previa del PDF');
    }
  };

  // Función para cerrar el modal
  const cerrarModalVistaPrevia = () => {
    if (modalVistaPrevia.pdfUrl) {
      URL.revokeObjectURL(modalVistaPrevia.pdfUrl);
    }
    setModalVistaPrevia({
      isOpen: false,
      pdfUrl: '',
      titulo: ''
    });
  };

  // Función para descargar PDF
  const handleDescargarPDF = async (oficioId, filename, tipo = 'entrada') => {
    try {
      const token = localStorage.getItem('api_token');
      if (!token) {
        alert('No hay token de autenticación. Por favor, inicia sesión nuevamente.');
        return;
      }

      const endpoint = tipo === 'entrada' 
        ? `/api/control-gestion/oficios-entrada/${oficioId}/descargar_pdf/`
        : `/api/control-gestion/oficios-salida/${oficioId}/descargar_pdf/`;

      const response = await fetch(`https://backend-registro-sa7u.onrender.com${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Crear enlace de descarga
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'documento.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Limpiar URL
      setTimeout(() => URL.revokeObjectURL(url), 100);

    } catch (error) {
      console.error('Error al descargar PDF:', error);
      alert('Error al descargar el PDF');
    }
  };

  // Componente StatsCard
  const StatsCard = ({ title, value, percentage, trend, icon }) => (
    <div className={`stats-card ${trend ? `trend-${trend}` : ''}`}>
      <div className="stats-icon">{icon}</div>
      <div className="stats-content">
        <h3>{title}</h3>
        <div className="stats-value">{value?.toLocaleString() || '0'}</div>
        {percentage && (
          <div className="stats-percentage">
            {percentage}% con archivo
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="control-gestion">
      <HeaderInstitucional />
      
      <div className="control-gestion-container">
        <h1>Control de Gestión CEAVI</h1>
        
        {/* Navegación por tabs */}
        <div className="tabs-navigation">
          <button
            className={activeTab === 'dashboard' ? 'tab-active' : 'tab-inactive'}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button
            className={activeTab === 'oficios-entrada' ? 'tab-active' : 'tab-inactive'}
            onClick={() => setActiveTab('oficios-entrada')}
          >
            📥 Oficios Entrada
          </button>
          <button
            className={activeTab === 'expedientes' ? 'tab-active' : 'tab-inactive'}
            onClick={() => setActiveTab('expedientes')}
          >
            📁 Expedientes
          </button>
          <button
            className={activeTab === 'oficios-salida' ? 'tab-active' : 'tab-inactive'}
            onClick={() => setActiveTab('oficios-salida')}
          >
            📤 Oficios Salida
          </button>
          <button
            className={activeTab === 'solicitudes' ? 'tab-active' : 'tab-inactive'}
            onClick={() => setActiveTab('solicitudes')}
          >
            📝 Solicitudes
          </button>
          <button
            className={activeTab === 'turno-cie' ? 'tab-active' : 'tab-inactive'}
            onClick={() => setActiveTab('turno-cie')}
          >
            🔄 Turno CIE
          </button>
          <button
            className={activeTab === 'notificaciones' ? 'tab-active' : 'tab-inactive'}
            onClick={() => setActiveTab('notificaciones')}
          >
            🔔 Notificaciones
          </button>
        </div>

        {/* Contenido según tab activo */}
        <div className="tab-content">
          {activeTab === 'dashboard' && (
            <DashboardView
              statsLoading={statsLoading}
              expedientesStats={expedientesStats}
              oficiosEntradaStats={oficiosEntradaStats}
              oficiosSalidaStats={oficiosSalidaStats}
              solicitudesStats={solicitudesStats}
              turnoCieStats={turnoCieStats}
              notificacionesStats={notificacionesStats}
              StatsCard={StatsCard}
            />
          )}
          {activeTab === 'oficios-entrada' && (
            <OficiosEntradaView
              oficios={oficios}
              oficiosPagination={oficiosPagination}
              oficiosLoading={oficiosLoading}
              searchTerm={searchTermOficiosEntrada}
              onSearchChange={handleSearchOficiosEntrada}
              onPrevPage={prevOficiosPage}
              onNextPage={nextOficiosPage}
              onVistaPrevia={handleVistaPrevia}
              onDescargarPDF={handleDescargarPDF}
            />
          )}
          {activeTab === 'expedientes' && (
            <ExpedientesView
              expedientes={expedientes}
              expedientesPagination={expedientesPagination}
              expedientesLoading={expedientesLoading}
              searchTerm={searchTermExpedientes}
              onSearchChange={handleSearchExpedientes}
              onPrevPage={prevExpedientesPage}
              onNextPage={nextExpedientesPage}
            />
          )}
          {activeTab === 'oficios-salida' && (
            <OficiosSalidaView
              oficiosSalida={oficiosSalida}
              oficiosSalidaPagination={oficiosSalidaPagination}
              oficiosSalidaLoading={oficiosSalidaLoading}
              searchTerm={searchTermOficiosSalida}
              onSearchChange={handleSearchOficiosSalida}
              onPrevPage={prevOficiosSalidaPage}
              onNextPage={nextOficiosSalidaPage}
            />
          )}
          {activeTab === 'solicitudes' && (
            <SolicitudesRegistroView
              solicitudes={solicitudes}
              solicitudesLoading={solicitudesLoading}
              solicitudesPagination={solicitudesPagination}
              searchTermSolicitudes={searchTermSolicitudes}
              handleSearchSolicitudes={handleSearchSolicitudes}
              prevSolicitudesPage={prevSolicitudesPage}
              nextSolicitudesPage={nextSolicitudesPage}
            />
          )}
          {activeTab === 'turno-cie' && (
            <TurnoCieView
              turnoCie={turnoCie}
              turnoCieLoading={turnoCieLoading}
              turnoCiePagination={turnoCiePagination}
              searchTermTurnoCie={searchTermTurnoCie}
              handleSearchTurnoCie={handleSearchTurnoCie}
              prevTurnoCiePage={prevTurnoCiePage}
              nextTurnoCiePage={nextTurnoCiePage}
            />
          )}
          {activeTab === 'notificaciones' && (
            <NotificacionesView
              notificacionesLoading={notificacionesLoading}
              notificaciones={notificaciones}
              notificacionesPagination={notificacionesPagination}
              searchTermNotificaciones={searchTermNotificaciones}
              handleSearchNotificaciones={handleSearchNotificaciones}
              handleNextPageNotificaciones={nextNotificacionesPage}
              handlePrevPageNotificaciones={prevNotificacionesPage}
            />
          )}
        </div>
      </div>

      {/* Modal de Vista Previa PDF */}
      {modalVistaPrevia.isOpen && (
        <div className="pdf-modal-overlay" onClick={cerrarModalVistaPrevia}>
          <div className="pdf-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="pdf-modal-header">
              <h3>{modalVistaPrevia.titulo}</h3>
              <button 
                className="pdf-modal-close"
                onClick={cerrarModalVistaPrevia}
                aria-label="Cerrar vista previa"
              >
                ✕
              </button>
            </div>
            <div className="pdf-modal-body">
              <iframe
                src={modalVistaPrevia.pdfUrl}
                type="application/pdf"
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                title={modalVistaPrevia.titulo}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlGestion;
