import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server as SocketServer } from 'socket.io';

import { env } from './config/env';
import { connectDB } from './config/db';
import { getRedis } from './config/redis';
import { logger } from './utils/logger';
import { SocketGateway } from './socket/gateway';
import { startGenerationWorker } from './workers/generation.worker';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler, notFound } from './middleware/errorHandler';
import apiRoutes from './routes/index';

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function bootstrap(): Promise<void> {
  // 1. Connect DB + Redis
  await connectDB();
  getRedis();   // initialise & test connection

  // 2. Express app
  const app    = express();
  const server = http.createServer(app);

  // 3. Socket.io
  const io = new SocketServer(server, {
    cors: {
      origin:  env.FRONTEND_URL,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });
  new SocketGateway(io);

  // 4. Start BullMQ worker (same process for Render single-dyno deploy)
  startGenerationWorker();

  // 5. Middleware
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(generalLimiter);

  // 6. Routes
  app.use('/api/v1', apiRoutes);

  // 7. Error handling
  app.use(notFound);
  app.use(errorHandler);

  // 8. Start server
  server.listen(env.PORT, () => {
    logger.info(`🚀 VedaAI backend running on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  // 9. Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      const { disconnectDB } = await import('./config/db');
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
