import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

import Grid from './Grid';
import EntityLayer from './EntityLayer';
import Sidebar from './UI/Sidebar';
import Toast from './UI/Toast';
import { useGameLoop } from '../hooks/useGameLoop';
import { findPath } from '../utils/pathfinding';
import {
    type Cell,
    type Enemy,
    type GameState,
    GRID_SIZE,
    type Projectile,
    type Tower,
    type TowerType,
    type Vector2,
    TOWER_COSTS
} from '../types';
import { GAME_CONFIG, TOWER_STATS } from '../constants/gameConfig';

const Game: React.FC = () => {
    // Game State
    const [gameState, setGameState] = useState<GameState>({
        money: GAME_CONFIG.INITIAL_MONEY,
        lives: GAME_CONFIG.INITIAL_LIVES,
        wave: 1,
        isPlaying: false,
        grid: [],
        towers: [],
        enemies: [],
        projectiles: [],
        path: []
    });

    const [selectedTower, setSelectedTower] = useState<TowerType | null>(null);
    const [isWaveActive, setIsWaveActive] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Refs for mutable game state to avoid re-renders during game loop
    const enemiesRef = useRef<Enemy[]>([]);
    const projectilesRef = useRef<Projectile[]>([]);
    const towersRef = useRef<Tower[]>([]);
    const gridRef = useRef<Cell[][]>([]); // Keep a ref for fast access in loop

    // Wave management
    const waveStateRef = useRef({
        enemiesSpawned: 0,
        enemiesToSpawn: 0,
        spawnTimer: 0,
        spawnInterval: 1.0, // Seconds between spawns
        waveComplete: false
    });

    const resetGame = () => {
        // Generate Grid
        const newGrid: Cell[][] = Array(GRID_SIZE).fill(null).map((_, y) =>
            Array(GRID_SIZE).fill(null).map((_, x) => ({
                x,
                y,
                isWall: false,
                isStart: false,
                isEnd: false
            }))
        );

        // Random Start and End on edges
        const edgeCells = [];
        for (let i = 0; i < GRID_SIZE; i++) {
            edgeCells.push({ x: i, y: 0 });
            edgeCells.push({ x: i, y: GRID_SIZE - 1 });
            edgeCells.push({ x: 0, y: i });
            edgeCells.push({ x: GRID_SIZE - 1, y: i });
        }

        // Simple random selection (ensure they are not too close)
        const start = edgeCells[Math.floor(Math.random() * edgeCells.length)];
        let end = edgeCells[Math.floor(Math.random() * edgeCells.length)];
        while (Math.abs(start.x - end.x) + Math.abs(start.y - end.y) < GAME_CONFIG.MIN_PATH_DISTANCE) {
            end = edgeCells[Math.floor(Math.random() * edgeCells.length)];
        }

        newGrid[start.y][start.x].isStart = true;
        newGrid[end.y][end.x].isEnd = true;

        gridRef.current = newGrid;
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

    const getEndNode = (grid: Cell[][]): Vector2 => {
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (grid[y][x].isEnd) return { x, y };
            }
        }
        return { x: GRID_SIZE - 1, y: GRID_SIZE - 1 }; // Should not happen
    };

    const spawnEnemy = () => {
        const start = getStartNode(gridRef.current);
        const end = getEndNode(gridRef.current);
        const path = findPath(gridRef.current, start, end);

        if (!path) return;

        const wave = gameState.wave;
        const hp = GAME_CONFIG.ENEMY_BASE_HP * (1 + wave * GAME_CONFIG.ENEMY_HP_INCREASE_PER_WAVE);

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
            frozen: false
        });
    };

    // Game Loop
    useGameLoop((deltaTime) => {
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
                // Target dead, remove projectile or move to last known position?
                // Simple: remove projectile
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

        projectilesRef.current = projectilesRef.current.filter(p => p.damage > 0);
    }, gameState.isPlaying);

    const handleCellClick = (x: number, y: number) => {
        if (!selectedTower) return;

        const cell = gridRef.current[y][x];
        if (cell.isWall || cell.isStart || cell.isEnd || cell.towerId) return;

        const cost = TOWER_COSTS[selectedTower];
        if (gameState.money < cost) return;

        // Check if placement blocks path
        // Temporarily place wall
        gridRef.current[y][x].isWall = true;
        const start = getStartNode(gridRef.current);
        const end = getEndNode(gridRef.current);
        const newPath = findPath(gridRef.current, start, end);

        if (!newPath) {
            // Blocked! Revert
            gridRef.current[y][x].isWall = false;
            setToastMessage("Cannot block the path!");
            return;
        }

        // Valid placement
        // 1. Deduct money
        setGameState(prev => ({ ...prev, money: prev.money - cost }));

        // 2. Add Tower
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

        // 3. Update Grid State
        const newGridState = [...gridRef.current.map(row => [...row])];
        newGridState[y][x].isWall = true;
        newGridState[y][x].towerId = newTower.id;
        gridRef.current = newGridState;
        setGameState(prev => ({ ...prev, grid: newGridState, towers: [...towersRef.current] }));

        // 4. Recalculate paths for all existing enemies
        enemiesRef.current.forEach(enemy => {
            const currentGridPos = {
                x: Math.round(enemy.position.x),
                y: Math.round(enemy.position.y)
            };
            const enemyPath = findPath(gridRef.current, currentGridPos, end);
            if (enemyPath) {
                enemy.path = enemyPath;
                enemy.targetIndex = 0; // Reset to start of new path
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
            />
            </div>
        </>
    );
};

export default Game;
