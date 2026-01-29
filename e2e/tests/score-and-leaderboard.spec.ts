import { test, expect } from '@playwright/test';
import { createGameHelper } from './helpers';

/**
 * Tests for scoring and leaderboard functionality.
 * 
 * These tests verify that:
 * 1. Score is calculated correctly after completing puzzles
 * 2. Score is displayed on the game over screen
 * 3. Leaderboard entries are created on victory
 * 4. Leaderboard is populated with correct data
 * 5. Leaderboard persists across games
 */
test.describe('Scoring System', () => {
    test('should display score on victory screen', async ({ context }) => {
        const helper = createGameHelper(context, true);

        const defuser = await helper.createDefuser('ScoreTest');
        const reader = await helper.createReader(1, 'Reader1');

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'defeat-test');

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);
        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        // Skip the puzzle to win
        await helper.skipPuzzle(defuser);

        const result = await helper.waitForGameOver(defuser);
        expect(result).toBe('victory');

        // Verify the final score section is visible on victory
        const scoreSection = defuser.page.locator('.score-display');
        await expect(scoreSection).toBeVisible();

        // Score should be displayed (even if 0, it should be visible)
        const scoreValue = defuser.page.locator('.score-value');
        await expect(scoreValue).toBeVisible();

        await helper.cleanup();
    });

    test('should show game stats on victory screen', async ({ context }) => {
        const helper = createGameHelper(context, true);

        const defuser = await helper.createDefuser('StatsTest');
        const reader = await helper.createReader(1, 'Reader1');

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'defeat-test');

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);
        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        await helper.skipPuzzle(defuser);
        await helper.waitForGameOver(defuser);

        // Verify stats panel is visible
        const statsPanel = defuser.page.locator('.stats-panel');
        await expect(statsPanel).toBeVisible();

        // Verify individual stats are displayed
        await expect(defuser.page.locator('.stat-item').filter({ hasText: 'Puzzles Solved' })).toBeVisible();
        await expect(defuser.page.locator('.stat-item').filter({ hasText: 'Time Used' })).toBeVisible();
        await expect(defuser.page.locator('.stat-item').filter({ hasText: 'Strikes' })).toBeVisible();
        await expect(defuser.page.locator('.stat-item').filter({ hasText: 'Difficulty' })).toBeVisible();

        await helper.cleanup();
    });

    test('should display puzzles solved count correctly', async ({ context }) => {
        const helper = createGameHelper(context, true);

        const defuser = await helper.createDefuser('PuzzleCountTest');
        const reader = await helper.createReader(1, 'Reader1');

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'defeat-test'); // 1 puzzle

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);
        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        await helper.skipPuzzle(defuser);
        await helper.waitForGameOver(defuser);

        // For defeat-test, there's 1 puzzle, and we completed 1
        const puzzleSolvedStat = defuser.page.locator('.stat-item').filter({ hasText: 'Puzzles Solved' });
        await expect(puzzleSolvedStat).toContainText('1 / 1');

        await helper.cleanup();
    });

    test('should not show final score section on defeat', async ({ context }) => {
        const helper = createGameHelper(context, true);

        const defuser = await helper.createDefuser('DefeatScoreTest');
        const reader = await helper.createReader(1, 'Reader1');

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'defeat-test');

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);
        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        // Don't solve - let timer run out
        const result = await helper.waitForGameOver(defuser, 10000);
        expect(result).toBe('defeat');

        // The "Final Score" section should NOT be visible on defeat
        // (based on GameOver.tsx: {isVictory && (...score-display...)})
        const scoreSection = defuser.page.locator('.score-display');
        await expect(scoreSection).not.toBeVisible();

        await helper.cleanup();
    });
});

test.describe('Leaderboard', () => {
    test('should display leaderboard panel on game over screen', async ({ context }) => {
        const helper = createGameHelper(context, true);

        const defuser = await helper.createDefuser('LeaderboardVisibility');
        const reader = await helper.createReader(1, 'Reader1');

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'defeat-test');

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);
        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        await helper.skipPuzzle(defuser);
        await helper.waitForGameOver(defuser);

        // Verify leaderboard is visible
        const leaderboard = defuser.page.getByTestId('leaderboard');
        await expect(leaderboard).toBeVisible();

        // Verify leaderboard has the title
        await expect(leaderboard).toContainText('Leaderboard');

        await helper.cleanup();
    });

    test('should add entry to leaderboard after victory', async ({ context }) => {
        const helper = createGameHelper(context, true);

        const defuserName = 'LeaderboardEntry';
        const defuser = await helper.createDefuser(defuserName);
        const reader = await helper.createReader(1, 'Reader1');

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        // Set player name
        await helper.setPlayerName(defuser, defuserName);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'defeat-test');

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);
        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        await helper.skipPuzzle(defuser);
        await helper.waitForGameOver(defuser);

        // Wait a moment for leaderboard to update
        await defuser.page.waitForTimeout(500);

        // Check that there's at least one entry in the leaderboard
        const leaderboard = defuser.page.getByTestId('leaderboard');
        const entries = leaderboard.locator('.leaderboard-entry');

        // Should have at least one entry
        const entryCount = await entries.count();
        expect(entryCount).toBeGreaterThanOrEqual(1);

        await helper.cleanup();
    });

    test('should display correct defuser name in leaderboard entry', async ({ context }) => {
        const helper = createGameHelper(context, true);

        const defuserName = 'TestDefuser123';
        const defuser = await helper.createDefuser(defuserName);
        const reader = await helper.createReader(1, 'Reader1');

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        // Set player name
        await helper.setPlayerName(defuser, defuserName);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'defeat-test');

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);
        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        await helper.skipPuzzle(defuser);
        await helper.waitForGameOver(defuser);

        // Wait for leaderboard to update
        await defuser.page.waitForTimeout(500);

        // Check that the defuser name appears in the leaderboard
        const leaderboard = defuser.page.getByTestId('leaderboard');
        await expect(leaderboard).toContainText(defuserName);

        await helper.cleanup();
    });

    test('should display difficulty in leaderboard entry', async ({ context }) => {
        const helper = createGameHelper(context, true);

        const defuser = await helper.createDefuser('DifficultyTest');
        const reader = await helper.createReader(1, 'Reader1');

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'defeat-test');

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);
        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        await helper.skipPuzzle(defuser);
        await helper.waitForGameOver(defuser);

        await defuser.page.waitForTimeout(500);

        // The entry should show the difficulty
        const leaderboard = defuser.page.getByTestId('leaderboard');
        await expect(leaderboard).toContainText('defeat-test');

        await helper.cleanup();
    });

    test('should display puzzle count in leaderboard entry', async ({ context }) => {
        const helper = createGameHelper(context, true);

        const defuser = await helper.createDefuser('PuzzleCountEntry');
        const reader = await helper.createReader(1, 'Reader1');

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'defeat-test'); // 1 puzzle

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);
        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        await helper.skipPuzzle(defuser);
        await helper.waitForGameOver(defuser);

        // Wait for leaderboard to populate
        await defuser.page.waitForTimeout(1500);

        // First verify there's an entry by waiting for it
        const leaderboard = defuser.page.getByTestId('leaderboard');
        const entries = leaderboard.locator('.leaderboard-entry');

        // Wait for entries to appear
        await expect(entries.first()).toBeVisible({ timeout: 5000 });
        const entryCount = await entries.count();
        expect(entryCount).toBeGreaterThan(0);

        // Entry should show "1 puzzle" or "1 puzzles"
        await expect(leaderboard).toContainText(/1 puzzles?/);

        await helper.cleanup();
    });

    test('should display score in leaderboard entry', async ({ context }) => {
        const helper = createGameHelper(context, true);

        const defuser = await helper.createDefuser('ScoreEntry');
        const reader = await helper.createReader(1, 'Reader1');

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'defeat-test');

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);
        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        await helper.skipPuzzle(defuser);
        await helper.waitForGameOver(defuser);

        // Wait for leaderboard to update (it needs time to sync)
        await defuser.page.waitForTimeout(1000);

        // First check if there are any entries
        const leaderboard = defuser.page.getByTestId('leaderboard');
        const entries = leaderboard.locator('.leaderboard-entry');
        const entryCount = await entries.count();

        // If no entries, the test documents that leaderboard isn't being populated
        expect(entryCount).toBeGreaterThan(0);

        // There should be a score visible in the entry
        const scoreElement = leaderboard.locator('.entry-score').first();
        await expect(scoreElement).toBeVisible();

        // The score should be a number
        const scoreText = await scoreElement.textContent();
        expect(scoreText).not.toBeNull();
        expect(scoreText).toMatch(/^\d+$/);

        await helper.cleanup();
    });

    test('should not add leaderboard entry on defeat', async ({ context }) => {
        const helper = createGameHelper(context, true);

        // Clear any existing leaderboard entries by using a fresh context
        const defuser = await helper.createDefuser('NoDefeatEntry');
        const reader = await helper.createReader(1, 'Reader1');

        // Clear localStorage before the test
        await defuser.page.evaluate(() => {
            localStorage.removeItem('ticktickboom-leaderboard');
        });
        await defuser.page.reload();
        await defuser.page.waitForTimeout(500);

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'defeat-test');

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);
        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        // Let the game time out
        const result = await helper.waitForGameOver(defuser, 10000);
        expect(result).toBe('defeat');

        await defuser.page.waitForTimeout(500);

        // The leaderboard should show "No entries yet"
        const leaderboard = defuser.page.getByTestId('leaderboard');
        await expect(leaderboard).toContainText('No entries yet');

        await helper.cleanup();
    });

    test('should persist leaderboard entries across games', async ({ context }) => {
        const helper = createGameHelper(context, true);

        const defuserName = 'PersistTest';
        const defuser = await helper.createDefuser(defuserName);
        const reader = await helper.createReader(1, 'Reader1');

        // Clear localStorage before the test
        await defuser.page.evaluate(() => {
            localStorage.removeItem('ticktickboom-leaderboard');
        });

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        await helper.setPlayerName(defuser, defuserName);
        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'defeat-test');

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);
        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        await helper.skipPuzzle(defuser);
        await helper.waitForGameOver(defuser);

        // Wait for leaderboard to populate
        await defuser.page.waitForTimeout(1500);

        // Verify first entry exists
        let leaderboard = defuser.page.getByTestId('leaderboard');
        let entries = leaderboard.locator('.leaderboard-entry');

        // Wait for entries to appear (with retry)
        await expect(entries.first()).toBeVisible({ timeout: 5000 });
        const firstEntryCount = await entries.count();
        expect(firstEntryCount).toBeGreaterThanOrEqual(1);

        // Play again
        await helper.clickPlayAgain(defuser);

        // Start another game
        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);
        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        await helper.skipPuzzle(defuser);
        await helper.waitForGameOver(defuser);

        // Wait for leaderboard to update
        await defuser.page.waitForTimeout(1500);

        // Should have more entries than before
        leaderboard = defuser.page.getByTestId('leaderboard');
        entries = leaderboard.locator('.leaderboard-entry');
        const secondEntryCount = await entries.count();
        expect(secondEntryCount).toBeGreaterThan(firstEntryCount);

        await helper.cleanup();
    });

    test('should show leaderboard to both defuser and reader on game over', async ({ context }) => {
        const helper = createGameHelper(context, true);

        const defuser = await helper.createDefuser('BothPlayersLeaderboard');
        const reader = await helper.createReader(1, 'Reader1');

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'defeat-test');

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);
        await helper.startGame(defuser);

        await helper.waitForGameStart(defuser);
        await helper.waitForGameStart(reader);

        await helper.skipPuzzle(defuser);

        await helper.waitForGameOver(defuser);
        await helper.waitForGameOver(reader);

        // Both players should see the leaderboard
        const defuserLeaderboard = defuser.page.getByTestId('leaderboard');
        const readerLeaderboard = reader.page.getByTestId('leaderboard');

        await expect(defuserLeaderboard).toBeVisible();
        await expect(readerLeaderboard).toBeVisible();

        await helper.cleanup();
    });
});

test.describe('Score Calculation', () => {
    test('should have non-zero score after completing puzzles without strikes', async ({ context }) => {
        const helper = createGameHelper(context, true);

        const defuser = await helper.createDefuser('NonZeroScore');
        const reader = await helper.createReader(1, 'Reader1');

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        // Use 'test' difficulty which allows skipping (test-wire-array doesn't)
        await helper.setDifficulty(defuser, 'defeat-test');

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);
        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        // Skip the puzzle
        await helper.skipPuzzle(defuser);
        await helper.waitForGameOver(defuser);

        // Check the displayed score
        const scoreValue = defuser.page.locator('.score-value');
        const scoreText = await scoreValue.textContent();

        // Score should be displayed
        expect(scoreText).not.toBeNull();

        // NOTE: This test documents the current behavior.
        // If score is always 0, this test will help identify the issue.
        // The score should ideally be > 0 for a successful completion.
        console.log(`Final score displayed: ${scoreText}`);

        await helper.cleanup();
    });

    /**
     * Verify that score is greater than zero on victory.
     */
    test('score should be greater than zero on victory', async ({ context }) => {
        // This test specifically checks for the reported bug: score is always 0
        const helper = createGameHelper(context, true);

        const defuser = await helper.createDefuser('ZeroScoreBug');
        const reader = await helper.createReader(1, 'Reader1');

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'defeat-test');

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);
        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        await helper.skipPuzzle(defuser);
        await helper.waitForGameOver(defuser);

        // Check the score value
        const scoreValue = defuser.page.locator('.score-value');
        const scoreText = await scoreValue.textContent();

        // This assertion documents the expected behavior:
        // Score SHOULD be greater than 0 for a victory
        // If this test fails with score = 0, the bug is confirmed
        const score = parseInt(scoreText || '0', 10);
        expect(score).toBeGreaterThan(0);

        await helper.cleanup();
    });

    test('should show score in game stats with correct format', async ({ context }) => {
        const helper = createGameHelper(context, true);

        const defuser = await helper.createDefuser('ScoreFormat');
        const reader = await helper.createReader(1, 'Reader1');

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'defeat-test');

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);
        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        await helper.skipPuzzle(defuser);
        await helper.waitForGameOver(defuser);

        // Verify the score display structure
        const scoreDisplay = defuser.page.locator('.score-display');
        await expect(scoreDisplay).toBeVisible();

        // Should have "Final Score" heading
        await expect(scoreDisplay.locator('h3')).toContainText('Final Score');

        // Should have a numeric value
        const scoreValue = scoreDisplay.locator('.score-value');
        const text = await scoreValue.textContent();
        expect(text).toMatch(/^\d+$/);

        await helper.cleanup();
    });

    /**
     * Verify that leaderboard entries have non-zero scores.
     */
    test('leaderboard entry should have non-zero score', async ({ context }) => {
        // This test checks that the leaderboard entry has a proper score
        const helper = createGameHelper(context, true);

        const defuser = await helper.createDefuser('LeaderboardScoreBug');
        const reader = await helper.createReader(1, 'Reader1');

        // Clear localStorage before the test
        await defuser.page.evaluate(() => {
            localStorage.removeItem('ticktickboom-leaderboard');
        });

        const roomCode = await helper.createRoom(defuser);
        await helper.joinRoom(reader, roomCode);

        await helper.setRole(defuser, 'defuser');
        await helper.setRole(reader, 'reader');
        await helper.setDifficulty(defuser, 'defeat-test');

        await helper.toggleReady(defuser);
        await helper.toggleReady(reader);
        await helper.startGame(defuser);
        await helper.waitForGameStart(defuser);

        await helper.skipPuzzle(defuser);
        await helper.waitForGameOver(defuser);

        // Wait for leaderboard to populate
        await defuser.page.waitForTimeout(1000);

        // Get the leaderboard entry score
        const leaderboard = defuser.page.getByTestId('leaderboard');
        const scoreElement = leaderboard.locator('.entry-score').first();

        // First verify there's an entry
        const entries = leaderboard.locator('.leaderboard-entry');
        const entryCount = await entries.count();
        expect(entryCount).toBeGreaterThan(0);

        // Now check the score
        const scoreText = await scoreElement.textContent();
        const score = parseInt(scoreText || '0', 10);

        // The score in leaderboard should be greater than 0
        expect(score).toBeGreaterThan(0);

        await helper.cleanup();
    });
});
