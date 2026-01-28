import type { useGameState } from '../hooks/useGameState';
import { Timer } from '../components/Timer';
import { StrikeIndicator } from '../components/StrikeIndicator';
import { SerialNumber } from '../components/SerialNumber';
import { PuzzlePanel } from '../components/PuzzlePanel';
import { TakeoverModal } from '../components/TakeoverModal';
import './DefuserGame.css';

interface DefuserGameProps {
    gameState: ReturnType<typeof useGameState>;
}

export function DefuserGame({ gameState }: DefuserGameProps) {
    const { room, gameState: game } = gameState;
    const isTestMode = new URLSearchParams(window.location.search).get('testMode') === 'true';

    if (!room || !game) {
        return <div className="loading">Loading game...</div>;
    }

    const currentPuzzle = game.puzzles[game.currentPuzzleIndex];
    const isPaused = room.phase === 'paused';
    const isTestDifficulty = room.difficulty === 'test' || room.difficulty === 'defeat-test';

    return (
        <div className="defuser-screen" data-testid="defuser-screen">
            {/* Top Bar */}
            <div className="game-header">
                <div className="header-left">
                    <SerialNumber serial={game.serialNumber} />
                </div>
                <div className="header-center">
                    <Timer
                        timeRemaining={game.timeRemaining}
                        isPaused={isPaused}
                    />
                </div>
                <div className="header-right">
                    <StrikeIndicator
                        strikes={game.strikes}
                        maxStrikes={game.maxStrikes}
                    />
                </div>
            </div>

            {/* Progress Bar */}
            <div className="progress-bar">
                <div className="progress-info">
                    <span>Module {game.currentPuzzleIndex + 1} of {game.puzzles.length}</span>
                    <span>{game.completedCount} completed</span>
                </div>
                <div className="progress-track">
                    <div
                        className="progress-fill"
                        style={{ width: `${(game.completedCount / game.puzzles.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Main Puzzle Area */}
            <div className="puzzle-area">
                {currentPuzzle && !currentPuzzle.isCompleted && (
                    <PuzzlePanel
                        puzzle={currentPuzzle}
                        onAction={(action: Record<string, unknown>) => gameState.submitPuzzleAction(currentPuzzle.id, action)}
                        serialNumber={game.serialNumber}
                        indicators={game.indicators}
                    />
                )}

                {/* Test Mode Skip Button */}
                {isTestMode && isTestDifficulty && currentPuzzle && !currentPuzzle.isCompleted && (
                    <button
                        className="skip-puzzle-btn"
                        data-testid="skip-puzzle-btn"
                        onClick={() => gameState.skipPuzzle()}
                        style={{
                            marginTop: '1rem',
                            padding: '0.5rem 1rem',
                            background: '#666',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                    >
                        ⏭️ Skip Puzzle (Test Mode)
                    </button>
                )}
            </div>

            {/* Puzzle List */}
            <div className="puzzle-list">
                {game.puzzles.map((puzzle, idx) => (
                    <div
                        key={puzzle.id}
                        className={`puzzle-indicator ${puzzle.isCompleted ? 'completed' : ''} ${idx === game.currentPuzzleIndex ? 'current' : ''}`}
                        data-testid={`puzzle-indicator-${idx}`}
                    >
                        <span className="puzzle-type">{formatPuzzleType(puzzle.type)}</span>
                        {puzzle.isCompleted && <span className="check">✓</span>}
                    </div>
                ))}
            </div>

            {/* Takeover Modal */}
            {isPaused && (
                <TakeoverModal
                    onTakeover={() => gameState.requestTakeover()}
                    isDefuser={room.players.find(p => p.id === gameState.playerId)?.role === 'defuser'}
                />
            )}
        </div>
    );
}

function formatPuzzleType(type: string): string {
    return type
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
