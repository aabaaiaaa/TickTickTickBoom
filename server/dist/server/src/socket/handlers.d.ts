import type { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '../../../shared/types.js';
import { RoomManager } from '../rooms/RoomManager.js';
type GameServer = Server<ClientToServerEvents, ServerToClientEvents>;
export declare function setupSocketHandlers(io: GameServer, roomManager: RoomManager): void;
export {};
