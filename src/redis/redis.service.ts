import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly queueName: string;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      username: process.env.REDIS_USERNAME,
      db: parseInt(process.env.REDIS_DB || '0'),
    });
    this.queueName = process.env.REDIS_QUEUE_NAME || 'color-sprayer-queue';
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

  async enqueue(message: string): Promise<number> {
    return this.redis.rpush(this.queueName, message);
  }

  async dequeue(): Promise<string | null> {
    return this.redis.lpop(this.queueName);
  }

  async blockingDequeue(timeout: number = 0): Promise<string | null> {
    const result = await this.redis.blpop(this.queueName, timeout);
    return result ? result[1] : null;
  }

  async getQueueLength(): Promise<number> {
    return this.redis.llen(this.queueName);
  }

  async peekQueue(start: number = 0, end: number = -1): Promise<string[]> {
    return this.redis.lrange(this.queueName, start, end);
  }

  async clearQueue(): Promise<void> {
    await this.redis.del(this.queueName);
  }

  async startConsumer(
    callback: (message: string) => Promise<void>,
    options: {
      pollInterval?: number;
      stopOnError?: boolean;
    } = {},
  ): Promise<() => void> {
    const { pollInterval = 0, stopOnError = false } = options;
    let isRunning = true;

    const processMessages = async () => {
      while (isRunning) {
        try {
          const message = await this.blockingDequeue(pollInterval);
          if (message && isRunning) {
            await callback(message);
          }
        } catch (error) {
          console.error(
            `Error processing message from queue ${this.queueName}:`,
            error,
          );
          if (stopOnError) {
            isRunning = false;
            break;
          }
        }
      }
    };

    processMessages();

    return () => {
      isRunning = false;
    };
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }
}
