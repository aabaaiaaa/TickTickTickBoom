import { useState } from 'react';
import type { useGameState } from '../hooks/useGameState';
import './Home.css';

interface HomeProps {
    gameState: ReturnType<typeof useGameState>;
}

export function Home({ gameState }: HomeProps) {
    const [joinCode, setJoinCode] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);

    const handleCreateRoom = async () => {
        setIsCreating(true);
        const roomCode = await gameState.createRoom();
        if (roomCode) {
            await gameState.joinRoom(roomCode);
        }
        setIsCreating(false);
    };

    const handleJoinRoom = async () => {
        if (!joinCode.trim()) return;
        setIsJoining(true);
        await gameState.joinRoom(joinCode.trim().toUpperCase());
        setIsJoining(false);
    };

    return (
        <div className="home-screen" data-testid="home-screen">
            <div className="home-content">
                <div className="logo-section">
                    <img src="/bomb.svg" alt="Bomb" className="logo-bomb" />
                    <h1 className="game-title">
                        <span className="tick">Tick</span>
                        <span className="tick">Tick</span>
                        <span className="tick">Tick</span>
                        <span className="boom">BOOM!</span>
                    </h1>
                    <p className="tagline">Defuse the bomb. Beat the clock. Don't blow it.</p>
                </div>

                <div className="home-actions">
                    <button
                        className="primary large"
                        onClick={handleCreateRoom}
                        disabled={isCreating || !gameState.isConnected}
                        data-testid="create-room-btn"
                    >
                        {isCreating ? 'Creating...' : 'Create Room'}
                    </button>

                    <div className="divider">
                        <span>OR</span>
                    </div>

                    <div className="join-section">
                        <input
                            type="text"
                            placeholder="Enter Room Code"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            maxLength={4}
                            className="room-code-input"
                            data-testid="join-code-input"
                        />
                        <button
                            className="secondary"
                            onClick={handleJoinRoom}
                            disabled={isJoining || !joinCode.trim() || !gameState.isConnected}
                            data-testid="join-room-btn"
                        >
                            {isJoining ? 'Joining...' : 'Join Room'}
                        </button>
                    </div>
                </div>

                <div className="leaderboard-preview">
                    <h3>🏆 Top Scores</h3>
                    {gameState.leaderboard.length === 0 ? (
                        <p className="no-scores">No scores yet. Be the first!</p>
                    ) : (
                        <ul className="score-list">
                            {gameState.leaderboard
                                .sort((a, b) => a.completionTimeMs - b.completionTimeMs)
                                .slice(0, 5)
                                .map((entry, idx) => (
                                    <li key={entry.id}>
                                        <span className="rank">#{idx + 1}</span>
                                        <span className="time">{formatTime(entry.completionTimeMs)}</span>
                                        <span className="difficulty">{entry.difficulty}</span>
                                    </li>
                                ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
