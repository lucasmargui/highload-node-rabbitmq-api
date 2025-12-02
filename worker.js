// worker.js
import amqp from "amqplib";
import dotenv from "dotenv";
import pino from 'pino';
import { setTimeout as wait } from 'timers/promises';

dotenv.config();

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const HOST = process.env.RABBITMQ_HOST;
const PORT = process.env.RABBITMQ_PORT;
const USER = process.env.RABBITMQ_USER;
const PASS = process.env.RABBITMQ_PASS;
const RABBIT_URL = `amqp://${USER}:${PASS}@${HOST}:${PORT}`;

const EXCHANGE = process.env.EXCHANGE || 'jobs-exchange';
const ROUTING_KEY = process.env.ROUTING_KEY || 'send.whatsapp';
const QUEUE = process.env.CONSUMER_QUEUE || 'send-whatsapp-queue';

const MAX_CHANNELS = parseInt(process.env.MAX_CHANNELS) || 5;
const PREFETCH = parseInt(process.env.PREFETCH) || 10;

// -----------------------------------------------------------------------------
// Espera RabbitMQ ficar pronto
// -----------------------------------------------------------------------------
async function waitRabbitReady(retries = 20, delay = 3000) {
  const url = `http://${HOST}:15672/api/overview`; // porta do management
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: "Basic " + Buffer.from(`${USER}:${PASS}`).toString("base64"),
        },
      });
      if (res.ok) {
        console.log("🐇 RabbitMQ pronto!");
        return;
      }
    } catch {}
    await wait(delay);
  }
  throw new Error("RabbitMQ não ficou pronto a tempo.");
}

// -----------------------------------------------------------------------------
// Processa cada job
// -----------------------------------------------------------------------------
async function processJob(payload) {
  // lógica pesada do worker
  logger.info({ payload }, 'Job processado com sucesso');
  await new Promise(res => setTimeout(res, 10)); // simula 10ms de trabalho
}

// -----------------------------------------------------------------------------
// Inicializa worker com múltiplos canais e prefetch
// -----------------------------------------------------------------------------
async function startWorker() {
  const connection = await amqp.connect(RABBIT_URL);

  connection.on('close', () => {
    logger.warn('Worker connection closed. Exiting...');
    process.exit(1);
  });

  for (let i = 0; i < MAX_CHANNELS; i++) {
    const channel = await connection.createChannel();
    await channel.assertExchange(EXCHANGE, 'direct', { durable: true });
    await channel.assertQueue(QUEUE, { durable: true });
    await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);

    channel.prefetch(PREFETCH);

    channel.consume(QUEUE, async (msg) => {
      if (!msg) return;
      processJob(JSON.parse(msg.content.toString()))
        .then(() => channel.ack(msg))
        .catch(err => {
          logger.error(err, 'Erro processando job');
          channel.nack(msg, false, true);
        });
    });
  }

  console.log(`Worker iniciado com ${MAX_CHANNELS} canais, aguardando mensagens...`);
}

// -----------------------------------------------------------------------------
// Inicialização
// -----------------------------------------------------------------------------
(async () => {
  await waitRabbitReady();
  await startWorker();
})();
