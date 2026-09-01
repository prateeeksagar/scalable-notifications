# Distributed Multi-Channel Notification Engine

A high-throughput, event-driven notification engine built with TypeScript, Fastify, BullMQ, Redis, PostgreSQL, and Drizzle ORM inside a Turborepo monorepo.

Designed to decouple notification ingestion from third-party delivery services, ensuring sub-15ms API response times, zero duplicate sends, dynamic template compilation, resilient multi-channel dispatching, and automated Dead Letter Queue (DLQ) failure recovery.

---

## System Architecture

```
[ Client / Webhook / Service ]
              |
              | POST /api/v1/notification (Payload + Idempotency-Key)
              v
     +-----------------+
     |    apps/api     |
     | (Fastify HTTP)  |<---------------------------------------------------+
     +--------+--------+                                                    |
              |                                                             |
              |-- 1. Check Redis Cache & Atomic Insert to Postgres ('QUEUED') |
              |-- 2. Enqueue Job to BullMQ with Priority Weight             |
              |-- 3. Return 202 Accepted (< 15ms)                           |
              v                                                             |
     +-----------------+                                                    |
     |  Redis (BullMQ) |                                                    |
     | (notifications) |                                                    |
     +--------+--------+                                                    |
              |                                                             |
              | Asynchronous Job Pickup (concurrency: 10)                   |
              v                                                             |
     +-----------------+                                                    |
     |  apps/workers   |                                                    |
     | (Worker Engine) |                                                    |
     +--------+--------+                                                    |
              |                                                             |
              |-- 1. Fetch & Render Template (Mustache Interpolation)       |
              |-- 2. Dispatch via Provider Chain (Primary -> Fallback)      |
              |                                                             |
      +-------+-------+                                                     |
      |               |                                                     |
  [Success]       [Failed all 3 retries]                                    |
      |               |                                                     |
      v               v                                                     |
+-----------+   +-------------------+                                       |
| Postgres  |   |   Redis (BullMQ)  |                                       |
|  ('SENT') |   | (notifications-dlq|                                       |
+-----------+   +---------+---------+                                       |
                          |                                                 |
                          | Terminal failure stored with error stack trace  |
                          v                                                 |
                +-------------------+                                       |
                | Postgres Audit DB |                                       |
                |  ('DEAD_LETTER')  |                                       |
                +---------+---------+                                       |
                          |                                                 |
                          | Manual / Automated Replay Endpoint              |
                          +--- POST /api/v1/dlq/replay/:id -----------------+
```

---

## Key Features

### 1. Asynchronous Event-Driven Architecture
- Ingestion API immediately enqueues messages to Redis and responds with `202 Accepted` and a `notificationId`.
- Completely isolates client-facing APIs from third-party vendor latencies (Resend, Twilio, SendGrid) and downstream network outages.

### 2. Multi-Channel Support with Provider Failover
- Unified provider interface for **Email**, **SMS**, **WhatsApp**, and **In-App** channels.
- **Failover Chains**: Automatically falls back to secondary providers if the primary provider (e.g. Resend) encounters upstream errors or network timeouts, guaranteeing maximum delivery reliability.

### 3. Dead Letter Queue (DLQ) and Replay Engine
- When a notification exhausts all 3 exponential backoff retries, it is automatically routed to a dedicated `notifications-dlq` queue.
- Updates PostgreSQL record to `DEAD_LETTER` with the exact error message and timestamp.
- Provides a dedicated Replay API (`POST /api/v1/dlq/replay/:id`) to re-inject failed messages into the active queue once the issue is resolved.

### 4. Distributed Idempotency and Deduplication
- Two-tier idempotency system:
  - **Tier 1 (Redis Cache)**: Sub-millisecond in-memory cache check for `Idempotency-Key` headers with a 24-hour TTL.
  - **Tier 2 (PostgreSQL Atomic Safety)**: Unique constraint on `idempotency_key` using `ON CONFLICT DO NOTHING` to eliminate race conditions during concurrent simultaneous requests.
- Prevents duplicate charges, duplicate OTPs, and redundant emails on client retries.

### 5. Dynamic Template Engine
- Database-backed template storage (`templates` table) with natural slug identifiers (`templateId`).
- Embedded Mustache compilation engine supporting dynamic variable interpolation across subjects, message bodies, titles, and action URLs.
- Automatic variable validation and fallback mechanisms.

### 6. Multi-Level Priority Queueing
- Numeric weighted priority scheduling in BullMQ (`CRITICAL` = 1, `HIGH` = 2, `NORMAL` = 3, `LOW` = 4).
- Critical transactional alerts (OTPs, 2FA, password resets) automatically bypass large backlogs of marketing or bulk campaigns in the queue.

### 7. End-to-End Type Safety and Schema Validation
- Strict validation at the API layer using Zod Discriminated Unions.
- Guarantees that channel-specific requirements (e.g. `subject` for emails vs phone number formatting for SMS) are validated before entering the queue.

---

## Monorepo Structure

```
.
├── apps/
│   ├── api/                # Fastify REST API for notification ingestion, queries, and DLQ
│   └── workers/            # BullMQ background worker consumers, DLQ routers, and processors
│
├── packages/
│   ├── broker/             # BullMQ queue definitions (main & DLQ) and Redis connection
│   ├── db/                 # Drizzle ORM schemas, PostgreSQL connection, and migrations
│   ├── providers/          # Multi-channel delivery providers & ProviderFactory failover registry
│   └── shared-types/       # Canonical TypeScript types and Zod validation schemas
│
├── pnpm-workspace.yaml     # pnpm workspace configuration
├── turbo.json              # Turborepo task pipeline configuration
└── docker-compose.yml      # Local development container definitions
```

---

## API Reference

### 1. Ingest Notification

```http
POST /api/v1/notification
```

#### Headers:
- `Content-Type`: `application/json`
- `Idempotency-Key`: `string` *(Optional, recommended for transactional requests)*

#### Request Body (Template-Based Email):
```json
{
  "channel": "EMAIL",
  "priority": "HIGH",
  "payload": {
    "to": "user@example.com",
    "templateId": "welcome-email",
    "variables": {
      "name": "Alex",
      "email": "user@example.com",
      "loginUrl": "https://myapp.com/login"
    }
  }
}
```

#### Request Body (Raw SMS):
```json
{
  "channel": "SMS",
  "priority": "CRITICAL",
  "payload": {
    "to": "+1234567890",
    "body": "Your verification code is 849201. Valid for 5 minutes."
  }
}
```

#### Response (202 Accepted):
```json
{
  "success": true,
  "message": "Notification queued successfully",
  "notificationId": "2a418c49-5818-441e-aee3-ec9d3e9a1363",
  "isDuplicate": false
}
```

---

### 2. List Notifications

```http
GET /api/v1/notification
```

#### Response (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "2a418c49-5818-441e-aee3-ec9d3e9a1363",
      "channel": "EMAIL",
      "status": "SENT",
      "priority": "HIGH",
      "payload": { ... },
      "createdAt": "2026-09-01T12:00:00.000Z",
      "updatedAt": "2026-09-01T12:00:01.250Z"
    }
  ]
}
```

---

### 3. Dead Letter Queue (DLQ) Management

#### A. List Dead Letters
```http
GET /api/v1/dlq
```

#### Response (200 OK):
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": "2a418c49-5818-441e-aee3-ec9d3e9a1363",
      "channel": "EMAIL",
      "status": "DEAD_LETTER",
      "failedReason": "All providers for channel EMAIL failed. Last error: API Key Invalid",
      "payload": { ... },
      "createdAt": "2026-09-01T12:00:00.000Z",
      "updatedAt": "2026-09-01T12:00:05.120Z"
    }
  ]
}
```

#### B. Replay Dead-Lettered Notification
```http
POST /api/v1/dlq/replay/:id
```

#### Response (200 OK):
```json
{
  "success": true,
  "message": "Notification 2a418c49-5818-441e-aee3-ec9d3e9a1363 re-requested successfully for processing"
}
```

---

## Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- pnpm (`npm install -g pnpm`)
- PostgreSQL instance (Local or Neon)
- Redis instance (Local or Redis Cloud)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/scalable-notifications.git
cd scalable-notifications
pnpm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:

```env
POSTGRESQL='postgresql://user:password@localhost:5432/notification_db'
REDIS_URL='redis://default:password@localhost:6379'
RESEND_API='re_your_resend_api_key'
PORT=3000
```

### 3. Push Database Schemas
```bash
pnpm --filter @project/db db:push
```

### 4. Start Development Servers
Start both the Ingestion API and Background Workers:

```bash
# Terminal 1: Start Ingestion API
pnpm run dev:api

# Terminal 2: Start Background Workers
pnpm run dev:workers
```

### 5. Launch Drizzle Studio (Optional UI)
To visually inspect and manage database tables, dead letters, and templates:
```bash
pnpm --filter @project/db db:studio
```

---

## Tech Stack

- **Runtime & Language**: Node.js, TypeScript
- **API Framework**: Fastify
- **Message Broker & Queue**: BullMQ, Redis (ioredis)
- **Database & ORM**: PostgreSQL, Drizzle ORM
- **Email Delivery**: Resend SDK (with Provider Failover)
- **Validation**: Zod (Discriminated Unions)
- **Template Engine**: Mustache
- **Monorepo Tooling**: Turborepo, pnpm
