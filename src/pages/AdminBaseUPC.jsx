import React, { useEffect, useMemo, useState } from 'react';

// Versión simplificada y enfocada en visualización de la colección `base_upc`.
// Este frontend no se conecta directamente a MongoDB: usa el endpoint backend
// `/api/mongo-admin` (serverless/mongo_admin) que debe tener `MONGODB_URI` configurada.

function AdminBaseUPC() {
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState([]);
  const [schema, setSchema] = useState({});
  const [error, setError] = useState(null);

  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(50);
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);

  // carga esquema (tipos y ejemplos) — muestra las variables disponibles
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/mongo-admin?action=schema&size=200', { credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        const body = await res.json();
        if (mounted && body && body.schema) setSchema(body.schema);
      } catch (err) {
        console.error('Error fetching schema', err);
        if (mounted) setError(String(err.message || err));
      }
    })();
    return () => { mounted = false; };
  }, []);

  // carga documentos
  useEffect(() => {
    load();
  }, [limit, skip]);

  async function load(search) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (typeof search !== 'undefined') params.set('q', search || '');
      else if (q) params.set('q', q);
      params.set('limit', String(limit));
      params.set('skip', String(skip));

      const res = await fetch(`/api/mongo-admin?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const body = await res.json();
      setDocs(body.results || []);
      setTotal(body.total || 0);
    } catch (err) {
      console.error('Error loading docs', err);
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e && e.preventDefault();
    setSkip(0);
    load(q);
  }

  // columnas: usar las claves del schema ordenadas (poner _id primero si existe)
  const columns = useMemo(() => {
    const keys = Object.keys(schema || {});
    if (keys.includes('_id')) {
      keys.sort((a, b) => (a === '_id' ? -1 : b === '_id' ? 1 : a.localeCompare(b)));
    }
    return keys.length ? keys : (docs.length ? Object.keys(docs[0] || {}) : []);
  }, [schema, docs]);

  function renderCell(value) {
    if (value === null || typeof value === 'undefined') return '';
    if (Array.isArray(value)) return '[' + (value.length ? value.slice(0,3).map(v => String(v)).join(', ') + (value.length>3? ', …':'' ) : '') + ']';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-md shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Visor: colección <code>base_upc</code> (db: reviceavi)</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="mb-4 flex gap-2 items-center">
        <form onSubmit={handleSearch} className="flex-grow flex gap-2">
          <input
            placeholder="Buscar texto en campos comunes..."
            value={q}
            onChange={e => setQ(e.target.value)}
            className="border p-2 rounded w-full"
          />
          <button type="submit" className="bg-primary-600 text-white px-4 rounded">Buscar</button>
        </form>
        <div className="text-sm text-gray-600">Total: {total} — Mostrando: {docs.length}</div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Columnas detectadas (schema):</label>
        <div className="grid grid-cols-3 gap-2 text-xs">
          {Object.keys(schema || {}).length === 0 ? (
            <div className="text-gray-500">No hay esquema detectado — verifica `/api/mongo-admin?action=schema`</div>
          ) : (
            Object.entries(schema).map(([k, meta]) => (
              <div key={k} className="p-2 border rounded bg-gray-50">
                <div className="font-mono text-sm">{k}</div>
                <div className="text-xs text-gray-600">Tipos: {(meta.types || []).join(', ')}</div>
                {meta.samples && meta.samples.length > 0 && (
                  <div className="mt-1 text-xs text-gray-700">Ej: {String(meta.samples[0])}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-4 text-center">Cargando documentos...</div>
      ) : (
        <div className="overflow-x-auto border">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-100">
                {columns.map(c => (
                  <th key={c} className="p-2 border text-left text-xs font-bold">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.map((d, i) => (
                <tr key={d._id ?? i} className="hover:bg-gray-50">
                  {columns.map(c => (
                    <td key={c} className="p-2 border text-sm align-top max-w-xs break-words">{renderCell(d[c])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button className="px-3 py-1 border rounded" onClick={() => { setSkip(Math.max(0, skip - limit)); }}>« Página anterior</button>
        <button className="px-3 py-1 border rounded" onClick={() => { setSkip(skip + limit); }}>Página siguiente »</button>
        <div className="text-sm text-gray-600">Skip: {skip} — Limit:</div>
        <input type="number" className="w-20 border p-1 rounded" value={limit} onChange={e => setLimit(Number(e.target.value) || 50)} />
      </div>
    </div>
  );
}

export default AdminBaseUPC;