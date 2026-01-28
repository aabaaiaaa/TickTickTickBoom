import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, LeaderboardEntry } from '../../../shared/types.js';
import { RoomManager } from '../rooms/RoomManager.js';
import { validatePuzzleAction } from '../game/PuzzleValidator.js';

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type GameServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function setupSocketHandlers(io: GameServer, roomManager: RoomManager): void {
    io.on('connection', (socket: GameSocket) => {
        console.log(`Client connected: ${socket.id}`);

        // Create Room
        socket.on('create-room', (callback) => {
            try {
                const { room, playerId } = roomManager.createRoom(socket.id);
                socket.join(room.code);
                callback({ success: true, roomCode: room.code, playerId });
                socket.emit('room-updated', room);

                // Store playerId on socket for later use
                (socket as unknown as { playerId: string }).playerId = playerId;
            } catch (error) {
                console.error('Error creating room:', error);
                callback({ success: false, error: 'Failed to create room' });
            }
        });

        // Join Room
        socket.on('join-room', ({ roomCode }, callback) => {
            try {
                const result = roomManager.joinRoom(roomCode, socket.id);
                if (!result) {
                    callback({ success: false, error: 'Room not found or game in progress' });
                    return;
                }

                const { room, playerId } = result;
                socket.join(room.code);
                (socket as unknown as { playerId: string }).playerId = playerId;

                callback({ success: true, room, playerId });
                io.to(room.code).emit('room-updated', room);
            } catch (error) {
                console.error('Error joining room:', error);
                callback({ success: false, error: 'Failed to join room' });
            }
        });

        // Leave Room
        socket.on('leave-room', () => {
            handleLeaveRoom(socket, io, roomManager);
        });

        // Set Name
        socket.on('set-name', ({ name }) => {
            const room = roomManager.setPlayerName(socket.id, name);
            if (room) {
                io.to(room.code).emit('room-updated', room);
            }
        });

        // Set Role
        socket.on('set-role', ({ role }) => {
            const room = roomManager.setPlayerRole(socket.id, role);
            if (room) {
                io.to(room.code).emit('room-updated', room);
            }
        });

        // Toggle Ready
        socket.on('toggle-ready', () => {
            const room = roomManager.toggleReady(socket.id);
            if (room) {
                io.to(room.code).emit('room-updated', room);
            }
        });

        // Set Difficulty
        socket.on('set-difficulty', ({ difficulty }) => {
            const room = roomManager.setDifficulty(socket.id, difficulty);
            if (room) {
                io.to(room.code).emit('room-updated', room);
            }
        });

        // Start Game
        socket.on('start-game', () => {
            const room = roomManager.startGame(socket.id);
            if (!room || !room.gameState) {
                socket.emit('error', 'Cannot start game');
                return;
            }

            io.to(room.code).emit('room-updated', room);
            io.to(room.code).emit('game-state-updated', room.gameState);

            // Start game timer
            startGameTimer(io, roomManager, room.code);
        });

        // Puzzle Action
        socket.on('puzzle-action', ({ puzzleId, action }, callback) => {
            const room = roomManager.getRoomBySocket(socket.id);
            if (!room || !room.gameState || room.phase !== 'playing') {
                callback({ success: false, error: 'Game not in progress' });
                return;
            }

            // Only defuser can perform puzzle actions
            const player = roomManager.getPlayer(socket.id);
            if (!player || player.role !== 'defuser') {
                callback({ success: false, error: 'Only the defuser can interact with puzzles' });
                return;
            }

            const puzzle = room.gameState.puzzles.find(p => p.id === puzzleId);
            if (!puzzle || puzzle.isCompleted) {
                callback({ success: false, error: 'Invalid puzzle' });
                return;
            }

            const result = validatePuzzleAction(puzzle, action);

            if (result.correct) {
                puzzle.isCompleted = true;
                room.gameState.completedCount++;

                // Check for victory
                if (room.gameState.completedCount >= room.gameState.puzzles.length) {
                    endGame(io, roomManager, room.code, true);
                } else {
                    // Move to next puzzle
                    room.gameState.currentPuzzleIndex++;
                }
            } else if (result.strike) {
                // Only increment strikes if explicitly a strike
                puzzle.attempts++;
                room.gameState.strikes++;

                // Check for defeat
                if (room.gameState.strikes >= room.gameState.maxStrikes) {
                    endGame(io, roomManager, room.code, false);
                }
            }
            // If neither correct nor strike, it's just a neutral action (puzzle still in progress)

            callback({ success: true, correct: result.correct });
            io.to(room.code).emit('puzzle-result', {
                puzzleId,
                correct: result.correct,
                newStrikes: room.gameState.strikes
            });
            io.to(room.code).emit('game-state-updated', room.gameState);
        });

        // Skip Puzzle (test mode only)
        socket.on('skip-puzzle', (callback) => {
            const room = roomManager.getRoomBySocket(socket.id);
            if (!room || !room.gameState || room.phase !== 'playing') {
                callback({ success: false, error: 'Game not in progress' });
                return;
            }

            // Only allow in test difficulties
            if (room.difficulty !== 'test' && room.difficulty !== 'defeat-test') {
                callback({ success: false, error: 'Skip only available in test mode' });
                return;
            }

            // Only defuser can skip puzzles
            const player = roomManager.getPlayer(socket.id);
            if (!player || player.role !== 'defuser') {
                callback({ success: false, error: 'Only the defuser can skip puzzles' });
                return;
            }

            const puzzle = room.gameState.puzzles[room.gameState.currentPuzzleIndex];
            if (!puzzle || puzzle.isCompleted) {
                callback({ success: false, error: 'No active puzzle' });
                return;
            }

            // Mark puzzle as completed
            puzzle.isCompleted = true;
            room.gameState.completedCount++;

            // Check for victory
            if (room.gameState.completedCount >= room.gameState.puzzles.length) {
                endGame(io, roomManager, room.code, true);
            } else {
                // Move to next puzzle
                room.gameState.currentPuzzleIndex++;
            }

            callback({ success: true });
            io.to(room.code).emit('puzzle-result', {
                puzzleId: puzzle.id,
                correct: true,
                newStrikes: room.gameState.strikes
            });
            io.to(room.code).emit('game-state-updated', room.gameState);
        });

        // Get Puzzle Solution (test mode only) - For automated testing
        socket.on('get-puzzle-solution', (callback) => {
            const room = roomManager.getRoomBySocket(socket.id);
            if (!room || !room.gameState || room.phase !== 'playing') {
                callback({ success: false, error: 'Game not in progress' });
                return;
            }

            // Only allow in test difficulties
            if (!room.difficulty.startsWith('test')) {
                callback({ success: false, error: 'Solution only available in test mode' });
                return;
            }

            const puzzle = room.gameState.puzzles[room.gameState.currentPuzzleIndex];
            if (!puzzle) {
                callback({ success: false, error: 'No active puzzle' });
                return;
            }

            callback({
                success: true,
                puzzleType: puzzle.type,
                solution: puzzle.solution,
                defuserView: puzzle.defuserView,
                serialNumber: room.gameState.serialNumber,
                indicators: room.gameState.indicators,
                strikes: room.gameState.strikes
            });
        });

        // Request Takeover (when defuser disconnects)
        socket.on('request-takeover', () => {
            const room = roomManager.handleTakeover(socket.id);
            if (room && room.gameState) {
                io.to(room.code).emit('room-updated', room);
                io.to(room.code).emit('game-state-updated', room.gameState);

                // Resume timer
                startGameTimer(io, roomManager, room.code);
            }
        });

        // Sync Leaderboard
        socket.on('sync-leaderboard', ({ entries }) => {
            const roomCode = roomManager.getRoomCode(socket.id);
            if (!roomCode) return;

            // Store entries temporarily for merging
            const socketData = socket as unknown as { leaderboardEntries?: LeaderboardEntry[] };
            socketData.leaderboardEntries = entries;

            // Check if all players have submitted their leaderboards
            const room = roomManager.getRoom(roomCode);
            if (!room) return;

            const connectedSockets = io.sockets.adapter.rooms.get(roomCode);
            if (!connectedSockets) return;

            const allEntries: LeaderboardEntry[] = [];
            const seenIds = new Set<string>();

            for (const socketId of connectedSockets) {
                const playerSocket = io.sockets.sockets.get(socketId);
                if (playerSocket) {
                    const data = playerSocket as unknown as { leaderboardEntries?: LeaderboardEntry[] };
                    if (data.leaderboardEntries) {
                        for (const entry of data.leaderboardEntries) {
                            if (!seenIds.has(entry.id)) {
                                seenIds.add(entry.id);
                                allEntries.push(entry);
                            }
                        }
                    }
                }
            }

            // Broadcast merged leaderboard to all players in room
            io.to(roomCode).emit('leaderboard-synced', allEntries);
        });

        // Play Again
        socket.on('play-again', () => {
            const roomCode = roomManager.getRoomCode(socket.id);
            if (!roomCode) return;

            const room = roomManager.resetToLobby(roomCode);
            if (room) {
                io.to(roomCode).emit('room-updated', room);
            }
        });

        // Handle Disconnect
        socket.on('disconnect', () => {
            handleDisconnect(socket, io, roomManager);
        });
    });
}

function handleLeaveRoom(socket: GameSocket, io: GameServer, roomManager: RoomManager): void {
    const result = roomManager.leaveRoom(socket.id);
    if (!result) return;

    const { room, wasDefuser, isEmpty } = result;
    socket.leave(room.code);

    if (isEmpty) {
        return; // Room deleted
    }

    // If defuser left during game, pause and offer takeover
    if (wasDefuser && room.phase === 'playing') {
        room.phase = 'paused';
        roomManager.clearGameTimer(room.code);
        io.to(room.code).emit('defuser-disconnected');
        io.to(room.code).emit('takeover-available', { previousDefuser: 'Unknown' });
    }

    io.to(room.code).emit('room-updated', room);
}

function handleDisconnect(socket: GameSocket, io: GameServer, roomManager: RoomManager): void {
    console.log(`Client disconnected: ${socket.id}`);

    const result = roomManager.markPlayerDisconnected(socket.id);
    if (!result) return;

    const { room, wasDefuser } = result;

    // If defuser disconnected during game, pause and offer takeover
    if (wasDefuser && room.phase === 'playing') {
        room.phase = 'paused';
        roomManager.clearGameTimer(room.code);
        roomManager.setRoomPhase(room.code, 'paused');
        io.to(room.code).emit('defuser-disconnected');

        const defuser = room.players.find(p => p.role === 'defuser');
        io.to(room.code).emit('takeover-available', {
            previousDefuser: defuser?.name || 'Unknown'
        });
    }

    // Check if only readers left and last one disconnected during game
    const connectedReaders = room.players.filter(p => p.role === 'reader' && p.isConnected);
    const connectedDefuser = room.players.find(p => p.role === 'defuser' && p.isConnected);

    if (room.phase === 'playing' && !connectedDefuser && connectedReaders.length === 0) {
        endGame(io, roomManager, room.code, false);
        return;
    }

    io.to(room.code).emit('room-updated', room);
}

function startGameTimer(io: GameServer, roomManager: RoomManager, roomCode: string): void {
    const timer = setInterval(() => {
        const room = roomManager.getRoom(roomCode);
        if (!room || !room.gameState || room.phase !== 'playing') {
            roomManager.clearGameTimer(roomCode);
            return;
        }

        room.gameState.timeRemaining--;

        if (room.gameState.timeRemaining <= 0) {
            endGame(io, roomManager, roomCode, false);
            return;
        }

        io.to(roomCode).emit('game-state-updated', room.gameState);
    }, 1000);

    roomManager.setGameTimer(roomCode, timer);
}

function endGame(io: GameServer, roomManager: RoomManager, roomCode: string, victory: boolean): void {
    const room = roomManager.getRoom(roomCode);
    if (!room || !room.gameState) return;

    roomManager.clearGameTimer(roomCode);
    room.phase = victory ? 'victory' : 'defeat';

    io.to(roomCode).emit('game-over', {
        victory,
        finalTime: room.gameState.timeRemaining,
        strikes: room.gameState.strikes,
    });
    io.to(roomCode).emit('room-updated', room);
}
