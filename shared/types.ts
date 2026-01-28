// ============================================
// Player & Room Types
// ============================================

export type PlayerRole = 'defuser' | 'reader';

export interface Player {
    id: string;
    socketId: string;
    name: string;
    role: PlayerRole;
    isReady: boolean;
    isConnected: boolean;
}

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'test' | 'defeat-test'
    | 'test-wire-array' | 'test-button-matrix' | 'test-keypad-cipher' | 'test-indicator-lights'
    | 'test-frequency-tuner' | 'test-simon-signals' | 'test-sequence-memory' | 'test-countdown-override'
    | 'test-capacitor-bank' | 'test-pressure-equalizer' | 'test-maze-navigator' | 'test-mechanical-switches';

export interface DifficultySettings {
    puzzleCount: number;
    timeSeconds: number;
    label: string;
}

export const DIFFICULTY_PRESETS: Record<Difficulty, DifficultySettings> = {
    easy: { puzzleCount: 3, timeSeconds: 420, label: 'Easy (3 puzzles, 7 min)' },
    medium: { puzzleCount: 5, timeSeconds: 300, label: 'Medium (5 puzzles, 5 min)' },
    hard: { puzzleCount: 7, timeSeconds: 240, label: 'Hard (7 puzzles, 4 min)' },
    expert: { puzzleCount: 10, timeSeconds: 210, label: 'Expert (10 puzzles, 3.5 min)' },
    // Test-only difficulties (hidden in normal UI)
    'test': { puzzleCount: 12, timeSeconds: 600, label: 'Test (all 12 puzzles, 10 min)' },
    'defeat-test': { puzzleCount: 1, timeSeconds: 3, label: 'Defeat Test (1 puzzle, 3 sec)' },
    // Individual puzzle test modes - one puzzle each, 2 minutes
    'test-wire-array': { puzzleCount: 1, timeSeconds: 120, label: 'Test Wire Array' },
    'test-button-matrix': { puzzleCount: 1, timeSeconds: 120, label: 'Test Button Matrix' },
    'test-keypad-cipher': { puzzleCount: 1, timeSeconds: 120, label: 'Test Keypad Cipher' },
    'test-indicator-lights': { puzzleCount: 1, timeSeconds: 120, label: 'Test Indicator Lights' },
    'test-frequency-tuner': { puzzleCount: 1, timeSeconds: 120, label: 'Test Frequency Tuner' },
    'test-simon-signals': { puzzleCount: 1, timeSeconds: 120, label: 'Test Simon Signals' },
    'test-sequence-memory': { puzzleCount: 1, timeSeconds: 120, label: 'Test Sequence Memory' },
    'test-countdown-override': { puzzleCount: 1, timeSeconds: 120, label: 'Test Countdown Override' },
    'test-capacitor-bank': { puzzleCount: 1, timeSeconds: 120, label: 'Test Capacitor Bank' },
    'test-pressure-equalizer': { puzzleCount: 1, timeSeconds: 120, label: 'Test Pressure Equalizer' },
    'test-maze-navigator': { puzzleCount: 1, timeSeconds: 120, label: 'Test Maze Navigator' },
    'test-mechanical-switches': { puzzleCount: 1, timeSeconds: 120, label: 'Test Mechanical Switches' },
};

// Standard difficulties shown in normal gameplay
export const STANDARD_DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];
// Test difficulties only shown in test mode
export const TEST_DIFFICULTIES: Difficulty[] = ['test', 'defeat-test',
    'test-wire-array', 'test-button-matrix', 'test-keypad-cipher', 'test-indicator-lights',
    'test-frequency-tuner', 'test-simon-signals', 'test-sequence-memory', 'test-countdown-override',
    'test-capacitor-bank', 'test-pressure-equalizer', 'test-maze-navigator', 'test-mechanical-switches'
];

export type RoomPhase = 'lobby' | 'playing' | 'paused' | 'victory' | 'defeat';

export interface Room {
    code: string;
    players: Player[];
    difficulty: Difficulty;
    phase: RoomPhase;
    hostId: string;
    gameState: GameState | null;
}

// ============================================
// Game State Types
// ============================================

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

// ============================================
// Puzzle Types
// ============================================

export type PuzzleType =
    | 'wire-array'
    | 'button-matrix'
    | 'keypad-cipher'
    | 'indicator-lights'
    | 'frequency-tuner'
    | 'simon-signals'
    | 'sequence-memory'
    | 'countdown-override'
    | 'capacitor-bank'
    | 'pressure-equalizer'
    | 'maze-navigator'
    | 'mechanical-switches';

export interface PuzzleInstance {
    id: string;
    type: PuzzleType;
    defuserView: unknown; // Type varies by puzzle
    solution?: unknown; // Server-only: stores puzzle solution (not sent to client)
    isCompleted: boolean;
    attempts: number;
}

// Alias for client components - note: use defuserView for puzzle state
export type Puzzle = PuzzleInstance;
export type PuzzleAction = Record<string, unknown>;
export type GameIndicator = IndicatorState;

// ============================================
// Socket Event Types
// ============================================

// Client -> Server Events
export interface ClientToServerEvents {
    'create-room': (callback: (response: { success: boolean; roomCode?: string; playerId?: string; error?: string }) => void) => void;
    'join-room': (data: { roomCode: string }, callback: (response: { success: boolean; room?: Room; playerId?: string; error?: string }) => void) => void;
    'leave-room': () => void;
    'set-name': (data: { name: string }) => void;
    'set-role': (data: { role: PlayerRole }) => void;
    'toggle-ready': () => void;
    'set-difficulty': (data: { difficulty: Difficulty }) => void;
    'start-game': () => void;
    'puzzle-action': (data: { puzzleId: string; action: unknown }, callback: (response: { success: boolean; correct?: boolean; error?: string }) => void) => void;
    'request-takeover': () => void;
    'sync-leaderboard': (data: { entries: LeaderboardEntry[] }) => void;
    'play-again': () => void;
    // Test mode only - skip current puzzle
    'skip-puzzle': (callback: (response: { success: boolean; error?: string }) => void) => void;
    // Test mode only - get puzzle solution for automated testing
    'get-puzzle-solution': (callback: (response: PuzzleSolutionResponse) => void) => void;
}

// Response type for get-puzzle-solution
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

// Server -> Client Events
export interface ServerToClientEvents {
    'room-updated': (room: Room) => void;
    'game-state-updated': (gameState: GameState) => void;
    'puzzle-result': (data: { puzzleId: string; correct: boolean; newStrikes?: number }) => void;
    'game-over': (data: { victory: boolean; finalTime: number; strikes: number }) => void;
    'defuser-disconnected': () => void;
    'takeover-available': (data: { previousDefuser: string }) => void;
    'leaderboard-synced': (entries: LeaderboardEntry[]) => void;
    'error': (message: string) => void;
}

// ============================================
// Leaderboard Types
// ============================================

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

// ============================================
// Utility Types
// ============================================

export function generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

export function generatePlayerId(): string {
    return `player-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function generateSerialNumber(): string {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const digits = '0123456789';
    let serial = '';
    // Format: LL#-#LL (e.g., "K4N-7E2")
    serial += letters[Math.floor(Math.random() * letters.length)];
    serial += digits[Math.floor(Math.random() * digits.length)];
    serial += letters[Math.floor(Math.random() * letters.length)];
    serial += '-';
    serial += digits[Math.floor(Math.random() * digits.length)];
    serial += letters[Math.floor(Math.random() * letters.length)];
    serial += digits[Math.floor(Math.random() * digits.length)];
    return serial;
}
