import type { PuzzleType, IndicatorState, Difficulty, PuzzleInstance } from '../../../shared/types.js';
import type { ValidationResult } from '../game/PuzzleValidator.js';
type Direction = 'up' | 'down' | 'left' | 'right';
interface Position {
    row: number;
    col: number;
}
export interface MazeNavigatorView {
    gridSize: number;
    currentPosition: Position;
    goalPosition: Position;
    waypoints: Position[];
    visitedWaypoints: number[];
    moveHistory: Direction[];
    hitWall: boolean;
}
interface MazeNavigatorSolution {
    mazeIndex: number;
    walls: number[][];
}
interface MazeNavigatorPuzzle {
    type: PuzzleType;
    defuserView: MazeNavigatorView;
    solution: MazeNavigatorSolution;
}
export declare function generateMazeNavigator(_difficulty: Difficulty, _serialNumber: string, _indicators: IndicatorState[]): MazeNavigatorPuzzle;
export declare function validateMazeNavigator(puzzle: PuzzleInstance, action: unknown): ValidationResult;
export {};
