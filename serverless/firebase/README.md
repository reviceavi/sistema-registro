Firebase Functions deploy (example)

1) Install firebase tools and login:
   npm i -g firebase-tools
   firebase login

2) Initialize functions (if not already):
   firebase init functions

3) Set config vars (do NOT commit service_role):
   firebase functions:config:set supabase.url="https://<project>.supabase.co" supabase.service_role="<SERVICE_ROLE_KEY>"

4) Deploy:
   firebase deploy --only functions:authenticate

5) Call the function (example):
   curl -X POST https://us-central1-<your-project>.cloudfunctions.net/authenticate \
     -H "Content-Type: application/json" \
     -d '{"email":"mcano.ceavi@gmail.com","password":"michel123"}'

Security notes
- Keep service_role in functions config only.
- Protect endpoint with rate-limits or additional auth if needed.

Additional notes

- After deploying, if you want the frontend to use this proxy, set an environment variable in your frontend hosting (Vercel/Netlify/Firebase Hosting) named `VITE_AUTH_PROXY_URL` with the URL of the deployed function, e.g. `https://us-central1-<project>.cloudfunctions.net/authenticate`.
- The frontend will prefer the proxy if `VITE_AUTH_PROXY_URL` is present; otherwise it calls Supabase RPC directly with the anon key.
- For production, consider adding recaptcha/rate-limiting and monitoring for brute-force protection.
