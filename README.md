# Port Simulation

Visualization of port operations with ship animations, queues, and pier management.

## Description

A port simulation where ships arrive, are serviced at piers, and depart. The project is implemented using object-oriented approach, TypeScript, Pixi.js for visualization, and TweenJS for animations.

## Functionality

### Main Components:

1. **Sea** - rectangular blue work area
2. **Port** - highlighted rectangular area with a single entrance
   - Only one ship can pass through the entrance at a time
   - The port has 4 piers, all empty at the start
3. **Piers** - rectangular areas
   - If a pier is filled with cargo - the rectangle is filled with color
   - If empty - transparent
   - Only one ship can dock at a pier at a time
4. **Ships** - green or red rectangles
   - **Green ships** - arrive empty, get loaded with cargo
   - **Red ships** - arrive with cargo, get unloaded
   - A filled ship is displayed as a filled rectangle
   - An empty ship - only outline

### Work Logic:

- Ships arrive from the opposite side of the sea
- Ship type (green/red) is chosen randomly
- Ship spawn frequency: **1 every 8 seconds**
- Time spent in port: **5 seconds**
- Green ships queue if there is no cargo on free piers
- Red ships queue if all free piers are filled

## Technologies

- **TypeScript** - code typing
- **Pixi.js v8.8.1** - visualization and rendering
- **TweenJS v25.0.0** - smooth ship movement animations
- **Vite** - build and development

## Project Structure

```
src/
├── app/
│   ├── config.ts          # Configuration (sizes, timings, positions)
│   ├── index.ts           # Main GameApp class
│   ├── port/
│   │   ├── PortScene.ts   # Main scene with simulation logic
│   │   ├── Port.ts        # Port class (pier and queue management)
│   │   ├── Pier.ts        # Pier class
│   │   ├── Ship.ts        # Ship class
│   │   └── types.ts       # TypeScript types
│   ├── ui/
│   │   └── HUD.ts         # Event logging
│   └── utils/
│       ├── tween.ts       # Animation utilities
│       └── id.ts          # Unique ID generation
├── main.ts                # Entry point
└── styles/
    └── index.css          # Styles
```

## Installation and Launch

### Requirements

- Node.js (version 18 or higher)
- npm or yarn

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Run in Development Mode

```bash
npm run dev
```

Or:

```bash
npm start
```

After launch, open your browser at the address shown by Vite (usually `http://localhost:5173`).

### Step 3: Build for Production

```bash
npm run build
```

The built project will be in the `dist/` folder.

### Additional Commands

```bash
# Check code formatting
npm run format:check

# Format code
npm run format

# Run linter
npm run lint
```

## How It Works

### Architecture

The project uses an object-oriented approach:

- **GameApp** - main class, initializes Pixi.js Application
- **PortScene** - main scene, manages the simulation
- **Port** - manages piers and ship queues
- **Pier** - represents a single pier with state (EMPTY/FILLED)
- **Ship** - represents a ship with type (RED/GREEN) and cargo state

### Workflow

1. **Ship Spawn**: Every 8 seconds a new ship is created (random type)
2. **Approach to Port**: Ship moves to the queue area
3. **Service Availability Check**:
   - Green ships look for a pier with cargo (FILLED)
   - Red ships look for an empty pier (EMPTY)
4. **Queue**: If no appropriate pier is available, ship joins the queue
5. **Port Entry**: Only one ship can pass through the entrance at a time
6. **Service**: Ship docks at the pier, waits 5 seconds
7. **Cargo Exchange**:
   - Red ship unloads → pier becomes FILLED
   - Green ship loads → pier becomes EMPTY
8. **Exit**: Ship exits through the entrance and departs

### Animations

All ship movements are implemented using TweenJS:
- Approach to port
- Entry through entrance
- Movement to pier
- Exit from port
- Movement in queue

## Configuration

Main parameters can be changed in `src/app/config.ts`:

- `spawnEveryMs` - ship spawn frequency (default 8000 ms)
- `serviceTimeMs` - service time (default 5000 ms)
- `maxShips` - maximum number of ships simultaneously
- `piers` - positions and number of piers
- Sizes and positions of elements
