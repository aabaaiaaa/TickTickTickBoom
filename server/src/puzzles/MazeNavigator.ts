import type { PuzzleType, IndicatorState, Difficulty, PuzzleInstance } from '../../../shared/types.js';
import type { ValidationResult } from '../game/PuzzleValidator.js';

type Cell = 'empty' | 'wall';
type Direction = 'up' | 'down' | 'left' | 'right';

interface Position {
    row: number;
    col: number;
}

// Pre-defined maze layouts (6x6 grids)
// 1 = wall, 0 = empty
const MAZE_LAYOUTS: { walls: number[][]; waypoints: Position[] }[] = [
    {
        walls: [
            [0, 0, 1, 0, 0, 0],
            [0, 0, 1, 0, 1, 0],
            [0, 0, 0, 0, 1, 0],
            [1, 1, 0, 1, 1, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 1, 1, 1, 0, 0],
        ],
        waypoints: [{ row: 1, col: 1 }, { row: 4, col: 4 }],
    },
    {
        walls: [
            [0, 1, 0, 0, 0, 0],
            [0, 1, 0, 1, 1, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 1, 1, 1, 0, 1],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 1, 0, 1, 0],
        ],
        waypoints: [{ row: 0, col: 3 }, { row: 5, col: 5 }],
    },
    {
        walls: [
            [0, 0, 0, 1, 0, 0],
            [1, 1, 0, 1, 0, 1],
            [0, 0, 0, 0, 0, 0],
            [0, 1, 0, 1, 1, 0],
            [0, 1, 0, 0, 0, 0],
            [0, 0, 0, 1, 0, 0],
        ],
        waypoints: [{ row: 2, col: 2 }, { row: 4, col: 5 }],
    },
    {
        walls: [
            [0, 0, 0, 0, 1, 0],
            [0, 1, 1, 0, 1, 0],
            [0, 1, 0, 0, 0, 0],
            [0, 0, 0, 1, 0, 1],
            [1, 1, 0, 1, 0, 0],
            [0, 0, 0, 0, 0, 0],
        ],
        waypoints: [{ row: 0, col: 0 }, { row: 3, col: 2 }],
    },
];

export interface MazeNavigatorView {
    gridSize: number;
    currentPosition: Position;
    goalPosition: Position;
    waypoints: Position[];
    visitedWaypoints: number[]; // Indices of visited waypoints
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

export function generateMazeNavigator(
    _difficulty: Difficulty,
    _serialNumber: string,
    _indicators: IndicatorState[]
): MazeNavigatorPuzzle {
    // Select random maze
    const mazeIndex = Math.floor(Math.random() * MAZE_LAYOUTS.length);
    const maze = MAZE_LAYOUTS[mazeIndex];

    // Find valid start and goal positions (not on walls, not on waypoints)
    let startPos: Position;
    let goalPos: Position;

    do {
        startPos = {
            row: Math.floor(Math.random() * 6),
            col: Math.floor(Math.random() * 6)
        };
    } while (
        maze.walls[startPos.row][startPos.col] === 1 ||
        maze.waypoints.some(w => w.row === startPos.row && w.col === startPos.col)
    );

    do {
        goalPos = {
            row: Math.floor(Math.random() * 6),
            col: Math.floor(Math.random() * 6)
        };
    } while (
        maze.walls[goalPos.row][goalPos.col] === 1 ||
        (goalPos.row === startPos.row && goalPos.col === startPos.col) ||
        maze.waypoints.some(w => w.row === goalPos.row && w.col === goalPos.col)
    );

    return {
        type: 'maze-navigator',
        defuserView: {
            gridSize: 6,
            currentPosition: startPos,
            goalPosition: goalPos,
            waypoints: [...maze.waypoints],
            visitedWaypoints: [],
            moveHistory: [],
            hitWall: false,
        },
        solution: {
            mazeIndex,
            walls: maze.walls,
        },
    };
}

export function validateMazeNavigator(puzzle: PuzzleInstance, action: unknown): ValidationResult {
    const view = puzzle.defuserView as MazeNavigatorView;
    const solution = puzzle.solution as MazeNavigatorSolution;
    const actionData = action as { direction: Direction };

    if (!['up', 'down', 'left', 'right'].includes(actionData.direction)) {
        return { correct: false, message: 'Invalid direction' };
    }

    const direction = actionData.direction;
    const current = view.currentPosition;

    // Calculate new position
    let newRow = current.row;
    let newCol = current.col;

    switch (direction) {
        case 'up': newRow--; break;
        case 'down': newRow++; break;
        case 'left': newCol--; break;
        case 'right': newCol++; break;
    }

    // Check bounds
    if (newRow < 0 || newRow >= view.gridSize || newCol < 0 || newCol >= view.gridSize) {
        view.hitWall = true;
        return { correct: false, message: 'Hit the boundary! STRIKE!', strike: true };
    }

    // Check for wall using solution data
    const walls = solution.walls;
    if (walls[newRow][newCol] === 1) {
        view.hitWall = true;
        return { correct: false, message: 'Hit a wall! STRIKE!', strike: true };
    }

    // Valid move
    view.moveHistory.push(direction);
    view.currentPosition = { row: newRow, col: newCol };
    view.hitWall = false;

    // Check if on waypoint
    const waypointIndex = view.waypoints.findIndex(
        w => w.row === newRow && w.col === newCol
    );
    if (waypointIndex !== -1 && !view.visitedWaypoints.includes(waypointIndex)) {
        view.visitedWaypoints.push(waypointIndex);
    }

    // Check if reached goal
    if (newRow === view.goalPosition.row && newCol === view.goalPosition.col) {
        // Check if all waypoints visited
        if (view.visitedWaypoints.length < view.waypoints.length) {
            return { correct: false, message: 'Must visit all waypoints first!' };
        }
        return { correct: true, message: 'Maze completed!' };
    }

    const waypointsRemaining = view.waypoints.length - view.visitedWaypoints.length;
    return {
        correct: false,
        message: waypointsRemaining > 0
            ? `${waypointsRemaining} waypoint(s) remaining`
            : 'Head to the goal!'
    };
}
