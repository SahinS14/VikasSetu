# Deploy VikasSetu

Vercel hosts the React/Vite frontend. The Express API, Python face-recognition service, and PostgreSQL database must remain on long-running or managed services, because they cannot run as a static Vercel site.

## 1. Deploy the API and database

1. Provision a managed PostgreSQL database (for example Supabase Postgres, Neon, or Render Postgres).
2. Deploy the `backend` directory as a Node.js service on Render or another Node host.
3. In that service, configure `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `NODE_ENV=production`, and `FRONTEND_URL`.
4. Run `npm run db:deploy` once, then `npm run db:seed` only if you want the demo users and data.
5. Set `FRONTEND_URL` to your Vercel production domain after it is created.

## 2. Deploy the frontend to Vercel

1. Import this repository in Vercel. Leave the root directory as the repository root.
2. Vercel will use `npm run build` and publish `dist` through `vercel.json`.
3. Add the following production environment variable in **Project Settings → Environment Variables**:

   ```text
   VITE_API_URL=https://YOUR-BACKEND-DOMAIN.example.com/api
   ```

4. Deploy. The SPA rewrite in `vercel.json` keeps dashboard routes working after a page refresh.

## Required production checks

- Do not set `VITE_API_URL` to a localhost address.
- Do not add `DATABASE_URL`, `DIRECT_URL`, or `JWT_SECRET` to Vercel: they belong only to the backend host.
- Confirm the backend's `FRONTEND_URL` points to your Vercel URL and that HTTPS is used for both services.
- Rebuild/redeploy Vercel after changing `VITE_API_URL`; Vite embeds it into the browser bundle.
