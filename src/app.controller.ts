import { Controller, Get } from '@nestjs/common';
import { RedisService } from './redis/redis.service';
import { ProducerService } from './redis/producer.service';

@Controller()
export class AppController {
  constructor(
    private readonly redisService: RedisService,
    private readonly producerService: ProducerService,
  ) {}

  @Get('stats')
  async getQueueStats() {
    const queueLength = await this.redisService.getQueueLength();
    const producedCount = this.producerService.getMessageCount();
    const recentMessages = await this.redisService.peekQueue(0, 5); // Get last 5 messages for preview

    return {
      queueLength,
      producedCount,
      recentMessages: recentMessages.map((msg) => JSON.parse(msg)),
      timestamp: new Date().toISOString(),
    };
  }
}
