# Tomato — Production-Oriented Food Delivery Platform

Tomato is a full-stack food-delivery application built to demonstrate production-style backend engineering, secure authentication, transactional order processing, concurrency safety, observability, containerisation, deployment, and measured load testing.

The project combines a **FastAPI + PostgreSQL backend** with a **React + TypeScript frontend**, deployed as a real end-to-end application.

## Live deployment

- Frontend: `https://tomato-3rjy96gzg-piyush-toraskars-projects.vercel.app`
- Backend API: `https://mini-uber-backend-production.up.railway.app`
- Swagger docs: `https://mini-uber-backend-production.up.railway.app/docs`

> The frontend is deployed on Vercel, while the FastAPI backend and PostgreSQL database run on Railway.

---

## What the project supports

### Customer

- Register and log in
- Multi-device sessions
- Browse restaurants
- Browse menus
- Add/remove items from basket
- Change item quantities
- Create orders
- View order history
- Track order status
- Log out from the current device or all devices

### Restaurant

- Privileged restaurant account provisioning
- Create/link restaurant profile
- Manage restaurant location
- Add menu items
- View restaurant orders
- Update supported order states

### Driver

- Privileged driver account provisioning
- Create/link driver profile
- Update location and availability
- View assigned orders
- Participate in driver assignment workflow

---

## Engineering highlights

This project was intentionally designed beyond basic CRUD.

### Authentication and session security

- Argon2 password hashing
- JWT access tokens
- Rotating refresh tokens
- Per-device sessions
- Re-login on the same device invalidates the previous session for that device
- Other device sessions remain valid
- Logout current device
- Logout all devices
- Email verification flow
- Password reset flow
- Public registration restricted to customer accounts
- Restaurant and driver accounts provisioned through a privileged CLI

### Transaction and concurrency safety

- PostgreSQL transactions
- Row-level locking using `SELECT ... FOR UPDATE`
- `SKIP LOCKED` for concurrent driver candidate selection
- Database uniqueness constraints as concurrency backstops
- Atomic order + idempotency record creation
- Decimal/Numeric values for money instead of floating point

### Idempotent order creation

Order creation uses an `Idempotency-Key` request header.

The backend stores a request hash and idempotency record so that retries do not accidentally create duplicate orders.

This protects against scenarios such as:

- user double-clicks
- browser retries
- network timeout after the server already processed the order
- multiple concurrent requests using the same idempotency key

### Observability

- Structured JSON request logs
- Request IDs
- Account IDs where available
- Request latency
- Database query timing
- Database connection metrics
- Driver-matching metrics
- Prometheus-compatible `/metrics` endpoint
- `/health` and `/database-health` health checks

---

## Tech stack

### Backend

- Python 3.11
- FastAPI
- Uvicorn
- PostgreSQL
- SQLAlchemy 2.x
- Alembic
- Pydantic / pydantic-settings
- PyJWT
- Argon2 via `pwdlib`
- Prometheus client
- Pytest

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Lucide React
- React Context
- Vitest
- Testing Library

### Infrastructure

- Docker
- Docker Compose
- Nginx
- GitHub Actions
- Railway
- Vercel
- k6

---

## Architecture

```text
                         User
                           |
                           | HTTPS
                           v
                 +-------------------+
                 |      Vercel       |
                 | React + TypeScript|
                 |       Vite        |
                 +---------+---------+
                           |
                           | REST / JSON
                           | Bearer JWT
                           | Idempotency-Key
                           v
                 +-------------------+
                 |      Railway      |
                 | FastAPI + Uvicorn |
                 +---------+---------+
                           |
                           | SQLAlchemy
                           v
                 +-------------------+
                 |    PostgreSQL     |
                 +-------------------+
