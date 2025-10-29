Serverless auth example

This folder contains a minimal serverless endpoint that proxies authentication
requests to the Supabase RPC `authenticate_user` using the service_role key.

Usage

- Deploy to your preferred serverless platform (Vercel, Netlify, Cloud Run, etc.).
- Set environment variables:
  - SUPABASE_URL (e.g. https://<project>.supabase.co)
  - SERVICE_ROLE_KEY (your service_role key)

Example request

POST /api/authenticate
Content-Type: application/json

{
  "email": "mcano.ceavi@gmail.com",
  "password": "michel123"
}

Security notes

- Do NOT store service_role key on the client.
- Rate-limit and audit the endpoint.
- You can exchange the validated user for a signed JWT here if you need a session.
