import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * TestBoardBed-style test helpers for multi-player testing.
 * 
 * The game uses URL parameters to identify players in TestBoardBed:
 * - ?sharedDeviceId=shared - For the defuser view
 * - ?playerDeviceId=player-N - For reader views
 * - ?testMode=true - Enables test difficulties in lobby
 */

const BASE_URL = 'http://localhost:5175';

export interface TestPlayer {
    page: Page;
    name: string;
    role: 'defuser' | 'reader';
}

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'test' | 'defeat-test'
    | 'test-wire-array' | 'test-button-matrix' | 'test-keypad-cipher' | 'test-indicator-lights'
    | 'test-frequency-tuner' | 'test-simon-signals' | 'test-sequence-memory' | 'test-countdown-override'
    | 'test-capacitor-bank' | 'test-pressure-equalizer' | 'test-maze-navigator' | 'test-mechanical-switches';

export class GameTestHelper {
    private context: BrowserContext;
    private players: Map<string, TestPlayer> = new Map();
    private testMode: boolean;

    constructor(context: BrowserContext, testMode: boolean = false) {
        this.context = context;
        this.testMode = testMode;
    }

    /**
     * Create a defuser player (uses sharedDeviceId for TestBoardBed)
     */
    async createDefuser(name: string = 'Defuser'): Promise<TestPlayer> {
        const page = await this.context.newPage();
        const url = this.testMode
            ? `${BASE_URL}?sharedDeviceId=shared&testMode=true`
            : `${BASE_URL}?sharedDeviceId=shared`;
        await page.goto(url);
        const player: TestPlayer = { page, name, role: 'defuser' };
        this.players.set('defuser', player);
        return player;
    }

    /**
     * Create a reader player (uses playerDeviceId for TestBoardBed)
     */
    async createReader(playerNum: number, name?: string): Promise<TestPlayer> {
        const page = await this.context.newPage();
        const url = this.testMode
            ? `${BASE_URL}?playerDeviceId=player-${playerNum}&testMode=true`
            : `${BASE_URL}?playerDeviceId=player-${playerNum}`;
        await page.goto(url);
        const playerName = name || `Reader${playerNum}`;
        const player: TestPlayer = { page, name: playerName, role: 'reader' };
        this.players.set(`reader-${playerNum}`, player);
        return player;
    }

    /**
     * Create a room with the defuser
     */
    async createRoom(defuser: TestPlayer): Promise<string> {
        await defuser.page.getByTestId('create-room-btn').click();

        // Wait for lobby and get room code
        await defuser.page.waitForSelector('[data-testid="lobby-screen"]');
        const roomCode = await defuser.page.getByTestId('room-code').textContent();

        if (!roomCode) {
            throw new Error('Failed to get room code');
        }

        return roomCode;
    }

    /**
     * Join a room with a reader
     */
    async joinRoom(reader: TestPlayer, roomCode: string): Promise<void> {
        await reader.page.getByTestId('join-code-input').fill(roomCode);
        await reader.page.getByTestId('join-room-btn').click();
        await reader.page.waitForSelector('[data-testid="lobby-screen"]');
    }

    /**
     * Set player name in lobby
     */
    async setPlayerName(player: TestPlayer, name: string): Promise<void> {
        // Click edit button to enable name editing
        await player.page.getByTestId('edit-name-btn').click();
        const nameInput = player.page.getByTestId('name-input');
        await nameInput.clear();
        await nameInput.fill(name);
        // Click save or press Enter
        await player.page.keyboard.press('Enter');
    }

    /**
     * Set role in lobby
     */
    async setRole(player: TestPlayer, role: 'defuser' | 'reader'): Promise<void> {
        await player.page.getByTestId(`role-${role}`).click();
    }

    /**
     * Toggle ready state
     */
    async toggleReady(player: TestPlayer): Promise<void> {
        await player.page.getByTestId('ready-btn').click();
    }

    /**
     * Set difficulty (only available to room creator)
     */
    async setDifficulty(player: TestPlayer, difficulty: Difficulty): Promise<void> {
        await player.page.getByTestId(`difficulty-${difficulty}`).click();
    }

    /**
     * Start the game (only available to room creator when all ready)
     */
    async startGame(player: TestPlayer): Promise<void> {
        const startBtn = player.page.getByTestId('start-game-btn');
        // Wait for button to be enabled
        await startBtn.waitFor({ state: 'visible' });
        await expect(startBtn).toBeEnabled({ timeout: 10000 });
        await startBtn.click();
    }

    /**
     * Wait for game screen to load
     */
    async waitForGameStart(player: TestPlayer): Promise<void> {
        if (player.role === 'defuser') {
            await player.page.waitForSelector('[data-testid="defuser-screen"]', { timeout: 15000 });
        } else {
            await player.page.waitForSelector('[data-testid="reader-screen"]', { timeout: 15000 });
        }
    }

    /**
     * Skip the current puzzle (test mode only)
     */
    async skipPuzzle(player: TestPlayer): Promise<void> {
        await player.page.getByTestId('skip-puzzle-btn').click();
        // Wait a moment for the puzzle to be skipped and UI to update
        await player.page.waitForTimeout(200);
    }

    /**
     * Get current timer value
     */
    async getTimer(player: TestPlayer): Promise<string> {
        return await player.page.getByTestId('timer').textContent() || '';
    }

    /**
     * Get current strikes
     */
    async getStrikes(player: TestPlayer): Promise<number> {
        const strikeIndicator = player.page.getByTestId('strike-indicator');
        const activeStrikes = await strikeIndicator.locator('.strike-light.active').count();
        return activeStrikes;
    }

    // ============================================
    // Puzzle Interaction Methods
    // ============================================

    /**
     * Get current puzzle type from the puzzle panel.
     * Returns empty string if no puzzle panel is visible (e.g., game over).
     */
    async getCurrentPuzzleType(player: TestPlayer): Promise<string> {
        const puzzlePanel = player.page.locator('.puzzle-panel');
        const isVisible = await puzzlePanel.isVisible().catch(() => false);
        if (!isVisible) {
            return '';
        }
        const testId = await puzzlePanel.getAttribute('data-testid', { timeout: 5000 }).catch(() => null);
        // testid format: "puzzle-wire-array" -> "wire-array"
        return testId?.replace('puzzle-', '') || '';
    }

    /**
     * Wire Array: Cut a wire by index
     */
    async cutWire(player: TestPlayer, index: number): Promise<void> {
        await player.page.getByTestId(`wire-${index}`).click();
    }

    /**
     * Button Matrix: Click a button by row and column
     */
    async clickMatrixButton(player: TestPlayer, row: number, col: number): Promise<void> {
        await player.page.getByTestId(`button-${row}-${col}`).click();
    }

    /**
     * Keypad Cipher: Press a key by row and column
     */
    async pressKeypadKey(player: TestPlayer, row: number, col: number): Promise<void> {
        await player.page.getByTestId(`key-${row}-${col}`).click();
    }

    /**
     * Countdown Override: Submit an answer
     */
    async submitCountdownAnswer(player: TestPlayer, answer: string): Promise<void> {
        await player.page.getByTestId('answer-input').fill(answer);
        await player.page.getByTestId('submit-answer-btn').click();
    }

    /**
     * Frequency Tuner: Click transmit button
     */
    async submitFrequency(player: TestPlayer): Promise<void> {
        await player.page.getByTestId('transmit-btn').click();
    }

    /**
     * Simon Signals: Press a color button
     */
    async pressSimonColor(player: TestPlayer, color: 'red' | 'blue' | 'green' | 'yellow'): Promise<void> {
        await player.page.getByTestId(`simon-${color}`).click();
    }

    /**
     * Sequence Memory: Press a memory button (1-indexed)
     */
    async pressMemoryButton(player: TestPlayer, buttonNum: number): Promise<void> {
        await player.page.getByTestId(`memory-btn-${buttonNum}`).click();
    }

    /**
     * Indicator Lights: Click an indicator and verify
     */
    async clickIndicator(player: TestPlayer, index: number): Promise<void> {
        await player.page.getByTestId(`indicator-${index}`).click();
    }

    async verifyIndicators(player: TestPlayer): Promise<void> {
        await player.page.getByTestId('verify-btn').click();
    }

    /**
     * Capacitor Bank: Adjust a capacitor and discharge
     */
    async clickCapacitor(player: TestPlayer, index: number): Promise<void> {
        await player.page.getByTestId(`capacitor-${index}`).click();
    }

    async dischargeCapacitors(player: TestPlayer): Promise<void> {
        await player.page.getByTestId('discharge-btn').click();
    }

    /**
     * Pressure Equalizer: Click slider and confirm
     */
    async clickSlider(player: TestPlayer, index: number): Promise<void> {
        await player.page.getByTestId(`slider-${index}`).click();
    }

    async confirmPressure(player: TestPlayer): Promise<void> {
        await player.page.getByTestId('confirm-pressure-btn').click();
    }

    /**
     * Maze Navigator: Move in a direction
     */
    async moveInMaze(player: TestPlayer, direction: 'up' | 'down' | 'left' | 'right'): Promise<void> {
        await player.page.getByTestId(`move-${direction}`).click();
    }

    /**
     * Mechanical Switches: Toggle a switch and confirm
     */
    async toggleSwitch(player: TestPlayer, index: number): Promise<void> {
        await player.page.getByTestId(`switch-${index}`).click();
    }

    async confirmSwitches(player: TestPlayer): Promise<void> {
        await player.page.getByTestId('confirm-switches-btn').click();
    }

    // ============================================
    // Game End & Flow Methods
    // ============================================

    /**
     * Wait for game over screen to appear
     */
    async waitForGameOver(player: TestPlayer, timeout: number = 30000): Promise<'victory' | 'defeat'> {
        await player.page.waitForSelector('[data-testid="gameover-screen"]', { timeout });
        const hasVictory = await player.page.locator('.gameover-screen.victory').isVisible().catch(() => false);
        return hasVictory ? 'victory' : 'defeat';
    }

    /**
     * Click play again button
     */
    async clickPlayAgain(player: TestPlayer): Promise<void> {
        await player.page.getByTestId('play-again-btn').click();
        await player.page.waitForSelector('[data-testid="lobby-screen"]');
    }

    /**
     * Click leave room button from game over screen
     */
    async clickLeaveRoom(player: TestPlayer): Promise<void> {
        await player.page.getByTestId('leave-btn').click();
        await player.page.waitForSelector('[data-testid="home-screen"]');
    }

    /**
     * Wait for puzzle to change or game to end
     */
    async waitForPuzzleChange(player: TestPlayer, currentType: string, timeout: number = 10000): Promise<boolean> {
        try {
            await player.page.waitForFunction(
                (puzzleType) => {
                    const puzzlePanel = document.querySelector('.puzzle-panel');
                    const gameOver = document.querySelector('[data-testid="gameover-screen"]');
                    if (gameOver) return true;
                    if (!puzzlePanel) return false;
                    const currentTestId = puzzlePanel.getAttribute('data-testid');
                    return currentTestId !== `puzzle-${puzzleType}`;
                },
                currentType,
                { timeout }
            );
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get puzzle progress info
     */
    async getPuzzleProgress(player: TestPlayer): Promise<{ current: number; total: number; completed: number }> {
        const progressText = await player.page.locator('.progress-info').textContent() || '';
        const currentMatch = progressText.match(/Module (\d+) of (\d+)/);
        const completedMatch = progressText.match(/(\d+) completed/);
        return {
            current: currentMatch ? parseInt(currentMatch[1]) : 0,
            total: currentMatch ? parseInt(currentMatch[2]) : 0,
            completed: completedMatch ? parseInt(completedMatch[1]) : 0,
        };
    }

    /**
     * Clean up all pages
     */
    async cleanup(): Promise<void> {
        for (const player of this.players.values()) {
            await player.page.close();
        }
        this.players.clear();
    }
}

/**
 * Create a fresh game helper for each test
 */
export function createGameHelper(context: BrowserContext, testMode: boolean = false): GameTestHelper {
    return new GameTestHelper(context, testMode);
}
