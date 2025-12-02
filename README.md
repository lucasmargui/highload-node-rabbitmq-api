# High-Performance Node.js API with RabbitMQ

This project implements a high-performance architecture for asynchronous message processing using **Node.js**, **RabbitMQ**, **Fastify**, **PM2**, and **Nginx**, supporting high request loads and horizontal scalability.

It demonstrates practical practices in building scalable systems such as message queuing, load balancing, and fault-tolerant workers.

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Components](#components)
4. [Installation and Configuration](#installation-and-configuration)
5. [Running the System](#running-the-system)
6. [Load Testing](#load-testing)
7. [Environment Variables](#environment-variables)
8. [Message Flow](#message-flow)
9. [Best Practices and Applications](#best-practices-and-applications)

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

2. Create a `.env` file with environment variables:
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

3. Start containers:
```bash
docker-compose up --build -d
```

Environment-based configuration allows the same codebase to run in development, staging, and production without modification.

---

## Running the System

1. Start API and Worker using PM2:
```bash
npm install -g pm2
npm install
npm run start
pm2 start pm2.config.cjs
```

2. Check status:
```bash
pm2 list
```

Continuous monitoring and clustering via PM2 ensure uptime and reliability in production environments.

---

## Load Testing

1. Install Artillery:
```bash
npm install -g artillery
```

2. Run the test:
```bash
artillery run load-test.yml
```

Stress testing helps identify bottlenecks before production traffic spikes, reducing downtime and failures.

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

These practices are essential for production-grade applications like social media platforms, e-commerce order pipelines, banking systems, and messaging applications.

---

**Author:** Engineering Team
**Date:** 2025-12-01