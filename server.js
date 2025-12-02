// server.js
import Fastify from "fastify";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { connectRabbit, publishJob } from './rabbit.js';

const fastify = Fastify({ logger: false, trustProxy: true });

await connectRabbit();

// -------------------------
// Segurança
// -------------------------
await fastify.register(helmet);

// -------------------------
// Rate limiting leve
// -------------------------
// await fastify.register(rateLimit, {
//   max: 1000,            
//   timeWindow: '1 minute',
//   ban: false,
// });

// -------------------------
// Health check
// -------------------------
fastify.get('/health', async () => ({ status: 'ok' }));

// -------------------------
// Endpoint enqueue
// -------------------------
fastify.post('/enqueue', async (req, reply) => {
  const payload = req.body;
  try {
    await publishJob(payload);
    reply.send({ status: 'queued' });
  } catch (err) {
    console.error(err);
    reply.code(500).send({ error: 'Failed to enqueue' });
  }
});

// -------------------------
// Start do servidor
// -------------------------
const port = Number(process.env.PORT || 3001);
await fastify.listen({ port, host: '0.0.0.0' });
console.log('API listening on', port);
