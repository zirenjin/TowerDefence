import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

import Grid from './Grid';
import EntityLayer from './EntityLayer';
import Sidebar from './UI/Sidebar';
import Toast from './UI/Toast';
import { GAME_CONFIG, TOWER_STATS } from '../constants/gameConfig';
import { type GameState, type Tower, type Cell, type Vector2, type Enemy, type Projectile, type SelectedEntity, type TowerType, GRID_SIZE, TOWER_COSTS } from '../types';
import { findPath } from '../utils/pathfinding';
import { useGameLoop } from '../hooks/useGameLoop';

const createInitialGrid = () => {
    const grid = Array(GRID_SIZE).fill(null).map((_, y) =>
        Array(GRID_SIZE).fill(null).map((_, x) => ({
            x,
            y,
            isWall: false,
            isStart: false,
            isEnd: false,
            isPath: false
        }))
    );
    return grid;
};

const Game: React.FC = () => {
    // Game State
    const [gameState, setGameState] = useState<GameState>({
        money: GAME_CONFIG.INITIAL_MONEY,
        lives: GAME_CONFIG.INITIAL_LIVES,
        wave: 1,
        isPlaying: false,
        isGameOver: false,
        grid: createInitialGrid(),
        towers: [],
        enemies: [],
        projectiles: [],
        path: []
    });

    const towersRef = useRef<Tower[]>([]);
    const gridRef = useRef<Cell[][]>([]); // Keep a ref for fast access in loop
    const pathRef = useRef<Vector2[]>([]); // Store the fixed path
    const enemiesRef = useRef<Enemy[]>([]);
    const projectilesRef = useRef<Projectile[]>([]);

    // Wave management
    const waveStateRef = useRef({
        enemiesSpawned: 0,
        enemiesToSpawn: 0,
        spawnTimer: 0,
        spawnInterval: 1.0, // Seconds between spawns
        waveComplete: false
    });

    const [selectedTower, setSelectedTower] = useState<TowerType | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);
    const [isWaveActive, setIsWaveActive] = useState(false);

    const resetGame = () => {
        // Generate Grid
        const newGrid: Cell[][] = Array(GRID_SIZE).fill(null).map((_, y) =>
            Array(GRID_SIZE).fill(null).map((_, x) => ({
                x,
                y,
                isWall: false,
                isStart: false,
                isEnd: false,
                isPath: false
            }))
        );

        // Random Start and End on "inner" edges (at least 1 cell away from border)
        const innerEdgeCells = [];
        // Top and Bottom inner edges (y=1 and y=GRID_SIZE-2)
        for (let x = 1; x < GRID_SIZE - 1; x++) {
            innerEdgeCells.push({ x: x, y: 1 });
            innerEdgeCells.push({ x: x, y: GRID_SIZE - 2 });
        }
        // Left and Right inner edges (x=1 and x=GRID_SIZE-2)
        for (let y = 1; y < GRID_SIZE - 1; y++) {
            innerEdgeCells.push({ x: 1, y: y });
            innerEdgeCells.push({ x: GRID_SIZE - 2, y: y });
        }

        // Simple random selection (ensure they are not too close)
        // Simple random selection (ensure they are not too close)
        const start = innerEdgeCells[Math.floor(Math.random() * innerEdgeCells.length)];
        let end = innerEdgeCells[Math.floor(Math.random() * innerEdgeCells.length)];
        while (Math.abs(start.x - end.x) + Math.abs(start.y - end.y) < GAME_CONFIG.MIN_PATH_DISTANCE) {
            end = innerEdgeCells[Math.floor(Math.random() * innerEdgeCells.length)];
        }

        newGrid[start.y][start.x].isStart = true;
        newGrid[end.y][end.x].isEnd = true;

        // Generate Fixed Path
        const fixedPath = findPath(newGrid, start, end);
        if (fixedPath) {
            fixedPath.forEach(pos => {
                newGrid[pos.y][pos.x].isPath = true;
            });
        }

        gridRef.current = newGrid;
        pathRef.current = fixedPath || []; // Store path in ref
        enemiesRef.current = [];
        projectilesRef.current = [];
        towersRef.current = [];
        waveStateRef.current = {
            enemiesSpawned: 0,
            enemiesToSpawn: 0,
            spawnTimer: 0,
            spawnInterval: GAME_CONFIG.INITIAL_SPAWN_INTERVAL,
            waveComplete: false
        };

        setGameState({
            money: GAME_CONFIG.INITIAL_MONEY,
            lives: GAME_CONFIG.INITIAL_LIVES,
            wave: 1,
            isPlaying: false,
            isGameOver: false,
            grid: newGrid,
            towers: [],
            enemies: [],
            projectiles: [],
            path: []
        });
        setIsWaveActive(false);
    };

    // Initialize Game on mount
    useEffect(() => {
        resetGame();
    }, []);

    const startNextWave = () => {
        if (isWaveActive) return;

        const wave = gameState.wave;
        const count = GAME_CONFIG.INITIAL_WAVE_ENEMIES + wave * GAME_CONFIG.ENEMIES_PER_WAVE_INCREASE;

        waveStateRef.current = {
            enemiesSpawned: 0,
            enemiesToSpawn: count,
            spawnTimer: 0,
            spawnInterval: Math.max(
                GAME_CONFIG.MIN_SPAWN_INTERVAL,
                GAME_CONFIG.INITIAL_SPAWN_INTERVAL - wave * GAME_CONFIG.SPAWN_INTERVAL_DECREASE
            ),
            waveComplete: false
        };

        setIsWaveActive(true);
        setGameState(prev => ({ ...prev, isPlaying: true }));
    };

    const getStartNode = (grid: Cell[][]): Vector2 => {
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (grid[y][x].isStart) return { x, y };
            }
        }
        return { x: 0, y: 0 }; // Should not happen
    };

    const spawnEnemy = () => {
        const start = getStartNode(gridRef.current);

        // Use the pre-computed path from pathRef
        const path = pathRef.current;

        if (!path || path.length === 0) {
            console.warn("Cannot spawn enemy: No path available");
            return;
        }

        const wave = gameState.wave;
        let hp = GAME_CONFIG.ENEMY_BASE_HP * (1 + wave * GAME_CONFIG.ENEMY_HP_INCREASE_PER_WAVE);
        let isElite = false;

        // Dynamic Scaling: Elite Enemies
        // Calculate Total Tower DPS
        const totalTowerDPS = towersRef.current.reduce((total, tower) => {
            return total + (tower.damage * tower.fireRate);
        }, 0);

        // 20% chance to spawn an Elite enemy if there is some defense
        if (totalTowerDPS > 0 && Math.random() < 0.2) {
            isElite = true;
            // Elite HP = Normal HP + (Total DPS * 4)
            // This ensures the enemy can survive ~4 seconds of focused fire from all towers
            hp += totalTowerDPS * 4;
        }

        enemiesRef.current.push({
            id: uuidv4(),
            position: { ...start },
            targetIndex: 0,
            hp: hp,
            maxHp: hp,
            speed: GAME_CONFIG.ENEMY_BASE_SPEED,
            isSlowed: false,
            slowTimer: 0,
            path: path,
            frozen: false,
            isElite: isElite
        });
    };

    // Game Loop
    useGameLoop((deltaTime: number) => {
        if (!gameState.isPlaying) return;

        // 1. Spawning Enemies
        if (isWaveActive && waveStateRef.current.enemiesSpawned < waveStateRef.current.enemiesToSpawn) {
            waveStateRef.current.spawnTimer += deltaTime;
            if (waveStateRef.current.spawnTimer >= waveStateRef.current.spawnInterval) {
                spawnEnemy();
                waveStateRef.current.spawnTimer = 0;
                waveStateRef.current.enemiesSpawned++;
            }
        } else if (isWaveActive && enemiesRef.current.length === 0 && waveStateRef.current.enemiesSpawned >= waveStateRef.current.enemiesToSpawn) {
            // Wave Complete
            setIsWaveActive(false);
            setGameState(prev => ({ ...prev, wave: prev.wave + 1 }));
        }

        // 2. Update Enemies
        enemiesRef.current.forEach(enemy => {
            // Apply Slow
            if (enemy.isSlowed) {
                enemy.slowTimer -= deltaTime;
                if (enemy.slowTimer <= 0) {
                    enemy.isSlowed = false;
                    enemy.speed = GAME_CONFIG.ENEMY_BASE_SPEED;
                }
            }

            // Movement
            if (enemy.path.length > 0) {
                const target = enemy.path[enemy.targetIndex];
                if (!target) return; // Should not happen if logic is correct

                const dx = target.x - enemy.position.x;
                const dy = target.y - enemy.position.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                const moveDist = enemy.speed * deltaTime;

                if (dist <= moveDist) {
                    // Reached target node
                    enemy.position = { ...target };
                    enemy.targetIndex++;

                    // Check if reached end
                    if (enemy.targetIndex >= enemy.path.length) {
                        // Reached the end!
                        enemy.hp = 0; // Kill enemy
                        setGameState(prev => ({ ...prev, lives: Math.max(0, prev.lives - 1) }));
                    }
                } else {
                    // Move towards target
                    enemy.position.x += (dx / dist) * moveDist;
                    enemy.position.y += (dy / dist) * moveDist;
                }
            }
        });

        // Remove dead enemies
        enemiesRef.current = enemiesRef.current.filter(e => e.hp > 0);

        // 3. Towers Fire
        towersRef.current.forEach(tower => {
            tower.lastFired += deltaTime;
            if (tower.lastFired >= tower.fireRate) {
                // Find target
                const target = enemiesRef.current.find(e => {
                    const dx = e.position.x - tower.position.x;
                    const dy = e.position.y - tower.position.y;
                    return Math.sqrt(dx * dx + dy * dy) <= tower.range;
                });

                if (target) {
                    tower.lastFired = 0;
                    const towerStats = TOWER_STATS[tower.type];
                    projectilesRef.current.push({
                        id: uuidv4(),
                        position: { ...tower.position },
                        targetId: target.id,
                        damage: tower.damage,
                        speed: GAME_CONFIG.PROJECTILE_SPEED,
                        type: tower.type,
                        splashRadius: towerStats.splashRadius || 0,
                        slowFactor: towerStats.slowFactor || 1,
                        slowDuration: towerStats.slowDuration || 0
                    });
                }
            }
        });

        // 4. Update Projectiles
        projectilesRef.current.forEach(proj => {
            const target = enemiesRef.current.find(e => e.id === proj.targetId);
            if (!target) {
                proj.damage = 0; // Mark for removal
                return;
            }

            const dx = target.position.x - proj.position.x;
            const dy = target.position.y - proj.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const moveDist = proj.speed * deltaTime;

            if (dist <= moveDist) {
                // Hit!
                if (proj.type === 'AREA') {
                    // Splash Damage
                    enemiesRef.current.forEach(e => {
                        const ex = e.position.x - target.position.x;
                        const ey = e.position.y - target.position.y;
                        if (Math.sqrt(ex * ex + ey * ey) <= (proj.splashRadius || 0)) {
                            e.hp -= proj.damage;
                        }
                    });
                } else {
                    // Single Target
                    target.hp -= proj.damage;
                    if (proj.type === 'SLOW') {
                        target.isSlowed = true;
                        target.slowTimer = proj.slowDuration || 0;
                        target.speed = GAME_CONFIG.ENEMY_BASE_SPEED * (proj.slowFactor || 1);
                    }
                }

                // Add money if killed
                if (target.hp <= 0) {
                    setGameState(prev => ({ ...prev, money: prev.money + GAME_CONFIG.ENEMY_KILL_REWARD }));
                }

                proj.damage = 0; // Mark for removal
            } else {
                proj.position.x += (dx / dist) * moveDist;
                proj.position.y += (dy / dist) * moveDist;
            }
        });

        // Check Game Over
        if (gameState.lives <= 0 && !gameState.isGameOver) {
            setGameState(prev => ({ ...prev, isPlaying: false, isGameOver: true }));
            setIsWaveActive(false);
            return;
        }
    }, gameState.isPlaying);

    const handleDeleteEntity = () => {
        if (!selectedEntity) return;

        const { x, y } = selectedEntity.position;
        let refund = 0;

        if (selectedEntity.type === 'TOWER' && selectedEntity.tower) {
            refund = Math.floor(selectedEntity.tower.cost * 0.5);
            // Remove tower from towers array
            towersRef.current = towersRef.current.filter(t => t.id !== selectedEntity.id);
        } else if (selectedEntity.type === 'WALL') {
            refund = Math.floor(TOWER_COSTS.WALL * 0.5);
        }

        // Update Grid
        const newGridState = [...gridRef.current.map(row => [...row])];
        newGridState[y][x].isWall = false;
        newGridState[y][x].towerId = undefined;
        newGridState[y][x].isPath = false; // Will be updated by path recalc

        // Recalculate Path
        let startNode: Vector2 | null = null;
        let endNode: Vector2 | null = null;
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (newGridState[r][c].isStart) startNode = { x: c, y: r };
                if (newGridState[r][c].isEnd) endNode = { x: c, y: r };
            }
        }

        if (startNode && endNode) {
            const newPath = findPath(newGridState, startNode, endNode);
            if (newPath) {
                // Clear old path flags
                for (let r = 0; r < GRID_SIZE; r++) {
                    for (let c = 0; c < GRID_SIZE; c++) {
                        newGridState[r][c].isPath = false;
                    }
                }
                // Set new path flags
                newPath.forEach(pos => {
                    newGridState[pos.y][pos.x].isPath = true;
                });
                pathRef.current = newPath;

                // Recalculate enemy paths
                enemiesRef.current.forEach(enemy => {
                    const currentGridPos = {
                        x: Math.round(enemy.position.x),
                        y: Math.round(enemy.position.y)
                    };
                    const enemyPath = findPath(newGridState, currentGridPos, endNode!);
                    if (enemyPath) {
                        enemy.path = enemyPath;
                        enemy.targetIndex = 0;
                    }
                });
            }
        }

        gridRef.current = newGridState;
        setGameState(prev => ({
            ...prev,
            money: prev.money + refund,
            grid: newGridState,
            towers: [...towersRef.current]
        }));

        setToastMessage(`Refunded ${refund} gold`);
        setSelectedEntity(null);
    };

    const handleCellClick = (x: number, y: number) => {
        if (gameState.isGameOver) return;

        const cell = gridRef.current[y][x];

        // 1. Select existing entity
        if (cell.towerId || cell.isWall) {
            const entityType = cell.towerId ? 'TOWER' : 'WALL';
            const tower = cell.towerId ? towersRef.current.find(t => t.id === cell.towerId) : undefined;

            setSelectedEntity({
                type: entityType,
                position: { x, y },
                id: cell.towerId,
                tower: tower
            });
            setSelectedTower(null);
            return;
        }

        // 2. Deselect if clicking empty space (and not placing)
        if (selectedEntity && !selectedTower) {
            setSelectedEntity(null);
            return;
        }

        // 3. Place Tower
        if (!selectedTower) return;

        const cost = TOWER_COSTS[selectedTower];
        if (gameState.money < cost) {
            setToastMessage("Not enough money!");
            return;
        }

        // Check path blocking
        gridRef.current[y][x].isWall = true;

        let startNode: Vector2 | null = null;
        let endNode: Vector2 | null = null;
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (gridRef.current[r][c].isStart) startNode = { x: c, y: r };
                if (gridRef.current[r][c].isEnd) endNode = { x: c, y: r };
            }
        }

        if (!startNode || !endNode) {
            gridRef.current[y][x].isWall = false;
            return;
        }

        const newPath = findPath(gridRef.current, startNode, endNode);

        if (!newPath) {
            setToastMessage("Cannot block the path!");
            gridRef.current[y][x].isWall = false;
            return;
        }

        // Valid placement
        const towerStats = TOWER_STATS[selectedTower];
        const newTower: Tower = {
            id: uuidv4(),
            type: selectedTower,
            position: { x, y },
            range: towerStats.range,
            damage: towerStats.damage,
            fireRate: towerStats.fireRate,
            lastFired: 0,
            cost: cost
        };

        towersRef.current.push(newTower);

        // Update Grid
        const newGridState = [...gridRef.current.map(row => [...row])];
        newGridState[y][x].isWall = true;
        newGridState[y][x].towerId = newTower.id;

        // Update Path Visualization
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                newGridState[r][c].isPath = false;
            }
        }
        newPath.forEach(pos => {
            newGridState[pos.y][pos.x].isPath = true;
        });

        gridRef.current = newGridState;
        pathRef.current = newPath;

        setGameState(prev => ({
            ...prev,
            money: prev.money - cost,
            grid: newGridState,
            towers: [...towersRef.current]
        }));

        // Recalculate enemy paths
        enemiesRef.current.forEach(enemy => {
            const currentGridPos = {
                x: Math.round(enemy.position.x),
                y: Math.round(enemy.position.y)
            };
            const enemyPath = findPath(newGridState, currentGridPos, endNode!);
            if (enemyPath) {
                enemy.path = enemyPath;
                enemy.targetIndex = 0;
            }
        });
    };

    return (
        <>
            {toastMessage && (
                <Toast
                    message={toastMessage}
                    onClose={() => setToastMessage(null)}
                />
            )}
            <div className="flex w-full h-full bg-gray-100">
                <div className="flex-1 flex items-center justify-center relative">
                    <div className="relative">
                        <Grid
                            grid={gameState.grid}
                            towers={gameState.towers}
                            onCellClick={handleCellClick}
                        />
                        <EntityLayer
                            enemies={enemiesRef}
                            projectiles={projectilesRef}
                        />
                        {gameState.isGameOver && (
                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-50 rounded-lg">
                                <h2 className="text-4xl font-bold text-red-500 mb-4">GAME OVER</h2>
                                <p className="text-white mb-6">You survived {gameState.wave - 1} waves</p>
                                <button
                                    onClick={resetGame}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <Sidebar
                    money={gameState.money}
                    lives={gameState.lives}
                    wave={gameState.wave}
                    selectedTower={selectedTower}
                    onSelectTower={setSelectedTower}
                    onNextWave={startNextWave}
                    isWaveActive={isWaveActive}
                    onReset={resetGame}
                    selectedEntity={selectedEntity}
                    onDeleteEntity={handleDeleteEntity}
                />
            </div>
        </>
    );
};

export default Game;
