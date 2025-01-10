import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { RedisService } from './redis/redis.service';
import { ProducerService } from './redis/producer.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly redisService: RedisService,
    private readonly producerService: ProducerService,
  ) {}

  @Get()
  async getHello(): Promise<string> {
    return this.appService.getHello();
  }

  @Get('queue')
  async getQueueStatus() {
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
