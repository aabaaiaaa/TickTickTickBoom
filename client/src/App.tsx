import { useState, useEffect } from 'react';
import { useGameState } from './hooks/useGameState';
import { Home } from './screens/Home';
import { Lobby } from './screens/Lobby';
import { DefuserGame } from './screens/DefuserGame';
import { ReaderManual } from './screens/ReaderManual';
import { GameOver } from './screens/GameOver';
import './App.css';

type Screen = 'home' | 'lobby' | 'game' | 'gameover';

function App() {
    const gameState = useGameState();
    const [currentScreen, setCurrentScreen] = useState<Screen>('home');

    // Check URL params for TestBoardBed integration
    const params = new URLSearchParams(window.location.search);
    const sharedDeviceId = params.get('sharedDeviceId');
    const playerDeviceId = params.get('playerDeviceId');

    // Determine view type from URL params
    const isDefuserView = sharedDeviceId === 'shared';
    const isReaderView = !!playerDeviceId;

    // Update screen based on room phase
    useEffect(() => {
        if (!gameState.room) {
            setCurrentScreen('home');
            return;
        }

        switch (gameState.room.phase) {
            case 'lobby':
                setCurrentScreen('lobby');
                break;
            case 'playing':
            case 'paused':
                setCurrentScreen('game');
                break;
            case 'victory':
            case 'defeat':
                setCurrentScreen('gameover');
                break;
        }
    }, [gameState.room?.phase]);

    // Get current player's role
    const currentPlayer = gameState.room?.players.find(p => p.id === gameState.playerId);
    const isDefuser = currentPlayer?.role === 'defuser';

    // Render based on screen and role
    const renderContent = () => {
        switch (currentScreen) {
            case 'home':
                return <Home gameState={gameState} />;

            case 'lobby':
                return <Lobby gameState={gameState} />;

            case 'game':
                // If URL specifies role, use that; otherwise use player's actual role
                if (isDefuserView || (!isReaderView && isDefuser)) {
                    return <DefuserGame gameState={gameState} />;
                }
                return <ReaderManual gameState={gameState} />;

            case 'gameover':
                return <GameOver gameState={gameState} />;

            default:
                return <Home gameState={gameState} />;
        }
    };

    return (
        <div className="app" data-testid="app">
            {!gameState.isConnected && (
                <div className="connection-banner" data-testid="connection-status">
                    Connecting to server...
                </div>
            )}
            {gameState.error && (
                <div className="error-banner" data-testid="error-message">
                    {gameState.error}
                </div>
            )}
            {renderContent()}
        </div>
    );
}

export default App;
