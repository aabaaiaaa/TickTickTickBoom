import type { Puzzle, PuzzleAction, GameIndicator } from '../../../shared/types';
import { WireArrayPuzzle } from './puzzles/WireArrayPuzzle';
import { ButtonMatrixPuzzle } from './puzzles/ButtonMatrixPuzzle';
import { KeypadCipherPuzzle } from './puzzles/KeypadCipherPuzzle';
import { IndicatorLightsPuzzle } from './puzzles/IndicatorLightsPuzzle';
import { FrequencyTunerPuzzle } from './puzzles/FrequencyTunerPuzzle';
import { SimonSignalsPuzzle } from './puzzles/SimonSignalsPuzzle';
import { SequenceMemoryPuzzle } from './puzzles/SequenceMemoryPuzzle';
import { CountdownOverridePuzzle } from './puzzles/CountdownOverridePuzzle';
import { CapacitorBankPuzzle } from './puzzles/CapacitorBankPuzzle';
import { PressureEqualizerPuzzle } from './puzzles/PressureEqualizerPuzzle';
import { MazeNavigatorPuzzle } from './puzzles/MazeNavigatorPuzzle';
import { MechanicalSwitchesPuzzle } from './puzzles/MechanicalSwitchesPuzzle';
import './PuzzlePanel.css';

interface PuzzlePanelProps {
    puzzle: Puzzle;
    onAction: (action: PuzzleAction) => void;
    serialNumber: string;
    indicators: GameIndicator[];
}

export function PuzzlePanel({ puzzle, onAction, serialNumber, indicators }: PuzzlePanelProps) {
    const renderPuzzle = () => {
        switch (puzzle.type) {
            case 'wire-array':
                return <WireArrayPuzzle puzzle={puzzle} onAction={onAction} serialNumber={serialNumber} />;
            case 'button-matrix':
                return <ButtonMatrixPuzzle puzzle={puzzle} onAction={onAction} />;
            case 'keypad-cipher':
                return <KeypadCipherPuzzle puzzle={puzzle} onAction={onAction} indicators={indicators} />;
            case 'indicator-lights':
                return <IndicatorLightsPuzzle puzzle={puzzle} onAction={onAction} />;
            case 'frequency-tuner':
                return <FrequencyTunerPuzzle puzzle={puzzle} onAction={onAction} serialNumber={serialNumber} indicators={indicators} />;
            case 'simon-signals':
                return <SimonSignalsPuzzle puzzle={puzzle} onAction={onAction} serialNumber={serialNumber} />;
            case 'sequence-memory':
                return <SequenceMemoryPuzzle puzzle={puzzle} onAction={onAction} />;
            case 'countdown-override':
                return <CountdownOverridePuzzle puzzle={puzzle} onAction={onAction} />;
            case 'capacitor-bank':
                return <CapacitorBankPuzzle puzzle={puzzle} onAction={onAction} indicators={indicators} />;
            case 'pressure-equalizer':
                return <PressureEqualizerPuzzle puzzle={puzzle} onAction={onAction} />;
            case 'maze-navigator':
                return <MazeNavigatorPuzzle puzzle={puzzle} onAction={onAction} />;
            case 'mechanical-switches':
                return <MechanicalSwitchesPuzzle puzzle={puzzle} onAction={onAction} indicators={indicators} />;
            default:
                return <div className="unknown-puzzle">Unknown puzzle type</div>;
        }
    };

    return (
        <div className="puzzle-panel" data-testid={`puzzle-${puzzle.type}`}>
            <div className="puzzle-header">
                <h2>{formatPuzzleType(puzzle.type)}</h2>
            </div>
            <div className="puzzle-content">
                {renderPuzzle()}
            </div>
        </div>
    );
}

function formatPuzzleType(type: string): string {
    return type
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
