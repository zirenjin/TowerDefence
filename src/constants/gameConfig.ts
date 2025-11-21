import { type TowerType } from '../types';

// Game Balance Configuration
export const GAME_CONFIG = {
    // Initial Values
    INITIAL_MONEY: 100,
    INITIAL_LIVES: 20,

    // Wave Settings
    INITIAL_WAVE_ENEMIES: 10,
    ENEMIES_PER_WAVE_INCREASE: 2,
    INITIAL_SPAWN_INTERVAL: 1.0, // seconds
    MIN_SPAWN_INTERVAL: 0.2, // seconds
    SPAWN_INTERVAL_DECREASE: 0.05, // per wave

    // Enemy Settings
    ENEMY_BASE_HP: 100,
    ENEMY_HP_INCREASE_PER_WAVE: 0.2, // multiplier
    ENEMY_BASE_SPEED: 2.0,
    ENEMY_KILL_REWARD: 10,

    // Projectile Settings
    PROJECTILE_SPEED: 10,

    // Grid Settings
    MIN_PATH_DISTANCE: 10, // Minimum Manhattan distance between start and end
} as const;

// Tower Stats Configuration
export const TOWER_STATS: Record<TowerType, {
    range: number;
    damage: number;
    fireRate: number;
    splashRadius?: number;
    slowFactor?: number;
    slowDuration?: number;
}> = {
    PRIMARY: {
        range: 5,
        damage: 20,
        fireRate: 0.5,
    },
    SLOW: {
        range: 4,
        damage: 5,
        fireRate: 1.0,
        slowFactor: 0.6,
        slowDuration: 1.5,
    },
    AREA: {
        range: 3,
        damage: 15,
        fireRate: 1.5,
        splashRadius: 2.5,
    },
};
