// This script applies all necessary fixes to Game.tsx
// Run with: node apply_fixes.js

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'Game.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add isPath to createInitialGrid
content = content.replace(
    /(\s+isWall: false,\r?\n\s+isStart: false,\r?\n\s+isEnd: false\r?\n)(\s+\)\))/,
    '$1                isPath: false\r\n$2'
);

// 2. Add pathRef declaration
content = content.replace(
    /(const gridRef = useRef<Cell\[\]\[\]>\(\[\]\); \/\/ Keep a ref for fast access in loop\r?\n)/,
    '$1    const pathRef = useRef<Vector2[]>([]); // Store the fixed path\r\n'
);

// 3. Add isPath to resetGame grid
content = content.replace(
    /(\/\/ Generate Grid[\s\S]*?isWall: false,\r?\n\s+isStart: false,\r?\n\s+isEnd: false\r?\n)(\s+\)\))/,
    '$1                isPath: false\r\n$2'
);

// 4. Add path generation in resetGame
content = content.replace(
    /(newGrid\[start\.y\]\[start\.x\]\.isStart = true;\r?\n\s+newGrid\[end\.y\]\[end\.x\]\.isEnd = true;\r?\n\r?\n)(\s+gridRef\.current = newGrid;)/,
    `$1        // Generate Fixed Path
        const fixedPath = findPath(newGrid, start, end);
        if (fixedPath) {
            fixedPath.forEach(pos => {
                newGrid[pos.y][pos.x].isPath = true;
            });
        }

        $2
        pathRef.current = fixedPath || []; // Store path in ref
`
);

// 5. Fix spawnEnemy to use pathRef
content = content.replace(
    /(const spawnEnemy = \(\) => \{\r?\n\s+const start = getStartNode\(gridRef\.current\);\r?\n)\s+const end = getEndNode\(gridRef\.current\);\r?\n\s+const path = findPath\(gridRef\.current, start, end\);\r?\n\r?\n\s+if \(!path\) return;/,
    `$1        
        // Use the pre-computed path from pathRef
        const path = pathRef.current;

        if (!path || path.length === 0) {
            console.warn("Cannot spawn enemy: No path available");
            return;
        }`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixes applied successfully!');
