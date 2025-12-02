// rabbit.js
import amqp from 'amqplib';
import dotenv from "dotenv";
import pino from 'pino';

dotenv.config();

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

let connection = null;
const channelPool = [];
const MAX_CHANNELS = parseInt(process.env.MAX_CHANNELS) || 5;

// -----------------------------------------------------------------------------
// ENV Rabbit
// -----------------------------------------------------------------------------
const HOST = process.env.RABBITMQ_HOST;
const PORT = process.env.RABBITMQ_PORT;
const USER = process.env.RABBITMQ_USER;
const PASS = process.env.RABBITMQ_PASS;
const RABBIT_URL = `amqp://${USER}:${PASS}@${HOST}:${PORT}`;

// -----------------------------------------------------------------------------
// Exchange e Routing
// -----------------------------------------------------------------------------
const EXCHANGE = process.env.EXCHANGE || 'jobs-exchange';
const ROUTING_KEY = process.env.ROUTING_KEY || 'send.whatsapp';
const QUEUE = process.env.CONSUMER_QUEUE || 'send-whatsapp-queue';

// -----------------------------------------------------------------------------
// Conecta Rabbit e cria pool de canais
// -----------------------------------------------------------------------------
export async function connectRabbit(retries = 10, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      connection = await amqp.connect(RABBIT_URL);

      connection.on('close', () => {
        logger.warn('RabbitMQ connection closed. Reconnecting...');
        setTimeout(() => connectRabbit(), delay);
      });

      connection.on('error', (err) => {
        logger.error(err, 'RabbitMQ connection error');
      });

      // Cria pool de canais
      for (let i = 0; i < MAX_CHANNELS; i++) {
        const channel = await connection.createChannel();
        await channel.assertExchange(EXCHANGE, 'direct', { durable: true });
        await channel.assertQueue(QUEUE, { durable: true });
        await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);
        channelPool.push(channel);
      }

      logger.info('RabbitMQ connected, channel pool created');
      return;
    } catch (err) {
      logger.error(err, `Failed to connect to RabbitMQ. Retry ${i + 1}/${retries}`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  throw new Error('Unable to connect to RabbitMQ after retries');
}

// -----------------------------------------------------------------------------
// Publica job com retry simples
// -----------------------------------------------------------------------------
export async function publishJob(payload) {
  if (!channelPool.length) throw new Error('No RabbitMQ channels available');

  const channel = channelPool[Math.floor(Math.random() * channelPool.length)];

  try {
    const sent = channel.publish(EXCHANGE, ROUTING_KEY, Buffer.from(JSON.stringify(payload)), { persistent: true });
    if (!sent) {
      logger.warn('Channel buffer full, message may be delayed');
    }
  } catch (err) {
    logger.error(err, 'Failed to publish job. Retrying...');
    await new Promise(res => setTimeout(res, 100)); // simples retry
    channel.publish(EXCHANGE, ROUTING_KEY, Buffer.from(JSON.stringify(payload)), { persistent: true });
  }
}
