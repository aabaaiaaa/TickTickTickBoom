import type { useGameState } from '../hooks/useGameState';
import { Leaderboard } from '../components/Leaderboard';
import { DIFFICULTY_PRESETS } from '../../../shared/types';
import './GameOver.css';

interface GameOverProps {
    gameState: ReturnType<typeof useGameState>;
}

export function GameOver({ gameState }: GameOverProps) {
    const { room, gameState: game, leaderboard, playAgain, leaveRoom } = gameState;

    if (!room || !game) {
        return <div className="loading">Loading...</div>;
    }

    // Use room.phase instead of game.result since game.result isn't set by the server
    const isVictory = room.phase === 'victory';
    const defuser = room.players.find(p => p.role === 'defuser');

    // Calculate stats
    const totalTime = DIFFICULTY_PRESETS[room.difficulty].timeSeconds;
    const timeUsed = totalTime - game.timeRemaining;
    const minutes = Math.floor(timeUsed / 60);
    const seconds = timeUsed % 60;

    return (
        <div className={`gameover-screen ${isVictory ? 'victory' : 'defeat'}`} data-testid="gameover-screen">
            <div className="result-banner">
                {isVictory ? (
                    <>
                        <h1 className="result-title victory-title">🎉 BOMB DEFUSED! 🎉</h1>
                        <p className="result-subtitle">Outstanding teamwork!</p>
                    </>
                ) : (
                    <>
                        <h1 className="result-title defeat-title">💥 BOOM! 💥</h1>
                        <p className="result-subtitle">
                            {game.strikes >= game.maxStrikes
                                ? 'Too many strikes!'
                                : 'Time ran out!'}
                        </p>
                    </>
                )}
            </div>

            <div className="gameover-content">
                <div className="stats-panel">
                    <h2>📊 Game Stats</h2>

                    <div className="stat-grid">
                        <div className="stat-item">
                            <span className="stat-label">Puzzles Solved</span>
                            <span className="stat-value">{game.completedCount} / {game.puzzles.length}</span>
                        </div>

                        <div className="stat-item">
                            <span className="stat-label">Time Used</span>
                            <span className="stat-value">{minutes}:{seconds.toString().padStart(2, '0')}</span>
                        </div>

                        <div className="stat-item">
                            <span className="stat-label">Strikes</span>
                            <span className="stat-value strikes">{game.strikes} / {game.maxStrikes}</span>
                        </div>

                        <div className="stat-item">
                            <span className="stat-label">Difficulty</span>
                            <span className="stat-value capitalize">{room.difficulty}</span>
                        </div>

                        <div className="stat-item">
                            <span className="stat-label">Defuser</span>
                            <span className="stat-value">{defuser?.name || 'Unknown'}</span>
                        </div>

                        <div className="stat-item">
                            <span className="stat-label">Team Size</span>
                            <span className="stat-value">{room.players.length} players</span>
                        </div>
                    </div>

                    {isVictory && (
                        <div className="score-display">
                            <h3>Final Score</h3>
                            <span className="score-value">{game.score}</span>
                        </div>
                    )}
                </div>

                <div className="leaderboard-panel">
                    <Leaderboard entries={leaderboard} />
                </div>
            </div>

            <div className="gameover-actions">
                <button
                    className="btn btn-primary btn-large"
                    onClick={playAgain}
                    data-testid="play-again-btn"
                >
                    🔄 Play Again
                </button>
                <button
                    className="btn btn-secondary btn-large"
                    onClick={leaveRoom}
                    data-testid="leave-btn"
                >
                    🏠 Leave Room
                </button>
            </div>
        </div>
    );
}
