import React, { useEffect, useState } from 'react';
import HeaderInstitucional from '../components/HeaderInstitucional';
import './BuscarVictimas.css';
import './BuscarVictimasNoSQL.css';

const FIELD_LABELS = {
  id: 'ID',
  expedienteunico: 'Expediente Único',
  nombre: 'Nombre',
  tipo: 'Tipo',
  procedencia: 'Procedencia',
  clasificacion: 'Clasificación',
  pagado: 'Pagado',
  fechapago: 'Fecha Pago',
  monto: 'Monto',
  pago: 'Pago',
  fechaciefondo: 'Fecha CIE/Fondo',
  recepcionceavi: 'Recepción CEAVI',
  atrasohoy: 'Atraso Hoy',
  registro: 'Registro',
  expedyentefisico: 'Expediente Físico',
  expf: 'Expediente Físico',
  ubicacion: 'Ubicación',
  estatus: 'Estatus',
  primercontacto: 'Primer Contacto',
  fondo: 'Fondo',
  contencioso: 'Contencioso'
};

const BuscarCIE = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [stats, setStats] = useState({ total: 0 });
  const [expandedItem, setExpandedItem] = useState(null);
  const [allKeys, setAllKeys] = useState([]);
  const [activeSearchTerm, setActiveSearchTerm] = useState('');

  const cargar = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = `/data/cie.json?_ts=${Date.now()}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} ${res.statusText} al obtener ${url}. Respuesta: ${body.slice(0,200)}`);
      }
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      if (!ct.includes('application/json')) {
        const text = await res.text().catch(() => '');
        throw new Error('El recurso /data/cie.json no devolvió JSON. Verifique que exista en public/data/');
      }
      const all = await res.json();
      // calcular keys globales
      const keysSet = new Set();
      if (Array.isArray(all)) all.forEach(o => { if (o && typeof o === 'object') Object.keys(o).forEach(k => keysSet.add(k)); });
      setAllKeys(Array.from(keysSet));

      const term = (search || '').trim().toLowerCase();
      let filtered = all;
      if (term) {
        filtered = all.filter(item => {
          try { return JSON.stringify(item).toLowerCase().includes(term); }
          catch (e) {
            return false;
          }
        });
      }

      setStats({ total: filtered.length });
      setActiveSearchTerm(search || '');
      const start = (page - 1) * perPage;
      setItems(filtered.slice(start, start + perPage));
    } catch (e) {
      console.error('Error cargando CIE:', e);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, [page]);
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); cargar(); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const onSearch = (e) => { e.preventDefault(); setPage(1); cargar(); };

  return (
    <div className="bv-page min-h-screen bg-white">
      <HeaderInstitucional />
      <div className="container mx-auto px-4 py-8">
        <div className="card">
          <h1 className="title">Busca en la base de datos del Comité Interdisciplinario Evaluador</h1>
          <p className="muted">Consulta los datos sobre expedientes, procesos, reparación integral, etc.</p>

          <form className="search-form" onSubmit={onSearch}>
            <input className="search-input" placeholder="Buscar por nombre u otro texto" value={search} onChange={(e) => setSearch(e.target.value)} />
            <button className="btn" type="submit">Buscar</button>
          </form>

          <div className="stats">Total registros: {stats.total?.toLocaleString() || 0} {activeSearchTerm ? <span className="text-sm">— buscando: "{activeSearchTerm}"</span> : null}</div>

          {loading && <div className="loading">Cargando...</div>}
          {error && <div className="error">{error}</div>}

          <table className="results-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{FIELD_LABELS.id}</th>
                <th>{FIELD_LABELS.nombre}</th>
                <th>{FIELD_LABELS.tipo}</th>
                <th>{FIELD_LABELS.fechaciefondo}</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && !loading && (
                <tr><td colSpan={6} className="empty">Sin resultados</td></tr>
              )}
              {items.map((v, i) => {
                const get = (obj, keys) => {
                  for (const k of keys) if (k in obj && obj[k]) return obj[k];
                  const norm = s => String(s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
                  const ks = Object.keys(obj || {});
                  const cand = keys.map(k => norm(k));
                  for (const k of ks) {
                    const kn = norm(k);
                    if (cand.indexOf(kn) !== -1) return obj[k];
                  }
                  for (const k of ks) {
                    const kn = norm(k);
                    for (const c of cand) if (kn.includes(c) && obj[k]) return obj[k];
                  }
                  return undefined;
                };

                const id = get(v, ['id','col_1']);
                const nombre = get(v, ['nombre','col_3']);
                const tipo = get(v, ['tipo','col_4']);
                const fecha = get(v, ['fechaciefondo','col_12','fecha','Fecha','fecha_registro']);
                const thisIndex = (page-1)*perPage + i + 1;

                return (
                  <React.Fragment key={i}>
                    <tr>
                      <td>{thisIndex}</td>
                      <td className="mono">{id || 'N/A'}</td>
                      <td>{nombre || 'N/A'}</td>
                      <td>{tipo || '-'}</td>
                      <td>{fecha || '-'}</td>
                      <td><button className="btn small" onClick={() => setExpandedItem(prev => (prev && prev.index === thisIndex) ? null : { item: v, index: thisIndex })}>Ver más</button></td>
                    </tr>

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
                                    <td className="py-2 align-top font-mono text-xs text-gray-700 bg-gray-50 px-3 font-bold" style={{width: '30%'}}><strong>{FIELD_LABELS[k] || k}</strong></td>
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
            <span>Página {page} / {Math.max(1, Math.ceil((stats.total || 0) / perPage))}</span>
            <button className="page-btn" disabled={page >= Math.ceil((stats.total || 0) / perPage)} onClick={() => setPage(p => Math.min(Math.ceil((stats.total || 0) / perPage), p+1))}>Siguiente</button>
          </div>

          {/* Modal */}
          {expandedItem && (
            <div className="modal-overlay">
              <div className="modal-content animate-scale-in" role="dialog" aria-modal="true">
                <div className="bg-gradient-to-r from-primary-burgundy to-burgundy-dark p-6 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-bold mb-1">Detalle CIE</h3>
                      <p className="text-white/90 text-sm">Registro #{expandedItem.index}</p>
                    </div>
                    <button onClick={() => setExpandedItem(null)} className="text-white/80 hover:text-white bg-white/20 hover:bg-white/30 rounded-xl p-2">×</button>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[80vh]">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded-2xl border border-gray-100">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center border-b pb-3">Datos</h4>
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
                                <td className="py-2 whitespace-pre-wrap text-xs text-gray-800">{(() => {
                                  const val = expandedItem.item.hasOwnProperty(k) ? expandedItem.item[k] : '';
                                  if (val === null || val === undefined || val === '') return <span className="text-gray-400">(vacío)</span>;
                                  if (typeof val === 'object') return <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(val, null, 2)}</pre>;
                                  return String(val);
                                })()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-gray-100">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h4>
                      <div className="space-y-3 text-sm">
                        {/* resumen similar al otro */}
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

export default BuscarCIE;
