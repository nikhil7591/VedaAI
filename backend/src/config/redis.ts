import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

// Upstash Redis uses TLS — URL format: rediss://default:<token>@<host>:6379
// ioredis handles TLS automatically when protocol is rediss://

let redisInstance: Redis | null = null;

export function getRedis(): Redis {
  if (redisInstance) return redisInstance;

  redisInstance = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,   // Required by BullMQ
    enableReadyCheck: false,      // Required for Upstash compatibility
    tls: env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
    retryStrategy: (times) => {
      if (times > 10) {
        logger.error('Redis max retries reached');
        return null;
      }
      return Math.min(times * 500, 3000);
    },
  });

  redisInstance.on('connect',    () => logger.info('✅ Upstash Redis connected'));
  redisInstance.on('error',      (err) => logger.error('Redis error:', err));
  redisInstance.on('close',      () => logger.warn('Redis connection closed'));
  redisInstance.on('reconnecting', () => logger.warn('Redis reconnecting...'));

  return redisInstance;
}

// BullMQ requires a separate connection (maxRetriesPerRequest: null)
export function createRedisConnection(): Redis {
  return new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
    retryStrategy: (times) => {
      if (times > 10) return null;
      return Math.min(times * 500, 3000);
    },
  });
}
