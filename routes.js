import { publishJob } from './rabbit.js';
import dotenv from "dotenv";

dotenv.config();


const CONSUMER_QUEUE = process.env.CONSUMER_QUEUE || 'send-whatsapp-queue';
const EXCHANGE = process.env.EXCHANGE || 'jobs-exchange';
const ROUTING_KEY = process.env.ROUTING_KEY || 'send.whatsapp';

export default async function routes(fastify) {

  fastify.get('/health', async () => ({ status: 'ok' }));

  // Rota de alta performance que chamaria o rabbit.js
  fastify.post('/send', async (req, reply) => {
    const payload = req.body;

    // Evita travar o event loop
    setImmediate(async () => {
    try {
        await publishJob(EXCHANGE, ROUTING_KEY, payload);
    } catch (err) {
        console.error('Erro ao publicar:', err);
    }
    });
  
    reply.code(202).send({ accepted: true });
  });
}
