import { type Cell, type Vector2, GRID_SIZE } from '../types';

// Heuristic function (Manhattan distance)
const heuristic = (a: Vector2, b: Vector2): number => {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
};

export const findPath = (grid: Cell[][], start: Vector2, end: Vector2): Vector2[] | null => {
    const openSet: Vector2[] = [start];
    const cameFrom: Record<string, Vector2> = {};

    const gScore: Record<string, number> = {};
    const fScore: Record<string, number> = {};

    const key = (p: Vector2) => `${p.x},${p.y}`;

    gScore[key(start)] = 0;
    fScore[key(start)] = heuristic(start, end);

    while (openSet.length > 0) {
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
            // Note: We don't treat start/end as obstacles even if they have special flags, 
            // but we must ensure we don't place towers on them anyway.
            // The grid cell `isWall` determines if it's blocked.
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

    // No path found
    return null;
};
