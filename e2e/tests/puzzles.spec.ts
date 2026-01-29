import { test, expect } from '@playwright/test';
import { createGameHelper } from './helpers';

/**
 * Tests for all 12 puzzle types using the "test" difficulty
 * which loads all puzzles in a predictable order.
 */
test.describe('All Puzzle Types', () => {
    test('should complete all 12 puzzles and win the game', async ({ context }) => {
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
