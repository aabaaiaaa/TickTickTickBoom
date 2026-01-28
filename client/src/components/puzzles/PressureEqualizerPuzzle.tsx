import { useState, useEffect } from 'react';
import type { Puzzle, PuzzleAction } from '../../../../shared/types';
import './puzzles.css';

interface PressureEqualizerPuzzleProps {
    puzzle: Puzzle;
    onAction: (action: PuzzleAction) => void;
}

interface Slider {
    id: number;
    position: 'A' | 'B' | 'C' | 'D' | 'E';
    pressure: number;
    indicator: 'red' | 'yellow' | 'green';
    isLocked: boolean;
}

const POSITIONS = ['A', 'B', 'C', 'D', 'E'] as const;
const PRESSURE_VALUES: Record<string, number> = { A: 2, B: 4, C: 6, D: 8, E: 10 };

export function PressureEqualizerPuzzle({ puzzle, onAction }: PressureEqualizerPuzzleProps) {
    const [sliders, setSliders] = useState<Slider[]>([]);

    // Sync sliders from defuserView, updating lock states and indicators from server
    useEffect(() => {
        if (puzzle.defuserView) {
            const { sliders: serverSliders } = puzzle.defuserView as { sliders: Slider[] };
            setSliders(currentSliders => {
                if (currentSliders.length === 0) {
                    // First initialization
                    return serverSliders;
                }
                // Merge: keep our local positions but update lock states and indicators from server
                return currentSliders.map((local, idx) => ({
                    ...local,
                    isLocked: serverSliders[idx]?.isLocked ?? local.isLocked,
                    indicator: serverSliders[idx]?.indicator ?? local.indicator,
                }));
            });
        }
    }, [puzzle.defuserView]);

    if (!puzzle.defuserView || sliders.length === 0) {
        return <div className="puzzle-loading">Loading puzzle...</div>;
    }

    const totalPressure = sliders.reduce((sum, s) => sum + PRESSURE_VALUES[s.position], 0);

    const handleSliderChange = (index: number, direction: 'up' | 'down') => {
        const slider = sliders[index];
        if (slider.isLocked) return;

        const currentIdx = POSITIONS.indexOf(slider.position);
        const newIdx = direction === 'up'
            ? Math.min(currentIdx + 1, POSITIONS.length - 1)
            : Math.max(currentIdx - 1, 0);

        const newSliders = [...sliders];
        newSliders[index] = {
            ...slider,
            position: POSITIONS[newIdx]
        };

        // Update indicator colors based on new state
        // This is a simplified version - real logic would be more complex

        setSliders(newSliders);
        onAction({ type: 'adjust-slider', index, position: POSITIONS[newIdx] });
    };

    const handleConfirm = () => {
        onAction({ type: 'confirm-pressure', positions: sliders.map(s => s.position) });
    };

    return (
        <div className="pressure-equalizer-puzzle">
            <div className="pressure-display">
                System Pressure: <span className={totalPressure >= 26 && totalPressure <= 30 ? 'safe' : 'danger'}>{totalPressure}</span>
                <span className="target">(Target: 26-30)</span>
            </div>

            <div className="sliders-container">
                {sliders.map((slider, idx) => (
                    <div key={idx} className={`pressure-slider ${slider.isLocked ? 'locked' : ''}`} data-testid={`slider-${idx}`}>
                        <div className="slider-label">Slider {idx + 1}</div>
                        <div className={`slider-indicator ${slider.indicator}`} />
                        <div className="slider-track">
                            {POSITIONS.map(pos => (
                                <div
                                    key={pos}
                                    className={`slider-position ${slider.position === pos ? 'active' : ''}`}
                                >
                                    {pos}
                                </div>
                            ))}
                        </div>
                        <div className="slider-controls">
                            <button
                                onClick={() => handleSliderChange(idx, 'up')}
                                disabled={slider.isLocked || slider.position === 'E'}
                            >
                                ▲
                            </button>
                            <button
                                onClick={() => handleSliderChange(idx, 'down')}
                                disabled={slider.isLocked || slider.position === 'A'}
                            >
                                ▼
                            </button>
                        </div>
                        {slider.isLocked && <span className="locked-badge">🔒</span>}
                    </div>
                ))}
            </div>

            <button
                className="btn btn-primary confirm-btn"
                onClick={handleConfirm}
                data-testid="confirm-pressure-btn"
            >
                ✓ CONFIRM
            </button>

            <div className="puzzle-instruction-box">
                <h4>📋 How to solve:</h4>
                <ol>
                    <li>Tell reader each slider's <strong>position</strong> (A-E, A=bottom)</li>
                    <li>Tell reader each slider's <strong>indicator color</strong> (Red=locked, Yellow, Green)</li>
                    <li>Report the current <strong>system pressure</strong> ({totalPressure})</li>
                    <li>Use <strong>▲/▼ buttons</strong> to move unlocked sliders</li>
                    <li>Follow reader's order (some sliders unlock others!)</li>
                    <li>Press <strong>CONFIRM</strong> when pressure is 26-30</li>
                </ol>
                <p className="note">🔒 Red indicator = locked! Must unlock by adjusting other sliders first.</p>
            </div>
        </div>
    );
}
