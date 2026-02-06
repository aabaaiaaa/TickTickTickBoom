# TickTickTickBoom

A cooperative multiplayer bomb defusal puzzle game — talk fast, think faster, don't blow up.

## About

One player is the **Defuser**, staring down a ticking bomb covered in puzzles. Everyone else is a **Reader**, armed with the manual that holds the rules for solving each puzzle. The catch? The Defuser can't see the manual, and the Readers can't see the bomb. Players must communicate to solve all puzzles before the timer runs out or 3 strikes end the game.

Inspired by *Keep Talking and Nobody Explodes*.

## Features

- **12 unique puzzle types** — wire arrays, button matrices, keypads, indicator lights, frequency tuning, Simon signals, sequence memory, countdown overrides, capacitor banks, pressure equalizers, mazes, and mechanical switches
- **4 difficulty levels** — Easy through Expert with scaling puzzle count and time pressure
- **Real-time multiplayer** — create a room, share a 4-character code, and play together instantly
- **Scoring system** with persistent leaderboard
- **Defuser takeover** — if the Defuser disconnects, another player can step in

## Tech Stack

- **Client:** React 19 + Vite
- **Server:** Express + Socket.IO
- **Language:** TypeScript throughout
- **Testing:** Playwright (E2E) + Vitest (unit)

## Getting Started

### Prerequisites

- Node.js 18+

### Setup

```bash
npm run install:all
npm run dev
```

This starts both the client (http://localhost:5175) and server (port 3001). Open your browser to **http://localhost:5175**.

## How to Play

1. **Create a room** — one player creates a game and gets a 4-character room code
2. **Share the code** — other players join using the code
3. **Pick roles** — one player becomes the Defuser, the rest are Readers
4. **Choose difficulty** and start the game
5. **Communicate!** — the Defuser describes what they see, Readers look up the rules in the manual and talk them through each puzzle
6. **Win** by solving all puzzles before time runs out and without accumulating 3 strikes

## Difficulty Levels

| Difficulty | Puzzles | Time        |
|------------|---------|-------------|
| Easy       | 3       | 7:00        |
| Medium     | 5       | 5:00        |
| Hard       | 7       | 4:00        |
| Expert     | 10      | 3:30        |

## Scripts Reference

| Script              | Description                              |
|---------------------|------------------------------------------|
| `npm run dev`       | Start client and server in dev mode      |
| `npm run build`     | Build client and server for production   |
| `npm run test`      | Run client unit tests                    |
| `npm run test:e2e`  | Run end-to-end tests (headless)          |
| `npm run install:all` | Install dependencies for all packages  |

## Project Structure

```
├── client/     → React frontend (components, screens, hooks)
├── server/     → Express + Socket.IO backend (game logic, room management, puzzle validation)
├── shared/     → Shared TypeScript types and utilities
└── e2e/        → Playwright end-to-end tests
```
