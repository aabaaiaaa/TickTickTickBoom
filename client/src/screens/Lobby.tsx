import { useState } from 'react';
import type { useGameState } from '../hooks/useGameState';
import { DIFFICULTY_PRESETS, STANDARD_DIFFICULTIES, TEST_DIFFICULTIES } from '../../../shared/types';
import './Lobby.css';

interface LobbyProps {
    gameState: ReturnType<typeof useGameState>;
}

export function Lobby({ gameState }: LobbyProps) {
    const { room, playerId } = gameState;
    const [editingName, setEditingName] = useState(false);
    const [nameInput, setNameInput] = useState('');

    // Check for test mode via URL param
    const isTestMode = new URLSearchParams(window.location.search).get('testMode') === 'true';

    if (!room) return null;

    const currentPlayer = room.players.find(p => p.id === playerId);
    const isHost = room.hostId === playerId;
    const defuser = room.players.find(p => p.role === 'defuser');
    const readers = room.players.filter(p => p.role === 'reader');
    const allReady = room.players.every(p => p.isReady);
    const canStart = allReady && defuser && readers.length > 0 && room.players.length >= 2;

    const handleNameSubmit = () => {
        if (nameInput.trim()) {
            gameState.setName(nameInput.trim());
        }
        setEditingName(false);
    };

    const handleStartEdit = () => {
        setNameInput(currentPlayer?.name || '');
        setEditingName(true);
    };

    return (
        <div className="lobby-screen" data-testid="lobby-screen">
            <div className="lobby-header">
                <h1>Room: <span className="room-code" data-testid="room-code">{room.code}</span></h1>
                <p className="share-hint">Share this code with your friends!</p>
            </div>

            <div className="lobby-content">
                <div className="lobby-left">
                    {/* Difficulty Selection */}
                    <div className="card difficulty-card">
                        <h2>⚙️ Difficulty</h2>
                        <div className="difficulty-options">
                            {STANDARD_DIFFICULTIES.map(diff => (
                                <button
                                    key={diff}
                                    className={`difficulty-btn ${room.difficulty === diff ? 'selected' : ''}`}
                                    onClick={() => gameState.setDifficulty(diff)}
                                    data-testid={`difficulty-${diff}`}
                                >
                                    <span className="diff-name">{diff}</span>
                                    <span className="diff-details">
                                        {DIFFICULTY_PRESETS[diff].puzzleCount} puzzles • {Math.floor(DIFFICULTY_PRESETS[diff].timeSeconds / 60)}:{(DIFFICULTY_PRESETS[diff].timeSeconds % 60).toString().padStart(2, '0')}
                                    </span>
                                </button>
                            ))}
                            {/* Test-only difficulties - only visible in test mode */}
                            {isTestMode && TEST_DIFFICULTIES.map(diff => (
                                <button
                                    key={diff}
                                    className={`difficulty-btn test-difficulty ${room.difficulty === diff ? 'selected' : ''}`}
                                    onClick={() => gameState.setDifficulty(diff)}
                                    data-testid={`difficulty-${diff}`}
                                >
                                    <span className="diff-name">🧪 {diff}</span>
                                    <span className="diff-details">
                                        {DIFFICULTY_PRESETS[diff].puzzleCount} puzzles • {DIFFICULTY_PRESETS[diff].timeSeconds}s
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Your Settings */}
                    <div className="card player-settings">
                        <h2>👤 Your Settings</h2>

                        <div className="setting-row">
                            <label>Name:</label>
                            {editingName ? (
                                <div className="name-edit">
                                    <input
                                        type="text"
                                        value={nameInput}
                                        onChange={(e) => setNameInput(e.target.value)}
                                        maxLength={20}
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                                        data-testid="name-input"
                                    />
                                    <button className="secondary small" onClick={handleNameSubmit}>Save</button>
                                </div>
                            ) : (
                                <div className="name-display">
                                    <span data-testid="player-name">{currentPlayer?.name}</span>
                                    <button className="secondary small" onClick={handleStartEdit} data-testid="edit-name-btn">Edit</button>
                                </div>
                            )}
                        </div>

                        <div className="setting-row">
                            <label>Role:</label>
                            <div className="role-buttons">
                                <button
                                    className={`role-btn ${currentPlayer?.role === 'defuser' ? 'selected defuser' : ''}`}
                                    onClick={() => gameState.setRole('defuser')}
                                    data-testid="role-defuser"
                                >
                                    💣 Defuser
                                </button>
                                <button
                                    className={`role-btn ${currentPlayer?.role === 'reader' ? 'selected reader' : ''}`}
                                    onClick={() => gameState.setRole('reader')}
                                    data-testid="role-reader"
                                >
                                    📖 Reader
                                </button>
                            </div>
                        </div>

                        <div className="setting-row ready-row">
                            <button
                                className={`ready-btn ${currentPlayer?.isReady ? 'ready' : ''}`}
                                onClick={() => gameState.toggleReady()}
                                data-testid="ready-btn"
                            >
                                {currentPlayer?.isReady ? '✓ Ready!' : 'Click when Ready'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="lobby-right">
                    {/* Player List */}
                    <div className="card player-list">
                        <h2>👥 Players ({room.players.length})</h2>

                        <div className="players">
                            {/* Defuser */}
                            <div className="role-section">
                                <h3>💣 Defuser</h3>
                                {defuser ? (
                                    <div className={`player-item ${defuser.isReady ? 'ready' : ''}`} data-testid={`player-${defuser.id}`}>
                                        <span className="player-name">{defuser.name}</span>
                                        {defuser.id === room.hostId && <span className="host-badge">HOST</span>}
                                        <span className={`ready-status ${defuser.isReady ? 'is-ready' : ''}`}>
                                            {defuser.isReady ? '✓' : '○'}
                                        </span>
                                    </div>
                                ) : (
                                    <p className="no-player">No defuser assigned</p>
                                )}
                            </div>

                            {/* Readers */}
                            <div className="role-section">
                                <h3>📖 Readers ({readers.length})</h3>
                                {readers.length === 0 ? (
                                    <p className="no-player">No readers yet</p>
                                ) : (
                                    readers.map(reader => (
                                        <div
                                            key={reader.id}
                                            className={`player-item ${reader.isReady ? 'ready' : ''}`}
                                            data-testid={`player-${reader.id}`}
                                        >
                                            <span className="player-name">{reader.name}</span>
                                            {reader.id === room.hostId && <span className="host-badge">HOST</span>}
                                            <span className={`ready-status ${reader.isReady ? 'is-ready' : ''}`}>
                                                {reader.isReady ? '✓' : '○'}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Start Game */}
                    <div className="start-section">
                        {isHost ? (
                            <button
                                className="primary large start-btn"
                                onClick={() => gameState.startGame()}
                                disabled={!canStart}
                                data-testid="start-game-btn"
                            >
                                {canStart ? '🚀 Start Game' : 'Waiting for players...'}
                            </button>
                        ) : (
                            <p className="waiting-text">Waiting for host to start...</p>
                        )}

                        {!canStart && (
                            <ul className="start-requirements">
                                {!defuser && <li>❌ Need a defuser</li>}
                                {readers.length === 0 && <li>❌ Need at least 1 reader</li>}
                                {room.players.length < 2 && <li>❌ Need at least 2 players</li>}
                                {!allReady && <li>❌ All players must be ready</li>}
                            </ul>
                        )}
                    </div>

                    <button
                        className="secondary leave-btn"
                        onClick={() => gameState.leaveRoom()}
                        data-testid="leave-room-btn"
                    >
                        Leave Room
                    </button>
                </div>
            </div>
        </div>
    );
}
