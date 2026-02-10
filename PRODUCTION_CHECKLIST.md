# Production Readiness Checklist

This file is a reminder of what to change when moving the app from **development** to **production**.

---

## 1. Backend (`apps/backend`)

- **Environment variables (`.env`)**
  - `NODE_ENV=production`
  - `PORT=<your_port>` (e.g. `3000` or behind a reverse proxy)
  - `MONGODB_URI=<production_mongodb_uri>`
  - `JWT_SECRET=<long_random_secure_string>`
  - `CORS_ORIGIN=<frontend_urls>`  
    - Example (comma‑separated):  
      `CORS_ORIGIN=https://app.example.com,https://admin.example.com`

- **CORS configuration**
  - In production, backend uses `CORS_ORIGIN` to limit allowed origins.
  - Confirm your deployed frontend URL(s) are included.

- **Security**
  - HTTPS terminated at load balancer / reverse proxy (Nginx, etc.).
  - Keep `helmet` and `express-rate-limit` enabled (already wired).
  - Make sure MongoDB is not publicly exposed without auth.

---

## 2. Frontend (Web – root Svelte app)

- **API base URL**
  - Set `VITE_API_URL` in your web build environment (e.g. Vite env, hosting config):  
    `VITE_API_URL=https://api.example.com`
  - Confirm login, notes, and AI endpoints use the correct API URL in production.

- **Build & deploy**
  - Run:
    - `npm install` (if needed)
    - `npm run build`
  - Deploy the `dist/` contents behind HTTPS and a CDN if possible.

---

## 3. Yjs & Real-Time Sync

- **Backend WebSocket**
  - Ensure port and path for Yjs WebSocket are reachable externally:
    - Default: `ws://<api-host>:<port>` (from `WSController`).
  - If you terminate SSL at a proxy, configure:
    - `wss://` in your proxy (Nginx, etc.).

- **Frontend WebSocket URL**
  - Optionally set `VITE_WS_URL` if backend WebSocket is on a different host/port:  
    `VITE_WS_URL=wss://api.example.com`
  - Otherwise it defaults to `ws://localhost:3000` (dev only).

---

## 4. Electron Desktop App

- **CSP (Content Security Policy)**
  - Production CSP is defined in:
    - `electron/src/setup.ts` (runtime header)
    - `electron/app/index.html` (static HTML)
  - Confirm:
    - No `'unsafe-eval'` in production CSP.
    - `connect-src` includes your production API & WebSocket:
      - `connect-src <customScheme>://* https://api.example.com wss://api.example.com`

- **API base URL**
  - The Electron app uses the same `VITE_API_URL` as the web build.
  - For production builds, set `VITE_API_URL` before building:
    - `VITE_API_URL=https://api.example.com npm run build`
    - Then `npm run electron:build` (or your packaging script).

- **Packaging**
  - From project root:
    - `npm run build` (web assets)
    - `npm run electron:build`
  - Test the packaged app:
    - Login / register
    - Editing & real-time sync
    - Sharing / public notes

---

## 5. General Monitoring & Logging

- Enable monitoring/alerting in production (see `IMPROVED_PROPOSAL.md` §17):
  - Error tracking (e.g. Sentry).
  - Uptime monitoring.
  - Basic metrics (latency, error rate).

- Ensure logs from backend are collected (e.g. via a log aggregator).

---

## 6. Quick Pre-Launch Sanity Checklist

- [ ] `JWT_SECRET` is set and long/random.
- [ ] `NODE_ENV=production` on backend.
- [ ] `MONGODB_URI` points to production DB.
- [ ] `CORS_ORIGIN` lists only your real frontend origins.
- [ ] `VITE_API_URL` points to production API in both web and Electron builds.
- [ ] CSP in Electron allows your API/WebSocket and has no `'unsafe-eval'` in production.
- [ ] Real-time editing works between multiple clients in production environment.
- [ ] Basic monitoring and logging are enabled.


