# 🍅 Tomato — Scalable Food Delivery Platform

A production-oriented full-stack food delivery platform built with **FastAPI, PostgreSQL, Redis, Kafka, React and TypeScript**.

Tomato models the core workflow of applications such as Zomato, Uber Eats and DoorDash: customers discover restaurants and place orders, restaurants process them, and drivers handle delivery.

The project focuses not only on API functionality, but also on **concurrency, transactional consistency, idempotency, caching, event-driven architecture, authentication, observability, containerisation and load testing**.

---

## Architecture

```text
                              ┌─────────────────────┐
                              │    React Frontend   │
                              │ TypeScript + Nginx  │
                              │       :8080         │
                              └──────────┬──────────┘
                                         │
                                         │ HTTP / REST
                                         ▼
                              ┌─────────────────────┐
                              │      FastAPI        │
                              │  4 Uvicorn Workers  │
                              │       :8000         │
                              └──────────┬──────────┘
                                         │
                   ┌─────────────────────┼─────────────────────┐
                   │                     │                     │
                   ▼                     ▼                     ▼
          ┌────────────────┐    ┌────────────────┐    ┌────────────────┐
          │   PostgreSQL   │    │     Redis      │    │     Kafka      │
          │                │    │                │    │                │
          │ Source of      │    │ Fast state /   │    │ Order-event    │
          │ truth          │    │ caching        │    │ streaming      │
          └────────────────┘    └────────────────┘    └───────┬────────┘
                                                               │
                                                               ▼
                                                    ┌───────────────────┐
                                                    │ Order Event       │
                                                    │ Consumer          │
                                                    └───────────────────┘
```

The frontend communicates only with the FastAPI API. PostgreSQL, Redis and Kafka remain internal infrastructure components.

---

## Features

### Customer

- User registration and authentication
- Restaurant discovery
- Menu browsing
- Basket management
- Checkout
- Idempotent order creation
- Order history
- Order details
- Order status tracking

### Restaurant

- Restaurant-specific workflows
- Menu and order management
- Order status transitions
- Role-based access control

### Driver

- Driver-specific workflows
- Driver location updates
- Delivery assignment support
- Order lifecycle integration

### Backend Engineering

- REST API architecture with FastAPI
- PostgreSQL persistence with SQLAlchemy
- Alembic database migrations
- Redis integration
- Kafka event streaming
- Kafka consumer groups
- JWT authentication
- Argon2 password hashing
- Role-based authorisation
- Idempotent order creation
- Transactional database operations
- Pagination
- Rate limiting
- Structured logging
- Prometheus metrics
- Docker Compose orchestration
- Automated testing
- k6 load testing

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| API | FastAPI |
| ORM | SQLAlchemy |
| Database | PostgreSQL |
| Cache / Fast State | Redis |
| Event Streaming | Apache Kafka |
| Authentication | JWT, Argon2 |
| Validation | Pydantic |
| Migrations | Alembic |
| API Server | Uvicorn |
| Frontend Server | Nginx |
| Metrics | Prometheus |
| Testing | Pytest |
| Load Testing | k6 |
| Containers | Docker, Docker Compose |

---

# System Design

## Request Flow

A typical synchronous request follows:

```text
Client
  │
  ▼
React
  │
  ▼
FastAPI
  │
  ├── Authentication / Authorisation
  │
  ├── Business Logic
  │
  ▼
PostgreSQL
  │
  ▼
Response
```

Operations that benefit from asynchronous processing can additionally produce Kafka events:

```text
Order created
     │
     ▼
PostgreSQL transaction
     │
     ▼
Kafka Producer
     │
     ▼
order-events topic
     │
     ▼
Kafka Consumer Group
     │
     ▼
Asynchronous processing
```

This separates request-response work from event-driven processing.

---

# Redis

Redis provides a low-latency data layer alongside PostgreSQL.

The architecture follows the principle:

```text
PostgreSQL
    │
    │ durable source of truth
    ▼
  Redis
    │
    │ fast / transient state
    ▼
FastAPI
```

Redis is connected through:

```text
redis://redis:6379/0
```

inside the Docker network.

Redis is intentionally not exposed directly to the frontend.

---

# Kafka

Kafka is used for asynchronous order-event processing.

The application publishes events to:

```text
order-events
```

The backend uses:

```text
Kafka Producer
      │
      ▼
order-events
      │
      ▼
Consumer Group
      │
      ▼
tomato-order-events
```

Example events can represent changes such as:

```text
order_created
order_status_changed
driver_assigned
```

This enables event-driven processing without tightly coupling every downstream operation to the original HTTP request.

---

## Kafka KRaft Configuration

The local Kafka deployment runs in **KRaft mode**, eliminating the need for ZooKeeper.

```text
Kafka Node 1
├── Broker
└── Controller
```

Internal Docker communication uses:

```text
kafka:29092
```

The host machine can access Kafka through:

```text
localhost:9092
```

---

# Authentication

Tomato uses JWT-based authentication with role-based authorisation.

Passwords are hashed using **Argon2**.

Conceptually:

```text
Email + Password
      │
      ▼
Argon2 verification
      │
      ▼
JWT issued
      │
      ▼
Authenticated API request
      │
      ▼
Role validation
```

Supported application roles include the customer, restaurant and driver workflows.

Protected API requests use:

```http
Authorization: Bearer <access_token>
```

---

# Idempotent Orders

Order creation is protected against accidental duplicate requests.

This matters when clients retry because of:

- network timeouts
- connection failures
- repeated button presses
- client-side retries

Conceptually:

```text
POST /orders
Idempotency-Key: abc123
        │
        ▼
First request
        │
        ├── create order
        └── store result

Retry with abc123
        │
        ▼
Return existing result
```

This prevents a retry from unintentionally creating multiple orders.

---

# Database

PostgreSQL acts as the durable source of truth.

Database changes are managed through **Alembic migrations** rather than manual schema changes.

Apply migrations with:

```bash
alembic upgrade head
```

The Docker API service performs the migration before starting Uvicorn.

---

# Concurrency

The API runs with multiple Uvicorn workers:

```text
                    Port 8000
                        │
             ┌──────────┼──────────┐
             │          │          │
             ▼          ▼          ▼
          Worker 1   Worker 2   Worker 3   Worker 4
```

This allows the API process to utilise multiple CPU cores rather than being limited to a single Python process.

---

# Performance Testing

Performance testing is implemented using **k6**.

The repository contains tests including:

```text
loadtests/
├── baseline.js
├── authenticated.js
├── bottleneck.js
├── capacity.js
├── rps_1500.js
└── rps_stages.js
```

## Concurrency Optimisation Experiment

The `/health` endpoint was benchmarked using a staged constant-arrival-rate workload with targets from:

```text
250
500
750
1,000
1,250
1,500 requested requests/second
```

### Single Worker

The initial single-Uvicorn-worker configuration showed CPU saturation under increasing load.

Representative aggregate results:

| Metric | Result |
|---|---:|
| HTTP failures | 0% |
| Average latency | 2.69 s |
| Median latency | 1.07 s |
| p90 latency | 3.14 s |
| p95 latency | 17.96 s |
| Dropped iterations | 56,542 |

The API process reached approximately one CPU core of utilisation, indicating a process-level concurrency bottleneck.

### Four Workers

The API was then scaled to four Uvicorn workers.

Representative aggregate results:

| Metric | Result |
|---|---:|
| Successful requests | 148,710 |
| HTTP failures | **0%** |
| Average latency | **248.89 ms** |
| Median latency | **9.89 ms** |
| p90 latency | **584.76 ms** |
| p95 latency | **744.8 ms** |
| Dropped iterations | **8,795** |

Compared with the single-worker run:

- median latency decreased from **1.07 s → 9.89 ms**
- p95 latency decreased from **17.96 s → 744.8 ms**
- dropped iterations decreased by approximately **84%**
- all completed HTTP requests returned successfully

> **Note:** 1,500 RPS was a requested load-test target, not a claimed sustained application throughput. The test still recorded dropped iterations at high load. These figures benchmark the lightweight `/health` HTTP path and should not be interpreted as transactional order throughput.

This distinction is important because real order creation additionally exercises authentication, business logic, PostgreSQL transactions and asynchronous event infrastructure.

---

# Observability

The backend includes structured application logging and Prometheus-compatible metrics.

Metrics are exposed through:

```text
GET /metrics
```

A database-specific health check is also available:

```text
GET /database-health
```

while:

```text
GET /health
```

provides a lightweight application health check.

---

# Project Structure

```text
tomato/
│
├── app/
│   ├── routes/
│   │   ├── auth.py
│   │   ├── drivers.py
│   │   ├── orders.py
│   │   └── restaurants.py
│   │
│   ├── services/
│   │   ├── auth_service.py
│   │   ├── db_transaction.py
│   │   ├── driver_service.py
│   │   ├── order_service.py
│   │   └── restaurant_service.py
│   │
│   ├── workers/
│   │   ├── __init__.py
│   │   └── order_consumer.py
│   │
│   ├── config.py
│   ├── database.py
│   ├── kafka_client.py
│   ├── redis_client.py
│   ├── main.py
│   ├── metrics.py
│   ├── models.py
│   ├── observability.py
│   ├── rate_limiter.py
│   ├── schemas.py
│   └── security.py
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── types/
│   │
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.ts
│
├── alembic/
│   └── versions/
│
├── tests/
│
├── loadtests/
│   ├── baseline.js
│   ├── authenticated.js
│   ├── bottleneck.js
│   ├── capacity.js
│   ├── rps_1500.js
│   └── rps_stages.js
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── .env.example
├── .gitignore
├── alembic.ini
├── compose.yaml
├── Dockerfile
├── pytest.ini
├── requirements.txt
└── README.md
```

---

# Running Locally with Docker

## Prerequisites

Install:

- Docker Desktop
- Docker Compose
- Git

Clone the repository:

```bash
git clone https://github.com/Piyush-Toraskar/tomato.git
cd tomato
```

Create the environment file:

### Windows PowerShell

```powershell
Copy-Item .env.example .env
```

### Linux / macOS

```bash
cp .env.example .env
```

Review the values in `.env` before starting the application.

Then run:

```bash
docker compose up --build -d
```

Check container status:

```bash
docker compose ps
```

A healthy local stack should contain:

```text
PostgreSQL     healthy
Redis          healthy
Kafka          healthy
FastAPI        running
Frontend       healthy/running
```

---

# Local URLs

Once the stack is running:

| Service | URL |
|---|---|
| Tomato frontend | http://localhost:8080 |
| FastAPI | http://localhost:8000 |
| Swagger | http://localhost:8000/docs |
| Health | http://localhost:8000/health |
| Database health | http://localhost:8000/database-health |
| Prometheus metrics | http://localhost:8000/metrics |

Infrastructure:

| Service | Local Port |
|---|---:|
| PostgreSQL | 5433 |
| Redis | 6379 |
| Kafka | 9092 |

---

# Docker Services

The Docker Compose stack contains:

```text
db
redis
kafka
api
frontend
```

View status:

```bash
docker compose ps
```

View API logs:

```bash
docker compose logs api --tail=100
```

View Kafka logs:

```bash
docker compose logs kafka --tail=100
```

Follow all logs:

```bash
docker compose logs -f
```

Stop the stack:

```bash
docker compose down
```

To rebuild after application changes:

```bash
docker compose up --build -d
```

---

# Running Tests

Run backend tests inside the API container:

```bash
docker compose exec api pytest
```

Or locally:

```bash
pytest
```

The test suite covers areas including:

- authentication
- authorisation
- order flows
- idempotency
- transaction safety
- pagination
- data integrity
- observability
- PostgreSQL integration

---

# Running Load Tests

Install [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/).

For the staged RPS benchmark:

```bash
k6 run ./loadtests/rps_stages.js
```

For the ramp-to-1,500 benchmark:

```bash
k6 run ./loadtests/rps_1500.js
```

Monitor Docker resource consumption in another terminal:

```bash
docker stats
```

This is useful for distinguishing:

- application CPU saturation
- database bottlenecks
- Redis utilisation
- Kafka utilisation
- load-generator limitations

---

# Environment Variables

Example configuration:

```env
DB_USER=postgres
DB_PASSWORD=tomato_dev_password
DB_NAME=mini_uber

SECRET_KEY=replace-with-a-secure-random-secret

REDIS_URL=redis://redis:6379/0

KAFKA_BOOTSTRAP_SERVERS=kafka:29092
KAFKA_ORDER_TOPIC=order-events
KAFKA_CONSUMER_GROUP=tomato-order-events
```

Never commit your actual `.env` file.

The repository contains `.env.example` for documentation.

---

# Security

The project incorporates:

- Argon2 password hashing
- JWT authentication
- role-based authorisation
- request validation
- idempotent write operations
- database transaction boundaries
- environment-based secrets
- CORS configuration
- rate limiting

Production deployments should use a strong randomly generated `SECRET_KEY` and production-specific database credentials.

---

# Engineering Decisions

### Why PostgreSQL?

Orders, users, restaurants and transactional state require strong consistency and relational integrity.

### Why Redis?

Redis provides low-latency access to transient or frequently accessed state without replacing PostgreSQL as the durable source of truth.

### Why Kafka?

Order workflows naturally produce events that can be consumed asynchronously without coupling every downstream operation to the request path.

### Why idempotency?

Order creation is a state-changing operation that clients may retry. Idempotency prevents duplicate orders from network or client retries.

### Why multiple Uvicorn workers?

A single Python API process became CPU-bound during load testing. Multiple worker processes allow the application to use multiple CPU cores.

### Why Docker Compose?

The project contains several infrastructure dependencies. Docker Compose provides a reproducible local environment containing PostgreSQL, Redis, Kafka, FastAPI and the frontend.

---

# Future Improvements

Potential next steps include:

- move Kafka consumers into dedicated worker containers
- increase Kafka topic partitioning for parallel consumers
- benchmark the complete authenticated order-write path
- introduce distributed Redis-backed rate limiting
- add distributed tracing
- deploy behind a production reverse proxy/load balancer
- add horizontal API replicas
- add managed production PostgreSQL/Redis/Kafka
- implement real-time delivery updates
- add geospatial driver matching
- add payment integration

---

# Author

**Piyush Toraskar**

- [GitHub](https://github.com/Piyush-Toraskar)
- [LinkedIn](https://in.linkedin.com/in/piyush-toraskar-1a9092290)
- [LeetCode](https://leetcode.com/u/PiyushToraskar/)
- [Codeforces](https://codeforces.com/profile/fyurs720)

---

## Disclaimer

Tomato is an engineering/portfolio project inspired by the architecture and workflows of modern food-delivery systems. It is not affiliated with Zomato, Uber Eats, DoorDash or Deliveroo.
