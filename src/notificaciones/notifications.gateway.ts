import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { Logger } from '@nestjs/common';
  
  @WebSocketGateway({
    cors: {
      origin: '*', // Cambia según tus necesidades (por ejemplo, tu frontend)
    },
  })
  export class NotificationsGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
  {
    @WebSocketServer() server: Server; // Instancia del servidor Socket.IO
    private logger: Logger = new Logger('NotificationsGateway');
  
    // Inicialización del Gateway
    afterInit(server: Server) {
      this.logger.log('WebSocket Gateway Initialized');
    }
  
    // Manejar nuevas conexiones de clientes
    handleConnection(client: Socket) {
      this.logger.log(`Cliente conectado: ${client.id}`);
    }
  
    // Manejar desconexiones de clientes
    handleDisconnect(client: Socket) {
      this.logger.log(`Cliente desconectado: ${client.id}`);
    }
  
    // Emitir una notificación a todos los clientes conectados
    sendNotificationToAll(message: string) {
      this.server.emit('notification', { message });
    }
  }
  