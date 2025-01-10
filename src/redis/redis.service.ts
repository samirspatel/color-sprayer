import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      username: process.env.REDIS_USERNAME,
      db: parseInt(process.env.REDIS_DB || '0'),
    });
  }

  async set(key: string, value: string, ttl?: number): Promise<'OK'> {
    if (ttl) {
      return this.redis.set(key, value, 'EX', ttl);
    }
    return this.redis.set(key, value);
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async del(key: string): Promise<number> {
    return this.redis.del(key);
  }

  async exists(key: string): Promise<number> {
    return this.redis.exists(key);
  }

  async ttl(key: string): Promise<number> {
    return this.redis.ttl(key);
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }
}
