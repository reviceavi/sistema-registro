// Firebase Functions example for authentication proxy
// Deploy with firebase-tools. Set env variables with: firebase functions:config:set supabase.url="https://<project>.supabase.co" supabase.service_role="<SERVICE_ROLE_KEY>"

const fetch = require('node-fetch');
const functions = require('firebase-functions');

exports.authenticate = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

  const supabaseUrl = functions.config().supabase.url;
  const serviceRole = functions.config().supabase.service_role;
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
    // Return minimal safe payload
    return res.status(200).json({ user: { id: user.id, email: user.email, username: user.username } });
  } catch (err) {
    console.error('Firebase function error', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});
