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
  },
})
export class QueueGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger = new Logger('QueueGateway');
  private stopConsumers: (() => void)[] = [];
  private connectedClients = 0;
  private readonly NUM_CONSUMERS = 2; // Number of parallel consumers

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
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients--;
    this.logger.log(
      `Client disconnected: ${client.id}. Total clients: ${this.connectedClients}`,
    );

    if (this.connectedClients === 0) {
      this.stopConsuming();
    }
  }

  private async startConsuming() {
    this.logger.log(`Starting ${this.NUM_CONSUMERS} message consumers`);

    // Start multiple consumers in parallel
    for (let i = 0; i < this.NUM_CONSUMERS; i++) {
      const stopConsumer = await this.redisService.startConsumer(
        async (message) => {
          const parsedMessage = JSON.parse(message);
          this.server.emit('queueMessage', parsedMessage);
        },
        {
          pollInterval: 0,
          stopOnError: false,
        },
      );
      this.stopConsumers.push(stopConsumer);
    }
  }

  private stopConsuming() {
    this.logger.log('Stopping all message consumers');
    this.stopConsumers.forEach((stop) => stop());
    this.stopConsumers = [];
  }
}
