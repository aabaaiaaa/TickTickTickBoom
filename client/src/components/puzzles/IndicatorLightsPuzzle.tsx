import type { Puzzle, PuzzleAction } from '../../../../shared/types';
import './puzzles.css';

interface IndicatorLightsPuzzleProps {
    puzzle: Puzzle;
    onAction: (action: PuzzleAction) => void;
}

interface Indicator {
    label: string;
    isLit: boolean;
    isFlickering: boolean;
    color: string;
    canToggle: boolean;
}

export function IndicatorLightsPuzzle({ puzzle, onAction }: IndicatorLightsPuzzleProps) {
    if (!puzzle.defuserView) {
        return <div className="puzzle-loading">Loading puzzle...</div>;
    }
    const { indicators } = puzzle.defuserView as { indicators: Indicator[] };

    const handleToggle = (index: number) => {
        onAction({ type: 'toggle', index });
    };

    const handleToggleFlicker = (index: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Don't trigger the main toggle
        onAction({ type: 'toggle-flicker', index });
    };

    const handleVerify = () => {
        onAction({ type: 'verify' });
    };

    const getIndicatorState = (ind: Indicator) => {
        if (!ind.isLit) return 'unlit';
        if (ind.isFlickering) return 'flickering';
        return 'lit';
    };

    // Calculate current status for feedback
    const litCount = indicators.filter(i => i.isLit).length;
    const flickeringCount = indicators.filter(i => i.isFlickering).length;
    const carIndicator = indicators.find(i => i.label === 'CAR');
    const sigIndicator = indicators.find(i => i.label === 'SIG');
    const carSigValid = !carIndicator?.isLit || sigIndicator?.isLit;

    return (
        <div className="indicator-lights-puzzle">
            <div className="indicator-status-bar">
                <span className={`status-item ${litCount % 2 === 0 ? 'valid' : 'invalid'}`}>
                    Lit: {litCount} ({litCount % 2 === 0 ? 'even ✓' : 'odd ✗'})
                </span>
                <span className={`status-item ${flickeringCount <= 3 ? 'valid' : 'invalid'}`}>
                    Flickering: {flickeringCount}/3 max
                </span>
                <span className={`status-item ${carSigValid ? 'valid' : 'invalid'}`}>
                    CAR/SIG: {carSigValid ? '✓' : '✗'}
                </span>
            </div>

            <div className="indicators-grid">
                {indicators.map((ind, idx) => (
                    <div
                        key={idx}
                        className={`indicator-item ${ind.canToggle ? 'toggleable' : 'locked'}`}
                        onClick={() => ind.canToggle && handleToggle(idx)}
                        data-testid={`indicator-${idx}`}
                    >
                        <div
                            className={`indicator-light ${getIndicatorState(ind)}`}
                            style={{
                                backgroundColor: ind.isLit ? (ind.color || '#00ff00') : undefined,
                            }}
                        />
                        <span className="indicator-label">{ind.label}</span>
                        <span className="indicator-state">({getIndicatorState(ind)})</span>
                        {ind.canToggle && ind.isLit && (
                            <button
                                className={`flicker-btn ${ind.isFlickering ? 'active' : ''}`}
                                onClick={(e) => handleToggleFlicker(idx, e)}
                                title="Toggle flickering"
                            >
                                ⚡
                            </button>
                        )}
                        {!ind.canToggle && <span className="locked-badge">🔒</span>}
                    </div>
                ))}
            </div>

            <div className="verification-panel">
                <button
                    className="btn btn-primary verify-btn"
                    onClick={handleVerify}
                    data-testid="verify-btn"
                >
                    ✓ VERIFY
                </button>
            </div>

            <div className="puzzle-instruction-box">
                <h4>📋 How to solve:</h4>
                <ol>
                    <li><strong>Report</strong> each indicator's label, state, and color to the reader</li>
                    <li><strong>Click indicators</strong> to toggle them ON/OFF (🔒 = locked)</li>
                    <li>Use the <strong>⚡ button</strong> to toggle flickering on lit indicators</li>
                    <li>Reader will guide you to meet all 3 rules shown above</li>
                    <li>Press <strong>VERIFY</strong> when all status indicators show ✓</li>
                </ol>
                <p className="note">⚠️ Rules: Even # of lit, max 3 flickering, if CAR lit then SIG must be lit!</p>
            </div>
        </div>
    );
}
