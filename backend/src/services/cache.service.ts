import { getRedis } from '../config/redis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const NAMESPACE = 'veda';

export class CacheService {
  private static key(key: string): string {
    return `${NAMESPACE}:${key}`;
  }

  static async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await getRedis().get(CacheService.key(key));
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      logger.error('Cache GET error:', err);
      return null;
    }
  }

  static async set(key: string, value: unknown, ttlSeconds = env.REDIS_TTL_PAPER): Promise<void> {
    try {
      await getRedis().setex(CacheService.key(key), ttlSeconds, JSON.stringify(value));
    } catch (err) {
      logger.error('Cache SET error:', err);
    }
  }

  static async del(key: string): Promise<void> {
    try {
      await getRedis().del(CacheService.key(key));
    } catch (err) {
      logger.error('Cache DEL error:', err);
    }
  }

  static async exists(key: string): Promise<boolean> {
    try {
      return (await getRedis().exists(CacheService.key(key))) === 1;
    } catch {
      return false;
    }
  }
}
