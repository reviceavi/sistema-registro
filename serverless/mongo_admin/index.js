/*
  Serverless endpoint para operaciones CRUD mínimas sobre la colección "base_upc".
  - Usa la variable de entorno MONGODB_URI (cadena de conexión) y opcionalmente MONGODB_DB (por defecto: reviceavi)
  - Exponer rutas mediante método HTTP y query params:
    GET  -> lista documentos (opcional: ?q=texto para búsqueda en cualquier campo, ?limit, ?skip)
    GET?id=... -> obtener un documento por _id
    POST -> crear documento (body JSON)
    PUT?id=... -> actualizar documento por _id (body JSON)
    DELETE?id=... -> borrar documento por _id

  Nota: este archivo es un ejemplo serverless. Ajusta la ubicación y variables de entorno según tu plataforma (Vercel, Netlify, Cloud Run, Firebase Functions).
*/

const { MongoClient, ObjectId } = require('mongodb');

let cachedClient = null;

async function getClient(uri) {
  if (cachedClient && cachedClient.isConnected && cachedClient.isConnected()) {
    return cachedClient;
  }
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  cachedClient = client;
  return client;
}

module.exports = async function (req, res) {
  // Si se configura MONGO_ADMIN_KEY, exigir su presencia en la cabecera x-api-key
  const adminKey = process.env.MONGO_ADMIN_KEY;
  if (adminKey) {
    const provided = req.headers['x-api-key'] || req.headers['x-api-key'.toLowerCase()];
    if (!provided || provided !== adminKey) {
      return res.status(401).json({ error: 'Missing or invalid API key' });
    }
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) return res.status(500).json({ error: 'MONGODB_URI no configurada' });

  const dbName = process.env.MONGODB_DB || 'reviceavi';
  const collectionName = process.env.MONGODB_COLLECTION || 'base_upc';

  try {
    const client = await getClient(uri);
    const db = client.db(dbName);
    const col = db.collection(collectionName);

    const method = req.method.toUpperCase();
    const { id, q, limit = 50, skip = 0 } = req.query || {};

    // Proveer un endpoint que infiera esquema/columnas en base a una muestra
    if (req.method === 'GET' && req.query && req.query.action === 'schema') {
      // sample docs and infer basic types
      const sampleSize = parseInt(req.query.size, 10) || 100;
      const samples = await col.aggregate([{ $sample: { size: sampleSize } }]).toArray();
      const schema = {};
      samples.forEach(doc => {
        Object.keys(doc || {}).forEach(k => {
          const v = doc[k];
          const t = inferType(v);
          if (!schema[k]) schema[k] = { types: new Set(), samples: [] };
          schema[k].types.add(t);
          if (schema[k].samples.length < 5) schema[k].samples.push(v);
        });
      });
      const out = {};
      Object.keys(schema).forEach(k => {
        out[k] = { types: Array.from(schema[k].types), samples: schema[k].samples };
      });
      return res.status(200).json({ schema: out });
    }

    if (method === 'GET') {
      if (id) {
        const doc = await col.findOne({ _id: ObjectId.isValid(id) ? new ObjectId(id) : id });
        return res.status(200).json({ result: doc });
      }

      const l = parseInt(limit, 10) || 50;
      const s = parseInt(skip, 10) || 0;

      let filter = {};
      if (q) {
        // búsqueda simple: or sobre campos texto (usa $text si tienes índices de texto)
        const regex = new RegExp(q, 'i');
        filter = { $or: [
          { nombre: regex },
          { expedienteunico: regex },
          { municipio: regex },
          { telefono: regex },
          { curp: regex }
        ] };
      }

      const cursor = col.find(filter).skip(s).limit(l);
      const docs = await cursor.toArray();
      const total = await col.countDocuments(filter);
      return res.status(200).json({ results: docs, total });
    }

    if (method === 'POST') {
      const body = req.body || {};
      const r = await col.insertOne(body);
      return res.status(201).json({ insertedId: r.insertedId });
    }

    if (method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'Missing id for update' });
      const body = req.body || {};
      const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
      const r = await col.findOneAndUpdate(filter, { $set: body }, { returnDocument: 'after' });
      return res.status(200).json({ result: r.value });
    }

    if (method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'Missing id for delete' });
      const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
      const r = await col.deleteOne(filter);
      return res.status(200).json({ deletedCount: r.deletedCount });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('mongo_admin error', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

function inferType(v) {
  if (v === null || typeof v === 'undefined') return 'null';
  if (v instanceof Date) return 'date';
  if (ObjectId.isValid && ObjectId.isValid(v) && (typeof v === 'string' || v instanceof ObjectId)) {
    // heuristic: treat as id if looks like ObjectId
    if (typeof v === 'string' && /^[a-fA-F0-9]{24}$/.test(v)) return 'objectId';
  }
  if (Array.isArray(v)) return 'array';
  const t = typeof v;
  if (t === 'number') return 'number';
  if (t === 'boolean') return 'boolean';
  if (t === 'object') return 'object';
  if (t === 'string') {
    // try date parse
    const d = Date.parse(v);
    if (!Number.isNaN(d)) return 'date_string';
    // large numeric string?
    if (!Number.isNaN(Number(v))) return 'number_string';
    return 'string';
  }
  return t;
}
