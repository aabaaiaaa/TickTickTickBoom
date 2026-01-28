import { useState, useEffect, useCallback } from 'react';
import { getSocket } from '../socket/socket';
import type { Room, GameState, LeaderboardEntry } from '../../../shared/types';

interface UseGameStateReturn {
    room: Room | null;
    gameState: GameState | null;
    playerId: string | null;
    leaderboard: LeaderboardEntry[];
    isConnected: boolean;
    error: string | null;
    createRoom: () => Promise<string | null>;
    joinRoom: (roomCode: string) => Promise<boolean>;
    leaveRoom: () => void;
    setName: (name: string) => void;
    setRole: (role: 'defuser' | 'reader') => void;
    toggleReady: () => void;
    setDifficulty: (difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'test' | 'defeat-test') => void;
    startGame: () => void;
    submitPuzzleAction: (puzzleId: string, action: unknown) => Promise<{ success: boolean; correct?: boolean }>;
    requestTakeover: () => void;
    playAgain: () => void;
    syncLeaderboard: () => void;
    skipPuzzle: () => Promise<boolean>;
}

export function useGameState(): UseGameStateReturn {
    const [room, setRoom] = useState<Room | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const socket = getSocket();

        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);
        const handleRoomUpdated = (updatedRoom: Room) => setRoom(updatedRoom);
        const handleGameStateUpdated = (state: GameState) => setGameState(state);
        const handleError = (message: string) => setError(message);
        const handleLeaderboardSynced = (entries: LeaderboardEntry[]) => {
            setLeaderboard(entries);
            // Save to localStorage
            localStorage.setItem('ticktickboom-leaderboard', JSON.stringify(entries));
        };
        const handleGameOver = (data: { victory: boolean; finalTime: number; strikes: number }) => {
            console.log('Game Over:', data);
            // Add to leaderboard if victory
            if (data.victory && room && gameState) {
                const defuser = room.players.find(p => p.role === 'defuser');
                const entry: LeaderboardEntry = {
                    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    date: new Date().toISOString(),
                    difficulty: room.difficulty,
                    completionTimeMs: data.finalTime * 1000,
                    strikes: data.strikes,
                    playerNames: room.players.map(p => p.name),
                    defuserName: defuser?.name || 'Unknown',
                    puzzleCount: gameState.puzzles.length,
                    score: gameState.score,
                };
                const newLeaderboard = [...leaderboard, entry];
                setLeaderboard(newLeaderboard);
                localStorage.setItem('ticktickboom-leaderboard', JSON.stringify(newLeaderboard));

                // Sync with other players
                socket.emit('sync-leaderboard', { entries: newLeaderboard });
            }
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('room-updated', handleRoomUpdated);
        socket.on('game-state-updated', handleGameStateUpdated);
        socket.on('error', handleError);
        socket.on('leaderboard-synced', handleLeaderboardSynced);
        socket.on('game-over', handleGameOver);

        // Check connection state
        setIsConnected(socket.connected);

        // Load leaderboard from localStorage
        const stored = localStorage.getItem('ticktickboom-leaderboard');
        if (stored) {
            try {
                setLeaderboard(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse stored leaderboard:', e);
            }
        }

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('room-updated', handleRoomUpdated);
            socket.off('game-state-updated', handleGameStateUpdated);
            socket.off('error', handleError);
            socket.off('leaderboard-synced', handleLeaderboardSynced);
            socket.off('game-over', handleGameOver);
        };
    }, [room, leaderboard]);

    const createRoom = useCallback(async (): Promise<string | null> => {
        return new Promise((resolve) => {
            const socket = getSocket();
            socket.emit('create-room', (response) => {
                if (response.success && response.roomCode) {
                    if (response.playerId) {
                        setPlayerId(response.playerId);
                    }
                    resolve(response.roomCode);
                } else {
                    setError(response.error || 'Failed to create room');
                    resolve(null);
                }
            });
        });
    }, []);

    const joinRoom = useCallback(async (roomCode: string): Promise<boolean> => {
        return new Promise((resolve) => {
            const socket = getSocket();
            socket.emit('join-room', { roomCode }, (response) => {
                if (response.success && response.playerId) {
                    setPlayerId(response.playerId);
                    resolve(true);
                } else {
                    setError(response.error || 'Failed to join room');
                    resolve(false);
                }
            });
        });
    }, []);

    const leaveRoom = useCallback(() => {
        const socket = getSocket();
        socket.emit('leave-room');
        setRoom(null);
        setGameState(null);
        setPlayerId(null);
    }, []);

    const setName = useCallback((name: string) => {
        const socket = getSocket();
        socket.emit('set-name', { name });
    }, []);

    const setRole = useCallback((role: 'defuser' | 'reader') => {
        const socket = getSocket();
        socket.emit('set-role', { role });
    }, []);

    const toggleReady = useCallback(() => {
        const socket = getSocket();
        socket.emit('toggle-ready');
    }, []);

    const setDifficulty = useCallback((difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'test' | 'defeat-test') => {
        const socket = getSocket();
        socket.emit('set-difficulty', { difficulty });
    }, []);

    const startGame = useCallback(() => {
        const socket = getSocket();
        socket.emit('start-game');
    }, []);

    const submitPuzzleAction = useCallback(async (puzzleId: string, action: unknown): Promise<{ success: boolean; correct?: boolean }> => {
        return new Promise((resolve) => {
            const socket = getSocket();
            socket.emit('puzzle-action', { puzzleId, action }, (response) => {
                resolve(response);
            });
        });
    }, []);

    const requestTakeover = useCallback(() => {
        const socket = getSocket();
        socket.emit('request-takeover');
    }, []);

    const playAgain = useCallback(() => {
        const socket = getSocket();
        socket.emit('play-again');
    }, []);

    const syncLeaderboard = useCallback(() => {
        const socket = getSocket();
        socket.emit('sync-leaderboard', { entries: leaderboard });
    }, [leaderboard]);

    const skipPuzzle = useCallback(async (): Promise<boolean> => {
        return new Promise((resolve) => {
            const socket = getSocket();
            socket.emit('skip-puzzle', (response) => {
                resolve(response.success);
            });
        });
    }, []);

    // Get puzzle solution (test mode only) - for automated testing
    const getPuzzleSolution = useCallback(async () => {
        return new Promise((resolve) => {
            const socket = getSocket();
            socket.emit('get-puzzle-solution', (response) => {
                resolve(response);
            });
        });
    }, []);

    return {
        room,
        gameState,
        playerId,
        leaderboard,
        isConnected,
        error,
        createRoom,
        joinRoom,
        leaveRoom,
        setName,
        setRole,
        toggleReady,
        setDifficulty,
        startGame,
        submitPuzzleAction,
        requestTakeover,
        playAgain,
        syncLeaderboard,
        skipPuzzle,
        getPuzzleSolution,
    };
}
