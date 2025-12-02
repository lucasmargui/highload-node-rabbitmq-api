# High-Performance Node.js API with RabbitMQ

This project implements a high-performance architecture for asynchronous message processing using **Node.js**, **RabbitMQ**, **Fastify**, **PM2**, and **Nginx**, supporting high request loads and horizontal scalability.

It demonstrates practical practices in building scalable systems such as message queuing, load balancing, and fault-tolerant workers.

---

## Overview

The system is designed to:

- Receive HTTP requests and enqueue messages in RabbitMQ for asynchronous processing.
- Process messages via scalable workers without blocking the main application.
- Maintain high performance using PM2 clusters and load balancing via Nginx.
- Ensure resilience and reliability through automatic reconnection and retries.

This system is used in applications like notification services, order processing in e-commerce, and any microservice architecture where decoupled and reliable messaging is critical.

---

## System Architecture

```
[Client] --> [Nginx] --> [Node.js API (Fastify)] --> [RabbitMQ] --> [Node.js Worker]
```

- Nginx handles incoming requests and distributes them to multiple API instances.
- Node.js API acts as the entry point for clients and publishes jobs to RabbitMQ.
- RabbitMQ manages queues to decouple producers and consumers.
- Node.js Worker processes jobs asynchronously and in parallel.
- PM2 ensures process management and clustering for high availability.

This architecture is similar to production-grade systems like messaging backends, e-commerce order pipelines, or financial transaction processing, where performance and reliability are critical.

---

## Components

### 1. Docker Compose
File: `docker-compose.yml`

Docker Compose orchestrates RabbitMQ and API services, simplifying deployment and ensuring consistent environments across development, staging, and production.

### 2. Dockerfile
File: `Dockerfile`

Uses Node.js 18-alpine as a lightweight, secure base image, installs production dependencies, exposes port 3001, and starts the server with `server.js`. Containerization ensures consistent behavior across all environments.

### 3. Nginx
File: `nginx.conf`

Nginx performs load balancing using `least_conn`, reverse proxies multiple API instances, and configures keepalive and headers. This approach prevents single points of failure and distributes traffic efficiently in production systems.

### 4. PM2
File: `pm2.config.cjs`

PM2 runs API and worker processes in cluster mode, automatically restarts processes if memory limits are exceeded, and manages environment variables. This ensures uptime and high availability for Node.js applications.

### 5. Node.js API
Files: `server.js`, `routes.js`, `rabbit.js`

Fastify is used for high-speed HTTP handling, with security middleware and optional rate limiting. RabbitMQ connections use a channel pool, and endpoints include `/health` and `/enqueue`. This pattern allows APIs to handle thousands of concurrent requests efficiently.

### 6. Node.js Worker
File: `worker.js`

Workers connect to RabbitMQ with multiple channels and prefetch configuration, process jobs asynchronously, log actions using structured logging, and handle retries and reconnections. Workers decouple processing-heavy tasks from the API, improving responsiveness.

### 7. Load Testing (Artillery)
File: `load-test.yml`

Simulates up to 5000 requests per second to the `/enqueue` endpoint and configures HTTP timeouts and connection pools. Load testing identifies bottlenecks and ensures the system can handle peak traffic.

---

## Installation and Configuration

1. Clone the repository:
```bash
git clone <repo_url>
cd <repo>
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Make sure you have Docker installed if you want to run RabbitMQ locally. You need a running RabbitMQ instance for the API and workers.

4. Create a `.env` file with environment variables:
```
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASS=guest
CONSUMER_QUEUE=send-whatsapp-queue
EXCHANGE=jobs-exchange
ROUTING_KEY=send.whatsapp
MAX_CHANNELS=5
PREFETCH=10
LOG_LEVEL=info
```

5. Start containers:
```bash
docker-compose up --build -d
```

When using `npm run start-all`, if Docker is installed and RabbitMQ is not running, the command will automatically start RabbitMQ using Docker.

Environment-based configuration allows the same codebase to run in development, staging, and production without modification.

---

## Running and Testing the API

### Single-Core Mode (Single Instance)

This mode runs only one instance of the API and worker, useful for development, debugging, or small-scale testing.

**Steps:**

1. Start API and worker in single-core mode:
```bash
npm run start-all
```

2. Run load testing:
```bash
artillery run load-test.yml
```

- Simulates high request volume to the `/enqueue` endpoint.
- Useful to see how a single instance handles concurrent requests.

### Multi-Core Mode (Cluster Mode)

This mode runs multiple instances of the API and worker using PM2, taking advantage of all available CPU cores. Ideal for high-load production testing.

**Steps:**

1. Start API and worker with PM2 cluster mode:
```bash
pm2 start pm2.config.cjs
```

2. Monitor processes and resource usage:
```bash
pm2 monit
```

3. Run load testing:
```bash
artillery run load-test.yml
```

- Validates system performance under high concurrency.
- Ensures horizontal scalability and resilience.

Notes:
- `artillery run load-test.yml` works in both single-core and multi-core setups.
- Single-core tests are for functionality checks, multi-core tests are for performance and scalability validation.
- Use `pm2 logs` during multi-core tests to debug or identify bottlenecks.

---

## Environment Variables

| Variable | Description |
|----------|-----------|
| RABBITMQ_HOST | RabbitMQ host, ensures correct broker connection |
| RABBITMQ_PORT | RabbitMQ port for service connection |
| RABBITMQ_USER | Authentication user |
| RABBITMQ_PASS | Authentication password |
| CONSUMER_QUEUE | Queue name, allows multiple job types |
| EXCHANGE | Exchange name, routes messages to queues |
| ROUTING_KEY | Routing key for message filtering |
| MAX_CHANNELS | Max concurrent RabbitMQ channels, controls parallelism |
| PREFETCH | Max jobs per channel, prevents worker overload |
| LOG_LEVEL | Logging verbosity, for monitoring and debugging |

---

## Message Flow

1. Client sends an HTTP request to `/enqueue`.
2. API validates and publishes the message to RabbitMQ.
3. Worker consumes the message, processes the job, and acknowledges (`ack`).
4. Failed messages can be reprocessed (`nack`).

This decoupled architecture allows APIs to remain responsive while heavy processing happens asynchronously, commonly used in messaging, notifications, and transaction processing systems.

---

## Best Practices and Applications

- PM2 Cluster Mode maximizes CPU usage and keeps services highly available.
- RabbitMQ Channel Pool reduces overhead for high-volume message publishing.
- Retry and Reconnection ensure resiliency against temporary outages.
- Rate Limiting protects APIs from abuse and denial-of-service attacks.
- Load Balancing with Nginx ensures efficient traffic distribution and fault tolerance.
- Structured Logging with Pino enables monitoring, debugging, and analytics.
- Load Testing with Artillery validates system behavior under peak loads.

---
