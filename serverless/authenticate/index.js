// Ejemplo minimal de endpoint serverless que usa service_role para invocar la RPC
// Requiere NODE_ENV con SERVICE_ROLE_KEY y SUPABASE_URL configurados en el entorno de despliegue.

const fetch = require('node-fetch');

module.exports = async function (req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRole = process.env.SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole) return res.status(500).json({ error: 'Misconfigured server' });

  try {
    const r = await fetch(`${supabaseUrl}/rest/v1/rpc/authenticate_user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRole,
        'Authorization': `Bearer ${serviceRole}`
      },
      body: JSON.stringify({ p_email: email, p_password: password })
    });

    const body = await r.json();
    if (!Array.isArray(body) || body.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = body[0];
    // Aquí podrías emitir un JWT propio o devolver un objeto de sesión seguro
    return res.status(200).json({ user });
  } catch (err) {
    console.error('Serverless error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
};
