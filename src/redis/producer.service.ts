import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class ProducerService implements OnModuleInit, OnModuleDestroy {
  private isRunning = false;
  private messageCount = 0;

  constructor(private readonly redisService: RedisService) {}

  onModuleInit() {
    this.startProducing();
  }

  onModuleDestroy() {
    this.stopProducing();
  }

  private startProducing() {
    this.isRunning = true;
    this.produceMessages();
  }

  private stopProducing() {
    this.isRunning = false;
  }

  private async produceMessages() {
    while (this.isRunning) {
      try {
        const message = {
          id: ++this.messageCount,
          timestamp: new Date().toISOString(),
          data: `Message ${this.messageCount}`,
        };

        await this.redisService.enqueue(JSON.stringify(message));

        // Optional: Add a small delay to prevent overwhelming the system
        // await new Promise(resolve => setTimeout(resolve, 1));
      } catch (error) {
        console.error('Error producing message:', error);
        // Add a small delay on error to prevent tight error loops
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  getMessageCount(): number {
    return this.messageCount;
  }
}
