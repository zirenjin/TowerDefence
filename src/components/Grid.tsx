import React from 'react';
import { type Cell, GRID_SIZE, type Tower } from '../types';
import clsx from 'clsx';

interface GridProps {
    grid: Cell[][];
    towers: Tower[];
    onCellClick: (x: number, y: number) => void;
}

const Grid: React.FC<GridProps> = ({ grid, towers, onCellClick }) => {
    return (
        <div
            className="grid gap-px bg-gray-200 border border-gray-300 shadow-lg"
            style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                width: '600px',
                height: '600px'
            }}
        >
            {grid.map((row, y) => (
                row.map((cell, x) => {
                    const tower = towers.find(t => t.position.x === x && t.position.y === y);

                    return (
                        <div
                            key={`${x}-${y}`}
                            onClick={() => onCellClick(x, y)}
                            className={clsx(
                                "w-full h-full transition-colors duration-200 cursor-pointer relative",
                                {
                                    "bg-white hover:bg-gray-50": !cell.isWall && !cell.isStart && !cell.isEnd,
                                    "bg-gray-800": cell.isStart,
                                    "bg-red-500": cell.isEnd,
                                    "bg-blue-500": tower?.type === 'PRIMARY',
                                    "bg-green-500": tower?.type === 'SLOW',
                                    "bg-purple-500": tower?.type === 'AREA',
                                }
                            )}
                        >
                            {/* Render Tower Range on Hover? Maybe later. */}
                        </div>
                    );
                })
            ))}
        </div>
    );
};

export default Grid;
