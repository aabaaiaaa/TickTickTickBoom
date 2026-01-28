import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../../../shared/types';

const SERVER_URL = 'http://localhost:3001';

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: GameSocket | null = null;

export function getSocket(): GameSocket {
    if (!socket) {
        socket = io(SERVER_URL, {
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socket.on('connect', () => {
            console.log('Connected to server:', socket?.id);
        });

        socket.on('disconnect', (reason) => {
            console.log('Disconnected from server:', reason);
        });

        socket.on('connect_error', (error) => {
            console.error('Connection error:', error.message);
        });

        // Expose socket for e2e testing
        if (typeof window !== 'undefined') {
            (window as unknown as { __gameSocket: GameSocket }).__gameSocket = socket;
        }
    }

    return socket;
}

export function disconnectSocket(): void {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
