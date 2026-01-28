import type { Room, Player, Difficulty, GameState, PlayerRole } from '../../../shared/types.js';
import { generateRoomCode, generatePlayerId, DIFFICULTY_PRESETS } from '../../../shared/types.js';
import { generateGame } from '../game/GameGenerator.js';

export class RoomManager {
    private rooms: Map<string, Room> = new Map();
    private playerRooms: Map<string, string> = new Map(); // socketId -> roomCode
    private gameTimers: Map<string, NodeJS.Timeout> = new Map();

    createRoom(hostSocketId: string): { room: Room; playerId: string } {
        let code = generateRoomCode();
        // Ensure unique code
        while (this.rooms.has(code)) {
            code = generateRoomCode();
        }

        const playerId = generatePlayerId();
        const playerNumber = 1;

        const host: Player = {
            id: playerId,
            socketId: hostSocketId,
            name: `Player ${playerNumber}`,
            role: 'defuser', // First player defaults to defuser
            isReady: false,
            isConnected: true,
        };

        const room: Room = {
            code,
            players: [host],
            difficulty: 'easy',
            phase: 'lobby',
            hostId: playerId,
            gameState: null,
        };

        this.rooms.set(code, room);
        this.playerRooms.set(hostSocketId, code);

        return { room, playerId };
    }

    joinRoom(roomCode: string, socketId: string): { room: Room; playerId: string } | null {
        const room = this.rooms.get(roomCode.toUpperCase());
        if (!room) return null;

        // Check if rejoining
        const existingPlayer = room.players.find(p => p.socketId === socketId);
        if (existingPlayer) {
            existingPlayer.isConnected = true;
            return { room, playerId: existingPlayer.id };
        }

        // Don't allow joining mid-game
        if (room.phase !== 'lobby') return null;

        const playerId = generatePlayerId();
        const playerNumber = this.getNextPlayerNumber(room);

        const player: Player = {
            id: playerId,
            socketId,
            name: `Player ${playerNumber}`,
            role: 'reader', // New players default to reader
            isReady: false,
            isConnected: true,
        };

        room.players.push(player);
        this.playerRooms.set(socketId, roomCode.toUpperCase());

        return { room, playerId };
    }

    private getNextPlayerNumber(room: Room): number {
        const existingNumbers = room.players.map(p => {
            const match = p.name.match(/Player (\d+)/);
            return match ? parseInt(match[1], 10) : 0;
        });
        let num = 1;
        while (existingNumbers.includes(num)) num++;
        return num;
    }

    leaveRoom(socketId: string): { room: Room; wasDefuser: boolean; isEmpty: boolean } | null {
        const roomCode = this.playerRooms.get(socketId);
        if (!roomCode) return null;

        const room = this.rooms.get(roomCode);
        if (!room) return null;

        const playerIndex = room.players.findIndex(p => p.socketId === socketId);
        if (playerIndex === -1) return null;

        const player = room.players[playerIndex];
        const wasDefuser = player.role === 'defuser';

        // Remove player
        room.players.splice(playerIndex, 1);
        this.playerRooms.delete(socketId);

        // If room is empty, delete it
        if (room.players.length === 0) {
            this.deleteRoom(roomCode);
            return { room, wasDefuser, isEmpty: true };
        }

        // If host left, assign new host
        if (room.hostId === player.id && room.players.length > 0) {
            room.hostId = room.players[0].id;
        }

        return { room, wasDefuser, isEmpty: false };
    }

    markPlayerDisconnected(socketId: string): { room: Room; wasDefuser: boolean } | null {
        const roomCode = this.playerRooms.get(socketId);
        if (!roomCode) return null;

        const room = this.rooms.get(roomCode);
        if (!room) return null;

        const player = room.players.find(p => p.socketId === socketId);
        if (!player) return null;

        player.isConnected = false;
        const wasDefuser = player.role === 'defuser';

        // Check if all players disconnected
        const allDisconnected = room.players.every(p => !p.isConnected);
        if (allDisconnected) {
            this.deleteRoom(roomCode);
            return null;
        }

        return { room, wasDefuser };
    }

    reconnectPlayer(socketId: string, roomCode: string, playerId: string): Room | null {
        const room = this.rooms.get(roomCode.toUpperCase());
        if (!room) return null;

        const player = room.players.find(p => p.id === playerId);
        if (!player) return null;

        player.socketId = socketId;
        player.isConnected = true;
        this.playerRooms.set(socketId, roomCode.toUpperCase());

        return room;
    }

    setPlayerName(socketId: string, name: string): Room | null {
        const room = this.getRoomBySocket(socketId);
        if (!room || room.phase !== 'lobby') return null;

        const player = room.players.find(p => p.socketId === socketId);
        if (!player) return null;

        player.name = name.trim().substring(0, 20) || player.name;
        return room;
    }

    setPlayerRole(socketId: string, role: PlayerRole): Room | null {
        const room = this.getRoomBySocket(socketId);
        if (!room || room.phase !== 'lobby') return null;

        const player = room.players.find(p => p.socketId === socketId);
        if (!player) return null;

        // If trying to become defuser, check if there's already one
        if (role === 'defuser') {
            const existingDefuser = room.players.find(p => p.role === 'defuser' && p.id !== player.id);
            if (existingDefuser) {
                // Remove defuser role from existing player
                existingDefuser.role = 'reader';
            }
        }

        player.role = role;
        return room;
    }

    toggleReady(socketId: string): Room | null {
        const room = this.getRoomBySocket(socketId);
        if (!room || room.phase !== 'lobby') return null;

        const player = room.players.find(p => p.socketId === socketId);
        if (!player) return null;

        player.isReady = !player.isReady;
        return room;
    }

    setDifficulty(socketId: string, difficulty: Difficulty): Room | null {
        const room = this.getRoomBySocket(socketId);
        if (!room || room.phase !== 'lobby') return null;

        room.difficulty = difficulty;
        // Reset ready states when difficulty changes
        room.players.forEach(p => (p.isReady = false));
        return room;
    }

    canStartGame(room: Room): { canStart: boolean; reason?: string } {
        if (room.phase !== 'lobby') {
            return { canStart: false, reason: 'Game already in progress' };
        }

        if (room.players.length < 2) {
            return { canStart: false, reason: 'Need at least 2 players' };
        }

        const defuser = room.players.find(p => p.role === 'defuser');
        if (!defuser) {
            return { canStart: false, reason: 'No defuser assigned' };
        }

        const readers = room.players.filter(p => p.role === 'reader');
        if (readers.length === 0) {
            return { canStart: false, reason: 'Need at least 1 reader' };
        }

        const allReady = room.players.every(p => p.isReady);
        if (!allReady) {
            return { canStart: false, reason: 'Not all players are ready' };
        }

        return { canStart: true };
    }

    startGame(socketId: string): Room | null {
        const room = this.getRoomBySocket(socketId);
        if (!room) return null;

        const player = room.players.find(p => p.socketId === socketId);
        if (!player || room.hostId !== player.id) return null;

        const { canStart } = this.canStartGame(room);
        if (!canStart) return null;

        const settings = DIFFICULTY_PRESETS[room.difficulty];
        room.gameState = generateGame(room.difficulty, settings.puzzleCount);
        room.phase = 'playing';

        return room;
    }

    getRoom(roomCode: string): Room | null {
        return this.rooms.get(roomCode.toUpperCase()) || null;
    }

    getRoomBySocket(socketId: string): Room | null {
        const roomCode = this.playerRooms.get(socketId);
        if (!roomCode) return null;
        return this.rooms.get(roomCode) || null;
    }

    getRoomCode(socketId: string): string | null {
        return this.playerRooms.get(socketId) || null;
    }

    getPlayer(socketId: string): Player | null {
        const room = this.getRoomBySocket(socketId);
        if (!room) return null;
        return room.players.find(p => p.socketId === socketId) || null;
    }

    updateGameState(roomCode: string, gameState: GameState): Room | null {
        const room = this.rooms.get(roomCode);
        if (!room) return null;
        room.gameState = gameState;
        return room;
    }

    setRoomPhase(roomCode: string, phase: Room['phase']): Room | null {
        const room = this.rooms.get(roomCode);
        if (!room) return null;
        room.phase = phase;
        return room;
    }

    handleTakeover(socketId: string): Room | null {
        const room = this.getRoomBySocket(socketId);
        if (!room || room.phase !== 'paused') return null;

        const player = room.players.find(p => p.socketId === socketId);
        if (!player || player.role !== 'reader') return null;

        // Remove old defuser if disconnected
        const oldDefuser = room.players.find(p => p.role === 'defuser');
        if (oldDefuser && !oldDefuser.isConnected) {
            room.players = room.players.filter(p => p.id !== oldDefuser.id);
        } else if (oldDefuser) {
            oldDefuser.role = 'reader';
        }

        // New player becomes defuser
        player.role = 'defuser';
        room.phase = 'playing';

        return room;
    }

    resetToLobby(roomCode: string): Room | null {
        const room = this.rooms.get(roomCode);
        if (!room) return null;

        room.phase = 'lobby';
        room.gameState = null;
        room.players.forEach(p => (p.isReady = false));

        // Clear any game timer
        this.clearGameTimer(roomCode);

        return room;
    }

    setGameTimer(roomCode: string, timer: NodeJS.Timeout): void {
        this.clearGameTimer(roomCode);
        this.gameTimers.set(roomCode, timer);
    }

    clearGameTimer(roomCode: string): void {
        const timer = this.gameTimers.get(roomCode);
        if (timer) {
            clearInterval(timer);
            this.gameTimers.delete(roomCode);
        }
    }

    private deleteRoom(roomCode: string): void {
        this.clearGameTimer(roomCode);
        this.rooms.delete(roomCode);
    }

    getRoomCount(): number {
        return this.rooms.size;
    }
}
