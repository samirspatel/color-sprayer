import { Injectable } from '@nestjs/common';
import { RedisService } from './redis/redis.service';

@Injectable()
export class AppService {
  constructor(private readonly redisService: RedisService) {}

  async getHello(): Promise<string> {
    const cached = await this.redisService.get('greeting');
    if (cached) {
      return cached;
    }

    const greeting = 'Hello World!';
    await this.redisService.set('greeting', greeting, 60); // Cache for 60 seconds
    return greeting;
  }
}
