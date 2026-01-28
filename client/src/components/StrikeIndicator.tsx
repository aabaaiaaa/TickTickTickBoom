import './StrikeIndicator.css';

interface StrikeIndicatorProps {
    strikes: number;
    maxStrikes: number;
    compact?: boolean;
}

export function StrikeIndicator({ strikes, maxStrikes, compact = false }: StrikeIndicatorProps) {
    return (
        <div
            className={`strike-indicator ${compact ? 'compact' : ''}`}
            data-testid="strike-indicator"
        >
            <span className="strike-label">STRIKES</span>
            <div className="strike-lights">
                {Array.from({ length: maxStrikes }, (_, i) => (
                    <div
                        key={i}
                        className={`strike-light ${i < strikes ? 'active' : ''}`}
                    />
                ))}
            </div>
        </div>
    );
}
