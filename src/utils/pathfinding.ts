import { type Cell, type Vector2, GRID_SIZE } from '../types';

// Heuristic function (Manhattan distance)
const heuristic = (a: Vector2, b: Vector2): number => {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
};

export const findPath = (grid: Cell[][], start: Vector2, end: Vector2): Vector2[] | null => {
    // console.log(`Finding path from (${start.x},${start.y}) to (${end.x},${end.y})`);

    if (!grid || grid.length === 0) {
        console.error("Grid is empty or undefined");
        return null;
    }

    const openSet: Vector2[] = [start];
    const cameFrom: Record<string, Vector2> = {};

    const gScore: Record<string, number> = {};
    const fScore: Record<string, number> = {};

    const key = (p: Vector2) => `${p.x},${p.y}`;

    gScore[key(start)] = 0;
    fScore[key(start)] = heuristic(start, end);

    let iterations = 0;
    while (openSet.length > 0) {
        iterations++;
        if (iterations > 10000) {
            console.error("Pathfinding infinite loop detected");
            return null;
        }

        // Get node with lowest fScore
        let current = openSet[0];
        let lowestF = fScore[key(current)] || Infinity;

        for (let i = 1; i < openSet.length; i++) {
            const f = fScore[key(openSet[i])] || Infinity;
            if (f < lowestF) {
                lowestF = f;
                current = openSet[i];
            }
        }

        if (current.x === end.x && current.y === end.y) {
            // Reconstruct path
            const path: Vector2[] = [current];
            while (key(current) in cameFrom) {
                current = cameFrom[key(current)];
                path.unshift(current);
            }
            return path;
        }

        // Remove current from openSet
        openSet.splice(openSet.indexOf(current), 1);

        // Neighbors (Up, Down, Left, Right)
        const neighbors: Vector2[] = [
            { x: current.x, y: current.y - 1 },
            { x: current.x, y: current.y + 1 },
            { x: current.x - 1, y: current.y },
            { x: current.x + 1, y: current.y },
        ];

        for (const neighbor of neighbors) {
            // Check bounds
            if (neighbor.x < 0 || neighbor.x >= GRID_SIZE || neighbor.y < 0 || neighbor.y >= GRID_SIZE) {
                continue;
            }

            // Check obstacles (Towers)
            if (grid[neighbor.y][neighbor.x].isWall) {
                continue;
            }

            const tentativeGScore = (gScore[key(current)] || Infinity) + 1;

            if (tentativeGScore < (gScore[key(neighbor)] || Infinity)) {
                cameFrom[key(neighbor)] = current;
                gScore[key(neighbor)] = tentativeGScore;
                fScore[key(neighbor)] = tentativeGScore + heuristic(neighbor, end);

                if (!openSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
                    openSet.push(neighbor);
                }
            }
        }
    }

    console.warn("No path found");
    return null;
};
