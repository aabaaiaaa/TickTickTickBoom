import type { Room, Player, Difficulty, GameState, PlayerRole } from '../../../shared/types.js';
export declare class RoomManager {
    private rooms;
    private playerRooms;
    private gameTimers;
    createRoom(hostSocketId: string): {
        room: Room;
        playerId: string;
    };
    joinRoom(roomCode: string, socketId: string): {
        room: Room;
        playerId: string;
    } | null;
    private getNextPlayerNumber;
    leaveRoom(socketId: string): {
        room: Room;
        wasDefuser: boolean;
        isEmpty: boolean;
    } | null;
    markPlayerDisconnected(socketId: string): {
        room: Room;
        wasDefuser: boolean;
    } | null;
    reconnectPlayer(socketId: string, roomCode: string, playerId: string): Room | null;
    setPlayerName(socketId: string, name: string): Room | null;
    setPlayerRole(socketId: string, role: PlayerRole): Room | null;
    toggleReady(socketId: string): Room | null;
    setDifficulty(socketId: string, difficulty: Difficulty): Room | null;
    canStartGame(room: Room): {
        canStart: boolean;
        reason?: string;
    };
    startGame(socketId: string): Room | null;
    getRoom(roomCode: string): Room | null;
    getRoomBySocket(socketId: string): Room | null;
    getRoomCode(socketId: string): string | null;
    getPlayer(socketId: string): Player | null;
    updateGameState(roomCode: string, gameState: GameState): Room | null;
    setRoomPhase(roomCode: string, phase: Room['phase']): Room | null;
    handleTakeover(socketId: string): Room | null;
    resetToLobby(roomCode: string): Room | null;
    setGameTimer(roomCode: string, timer: NodeJS.Timeout): void;
    clearGameTimer(roomCode: string): void;
    private deleteRoom;
    getRoomCount(): number;
}
