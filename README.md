# Tomato — Scalable Food Delivery Backend

A production-oriented food delivery backend inspired by platforms such as Uber Eats and Zomato.

The project goes beyond basic CRUD APIs and explores backend engineering concerns such as authentication, multi-device sessions, transactional consistency, idempotency, concurrency safety, database performance, observability, rate limiting, containerisation, automated testing, CI, and load testing.

## Tech Stack

| Component | Technology |
|---|---|
| API Framework | FastAPI |
| Language | Python |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Validation | Pydantic |
| Database Migrations | Alembic |
| Authentication | Token-based authentication |
| Password Security | bcrypt / Passlib |
| Testing | Pytest |
| Load Testing | k6 |
| Containerisation | Docker & Docker Compose |
| CI | GitHub Actions |

---

## Features

### Authentication & Session Management

- User registration and login
- Secure password hashing
- Token-based authentication
- Logout and token revocation
- Multi-device session support
- One active token per device
- Re-login from the same device invalidates its previous token
- Sessions on other devices remain unaffected
- Role-based authorisation

### Restaurant & Menu Management

- Restaurant management APIs
- Menu item management
- Structured request/response validation
- Service-layer separation between API and business logic

### Order Management

- Create food orders containing multiple menu items
- Order status transitions
- Server-side order calculations
- Transaction-safe order creation
- Validation against inconsistent or invalid order data

### Driver Assignment

- Assign drivers to orders
- Validation of assignment operations
- Protection against invalid state transitions
- Transaction-safe dispatch logic

### Idempotency

Order creation supports idempotency protection to prevent duplicate orders when clients retry requests because of:

- network failures
- timeouts
- repeated button presses
- client retries

This is particularly important for APIs that perform state-changing operations.

### Transaction Safety

Critical database operations are executed using transaction boundaries to ensure that partial operations do not leave the system in an inconsistent state.

Examples include:

- order creation
- driver assignment
- multi-step database updates

If part of an operation fails, the transaction can be rolled back.

### Rate Limiting

Rate limiting is implemented to protect endpoints from excessive request traffic and abusive clients.

### Observability

The backend includes observability components for understanding application and database behaviour.

This includes:

- application metrics
- request monitoring
- database observability
- query inspection utilities

### Database Performance

Database performance improvements include:

- database indexes
- query analysis utilities
- pagination
- performance-oriented migrations

The project also contains scripts for inspecting database query execution.

---

## Project Architecture

The application follows a layered structure:

```text
Client
  |
  v
FastAPI Routes
  |
  v
Service Layer
  |
  v
SQLAlchemy ORM
  |
  v
PostgreSQL
```

Routes are responsible primarily for HTTP concerns, while business logic is handled by the service layer.

This keeps the codebase easier to test, maintain and extend.

---

## Project Structure

```text
mini-uber-backend/
|
|-- app/
|   |-- routes/
|   |   |-- auth.py
|   |   |-- drivers.py
|   |   |-- orders.py
|   |   `-- restaurants.py
|   |
|   |-- services/
|   |   |-- auth_service.py
|   |   |-- db_transaction.py
|   |   |-- driver_service.py
|   |   |-- order_service.py
|   |   `-- restaurant_service.py
|   |
|   |-- scripts/
|   |   |-- explain_queries.py
|   |   `-- provision_account.py
|   |
|   |-- config.py
|   |-- database.py
|   |-- db_observability.py
|   |-- helpers.py
|   |-- main.py
|   |-- metrics.py
|   |-- models.py
|   |-- observability.py
|   |-- rate_limiter.py
|   |-- schemas.py
|   `-- security.py
|
|-- alembic/
|   `-- versions/
|
|-- tests/
|   |-- postgres/
|   |-- test_auth.py
|   |-- test_authorization.py
|   |-- test_data_hardening.py
|   |-- test_idempotency.py
|   |-- test_observability.py
|   |-- test_order_flow.py
|   |-- test_pagination.py
|   `-- test_transaction_safety.py
|
|-- loadtests/
|   |-- authenticated.js
|   |-- baseline.js
|   |-- bottleneck.js
|   `-- capacity.js
|
|-- .github/
|   `-- workflows/
|       `-- ci.yml
|
|-- Dockerfile
|-- compose.yaml
|-- alembic.ini
|-- pytest.ini
|-- requirements.txt
`-- README.md
```

---

## Database Migrations

Database schema changes are managed using **Alembic** rather than manually modifying the production database.

The migration history includes:

```text
Baseline schema
      |
      v
Authentication hardening
      |
      v
Order data-model hardening
      |
      v
Order idempotency
      |
      v
Performance indexes
```

Apply migrations using:

```bash
alembic upgrade head
```

---

## Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/Piyush-Toraskar/tomato.git
cd tomato
```

### 2. Create a virtual environment

Windows:

```bash
python -m venv venv
venv\Scripts\activate
```

macOS/Linux:

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create a `.env` file in the project root.

Example:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/mini_uber
SECRET_KEY=replace-with-a-secure-secret
```

The actual `.env` file is intentionally excluded from Git.

### 5. Apply database migrations

```bash
alembic upgrade head
```

### 6. Start the API

```bash
uvicorn app.main:app --reload
```

The API will then be available locally.

FastAPI's interactive API documentation can be accessed at:

```text
http://127.0.0.1:8000/docs
```

---

## Running with Docker

The application can also be started using Docker Compose.

```bash
docker compose up --build
```

Docker provides a reproducible environment so that the application and its dependencies behave consistently across machines.

To stop the containers:

```bash
docker compose down
```

---

## Testing

The project contains automated tests covering core backend behaviour.

Run the complete test suite with:

```bash
pytest -v
```

Test coverage includes:

- authentication
- authorisation
- order workflows
- data integrity
- transaction safety
- idempotency
- pagination
- observability
- PostgreSQL integration

The separation between unit/application tests and PostgreSQL integration tests helps verify both application logic and real database behaviour.

---

## Load Testing

Load and capacity testing is performed using **k6**.

The repository contains several load-test scenarios:

```text
loadtests/
|-- baseline.js
|-- authenticated.js
|-- bottleneck.js
`-- capacity.js
```

Example:

```bash
k6 run loadtests/capacity.js
```

These tests are used to evaluate behaviour under increasing traffic and identify potential performance bottlenecks.

---

## Continuous Integration

A GitHub Actions workflow is included in:

```text
.github/workflows/ci.yml
```

The CI pipeline automatically validates the project when code changes are pushed, helping detect regressions before changes are merged.

---

## Key Engineering Concepts Demonstrated

This project was designed to explore backend concepts beyond simply building REST endpoints.

### 1. Separation of Concerns

HTTP routing, business logic and database access are separated into different layers.

### 2. Authentication Security

Passwords are never stored directly. Password hashes are stored and verified securely during authentication.

### 3. Multi-Device Sessions

Authentication sessions are tracked independently by device, allowing users to remain logged in on multiple devices while still allowing individual sessions to be invalidated.

### 4. Transactional Consistency

Operations involving multiple database changes are wrapped in transactions to avoid partial updates.

### 5. Idempotent APIs

Retrying certain operations does not unintentionally create duplicate resources.

### 6. Database Performance

Indexes, pagination and query inspection are used to improve and analyse database performance.

### 7. Observability

Metrics and database instrumentation make application behaviour easier to inspect and diagnose.

### 8. Scalability Testing

k6 load tests provide a way to identify capacity limits and performance bottlenecks rather than assuming that an API will scale.

### 9. Reproducible Deployment

Docker packages the application and its runtime dependencies into a consistent environment.

### 10. Automated Verification

Pytest and GitHub Actions provide automated verification of application behaviour as the codebase evolves.

---

## API Documentation

FastAPI automatically generates interactive OpenAPI documentation.

After starting the server, visit:

```text
http://127.0.0.1:8000/docs
```

This provides an interactive interface for exploring and testing the available API endpoints.

---

## Future Improvements

Possible extensions include:

- Redis-based distributed caching
- Redis-backed distributed rate limiting
- asynchronous background jobs
- message queues for order/driver events
- WebSocket-based live order tracking
- geospatial driver matching
- payment-service integration
- Kubernetes deployment
- distributed tracing
- horizontal API scaling

---

## Purpose

This project was built as a backend engineering exercise focused on understanding how production-oriented APIs are designed, tested, secured, monitored and scaled.

Rather than attempting to reproduce every feature of a real food-delivery platform, the project focuses on the engineering patterns required to build a reliable backend service.

---

## Author

**Piyush Toraskar**

GitHub: [Piyush-Toraskar](https://github.com/Piyush-Toraskar)
