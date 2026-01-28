import './TakeoverModal.css';

interface TakeoverModalProps {
    onTakeover: () => void;
    isDefuser: boolean;
}

export function TakeoverModal({ onTakeover, isDefuser }: TakeoverModalProps) {
    return (
        <div className="takeover-overlay" data-testid="takeover-modal">
            <div className="takeover-modal">
                <div className="takeover-icon">⚠️</div>
                <h2>DEFUSER DISCONNECTED</h2>
                <p className="takeover-message">
                    The defuser has left the game. The bomb timer is paused.
                </p>

                {isDefuser ? (
                    <p className="takeover-info">
                        You were the defuser. Reconnecting...
                    </p>
                ) : (
                    <>
                        <p className="takeover-info">
                            Someone must take over as defuser to continue.
                        </p>
                        <button
                            className="btn btn-primary takeover-btn"
                            onClick={onTakeover}
                            data-testid="takeover-btn"
                        >
                            🎮 Take Over as Defuser
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
