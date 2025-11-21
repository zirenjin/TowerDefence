export type Vector2 = {
    x: number;
    y: number;
};

export type TowerType = 'PRIMARY' | 'SLOW' | 'AREA';

export interface Tower {
    id: string;
    type: TowerType;
    position: Vector2;
    range: number;
    damage: number;
    fireRate: number;
    lastFired: number;
    cost: number;
}

export interface Enemy {
    id: string;
    position: Vector2;
    targetIndex: number;
    hp: number;
    maxHp: number;
    speed: number;
    isSlowed: boolean;
    slowTimer: number;
    path: Vector2[];
    frozen: boolean;
}

export interface Projectile {
    id: string;
    position: Vector2;
    targetId: string;
    damage: number;
    speed: number;
    type: TowerType;
    splashRadius?: number;
    slowDuration?: number;
    slowFactor?: number;
}

export interface Cell {
    x: number;
    y: number;
    isWall: boolean;
    isStart: boolean;
    isEnd: boolean;
    isPath: boolean;
    towerId?: string;
}

export interface GameState {
    money: number;
    lives: number;
    wave: number;
    isPlaying: boolean;
    grid: Cell[][];
    towers: Tower[];
    enemies: Enemy[];
    projectiles: Projectile[];
    path: Vector2[];
}

export const GRID_SIZE = 20;
export const TOWER_COSTS: Record<TowerType, number> = {
    PRIMARY: 50,
    SLOW: 100,
    AREA: 150,
};
