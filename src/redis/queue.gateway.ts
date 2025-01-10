import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import type { Server } from 'socket.io';
import type { Socket } from 'socket.io';
import { RedisService } from './redis.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    transports: ['websocket', 'polling'],
  },
})
export class QueueGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger = new Logger('QueueGateway');
  private stopConsumers: (() => void)[] = [];
  private connectedClients = 0;
  private readonly NUM_CONSUMERS = 1;
  private messageCount = 0;
  private statsInterval: NodeJS.Timeout | null = null;

  constructor(private readonly redisService: RedisService) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.connectedClients++;
    this.logger.log(
      `Client connected: ${client.id}. Total clients: ${this.connectedClients}`,
    );

    if (this.connectedClients === 1) {
      this.startConsuming();
      this.startStatsEmission();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients--;
    this.logger.log(
      `Client disconnected: ${client.id}. Total clients: ${this.connectedClients}`,
    );

    if (this.connectedClients === 0) {
      this.stopConsuming();
      this.stopStatsEmission();
    }
  }

  private async startStatsEmission() {
    this.logger.log('Starting stats emission');

    // Emit stats immediately on start
    await this.emitStats();

    // Then emit every second
    this.statsInterval = setInterval(async () => {
      await this.emitStats();
    }, 1000);
  }

  private stopStatsEmission() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }

  private async emitStats() {
    try {
      const queueLength = await this.redisService.getQueueLength();
      const recentMessages = await this.redisService.peekQueue(0, 5);

      this.server.emit('queueStats', {
        queueLength,
        messageCount: this.messageCount,
        recentMessages: recentMessages.map((msg) => JSON.parse(msg)),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Error emitting stats:', error);
    }
  }

  private async startConsuming() {
    this.logger.log(`Starting ${this.NUM_CONSUMERS} message consumers`);

    // Start multiple consumers in parallel
    for (let i = 0; i < this.NUM_CONSUMERS; i++) {
      const consumerId = i + 1;
      this.logger.log(`Starting consumer ${consumerId}`);

      const stopConsumer = await this.redisService.startConsumer(
        async (message) => {
          try {
            const parsedMessage = JSON.parse(message);
            this.messageCount++;

            // Log every 1000 messages
            if (this.messageCount % 1000 === 0) {
              this.logger.log(
                `Consumer ${consumerId} processed ${this.messageCount} messages`,
              );
            }

            this.server.emit('queueMessage', parsedMessage);
          } catch (error) {
            this.logger.error(
              `Error processing message in consumer ${consumerId}:`,
              error,
            );
          }
        },
        {
          pollInterval: 0,
          stopOnError: false,
        },
      );

      this.logger.log(`Consumer ${consumerId} started successfully`);
      this.stopConsumers.push(stopConsumer);
    }
  }

  private stopConsuming() {
    this.logger.log(
      `Stopping all consumers. Processed ${this.messageCount} messages in total`,
    );
    this.stopConsumers.forEach((stop, index) => {
      this.logger.log(`Stopping consumer ${index + 1}`);
      stop();
    });
    this.stopConsumers = [];
    this.messageCount = 0;
  }
}
