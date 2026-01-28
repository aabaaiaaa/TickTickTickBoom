// ============================================
// Player & Room Types
// ============================================
export const DIFFICULTY_PRESETS = {
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
export const STANDARD_DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'];
// Test difficulties only shown in test mode
export const TEST_DIFFICULTIES = ['test', 'defeat-test',
    'test-wire-array', 'test-button-matrix', 'test-keypad-cipher', 'test-indicator-lights',
    'test-frequency-tuner', 'test-simon-signals', 'test-sequence-memory', 'test-countdown-override',
    'test-capacitor-bank', 'test-pressure-equalizer', 'test-maze-navigator', 'test-mechanical-switches'
];
// ============================================
// Utility Types
// ============================================
export function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}
export function generatePlayerId() {
    return `player-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
export function generateSerialNumber() {
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
