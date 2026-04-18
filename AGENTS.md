# ATEGO - Agent Development Guide

## Project Overview

ATEGO is a 2-player strategy game similar to Stratego but with key differences:
- **Board**: 5×4 grid (smaller than Stratego's 10×10)
- **Pieces**: 8 per team (Yellow vs Red)
- **Goal**: Destroy the enemy's **Bomb** using the **Miner**

This is a monorepo containing both frontend and backend code for the ATEGO game.

## Repository Structure

```
atego/
├── AGENTS.md          # This file
├── README.md          # Brief project description
├── .gitignore
├── frontend/          # SvelteKit + TypeScript frontend
│   ├── src/
│   │   ├── app.html
│   │   ├── app.d.ts
│   │   ├── routes/
│   │   │   ├── +page.svelte         # Landing page (with loading screen)
│   │   │   ├── +layout.svelte       # Root layout
│   │   │   ├── [gameId]/+page.svelte # Game room page
│   │   │   ├── login/+page.svelte
│   │   │   └── user/[userId]/+page.svelte
│   │   └── lib/
│   │       ├── game/
│   │       │   ├── main.ts          # Core game loop, Socket.IO events
│   │       │   ├── piece.ts         # GamePiece class (movement, rendering)
│   │       │   ├── field.ts         # Board grid drawing
│   │       │   ├── resources.ts     # Asset loading
│   │       │   ├── utils.ts         # Coordinate flipping for red team
│   │       │   └── models.ts        # TypeScript interfaces
│   │       ├── components/
│   │       │   ├── GameConfiguation.svelte  # New game setup modal
│   │       │   └── Clock.svelte            # Game timer display
│   │       └── scss/
│   │           ├── _theme.scss
│   │           ├── _mixins.scss
│   │           └── global.scss
│   ├── static/
│   │   ├── favicon.png
│   │   ├── pieces/              # PNG images for game pieces
│   │   └── fonts/
│   ├── package.json
│   ├── svelte.config.js         # SvelteKit config (static adapter)
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── .env                     # Environment variables (not in git)
└── backend/               # Express.js + Socket.IO backend
    ├── src/
    │   ├── index.ts         # Main server, HTTP routes, Socket events
    │   ├── models.ts        # TypeScript interfaces (Game, Piece, Move, etc.)
    │   ├── gameData.ts      # GameService class (in-memory game state)
    │   ├── gameLogic.ts     # Move validation, combat, win conditions
    │   └── characterHierarchy.ts  # Piece stats & combat hierarchy
    ├── package.json
    └── tsconfig.json
```

## Game Pieces & Combat Hierarchy

| Piece | Rank | Beats | Special |
|-------|------|-------|---------|
| Bomb | 0 | 0,1,2,4,5,6 | Immobile; only Miner can defuse |
| Spy | 1 | 1,6 | Weak but beats Mr.X |
| Runner | 2 | 1,2 | **Can move any distance** |
| Miner | 3 | 0,1,2,3 | Only piece that beats Bomb |
| Assassin | 4 | 1,2,3,4 | - |
| Killer | 5 | 1,2,3,4,5 | - |
| Mr.X | 6 | 2,3,4,5,6 | Highest rank |

**Win Conditions:**
1. Miner destroys enemy Bomb
2. Opponent runs out of time
3. Enemy has only 1 piece left
4. Tie: Both Miners die simultaneously OR both run out of time

## Development Setup

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation

```bash
# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd backend && npm install
```

### Environment Variables

**Frontend (`frontend/.env`):**
```
VITE_SOCKET_ADRESS=http://localhost:8000
```

**Backend (`backend/.env`):**
```
PORT=8000
ORIGIN=http://localhost:5173  # Frontend URL for CORS
```

### Running Locally

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Client runs on http://localhost:5173
```

### Building for Production

**Frontend (Static Site):**
```bash
cd frontend
npm run build
# Output: build/ directory with static files
```

**Backend:**
```bash
cd backend
npm run build
# Compiles TypeScript to JavaScript
```

## Deployment (Render.com)

### Frontend (Static Site)

**Build Settings:**
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `build`

**Environment Variables:**
- `VITE_SOCKET_ADRESS=https://your-backend-url.onrender.com`

**Important:** The frontend is configured as a static SPA (Single Page Application) with:
- `@sveltejs/adapter-static` for static site generation
- `fallback: 'index.html'` for client-side routing
- Dynamic routes (`[gameId]`) use `export const prerender = false`

### Backend (Web Service)

**Build Settings:**
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

**Environment Variables:**
- `PORT=8000` (Render sets this automatically)
- `ORIGIN=https://your-frontend-url.onrender.com` (for CORS)

**Note:** The backend must remain a web service (not static) because:
- Socket.IO requires an active server for WebSocket connections
- Game state is held in-memory (`GameService` class)

## Key Technical Details

### Frontend Architecture

**Rendering:** Uses CreateJS (EaselJS) with 3 HTML5 Canvases:
- `gameCanvas` (512×640) - Main game board
- `heroCharacterCanvas` (768×96) - Your pieces/dead pieces
- `villainCharacterCanvas` (768×96) - Opponent's dead pieces

**State Management:**
- Real-time updates via Socket.IO
- Player ID stored in cookies (js-cookie)
- Game state managed in `main.ts`

**Perspective Handling:**
- Red team sees board flipped 180° via `flipFieldXIfRed` / `flipFieldYIfRed`

### Backend Architecture

**State Management:** In-memory storage via `GameService` class
- Games stored in `allGames` array
- No database persistence (yet)
- Games lost when server restarts

**Real-time Communication:** Socket.IO events:
- `joinGame`, `rejoinGame` - Player connection
- `allPiecesPlaced` - Initial piece placement
- `pieceMoved` - Game moves
- `updatePieces`, `updatePlayerTurn`, `gameOver` - State updates
- `clockUpdate` - Timer synchronization

**Clock:** Server-side timer updates every second via `setInterval`

## Important Code Patterns

### Adding `prerender` exports

**Static pages (landing page):**
```typescript
<script lang="ts">
  export const prerender = true;
  // ... rest of component
</script>
```

**Dynamic pages (game rooms):**
```typescript
<script lang="ts">
  export const prerender = false;
  // ... rest of component
</script>
```

### Environment Variables in Frontend

Only variables prefixed with `VITE_` are exposed to client code:
```typescript
const backendUrl = import.meta.env.VITE_SOCKET_ADRESS;
```

### SCSS Usage

Use `@use` instead of `@import` (deprecated):
```scss
@use "$lib/scss/mixins" as *;
// or
@use "$lib/scss/mixins" as mixins;
@include mixins.container;
```

### Loading Screen Pattern

The landing page (`+page.svelte`) implements a loading screen:
1. Shows spinner with "Waiting on server to boot..."
2. Polls backend health endpoint every 3 seconds
3. Shows "New Game" button once backend responds

## Common Issues & Solutions

### Issue: `npm audit fix` broke dependencies

**Problem:** `npm audit fix --force` downgrades packages to incompatible versions.

**Solution:** Never use `--force`. Restore from `package.json` and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Sass deprecation warnings

**Status:** Warnings are expected and harmless. The modern Sass API is configured in `vite.config.ts`.

### Issue: Build fails with dynamic routes

**Solution:** Ensure dynamic routes have `export const prerender = false`:
- `/[gameId]/+page.svelte`
- `/user/[userId]/+page.svelte`

### Issue: CORS errors

**Solution:** Set `ORIGIN` environment variable on backend to match frontend URL.

### Issue: Socket.IO connection fails

**Check:**
1. `VITE_SOCKET_ADRESS` is set correctly (no trailing slash)
2. Backend is running and accessible
3. CORS origin is configured on backend

## Security Notes

- **Never commit `.env` files** - they contain sensitive configuration
- Backend has CORS protection - configure `ORIGIN` properly
- Frontend exposes only `VITE_` prefixed env vars to client
- Game state is in-memory only - no persistence across restarts

## Package Updates

**⚠️ Warning:** Be cautious with updates to:
- `@sveltejs/kit`
- `@sveltejs/adapter-static`
- `vite`
- `svelte`

These packages have strict peer dependencies. Test thoroughly after updates.

**Safe to update:**
- `axios`
- `socket.io-client`
- `express`
- `mongoose`

## Troubleshooting

**Check both servers are running:**
```bash
# Backend
curl http://localhost:8000/
# Should return: "Welcome to Express & TypeScript Server"

# Frontend
curl http://localhost:5173/
# Should return HTML
```

**Check environment variables:**
```bash
# Frontend
cat frontend/.env

# Backend
cat backend/.env
```

**Clear build caches:**
```bash
# Frontend
cd frontend
rm -rf .svelte-kit build node_modules package-lock.json
npm install

# Backend
cd backend
rm -rf node_modules package-lock.json
npm install
```

## Contact & Resources

- **Live Game:** Deployed on Render.com
- **Repository:** Check git remotes for URL
- **Framework Docs:**
  - [SvelteKit](https://kit.svelte.dev/docs)
  - [Socket.IO](https://socket.io/docs/)
  - [CreateJS](https://createjs.com/docs)

---

*Last updated: 2026-04-19*
*For questions or issues, check the git history and commit messages for context.*
