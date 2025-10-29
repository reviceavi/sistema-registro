import React, { useEffect, useState } from 'react';
import HeaderInstitucional from '../components/HeaderInstitucional';
import './BuscarVictimasNoSQL.css';
// Importar estilos compartidos de BuscarVictimas para el modal/subventana
import './BuscarVictimas.css';
// Ahora la fuente es local: /data/base_upc_merged_sanitized_array.json

const BuscarVictimasNoSQL = () => {
  const [victimas, setVictimas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [stats, setStats] = useState({ total_victimas: 0 });
  const [expandedItem, setExpandedItem] = useState(null); // para 'Ver más'
  const [allKeys, setAllKeys] = useState([]); // union de todas las keys disponibles en el dataset

  const cargar = async () => {
    try {
      setLoading(true);
      setError(null);

  // Cargar archivo JSON local (ruta pública /data/...) con cache-busting
  const url = `/data/base_upc_merged_sanitized_array.json?_ts=${Date.now()}`;
  const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${res.statusText} al obtener /data/base_upc_merged_sanitized_array.json. Respuesta: ${body.slice(0,200)}`);
      }

      const ct = (res.headers.get('content-type') || '').toLowerCase();
      if (!ct.includes('application/json')) {
        // Si el servidor devolvió HTML (p. ej. index.html) o texto en vez de JSON, leer el texto y lanzar un error explicativo
        const text = await res.text().catch(() => '');
        console.error('Respuesta inesperada al solicitar el JSON (no es application/json):', text.slice(0,1000));
        throw new Error('El recurso /data/base_upc_merged_sanitized_array.json no devolvió JSON. Verifique que el archivo exista en public/data/ y que la ruta sea accesible.');
      }

      const all = await res.json();

      // construir lista de keys global (unión de todas las keys de los registros)
      try {
        const keysSet = new Set();
        if (Array.isArray(all)) {
          all.forEach(obj => {
            if (obj && typeof obj === 'object') Object.keys(obj).forEach(k => keysSet.add(k));
          });
        }
        setAllKeys(Array.from(keysSet));
      } catch (err) {
        console.warn('No se pudo calcular allKeys:', err);
      }

      // Helper para acceder a keys posibles (normaliza quitando acentos y case-insensitive)
      const findField = (obj, candidates = []) => {
        if (!obj || typeof obj !== 'object') return undefined;
        const keys = Object.keys(obj);
        const normalize = s => String(s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
        for (const c of candidates) {
          // comparaciones directas
          if (c in obj && obj[c]) return obj[c];
        }
        const candNorms = candidates.map(c => normalize(c));
        for (const k of keys) {
          const kn = normalize(k);
          const idx = candNorms.indexOf(kn);
          if (idx !== -1 && obj[k]) return obj[k];
        }
        // fallback: buscar cualquiera que contenga alguna palabra clave
        for (const k of keys) {
          const kn = normalize(k);
          for (const c of candidates) {
            if (kn.includes(normalize(c)) && obj[k]) return obj[k];
          }
        }
        return undefined;
      };

      // Filtrado local por término de búsqueda: implementación robusta
      // Convertimos cada registro a texto (JSON) y buscamos el término en cualquier campo.
      const term = (search || '').trim().toLowerCase();
      let filtered = all;
      if (term) {
        filtered = all.filter(item => {
          try {
            const txt = JSON.stringify(item).toLowerCase();
            return txt.includes(term);
          } catch (err) {
            // Fallback: intentar buscar en campos comunes
            const fallback = [
              findField(item, ['nombre_victima', 'nombre']),
              findField(item, ['alfanumerica_registro','alfanumericaregistro','numero_registro','numero']),
              findField(item, ['expediente_judicial','carpeta_investigacion']),
              findField(item, ['alcaldia','alcaldia_hecho_victimizante'])
            ].filter(Boolean).join(' ').toLowerCase();
            return fallback.includes(term);
          }
        });
      }

      setStats({ total_victimas: filtered.length });

      // Paginación local
      const start = (page - 1) * perPage;
      const pageItems = filtered.slice(start, start + perPage);
      setVictimas(pageItems);
    } catch (e) {
      console.error('Error cargando victimas NoSQL:', e);
      setError('Error al obtener datos');
    } finally {
      setLoading(false);
    }
  };

  // Ejecutar carga cuando cambie la página o el término de búsqueda.
  useEffect(() => { cargar(); }, [page]);

  // Debounce simple: recargar cuando el usuario deja de tipear
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      cargar();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const onSearch = async (e) => {
    e.preventDefault();
    // Forzar recarga inmediata al enviar el formulario
    setPage(1);
    cargar();
  };

  return (
    <div className="bv-page min-h-screen bg-white">
      <HeaderInstitucional />
      <div className="container mx-auto px-4 py-8">
        <div className="card">
          <h1 className="title">Buscar en Datos de UPC</h1>
          <p className="muted">Esta subpágina permite consultar los datos de gestiones y atención a víctimas de la Unidad de Atención Inmediata y Primer Contacto.</p>

          <form className="search-form" onSubmit={onSearch}>
            <input className="search-input" placeholder="Buscar por nombre, expediente o registro" value={search} onChange={(e) => setSearch(e.target.value)} />
            <button className="btn" type="submit">Buscar</button>
          </form>

          <div className="stats">Total observaciones: {stats.total_victimas?.toLocaleString() || 0}</div>

          {loading && <div className="loading">Cargando...</div>}
          {error && <div className="error">{error}</div>}

          <table className="results-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Registro</th>
                <th>Nombre</th>
                <th>Año</th>
                <th>Alcaldía</th>
              </tr>
            </thead>
            <tbody>
              {victimas.length === 0 && !loading && (
                <tr><td colSpan={5} className="empty">Sin resultados</td></tr>
              )}
              {victimas.map((v, i) => {
                // pequeña normalización local para render
                const normalize = s => String(s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '');
                const get = (obj, candidates) => {
                  if (!obj) return undefined;
                  for (const c of candidates) if (c in obj && obj[c]) return obj[c];
                  // try case-insensitive / normalized
                  const keys = Object.keys(obj);
                  const cnorms = candidates.map(c => normalize(c).toLowerCase());
                  for (const k of keys) {
                    const kn = normalize(k).toLowerCase();
                    if (cnorms.indexOf(kn) !== -1) return obj[k];
                  }
                  for (const k of keys) {
                    const kn = normalize(k).toLowerCase();
                    for (const c of cnorms) if (kn.includes(c) && obj[k]) return obj[k];
                  }
                  return undefined;
                };

                const registro = get(v, ['alfanumerica_registro','alfanúmericaregistro','alfanumericaregistro','AlfanúmericaRegistro','alfanumericaRegistro','numero_registro','numero']);
                const nombre = get(v, ['nombre_victima','nombre','padron_NombreVíctima','padron_NombreVictima','padron_Nombre']);
                const alcaldia = get(v, ['alcaldia','ALCALDIA','alcaldia_hecho_victimizante']);
                const fecha = get(v, ['fecha','padron_FechaRegistro','padron_Fecha_registro']);
                let anio = get(v, ['padron_Año','anio']);
                if (!anio && fecha) {
                  // intentar extraer año de formatos dd/mm/yyyy o texto con año
                  const m = String(fecha).match(/(20\d{2}|19\d{2})/);
                  if (m) anio = m[0];
                }

                const thisIndex = (page-1)*perPage + i + 1;
                return (
                  <React.Fragment key={v.id || i}>
                    <tr>
                      <td>{thisIndex}</td>
                      <td className="mono">{registro || 'N/A'}</td>
                      <td>{nombre || 'N/A'}</td>
                      <td>{anio || '-'}</td>
                      <td>{alcaldia || '-'}</td>
                      <td>
                        <button type="button" className="btn small" onClick={() => setExpandedItem(prev => (prev && prev.index === thisIndex) ? null : { item: v, index: thisIndex })}>Ver más</button>
                      </td>
                    </tr>

                    {/* Expansión inline como fallback si el modal no aparece o prefieres ver en la tabla */}
                    {expandedItem && expandedItem.index === thisIndex && (
                      <tr className="bg-gray-50">
                        <td colSpan={6}>
                          <div className="p-2">
                            <table className="w-full text-sm table-auto">
                              <thead>
                                <tr className="text-left border-b">
                                  <th className="pb-2 bg-gray-100 text-gray-800 font-semibold">Clave</th>
                                  <th className="pb-2">Valor</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(allKeys && allKeys.length ? allKeys : Object.keys(v)).map((k) => (
                                  <tr key={k} className="align-top border-b">
                                    <td className="py-2 align-top font-mono text-xs text-gray-700 bg-gray-50 px-3 font-bold" style={{width: '30%'}}><strong>{k}</strong></td>
                                    <td className="py-2 whitespace-pre-wrap text-xs text-gray-800">{(() => {
                                      const val = v.hasOwnProperty(k) ? v[k] : '';
                                      if (val === null || val === undefined || val === '') return <span className="text-gray-400">(vacío)</span>;
                                      if (typeof val === 'object') return <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(val, null, 2)}</pre>;
                                      return String(val);
                                    })()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          <div className="pagination">
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p-1))}>Anterior</button>
            <span>Página {page} / {Math.max(1, Math.ceil((stats.total_victimas || 0) / perPage))}</span>
            <button className="page-btn" disabled={page >= Math.ceil((stats.total_victimas || 0) / perPage)} onClick={() => setPage(p => Math.min(Math.ceil((stats.total_victimas || 0) / perPage), p+1))}>Siguiente</button>
          </div>

          {/* Modal / Drawer para ver detalle completo (usar las clases de BuscarVictimas para heredar estilos) */}
          {expandedItem && (
            <div className="modal-overlay">
              <div className="modal-content animate-scale-in" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-desc">
                {/* Header degradado */}
                <div className="bg-gradient-to-r from-primary-burgundy to-burgundy-dark p-6 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 id="modal-title" className="text-2xl font-bold mb-1">Detalle completo</h3>
                      <p id="modal-desc" className="text-white/90 text-sm">Registro #{expandedItem.index} — {expandedItem.item && (expandedItem.item.nombre_victima || expandedItem.item.nombre || expandedItem.item.padron_NombreVictima || '')}</p>
                    </div>
                    <button
                      onClick={() => setExpandedItem(null)}
                      className="text-white/80 hover:text-white bg-white/20 hover:bg-white/30 rounded-xl p-2 transition-all duration-200"
                      aria-label="Cerrar modal"
                      title="Cerrar"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Contenido del modal */}
                <div className="p-6 overflow-y-auto max-h-[80vh]">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded-2xl border border-gray-100">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center border-b pb-3">Datos del Registro</h4>
                      <div className="text-sm mono">
                        <table className="w-full text-sm table-auto">
                          <thead>
                            <tr className="text-left border-b">
                              <th className="pb-2 bg-gray-100 text-gray-800 font-semibold">Clave</th>
                              <th className="pb-2">Valor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(allKeys && allKeys.length ? allKeys : Object.keys(expandedItem.item)).map((k) => (
                              <tr key={k} className="align-top border-b">
                                <td className="py-2 align-top font-mono text-xs text-gray-700 bg-gray-50 px-3 font-bold" style={{width: '32%'}}><strong>{k}</strong></td>
                                <td className="py-2 whitespace-pre-wrap text-xs text-gray-800">
                                  {(() => {
                                    const val = expandedItem.item.hasOwnProperty(k) ? expandedItem.item[k] : '';
                                    if (val === null || val === undefined || val === '') return <span className="text-gray-400">(vacío)</span>;
                                    if (typeof val === 'object') return <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(val, null, 2)}</pre>;
                                    return String(val);
                                  })()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-gray-100">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h4>
                      <div className="space-y-3 text-sm">
                        {(() => {
                          const v = expandedItem.item || {};
                          const get = (cands) => {
                            for (const c of cands) if (v[c]) return v[c];
                            const normalize = s => String(s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
                            const keys = Object.keys(v);
                            for (const k of keys) {
                              const kn = normalize(k);
                              for (const c of cands) if (kn.includes(normalize(c))) return v[k];
                            }
                            return null;
                          };

                          return (
                            <>
                              <div className="border-b border-gray-100 pb-2">
                                <label className="font-medium text-gray-600">Registro:</label>
                                <p className="text-gray-900 mt-1">{get(['alfanumerica_registro','alfanumericaregistro','numero_registro','registro']) || 'N/A'}</p>
                              </div>
                              <div className="border-b border-gray-100 pb-2">
                                <label className="font-medium text-gray-600">Nombre:</label>
                                <p className="text-gray-900 mt-1">{get(['nombre_victima','nombre','padron_NombreVictima']) || 'N/A'}</p>
                              </div>
                              <div className="border-b border-gray-100 pb-2">
                                <label className="font-medium text-gray-600">Alcaldía:</label>
                                <p className="text-gray-900 mt-1">{get(['alcaldia','alcaldia_hecho_victimizante']) || 'N/A'}</p>
                              </div>
                              <div className="border-b border-gray-100 pb-2">
                                <label className="font-medium text-gray-600">Año / Fecha:</label>
                                <p className="text-gray-900 mt-1">{get(['padron_Año','anio','fecha','fecha_registro']) || 'N/A'}</p>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex justify-end">
                    <button type="button" className="px-6 py-3 bg-gradient-to-r from-primary-burgundy to-burgundy-dark text-white rounded-xl font-medium" onClick={() => setExpandedItem(null)}>Cerrar</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuscarVictimasNoSQL;
