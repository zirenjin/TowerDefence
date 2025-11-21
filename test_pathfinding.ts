
import { findPath } from './src/utils/pathfinding';
import { GRID_SIZE } from './src/types';

// Mock Cell interface since we can't import it easily if it's not exported or if we run this with node
// But we can just mock the grid structure as expected by findPath

const mockGrid = (size) => {
    const grid = [];
    for (let y = 0; y < size; y++) {
        const row = [];
        for (let x = 0; x < size; x++) {
            row.push({
                x,
                y,
                isWall: false,
                isStart: false,
                isEnd: false,
                isPath: false
            });
        }
        grid.push(row);
    }
    return grid;
};

const runTest = () => {
    console.log(`GRID_SIZE: ${GRID_SIZE}`);
    const grid = mockGrid(GRID_SIZE);

    const start = { x: 0, y: 0 };
    const end = { x: GRID_SIZE - 1, y: GRID_SIZE - 1 };

    console.log(`Testing path from (${start.x},${start.y}) to (${end.x},${end.y})`);

    const path = findPath(grid, start, end);

    if (path) {
        console.log(`Path found! Length: ${path.length}`);
        console.log(path.map(p => `(${p.x},${p.y})`).join(' -> '));
    } else {
        console.error("No path found!");
    }
};

runTest();
