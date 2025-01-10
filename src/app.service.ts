import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs/redis';
import { Redis } from 'ioredis';

@Injectable()
export class AppService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async getHello(): Promise<string> {
    const cachedValue = await this.redis.get('hello');
    if (cachedValue) {
      return cachedValue;
    }

    const value = 'Hello World!';
    await this.redis.set('hello', value, 'EX', 60); // Cache for 60 seconds
    return value;
  }
}
