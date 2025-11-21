import React, { useEffect, useRef } from 'react';
import { type Enemy, type Projectile, GRID_SIZE } from '../types';

interface EntityLayerProps {
    enemies: React.MutableRefObject<Enemy[]>;
    projectiles: React.MutableRefObject<Projectile[]>;
}

const EntityLayer: React.FC<EntityLayerProps> = ({ enemies, projectiles }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const render = () => {
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Calculate cell size
            const cellSize = canvas.width / GRID_SIZE;

            // Draw Enemies
            enemies.current.forEach(enemy => {
                ctx.fillStyle = '#333'; // Dark grey for enemies
                ctx.beginPath();
                // Draw circle for enemy
                const x = enemy.position.x * cellSize + cellSize / 2;
                const y = enemy.position.y * cellSize + cellSize / 2;
                const radius = cellSize * 0.3;

                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();

                // Draw HP Bar
                const hpPercent = enemy.hp / enemy.maxHp;
                ctx.fillStyle = 'red';
                ctx.fillRect(x - radius, y - radius - 5, radius * 2, 4);
                ctx.fillStyle = 'green';
                ctx.fillRect(x - radius, y - radius - 5, radius * 2 * hpPercent, 4);
            });

            // Draw Projectiles
            projectiles.current.forEach(proj => {
                ctx.fillStyle = proj.type === 'SLOW' ? 'green' : proj.type === 'AREA' ? 'purple' : 'blue';
                ctx.beginPath();
                const x = proj.position.x * cellSize + cellSize / 2;
                const y = proj.position.y * cellSize + cellSize / 2;
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
        // Empty dependency array is intentional - we want the render loop to run once
        // and access enemies/projectiles via refs for better performance
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <canvas
            ref={canvasRef}
            width={600}
            height={600}
            className="absolute top-0 left-0 pointer-events-none" // Overlay on top of Grid
        />
    );
};

export default EntityLayer;
