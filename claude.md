# NetWalk Game - Project Guidelines

## Overview

NetWalk is a puzzle game where the player connects computers to a server by rotating cable segments. Built with React + TypeScript + Vite.

## Project Structure

```
src/
├── engine/          # Game logic (pure TypeScript, no React)
│   ├── types.ts     # All game types and interfaces
│   ├── Cell.ts      # Cell class with rotation logic
│   ├── Grid.ts      # Grid class for game board
│   ├── LevelGenerator.ts    # Level generation (spanning tree)
│   ├── ConnectionValidator.ts # Connection checking (BFS)
│   └── ScoreCalculator.ts   # Score calculation
├── components/      # React components
│   ├── GameBoard/   # Game board components
│   ├── UI/          # UI elements (Timer, Counter, etc.)
│   └── common/      # Shared components (Button, Modal)
├── store/           # Zustand stores
│   ├── gameStore.ts       # Game state
│   ├── settingsStore.ts   # Settings
│   └── leaderboardStore.ts # Leaderboard
├── screens/         # App screens/pages
├── hooks/           # Custom React hooks
├── utils/           # Utility functions
└── assets/          # Static assets (sprites, sounds)
```

## Coding Standards

### TypeScript
- Use strict mode (`strict: true`)
- Prefer interfaces over types for object shapes
- Use enums for fixed sets of values (CellType, Direction, Difficulty)
- No `any` - use `unknown` if type is truly unknown
- Enable `noUncheckedIndexedAccess` for safer array access

### React
- Functional components only
- Use hooks for state and effects
- Prefer named exports for components
- Keep components small and focused
- Co-locate tests with components (`Component.test.tsx`)

### Game Engine
- Keep engine logic pure (no React, no DOM)
- All game classes should be easily testable
- Use immutable patterns where possible
- Document complex algorithms

### Testing
- Unit tests for engine logic (high coverage)
- Component tests with Testing Library
- E2E tests with Playwright for critical flows
- Test file naming: `*.test.ts` or `*.spec.ts`

### Commits
- Use semantic commits: `feat:`, `fix:`, `test:`, `docs:`, `chore:`, `refactor:`
- Scope when applicable: `feat(engine): add level generator`
- Keep commits atomic and focused

### Performance
- Level generation < 500ms
- UI response < 100ms
- Animations at 60 FPS
- Bundle size optimized for mobile

## Key Algorithms

### Level Generation (LevelGenerator.ts)
1. Place server (center or random)
2. Build spanning tree (DFS/Prim)
3. Add extra edges based on difficulty
4. Place computers on leaves
5. Determine cell types from connections
6. Scramble rotations (ensure not solved)

### Connection Validation (ConnectionValidator.ts)
1. BFS from server
2. Check all computers reachable
3. Check no hanging ends
4. Return connected cells set

### Cell Rotation
- Each cell has rotation 0-3 (0°, 90°, 180°, 270°)
- `getOpenDirections()` returns active directions based on type + rotation
- Directions: NORTH=0, EAST=1, SOUTH=2, WEST=3

## Difficulty Settings

| Difficulty | Grid Size | Computers | Extra Edges |
|------------|-----------|-----------|-------------|
| Easy       | 5×5       | 4-6       | 0%          |
| Medium     | 7×7       | 8-12      | 10-15%      |
| Hard       | 9×9       | 12-18     | 20-30%      |

## Color Scheme

| Element          | Color   | Hex     |
|------------------|---------|---------|
| Background       | Dark    | #1a1a2e |
| Cable Off        | Gray    | #4a4a5a |
| Cable On         | Green   | #00d26a |
| Hanging End      | Red     | #ff4757 |
| Server           | Yellow  | #ffd93d |
| Computer Off     | Blue    | #3498db |
| Computer On      | Green   | #2ecc71 |

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run test       # Run unit tests
npm run test:e2e   # Run E2E tests
npm run lint       # Lint code
npm run format     # Format code
```

## Docker

```bash
docker-compose up --build   # Build and run
docker-compose down         # Stop
```

Access at http://localhost:8080

## Versioning

- SemVer: MAJOR.MINOR.PATCH
- Use semantic-release for auto-versioning
- Current version in package.json

## Development Priorities

1. Game engine with full test coverage
2. Basic UI with all screens
3. State management and storage
4. PWA support
5. Android build

## Requirements Document

See `docs/netwalk-requirements.md` for full specifications.
