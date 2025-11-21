import React from 'react';
import { type TowerType, TOWER_COSTS } from '../../types';
import { Shield, Zap, Hexagon, Play, Pause, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
    money: number;
    lives: number;
    wave: number;
    selectedTower: TowerType | null;
    onSelectTower: (type: TowerType | null) => void;
    onNextWave: () => void;
    isWaveActive: boolean;
    onReset: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    money,
    lives,
    wave,
    selectedTower,
    onSelectTower,
    onNextWave,
    isWaveActive,
    onReset
}) => {
    return (
        <div className="w-64 bg-white p-6 shadow-xl flex flex-col gap-6 h-[600px] border-l border-gray-200">
            <div className="space-y-4">
                <h1 className="text-2xl font-bold text-gray-800">Tower Defense</h1>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-100 p-3 rounded-lg">
                        <div className="text-xs text-gray-500 uppercase font-bold">Money</div>
                        <div className="text-xl font-mono text-green-600">${money}</div>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg">
                        <div className="text-xs text-gray-500 uppercase font-bold">Lives</div>
                        <div className="text-xl font-mono text-red-600">{lives}</div>
                    </div>
                </div>

                <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="text-xs text-gray-500 uppercase font-bold mb-2">Wave</div>
                    <div className="flex items-center justify-between">
                        <div className="text-xl font-mono text-blue-600">{wave}</div>
                        <button
                            onClick={onNextWave}
                            disabled={isWaveActive}
                            className={clsx(
                                "px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2",
                                isWaveActive
                                    ? "bg-gray-300 cursor-not-allowed text-gray-500"
                                    : "bg-blue-500 hover:bg-blue-600 text-white"
                            )}
                        >
                            {isWaveActive ? <Pause size={16} /> : <Play size={16} />}
                            {isWaveActive ? "In Progress" : "Start Wave"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1">
                <h2 className="text-sm font-bold text-gray-500 uppercase mb-3">Towers</h2>
                <div className="space-y-3">
                    <TowerButton
                        type="PRIMARY"
                        icon={<Shield size={20} />}
                        label="Basic"
                        cost={TOWER_COSTS.PRIMARY}
                        color="bg-blue-500"
                        isSelected={selectedTower === 'PRIMARY'}
                        onClick={() => onSelectTower(selectedTower === 'PRIMARY' ? null : 'PRIMARY')}
                        canAfford={money >= TOWER_COSTS.PRIMARY}
                    />
                    <TowerButton
                        type="SLOW"
                        icon={<Hexagon size={20} />}
                        label="Slow"
                        cost={TOWER_COSTS.SLOW}
                        color="bg-green-500"
                        isSelected={selectedTower === 'SLOW'}
                        onClick={() => onSelectTower(selectedTower === 'SLOW' ? null : 'SLOW')}
                        canAfford={money >= TOWER_COSTS.SLOW}
                    />
                    <TowerButton
                        type="AREA"
                        icon={<Zap size={20} />}
                        label="Area"
                        cost={TOWER_COSTS.AREA}
                        color="bg-purple-500"
                        isSelected={selectedTower === 'AREA'}
                        onClick={() => onSelectTower(selectedTower === 'AREA' ? null : 'AREA')}
                        canAfford={money >= TOWER_COSTS.AREA}
                    />
                </div>
            </div>

            <button
                onClick={onReset}
                className="flex items-center justify-center gap-2 w-full py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
            >
                <RefreshCw size={18} />
                Reset Game
            </button>
        </div>
    );
};

interface TowerButtonProps {
    type: TowerType;
    icon: React.ReactNode;
    label: string;
    cost: number;
    color: string;
    isSelected: boolean;
    onClick: () => void;
    canAfford: boolean;
}

const TowerButton: React.FC<TowerButtonProps> = ({
    icon,
    label,
    cost,
    color,
    isSelected,
    onClick,
    canAfford
}) => {
    return (
        <button
            onClick={onClick}
            disabled={!canAfford && !isSelected}
            className={clsx(
                "w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all",
                isSelected ? "border-gray-800 bg-gray-50" : "border-transparent bg-gray-50 hover:bg-gray-100",
                !canAfford && !isSelected && "opacity-50 cursor-not-allowed"
            )}
        >
            <div className="flex items-center gap-3">
                <div className={clsx("p-2 rounded-md text-white", color)}>
                    {icon}
                </div>
                <span className="font-medium text-gray-700">{label}</span>
            </div>
            <span className="font-mono text-gray-500">${cost}</span>
        </button>
    );
};

export default Sidebar;
