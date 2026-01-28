import { test, expect } from '@playwright/test';
import { createGameHelper } from './helpers';

/**
 * Tests for all 12 puzzle types using the "test" difficulty
 * which loads all puzzles in a predictable order.
 */
test.describe('All Puzzle Types', () => {
    test('should complete all 12 puzzles and win the game', async ({ context }) => {
        const helper = createGameHelper(context, true); // testMode=true

        // Create defuser and reader
        const defuser = await helper.createDefuser('TestDefuser');
        const reader = await helper.createReader(1, 'TestReader');

        // Create room and have reader join
        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        // Set roles
        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');

        // Set test difficulty (all 12 puzzles, 10 min)
        await helper.setDifficulty(defuser, 'test');

        // Both ready up
        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);

        // Start game
        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        // Track puzzle types encountered for verification
        const seenPuzzleTypes: string[] = [];

        // Test difficulty has 12 puzzles in fixed order:
        // 1. wire-array, 2. button-matrix, 3. keypad-cipher, 4. indicator-lights,
        // 5. frequency-tuner, 6. simon-signals, 7. sequence-memory, 8. countdown-override,
        // 9. capacitor-bank, 10. pressure-equalizer, 11. maze-navigator, 12. mechanical-switches
        for (let i = 0; i < 12; i++) {
            // Check if game over screen is visible (shouldn't be yet)
            const gameOverVisible = await defuser.page.locator('[data-testid="gameover-screen"]').isVisible();
            if (gameOverVisible) {
                console.log(`Game ended early at puzzle ${i}`);
                break;
            }

            // Wait for puzzle panel to be visible with valid test ID
            await defuser.page.waitForSelector('.puzzle-panel[data-testid^="puzzle-"]', { timeout: 15000 });

            const puzzleType = await helper.getCurrentPuzzleType(defuser);
            expect(puzzleType).toBeTruthy();
            seenPuzzleTypes.push(puzzleType);
            console.log(`Puzzle ${i + 1}: ${puzzleType}`);

            // Skip the puzzle using test mode (this auto-completes it)
            await helper.skipPuzzle(defuser);
            // Wait a bit longer for socket events to process
            await defuser.page.waitForTimeout(500);

            // Wait for puzzle to change (or game to end on last puzzle)
            if (i < 11) {
                // Wait for React to re-render with new puzzle
                const changed = await defuser.page.waitForFunction(
                    (prevType: string) => {
                        const panel = document.querySelector('.puzzle-panel');
                        const gameOver = document.querySelector('[data-testid="gameover-screen"]');
                        if (gameOver) return true;
                        if (!panel) return false; // Panel removed
                        const currentTestId = panel.getAttribute('data-testid');
                        // Debug: log current state
                        console.log(`Waiting: prev=${prevType}, current=${currentTestId}`);
                        return currentTestId !== `puzzle-${prevType}`;
                    },
                    puzzleType,
                    { timeout: 15000, polling: 250 }
                ).then(() => true).catch(() => false);

                if (!changed) {
                    console.log(`Puzzle change FAILED at ${i + 1}: stuck on ${puzzleType}`);
                    // Get debug info about game state
                    const debugInfo = await defuser.page.evaluate(() => {
                        const panel = document.querySelector('.puzzle-panel');
                        const defuserScreen = document.querySelector('[data-testid="defuser-screen"]');
                        const gameOverScreen = document.querySelector('[data-testid="gameover-screen"]');
                        const lobbyScreen = document.querySelector('[data-testid="lobby-screen"]');
                        return {
                            panelExists: !!panel,
                            testId: panel?.getAttribute('data-testid'),
                            defuserScreenExists: !!defuserScreen,
                            gameOverExists: !!gameOverScreen,
                            lobbyExists: !!lobbyScreen,
                            bodyHTML: document.body.innerHTML.substring(0, 500)
                        };
                    });
                    console.log('Debug info:', JSON.stringify(debugInfo, null, 2));
                }
                expect(changed).toBe(true);
            }
        }

        // Verify we saw all 12 different puzzle types
        expect(seenPuzzleTypes.length).toBe(12);
        const uniquePuzzles = new Set(seenPuzzleTypes);
        expect(uniquePuzzles.size).toBe(12);

        // Wait for victory screen
        const result = await helper.waitForGameOver(defuser);
        expect(result).toBe('victory');

        // Verify victory screen elements
        await expect(defuser.page.locator('.gameover-screen')).toContainText('BOMB DEFUSED');

        await helper.cleanup();
    });

    test('should display each puzzle type correctly', async ({ context }) => {
        const helper = createGameHelper(context, true); // testMode=true

        const defuser = await helper.createDefuser('PuzzleDisplayTest');
        const reader = await helper.createReader(1, 'Reader1');

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'test');

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);
        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        // Expected puzzle order in test mode
        const expectedOrder = [
            'wire-array',
            'button-matrix',
            'keypad-cipher',
            'indicator-lights',
            'frequency-tuner',
            'simon-signals',
            'sequence-memory',
            'countdown-override',
            'capacitor-bank',
            'pressure-equalizer',
            'maze-navigator',
            'mechanical-switches'
        ];

        // Verify first 3 puzzles appear in correct order
        for (let i = 0; i < 3; i++) {
            const puzzleType = await helper.getCurrentPuzzleType(defuser);
            expect(puzzleType).toBe(expectedOrder[i]);

            // Verify puzzle panel is visible with correct test id
            await expect(defuser.page.getByTestId(`puzzle-${expectedOrder[i]}`)).toBeVisible();

            await helper.skipPuzzle(defuser);
            if (i < 2) {
                await helper.waitForPuzzleChange(defuser, puzzleType);
            }
        }

        await helper.cleanup();
    });
});
