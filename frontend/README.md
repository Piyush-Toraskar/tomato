# Tomato Frontend

Tomato is the React frontend for the existing FastAPI food-delivery backend in this repository. It is a real API client rather than a mocked catalogue: restaurant, menu, authentication, order and driver data come from the backend contract.

## Features

- Customer registration and sign-in
- Stable browser `device_id` for per-device sessions
- Access-token refresh and one automatic retry after access-token expiry
- Restaurant discovery using the backend's `limit`/`offset` pagination
- Restaurant and menu detail pages
- One-restaurant basket with persistent quantities
- Retry-safe checkout using the required `Idempotency-Key` header
- Order confirmation, history, details and status tracking
- Restaurant and driver workspaces for accounts provisioned by an administrator
- Account controls for current-device logout and all-device logout
- Loading skeletons, empty states, safe errors and toasts
- Responsive desktop, tablet and mobile layouts
- Production image built with Node and served by Nginx

The UI deliberately omits unsupported features. The backend does not currently expose ratings, reviews, promotions, payments, customer delivery addresses, restaurant photographs, favourites or live GPS tracking.

## Tech stack

- React 18
- TypeScript in strict mode
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Lucide React
- Vitest, Testing Library and jsdom
- Nginx for the production container

## Architecture

```text
Browser
  -> React Router page
  -> TanStack Query or mutation
  -> src/api/*
  -> central src/api/client.ts
  -> FastAPI
  -> SQLAlchemy
  -> PostgreSQL
```

Server state is owned by TanStack Query. Authentication and basket state are intentionally small and live in React Context. The access token stays in JavaScript memory. The rotating refresh token is persisted in `localStorage` because the current backend returns it in JSON and does not set an HttpOnly cookie.

## Project structure

```text
frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── api/                 # HTTP client and endpoint modules
│   ├── components/
│   │   ├── auth/
│   │   ├── cart/
│   │   ├── driver/
│   │   ├── layout/
│   │   ├── menu/
│   │   ├── order/
│   │   ├── restaurant/
│   │   └── ui/
│   ├── context/             # Auth, cart and toast state
│   ├── hooks/               # Query and context hooks
│   ├── lib/                 # Formatting, device ID, query keys, idempotency
│   ├── pages/               # Route-level screens
│   ├── test/                # Shared test setup, fixtures and render helpers
│   ├── types/               # Types matching backend schemas
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── .env.example
├── Dockerfile
├── nginx.conf
├── package.json
├── tailwind.config.ts
├── tsconfig*.json
├── vercel.json
├── vite.config.ts
└── vitest.config.ts
```

## Environment variables

Copy the example file:

```powershell
Copy-Item .env.example .env
```

Local Vite development:

```text
VITE_API_BASE_URL=http://localhost:8000
```

Vercel with the existing Railway backend:

```text
VITE_API_BASE_URL=https://mini-uber-backend-production.up.railway.app
```

Docker Compose uses a same-origin Nginx proxy and builds with:

```text
VITE_API_BASE_URL=/api
```

Every `VITE_*` value is embedded into browser code. Never put database passwords, JWT signing keys, Railway tokens or any other secret in a frontend environment variable.

## Local setup

### 1. Start the backend

From the repository root:

```powershell
Copy-Item .env.example .env
# Edit .env and set DB_PASSWORD and SECRET_KEY.

.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

The API should be available at `http://localhost:8000` and Swagger at `http://localhost:8000/docs`.

### 2. Start the frontend

Open another PowerShell terminal:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`.

## How the frontend communicates with the backend

`src/api/client.ts` reads `VITE_API_BASE_URL`, adds JSON and request-ID headers, attaches the bearer access token for protected calls and converts API failures into `ApiError` objects. Endpoint-specific code is separated into:

- `src/api/auth.ts`
- `src/api/restaurants.ts`
- `src/api/orders.ts`
- `src/api/drivers.ts`

The frontend sends only fields supported by Pydantic. Prices, totals, customer identity and authorisation decisions remain server-controlled.

## Authentication architecture

### Login

The browser creates one stable identifier in `localStorage` under `tomato.device-id` and sends it as `device_id` with email and password. Signing in again from the same browser invalidates that browser's previous access token, while another device session remains valid.

### Token handling

- Access token: stored only in module memory
- Refresh token: stored in `localStorage`
- Protected request: sends `Authorization: Bearer <access token>`
- Access token expires: one refresh request is coalesced across concurrent callers
- Refresh succeeds: both tokens are rotated and the original request is retried once
- Refresh fails: local tokens are cleared and the UI reports session expiry
- Logout: calls `/auth/logout` and clears this browser
- Logout all: calls `/auth/logout-all` and clears this browser after server-side revocation

Storing a refresh token in `localStorage` exposes it to JavaScript and therefore to a successful XSS attack. The stronger future design is a Secure, HttpOnly, SameSite refresh cookie issued by the backend, plus an in-memory access token. This frontend does not silently change the backend's current bearer-token contract.

## Basket and idempotent checkout

The basket is stored under `tomato.cart` and can contain items from one restaurant at a time. At checkout, `src/lib/idempotency.ts` fingerprints the restaurant and item quantities. It stores one operation key in `sessionStorage`:

- Same logical order after a network/server failure: reuse the same key
- Changed basket: create a new key
- Successful order: clear the key

`src/api/orders.ts` sends the value in the exact header required by the backend:

```http
Idempotency-Key: tomato-...
```

This protects a retry after a lost response from creating a duplicate order.

## Pagination

The backend returns arrays and accepts `limit` and `offset`; it does not return a total count. The UI therefore provides Previous/Next controls and infers another page when the current result length equals the requested page size. The page size is capped at the backend maximum of 100.

## CORS

Direct Vite or Vercel requests are cross-origin. The backend now reads a comma-separated `CORS_ORIGINS` variable and allows only explicit browser origins. For local development:

```text
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080
```

For Vercel, add the exact production frontend URL to the backend variable, for example:

```text
CORS_ORIGINS=https://tomato.example.com,https://tomato-frontend.vercel.app
```

Redeploy the backend after changing that value. Do not use `allow_origins=["*"]` for the production application.

Docker Compose avoids cross-origin requests by serving the browser and proxying `/api/*` from the same Nginx origin.

## Testing

Run all frontend tests:

```powershell
npm test
```

Run TypeScript checks:

```powershell
npm run typecheck
```

Build the production bundle:

```powershell
npm run build
```

The suite covers:

- registration and login forms
- stable browser device identifiers
- current-device logout
- access-token refresh and session expiry
- validation and network error mapping
- restaurant success, error and empty states
- menu loading and basket addition
- item removal and quantity changes
- checkout and order creation
- idempotent retry behaviour and exact header integration
- order-status timeline and history presentation

## Production build

```powershell
cd frontend
npm install
$env:VITE_API_BASE_URL="https://mini-uber-backend-production.up.railway.app"
npm run build
```

The static output is written to `frontend/dist`.

## Run the complete stack with Docker Compose

From the repository root:

```powershell
Copy-Item .env.example .env
# Set DB_PASSWORD and SECRET_KEY in .env.
docker compose build
docker compose up -d
docker compose ps -a
```

Open:

- Frontend: `http://localhost:8080`
- Backend Swagger: `http://localhost:8000/docs`
- Docker PostgreSQL from the host: `localhost:5433`

Startup order:

```text
PostgreSQL healthy
  -> Alembic migration container exits 0
  -> FastAPI health check passes
  -> Nginx frontend starts
```

Useful commands:

```powershell
docker compose logs -f frontend
docker compose logs -f api
docker compose logs migrate
docker compose exec api alembic current
docker compose down
```

`docker compose down` keeps PostgreSQL data. `docker compose down -v` also deletes the Docker database volume.

## Vercel deployment

1. Push the repository to GitHub.
2. Import it into Vercel.
3. Set **Root Directory** to `frontend`.
4. Framework preset: **Vite**.
5. Install command: `npm install`.
6. Build command: `npm run build`.
7. Output directory: `dist`.
8. Add `VITE_API_BASE_URL` with the public backend origin, without a trailing slash.
9. Deploy.
10. Add the final Vercel origin to backend `CORS_ORIGINS` and redeploy the backend.
11. Test registration, login, restaurant browsing, checkout, refresh after 15 minutes and logout from the final domain.

`vercel.json` sends browser routes back to `index.html`, so a direct visit to `/orders/42` still loads React Router.

## Docker deployment

The production `Dockerfile` has two stages:

1. `node:22-alpine` installs dependencies and runs the Vite build.
2. `nginx:1.27-alpine` serves only the generated static files.

Nginx provides:

- SPA fallback to `index.html`
- immutable caching for hashed `/assets/*`
- a JSON `/health` endpoint
- basic response-security headers
- `/api/*` reverse proxying to the Compose service named `api`

For a platform where frontend and backend are separate services, build the image with the public API URL:

```powershell
docker build `
  --build-arg VITE_API_BASE_URL=https://api.example.com `
  -t tomato-frontend `
  .\frontend
```

Run it:

```powershell
docker run --rm -p 8080:80 tomato-frontend
```

## End-to-end verification

1. Create a customer account.
2. Sign in and confirm `/auth/me` succeeds.
3. Browse restaurants and a menu.
4. Add items, change quantities and open the basket.
5. Place an order and confirm the confirmation page opens.
6. Refresh the order tracking page and inspect history.
7. Use a provisioned restaurant account to confirm, prepare and mark the order ready.
8. Assign a provisioned available driver.
9. Use the driver account to mark the order picked up and delivered.
10. Confirm the customer tracking page reflects each real backend status.

## Troubleshooting

### Browser reports a CORS error

Add the exact frontend origin to backend `CORS_ORIGINS`, including scheme and port, then restart/redeploy the API.

### Frontend calls the wrong API

Check the value used at Vite build time:

```powershell
$env:VITE_API_BASE_URL
```

Restart `npm run dev` after editing `.env`. Rebuild a Docker/Vercel deployment after changing it.

### Refresh works locally but not after deployment

Confirm the backend URL is HTTPS, the refresh endpoint is reachable and the refresh token has not expired or been rotated by another login on the same stable device ID.

### Direct browser route returns 404

Use the supplied `vercel.json` or Nginx `try_files` fallback. A static host must send unknown browser routes to `index.html`.

### Docker frontend starts before the API

Inspect `docker compose ps -a` and `docker compose logs migrate`. The frontend depends on a healthy API; the API depends on successful migrations.

### Restaurant or driver workspace cannot be opened

Public registration creates customers only. Use `python -m app.scripts.provision_account` in an authorised environment to create RESTAURANT or DRIVER accounts.
