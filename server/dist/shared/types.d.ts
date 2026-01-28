export type PlayerRole = 'defuser' | 'reader';
export interface Player {
    id: string;
    socketId: string;
    name: string;
    role: PlayerRole;
    isReady: boolean;
    isConnected: boolean;
}
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'test' | 'defeat-test' | 'test-wire-array' | 'test-button-matrix' | 'test-keypad-cipher' | 'test-indicator-lights' | 'test-frequency-tuner' | 'test-simon-signals' | 'test-sequence-memory' | 'test-countdown-override' | 'test-capacitor-bank' | 'test-pressure-equalizer' | 'test-maze-navigator' | 'test-mechanical-switches';
export interface DifficultySettings {
    puzzleCount: number;
    timeSeconds: number;
    label: string;
}
export declare const DIFFICULTY_PRESETS: Record<Difficulty, DifficultySettings>;
export declare const STANDARD_DIFFICULTIES: Difficulty[];
export declare const TEST_DIFFICULTIES: Difficulty[];
export type RoomPhase = 'lobby' | 'playing' | 'paused' | 'victory' | 'defeat';
export interface Room {
    code: string;
    players: Player[];
    difficulty: Difficulty;
    phase: RoomPhase;
    hostId: string;
    gameState: GameState | null;
}
export interface GameState {
    timeRemaining: number;
    strikes: number;
    maxStrikes: number;
    puzzles: PuzzleInstance[];
    currentPuzzleIndex: number;
    completedCount: number;
    serialNumber: string;
    indicators: IndicatorState[];
    result?: 'victory' | 'defeat';
    score: number;
}
export interface IndicatorState {
    label: string;
    isLit: boolean;
    isFlickering?: boolean;
    color: 'red' | 'green' | 'blue' | 'white' | 'yellow';
}
export type PuzzleType = 'wire-array' | 'button-matrix' | 'keypad-cipher' | 'indicator-lights' | 'frequency-tuner' | 'simon-signals' | 'sequence-memory' | 'countdown-override' | 'capacitor-bank' | 'pressure-equalizer' | 'maze-navigator' | 'mechanical-switches';
export interface PuzzleInstance {
    id: string;
    type: PuzzleType;
    defuserView: unknown;
    solution?: unknown;
    isCompleted: boolean;
    attempts: number;
}
export type Puzzle = PuzzleInstance;
export type PuzzleAction = Record<string, unknown>;
export type GameIndicator = IndicatorState;
export interface ClientToServerEvents {
    'create-room': (callback: (response: {
        success: boolean;
        roomCode?: string;
        playerId?: string;
        error?: string;
    }) => void) => void;
    'join-room': (data: {
        roomCode: string;
    }, callback: (response: {
        success: boolean;
        room?: Room;
        playerId?: string;
        error?: string;
    }) => void) => void;
    'leave-room': () => void;
    'set-name': (data: {
        name: string;
    }) => void;
    'set-role': (data: {
        role: PlayerRole;
    }) => void;
    'toggle-ready': () => void;
    'set-difficulty': (data: {
        difficulty: Difficulty;
    }) => void;
    'start-game': () => void;
    'puzzle-action': (data: {
        puzzleId: string;
        action: unknown;
    }, callback: (response: {
        success: boolean;
        correct?: boolean;
        error?: string;
    }) => void) => void;
    'request-takeover': () => void;
    'sync-leaderboard': (data: {
        entries: LeaderboardEntry[];
    }) => void;
    'play-again': () => void;
    'skip-puzzle': (callback: (response: {
        success: boolean;
        error?: string;
    }) => void) => void;
    'get-puzzle-solution': (callback: (response: PuzzleSolutionResponse) => void) => void;
}
export interface PuzzleSolutionResponse {
    success: boolean;
    error?: string;
    puzzleType?: PuzzleType;
    solution?: unknown;
    defuserView?: unknown;
    serialNumber?: string;
    indicators?: IndicatorState[];
    strikes?: number;
}
export interface ServerToClientEvents {
    'room-updated': (room: Room) => void;
    'game-state-updated': (gameState: GameState) => void;
    'puzzle-result': (data: {
        puzzleId: string;
        correct: boolean;
        newStrikes?: number;
    }) => void;
    'game-over': (data: {
        victory: boolean;
        finalTime: number;
        strikes: number;
    }) => void;
    'defuser-disconnected': () => void;
    'takeover-available': (data: {
        previousDefuser: string;
    }) => void;
    'leaderboard-synced': (entries: LeaderboardEntry[]) => void;
    'error': (message: string) => void;
}
export interface LeaderboardEntry {
    id: string;
    date: string;
    difficulty: Difficulty;
    completionTimeMs: number;
    strikes: number;
    playerNames: string[];
    defuserName: string;
    puzzleCount: number;
    score: number;
}
export declare function generateRoomCode(): string;
export declare function generatePlayerId(): string;
export declare function generateSerialNumber(): string;
