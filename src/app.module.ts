import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { RedisService } from './redis/redis.service';
import { ProducerService } from './redis/producer.service';
import { QueueGateway } from './redis/queue.gateway';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [RedisService, ProducerService, QueueGateway],
})
export class AppModule {}
