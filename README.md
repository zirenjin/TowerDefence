# Tower Defence Game

A classic tower defense game built with React + TypeScript + Vite.

## 🎮 Game Overview

This is a strategic tower defense game where players must place different types of defense towers on a grid map to prevent enemies from reaching their destination. Plan your tower placements and types wisely to defeat wave after wave of enemies!

## 🛠️ Tech Stack

- **React 18** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Fast Development Build Tool
- **Tailwind CSS** - Styling Framework
- **UUID** - Unique Identifier Generation

## 📋 Game Rules

### Basic Rules

- **Initial Money**: 100 coins
- **Initial Lives**: 20 points
- **Grid Size**: 20×20
- **Game Objective**: Survive as many waves as possible before running out of lives

### Game Mechanics

1. **Path System**
   - Start and end points are randomly generated each game
   - Enemies follow a fixed path
   - Placing towers dynamically recalculates the path
   - **Important**: You cannot block the enemy path completely!

2. **Wave System**
   - First wave: 3 enemies
   - Each wave increases by: 2 enemies
   - Spawn interval: Decreases from 0.5 seconds to minimum 0.2 seconds
   - Start the next wave after defeating all enemies

3. **Enemy Properties**
   - **Base Health**: 100 HP
   - **Health Growth**: Increases by 15% per wave
   - **Movement Speed**: 1.5 units/second
   - **Kill Reward**: 20 coins
   - **Elite Enemies**: 20% chance to spawn with significantly increased health

4. **Loss Condition**
   - Game ends when lives reach 0
   - Each enemy reaching the destination costs 1 life point

## 🏰 Tower Types

### 1. Primary Tower
- **Cost**: 50 coins
- **Range**: 5 tiles
- **Damage**: 20
- **Fire Rate**: 0.5 seconds/shot
- **Features**: High cost-effectiveness, suitable for early defense

### 2. Slow Tower
- **Cost**: 100 coins
- **Range**: 4 tiles
- **Damage**: 5
- **Fire Rate**: 1.0 seconds/shot
- **Special Effect**: Slows by 60%, lasts 1.5 seconds
- **Features**: Delays enemy speed, use in combination with other towers

### 3. Area Tower
- **Cost**: 150 coins
- **Range**: 3 tiles
- **Damage**: 15
- **Fire Rate**: 1.5 seconds/shot
- **Splash Radius**: 2.5 tiles
- **Features**: Area damage, effective against groups of enemies

### 4. Wall
- **Cost**: 5 coins
- **Features**: No attack capability, used to alter enemy path and guide enemies along longer routes

## 🎯 Strategy Tips

1. **Plan Your Path**: Use walls to extend enemy travel distance
2. **Tower Combination**: Mix different tower types for better effectiveness
3. **Priority Placement**: Place high-damage towers at key positions
4. **Economy Management**: Balance current defense needs with future development
5. **Slow Control**: Slow towers buy more time for other towers to deal damage

## 🚀 Quick Start

### Install Dependencies

```bash
npm install
```

### Development Mode

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 📂 Project Structure

```
src/
├── components/          # React components
│   ├── Game.tsx        # Main game logic
│   ├── Grid.tsx        # Grid rendering
│   ├── EntityLayer.tsx # Enemy and projectile rendering
│   └── UI/             # UI components
├── hooks/              # Custom Hooks
│   └── useGameLoop.ts  # Game loop
├── utils/              # Utility functions
│   └── pathfinding.ts  # A* pathfinding algorithm
├── constants/          # Game configuration
│   └── gameConfig.ts   # Game balance parameters
└── types/              # TypeScript type definitions
    └── index.ts
```

## 🎨 Game Features

- ✅ Dynamic path generation and pathfinding
- ✅ Multiple tower types
- ✅ Elite enemy system
- ✅ Splash damage and slow effects
- ✅ Responsive design
- ✅ Smooth animations
- ✅ Real-time game state display

## 📝 Development Notes

### ESLint Configuration

For production applications, it's recommended to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      tseslint.configs.recommendedTypeChecked,
      // Or use stricter rules
      tseslint.configs.strictTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```

## 🐛 Known Issues

- Game pause functionality to be implemented
- Tower upgrade system to be developed

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📄 License

MIT License
