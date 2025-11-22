import React from 'react';
import { type TowerType, TOWER_COSTS, type SelectedEntity } from '../../types';
import { Shield, Zap, Hexagon, Play, Pause, RefreshCw, Square, Trash2, Info } from 'lucide-react';
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
    selectedEntity: SelectedEntity | null;
    onDeleteEntity: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    money,
    lives,
    wave,
    selectedTower,
    onSelectTower,
    onNextWave,
    isWaveActive,
    onReset,
    selectedEntity,
    onDeleteEntity
}) => {
    return (
        <div className="w-64 bg-white p-6 shadow-xl flex flex-col gap-6 h-full border-l border-gray-200 overflow-y-auto">
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
                {selectedEntity ? (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                        <div className="flex items-center gap-2 text-gray-700 font-bold border-b pb-2">
                            <Info size={20} />
                            <span>{selectedEntity.type === 'TOWER' ? 'Tower Info' : 'Wall Info'}</span>
                        </div>

                        {selectedEntity.type === 'TOWER' && selectedEntity.tower && (
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Type:</span>
                                    <span className="font-medium">{selectedEntity.tower.type}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Damage:</span>
                                    <span className="font-medium">{selectedEntity.tower.damage}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Range:</span>
                                    <span className="font-medium">{selectedEntity.tower.range}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Fire Rate:</span>
                                    <span className="font-medium">{selectedEntity.tower.fireRate}/s</span>
                                </div>
                            </div>
                        )}

                        {selectedEntity.type === 'WALL' && (
                            <div className="text-sm text-gray-500 italic">
                                Blocks enemy path. No stats.
                            </div>
                        )}

                        <button
                            onClick={onDeleteEntity}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors font-medium text-sm"
                        >
                            <Trash2 size={16} />
                            Delete (Refund ${Math.floor((selectedEntity.type === 'TOWER' && selectedEntity.tower ? selectedEntity.tower.cost : TOWER_COSTS.WALL) * 0.5)})
                        </button>
                    </div>
                ) : (
                    <>
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
                            <TowerButton
                                type="WALL"
                                icon={<Square size={20} />}
                                label="Wall"
                                cost={TOWER_COSTS.WALL}
                                color="bg-gray-600"
                                isSelected={selectedTower === 'WALL'}
                                onClick={() => onSelectTower(selectedTower === 'WALL' ? null : 'WALL')}
                                canAfford={money >= TOWER_COSTS.WALL}
                            />
                        </div>
                    </>
                )}
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
