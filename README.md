# Port Simulation

Port simulation — ships arrive, load/unload cargo and queue at piers, built with Pixi.js and TweenJS.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Pixi.js](https://img.shields.io/badge/Pixi.js-E91E8C?style=flat&logo=pixijs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)

## About

An interactive port simulation where ships arrive from the sea, queue at the entrance, dock at piers to load or unload cargo, and depart. Built with an object-oriented architecture using Pixi.js for canvas rendering and TweenJS for smooth ship animations.

## Features

- **Ship spawning** — new ship every 8 seconds with random type (red/green)
- **Two ship types** — green ships arrive empty and get loaded, red ships arrive with cargo and get unloaded
- **4 piers** — each pier can be filled or empty, only one ship at a time
- **Queue system** — ships wait if no appropriate pier is available
- **Single entrance** — only one ship can pass through the port entrance at a time
- **Smooth animations** — all movements via TweenJS (approach, entry, docking, exit)
- **HUD logging** — real-time event log of port activity
- **Configurable** — spawn rate, service time, pier count and positions via `config.ts`

## How It Works

1. Ship spawns on the opposite side of the sea every 8 seconds
2. Ship moves toward the port queue area
3. Green ships wait for a filled pier — Red ships wait for an empty pier
4. Ship enters through the single entrance and docks
5. After 5 seconds the cargo is exchanged and the ship departs

## Tech Stack

| Technology | Purpose |
|---|---|
| TypeScript | Type safety and OOP architecture |
| Pixi.js v8 | Canvas rendering and visualization |
| TweenJS | Smooth ship movement animations |
| Vite | Build tool |

## Project Structure

```
src/
├── app/
│   ├── config.ts       # Sizes, timings, positions
│   ├── index.ts        # Main GameApp class
│   ├── port/
│   │   ├── PortScene.ts  # Simulation logic
│   │   ├── Port.ts       # Pier and queue management
│   │   ├── Pier.ts       # Pier class
│   │   ├── Ship.ts       # Ship class
│   │   └── types.ts      # TypeScript types
│   ├── ui/
│   │   └── HUD.ts        # Event logging
│   └── utils/
│       ├── tween.ts      # Animation utilities
│       └── id.ts         # Unique ID generation
├── main.ts             # Entry point
└── styles/
    └── index.css
```

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Author

Designed and developed by **Ihor Yanchuk**
[Portfolio](https://github.com/Vergos1) · [GitHub](https://github.com/Vergos1)
