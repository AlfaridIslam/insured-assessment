# InsuredMine Backend Engineering Technical Assessment

A high-performance, non-blocking insurance management system built with **Node.js**, **Express (ES Modules)**, **MongoDB**, **Redis**, and native **Worker Threads**. The system implements a strict 3-tier architecture with offloaded CSV data processing, transactional relational modeling, future-dated asynchronous message dispatching, real-time CPU watchdog monitoring, and automated process recovery.

---

## Architecture & System Design Overview

```text
+----------------------------------------------------------------------------------------------------+
|                                           Client / UI                                              |
+----------------------------------------------------------------------------------------------------+
                                                  |
                                                  | HTTP (REST)
                                                  v
+----------------------------------------------------------------------------------------------------+
|                                  Express API Gateway (Port 5000)                                   |
|                                                                                                    |
|   [ Middlewares ]                  ----------> [ Controllers ]         -------------> [ Services ] |
|   - Multer (Stream to Disk)                    - upload.controller.js                 - upload.service.js |
|   - Joi (Strict Validation)                    - search.controller.js                 - search.service.js |
|   - Error Handlers                             - message.controller.js                - message.service.js|
+----------------------------------------------------------------------------------------------------+
       |                                                 |                               |
       | IPC (workerData)                                | Wire Protocol                 | RESP Protocol
       v                                                 v                               v
+-----------------------------+               +----------------------+        +----------------------+
|    Node.js Worker Thread    |               |   MongoDB Database   |        |     Redis Store      |
|      (CPU-Bound Task)       |               |     (Port 27017)     |        |     (Port 6379)      |
+-----------------------------+               +----------------------+        +----------------------+
| - Streaming CSV Parser      |                          ^                               |
| - In-Memory Relational Maps |--------------------------+                               | Delayed Job Event
| - 250 Row Batch Inserts     |                                                          |
+-----------------------------+                                                          v
                                                                              +----------------------+
                                                                              | BullMQ Queue Worker  |
                                                                              | (Asynchronous Task)  |
                                                                              +----------------------+
                                                                              | - Status: 'queued'   |
                                                                              | - Mock Dispatch      |
                                                                              | - Status: 'sent'     |
                                                                              +----------------------+
```

---

## Core Architecture Principles

- **Non-Blocking Main Event Loop**: All CPU-heavy tasks (large CSV parsing) and time-delayed tasks (scheduled communications) are strictly decoupled from the main HTTP thread.
- **3-Tier Modular Structure**: Strict physical separation across Routes, Controllers, Services, Models, and Workers/Queues.
- **Resilient Infrastructure**: Stateful delayed tasks persist across process restarts via Redis-backed BullMQ queues.

---

## Technical Stack & Tool Selection Rationale

| Technology | Role | Justification & Architectural Trade-Offs |
| :--- | :--- | :--- |
| **Node.js (v20+)** | Runtime Environment | Provides an event-driven runtime using ES Modules (`type: module`), allowing native asynchronous I/O and modern JavaScript standards. |
| **Express.js** | HTTP Web Framework | Minimalist routing framework providing decoupled middleware pipelines for input validation, file uploads, static asset serving, and error handling. |
| **MongoDB & Mongoose** | Document Database & ODM | Accommodates normalized insurance entities (Users, Accounts, Policies, Carriers, Categories) while executing joins via aggregation pipelines (`$lookup`). |
| **Docker & Docker Compose** | Container Orchestration | Encapsulates dependencies (MongoDB and Redis) to ensure exact local environment parity without manual local service installations. |
| **Worker Threads** | CPU-Bound Computation | Isolates CSV parsing onto a secondary V8 thread, preventing CPU saturation on the main thread during large file ingestion. |
| **Redis** | In-Memory Key-Value Store | Acts as a high-speed persistence layer and event store for scheduled task timers and distributed job metadata. |
| **BullMQ** | Distributed Message Queue | Implements enterprise-grade job scheduling, exponential backoff retries, and delayed job triggers resilient to server restarts. |
| **Joi** | API Validation Layer | Enforces request hygiene with strict regex validation rules, rejecting malformed dates or times prior to queue insertion. |
| **Vyomi Gateway** | Outbound Dispatch Simulation | Emulates third-party communication delivery (SMS/Email) with generated transaction receipts, decoupling external vendor APIs from testing. |
| **PM2** | Process Manager | Provides automated process healing; monitors the Node.js process and immediately restarts it if the CPU watchdog triggers a termination. |

---

## Assessment Requirements & Implementation Details

### Task 1.1: High-Performance CSV Ingestion Pipeline
- **File Handling**: Handled via `multer` using disk storage to avoid holding file payloads in RAM.
- **Thread Offloading**: Dispatches an isolated `worker_threads` worker (`csvWorker.js`). Express immediately returns an HTTP `202 Accepted` response.
- **Chunked Batch Processing**: Reads the CSV stream and aggregates records into batches of 250 rows to protect V8 memory limits.
- **In-Memory Caching**: Implements `Map()` caches for relational dependencies (`Agent`, `User`, `PolicyCategory`, `PolicyCarrier`) to eliminate redundant MongoDB lookups across thousands of rows.
- **Schema Normalization**: Maps relational dependencies across 6 distinct Mongoose collections (`Agent`, `User`, `UserAccount`, `PolicyCategory`, `PolicyCarrier`, `Policy`).

### Task 1.2: Relational Aggregation Search API
- **Endpoint**: `GET /api/search?username=<firstName>`
- **Implementation**: Executes a single-trip MongoDB aggregation pipeline on the `User` collection.
- **Pipeline Stages**:
  - `$match`: Performs a case-insensitive regex search against `firstName`.
  - `$lookup`: Joins the `policies` collection via `userId`.
  - `$unwind`: Unwinds policies while preserving users without active policies (`preserveNullAndEmptyArrays: true`).
  - `$lookup` & `$addFields`: Performs left joins to attach `policycategories` and `policycarriers`.
  - `$group`: Re-aggregates matching policies into a cohesive user response document.

### Task 2.1: Future-Dated Message Scheduling
- **Endpoint**: `POST /api/messages/schedule`
- **Validation**: Joi enforces strict `YYYY-MM-DD` and 24-hour `HH:mm` format rules.
- **Queue Ingestion**: Calculates target execution delta (`targetDate.getTime() - Date.now()`). Saves an initial record in MongoDB with status `queued` and enqueues the job into BullMQ with the computed millisecond delay.
- **Job Execution**: The `messageWorker.js` consumer picks up the job upon timer expiration, executes the dispatch via the Vyomi simulation gateway, and marks the MongoDB record status as `sent`.

### Task 2.2: Real-Time CPU Watchdog & Self-Healing
- **Monitoring Metric**: Polls `os.cpus()` every 3 seconds to measure the delta between total system ticks and idle ticks across all cores.
- **Automated Termination**: If CPU utilization exceeds 70%, the process executes `process.exit(1)`.
- **Self-Healing Orchestration**: PM2 catches the non-zero exit code and automatically re-spawns a clean process instance.

---

## 📁 Project Structure

```text
insuredmine-assessment/
├── config/
│   ├── database.js              # MongoDB connection configuration (fallback/alias)
│   ├── redis.js                 # Redis connection options
│   └── vyomi.js                 # Outbound dispatch simulation engine
├── public/
│   └── index.html               # Verification UI dashboard (Tailwind CSS)
├── src/
│   ├── config/                  # Module connection setups (MongoDB, Redis, Socket.io, Vyomi)
│   │   ├── db.js
│   │   ├── redis.js
│   │   ├── socket.js
│   │   └── vyomi.js
│   ├── controllers/             # HTTP request/response handling and input validation
│   │   ├── message.controller.js# Message scheduling HTTP handler
│   │   ├── monitor.controller.js# CPU & memory telemetry HTTP handler
│   │   ├── policy.controller.js # Policy retrieval controller
│   │   ├── search.controller.js # Policy aggregation search HTTP handler
│   │   └── upload.controller.js # CSV file upload and worker handoff
│   ├── middlewares/             # Global error handling and request validation guards
│   │   ├── errorHandler.js      # Mongoose & global error handler
│   │   ├── upload.middleware.js # Multer disk-storage & file filters
│   │   └── validator.js         # Joi payload validation rules
│   ├── models/                  # MongoDB Mongoose schemas
│   │   ├── Agent.js             # Agent schema
│   │   ├── Policy.js            # Core policy schema with foreign ObjectIDs
│   │   ├── PolicyCarrier.js     # Insurance company schema
│   │   ├── PolicyCategory.js    # Policy category (LOB) schema
│   │   ├── ScheduledMessage.js  # Scheduled communications log schema
│   │   ├── User.js              # Customer demographic schema
│   │   ├── UserAccount.js       # User account relational schema
│   │   └── index.js             # Barrel export for all Mongoose models
│   ├── routes/                  # Express route definitions pointing to controllers
│   │   ├── index.js             # Consolidated API route gateway
│   │   ├── message.routes.js    # Routes for message scheduling
│   │   ├── monitor.routes.js    # Routes for CPU metrics
│   │   ├── policy.routes.js     # Routes for policy operations
│   │   ├── search.routes.js     # Routes for policy searching
│   │   └── upload.routes.js     # Routes for file ingestion
│   ├── services/                # Core business logic
│   │   ├── cpuMonitor.service.js# CPU telemetry service
│   │   ├── message.service.js   # Delay computation & BullMQ job placement
│   │   ├── policy.service.js    # Policy database aggregations
│   │   ├── search.service.js    # MongoDB aggregation pipeline definition
│   │   └── upload.service.js    # Worker Thread instantiator & lifecycle hooks
│   ├── utils/
│   │   └── cpuWatchdog.js       # Real-time CPU monitor & exit handler
│   ├── workers/                 # Background tasks
│   │   ├── queues/
│   │   │   ├── messageQueue.js  # BullMQ queue initialization
│   │   │   └── messageWorker.js # BullMQ worker consumer & status updater
│   │   └── threads/
│   │       └── csvWorker.js     # Isolated thread CSV parser & batch loader
│   ├── app.js                   # Express application configuration
│   └── server.js                # Main server entrypoint (HTTP, WebSockets, Workers)
├── tests/                       # Unit and integration test suites
│   ├── app.test.js
│   └── message.test.js
├── docker-compose.yml           # Local container specifications (MongoDB + Redis)
├── ecosystem.config.cjs         # PM2 process manager configuration
├── .env.example                 # Template for environment variables
├── package.json
└── README.md
```

---

## 🛠️ Installation & Setup Guide

### 1. Prerequisites
- [Node.js (v20 or higher)](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [PM2](https://pm2.keymetrics.io/) (installed globally via `npm install -g pm2`)

### 2. Environment Configuration
Create a `.env` file in the project root directory:

```env
NODE_ENV=development
PORT=5000

# MongoDB Configuration
MONGODB_URI=mongodb://127.0.0.1:27017/insuredmine_db

# Redis Configuration
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# CPU Watchdog Settings
CPU_THRESHOLD=70
CPU_CHECK_INTERVAL_MS=3000

# Vyomi Simulation Service
VYOMI_SIMULATION_ENABLED=true
VYOMI_SIMULATION_LATENCY_MS=100
```

### 3. Start Database & Message Broker Containers
Start MongoDB and Redis using Docker Compose:

```bash
docker compose up -d
```

Verify both containers are running:
```bash
docker compose ps
```

### 4. Install Dependencies
```bash
npm install
```

---

## 🏃 Running the Application

### Option A: Standard Development Mode
Run the application with live reload using nodemon:
```bash
npm run dev
```

### Option B: Production Mode with PM2 (Recommended for Watchdog Testing)
Run the application under PM2 supervision to observe automatic restart behaviors when the CPU threshold is triggered:
```bash
pm2 start ecosystem.config.cjs
pm2 logs insuredmine-api
```

---

## 🧪 Verification & API Documentation

### 1. Interactive Verification Dashboard
Navigate to the root URL in any browser:
```text
http://localhost:5000/
```
The client dashboard allows you to:
- **Upload a CSV file** and observe background ingestion.
- **Search for users** (e.g., *Lura*, *Torie*) to verify relational aggregation results.
- **Schedule delayed messages** and confirm real-time worker execution.

### 2. Swagger / OpenAPI Documentation
Access full API specifications and test endpoints directly via Swagger UI:
```text
http://localhost:5000/api/docs
```

---

## 📡 API Reference & Examples

### 1. CSV Data Ingestion
- **Endpoint**: `POST /api/upload`
- **Content-Type**: `multipart/form-data`
- **Field Name**: `file`

**Sample Request (cURL):**
```bash
curl -X POST http://localhost:5000/api/upload \
  -F "file=@./data-sheet.csv"
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "message": "File uploaded successfully. Processing started in background worker thread.",
  "file": {
    "originalName": "data-sheet.csv",
    "size": 142050,
    "tempPath": "uploads/import-1791022680-data-sheet.csv"
  }
}
```

### 2. Search Policy by User Name
- **Endpoint**: `GET /api/search`
- **Query Parameters**: `username` (string, required)

**Sample Request (cURL):**
```bash
curl -X GET "http://localhost:5000/api/search?username=Torie"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "6ac0d3c96f75030bba47659c",
      "firstName": "Torie Brodnax",
      "email": "zeitlin@icloud.com",
      "phoneNumber": "3666489561",
      "policies": [
        {
          "_id": "6ac0d3c16f75030bba4765a0",
          "policyNumber": "53GMWF4MC5VD",
          "policyStartDate": "2018-09-23T00:00:00.000Z",
          "policyEndDate": "2019-09-23T00:00:00.000Z",
          "premiumAmount": 850,
          "policyType": "Homeowners",
          "category": {
            "_id": "6ac0d3c16f75030bba4749cf",
            "categoryName": "Homeowners"
          },
          "carrier": {
            "_id": "6ac0d3c16f75030bba4749d1",
            "companyName": "Financial Pacific Ins Co"
          }
        }
      ]
    }
  ]
}
```

### 3. Schedule Communication Message
- **Endpoint**: `POST /api/messages/schedule`
- **Content-Type**: `application/json`

**Sample Request (cURL):**
```bash
curl -X POST http://localhost:5000/api/messages/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Policy renewal notice for account.",
    "day": "2026-10-04",
    "time": "10:30"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Message successfully scheduled and queued for delivery.",
  "data": {
    "id": "6ac0d5fc3faf6823b012e576",
    "message": "Policy renewal notice for account.",
    "scheduledDate": "2026-10-04T05:00:00.000Z",
    "delayMs": 67800000,
    "status": "queued",
    "jobId": "6ac0d5fc3faf6823b012e576"
  }
}
```

---

## 🛡️ Verifying CPU Watchdog & Self-Healing

1. Ensure the application is running via PM2:
   ```bash
   pm2 start ecosystem.config.cjs
   ```
2. Open `.env` and temporarily set `CPU_THRESHOLD=5` to simulate extreme load sensitivity:
   ```env
   CPU_THRESHOLD=5
   ```
3. Save the file and restart the process:
   ```bash
   pm2 restart insuredmine-api
   ```
4. Run `pm2 logs` to observe the watchdog action:
   ```text
   🛡️  CPU Watchdog active: monitoring every 3000ms at 5% ceiling
   🚨 CPU spike detected: 14% (exceeds 5% limit)
   🚨 Terminating process via process.exit(1) to trigger orchestrator restart.
   [PM2] App [insuredmine-api:0] exited with code [1] via signal [SIGINT]
   [PM2] Script ./src/server.js had been restarted [1] times
   ```
5. Reset `CPU_THRESHOLD=70` in `.env` and restart PM2 to return to production defaults:
   ```bash
   pm2 restart insuredmine-api
   ```
