import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly logger = new Logger(CacheService.name);

  constructor(private readonly config: ConfigService) {
    this.redis = new Redis({
      host: this.config.get('REDIS_HOST', 'localhost'),
      port: this.config.get('REDIS_PORT', 6379),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    this.redis.on('error', (err) => {
      this.logger.warn(`Redis 连接异常 (服务降级运行): ${err.message}`);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try { const v = await this.redis.get(key); return v ? JSON.parse(v) : null; }
    catch { return null; }
  }

  async set(key: string, value: unknown, ttlSeconds = 3600): Promise<void> {
    try { await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds); } catch {}
  }

  async del(key: string): Promise<void> {
    try { await this.redis.del(key); } catch {}
  }

  async onModuleDestroy(): Promise<void> { await this.redis.quit(); }
}
