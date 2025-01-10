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
  private stopConsumer: (() => void) | null = null;
  private connectedClients = 0;

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
    this.logger.log('Starting message consumption');
    this.stopConsumer = await this.redisService.startConsumer(
      async (message) => {
        const parsedMessage = JSON.parse(message);
        this.server.emit('queueMessage', parsedMessage);
      },
      {
        pollInterval: 0,
        stopOnError: false,
      },
    );
  }

  private stopConsuming() {
    if (this.stopConsumer) {
      this.logger.log('Stopping message consumption');
      this.stopConsumer();
      this.stopConsumer = null;
    }
  }
}
