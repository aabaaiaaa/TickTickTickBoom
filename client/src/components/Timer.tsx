import './Timer.css';

interface TimerProps {
    timeRemaining: number;
    isPaused: boolean;
    compact?: boolean;
}

export function Timer({ timeRemaining, isPaused, compact = false }: TimerProps) {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;

    const isLow = timeRemaining <= 60;
    const isCritical = timeRemaining <= 30;

    return (
        <div
            className={`timer ${compact ? 'compact' : ''} ${isLow ? 'low' : ''} ${isCritical ? 'critical' : ''} ${isPaused ? 'paused' : ''}`}
            data-testid="timer"
        >
            {isPaused && <span className="pause-indicator">⏸</span>}
            <span className="timer-display">
                {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
        </div>
    );
}
