// Pequeño servidor Express para ejecutar localmente el handler serverless/mongo_admin
// Carga variables desde .env y monta el endpoint en /api/mongo-admin
const express = require('express');
require('dotenv').config();

const handler = require('./serverless/mongo_admin/index.js');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Forward all requests to the serverless handler
app.all('/api/mongo-admin', async (req, res) => {
  try {
    // handler expects (req, res)
    await handler(req, res);
  } catch (err) {
    console.error('Error in local wrapper:', err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Local server listening on http://localhost:${port}`);
  console.log('Endpoint available: GET/POST/PUT/DELETE http://localhost:' + port + '/api/mongo-admin');
});
