import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';

let gatewayInstance: SocketGateway | null = null;

export class SocketGateway {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.registerHandlers();
    gatewayInstance = this;
    logger.info('✅ SocketGateway initialized');
  }

  private registerHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.debug(`Socket connected: ${socket.id}`);

      socket.on('join', ({ assignmentId }: { assignmentId: string }) => {
        const room = `assignment:${assignmentId}`;
        socket.join(room);
        logger.debug(`Socket ${socket.id} joined room ${room}`);
        socket.emit('joined', { room, assignmentId });
      });

      socket.on('leave', ({ assignmentId }: { assignmentId: string }) => {
        const room = `assignment:${assignmentId}`;
        socket.leave(room);
        logger.debug(`Socket ${socket.id} left room ${room}`);
      });

      socket.on('disconnecting', () => {
        logger.debug(`Socket ${socket.id} disconnecting from rooms:`, [...socket.rooms]);
      });

      socket.on('disconnect', (reason) => {
        logger.debug(`Socket ${socket.id} disconnected: ${reason}`);
      });
    });
  }

  async emit(assignmentId: string, event: string, data: Record<string, unknown>): Promise<void> {
    const room = `assignment:${assignmentId}`;
    this.io.to(room).emit(event, {
      ...data,
      assignmentId,
      timestamp: new Date().toISOString(),
    });
    logger.debug(`Emitted "${event}" to room ${room}`);
  }

  async emitProgress(
    assignmentId: string,
    jobId: string,
    progress: number,
    stage: string
  ): Promise<void> {
    await this.emit(assignmentId, 'generation:progress', { jobId, progress, stage });
  }

  async emitCompleted(
    assignmentId: string,
    jobId: string,
    paperId: string
  ): Promise<void> {
    await this.emit(assignmentId, 'generation:completed', {
      jobId,
      paperId,
      message: 'Question paper ready',
    });
  }

  async emitFailed(
    assignmentId: string,
    jobId: string,
    errorCode: string,
    message: string
  ): Promise<void> {
    await this.emit(assignmentId, 'generation:failed', { jobId, errorCode, message });
  }
}

export function getSocketGateway(): SocketGateway {
  if (!gatewayInstance) throw new Error('SocketGateway not yet initialized');
  return gatewayInstance;
}
