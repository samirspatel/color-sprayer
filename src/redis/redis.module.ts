import { Module } from '@nestjs/common';
import { RedisModule as NestRedisModule } from '@nestjs/redis';

@Module({
  imports: [
    NestRedisModule.forRoot({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
    }),
  ],
  exports: [NestRedisModule],
})
export class RedisModule {}
