# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TableTap is a real-time multiplayer tabletop war game built on [SpacetimeDB](https://spacetimedb.com). The server is a Rust WASM module running inside SpacetimeDB; the client is a TypeScript/Vite browser app that connects to SpacetimeDB via WebSocket.

## Commands

### Server (Rust)

```bash
# Build the server module
cd server && cargo build

# Publish (deploy) the module to a local SpacetimeDB instance, wiping existing data
cd server && spacetime publish tabletap --server localhost --delete-data

# Regenerate TypeScript bindings from the server module, then interactively stage only changed generated files
spacetime generate --lang typescript --out-dir client/src/module_bindings --project-path server
git checkout -p client/src/module_bindings/*.ts
```

The `update_bindings.sh` script at the repo root runs all three steps in sequence.

### Client (TypeScript/Vite)

```bash
cd client
bun install          # install dependencies
bunx vite            # start dev server (connects to ws://localhost:3000)
bunx vite build      # production build
```

There are no automated tests in this project.

## Architecture

### Data flow

All game state lives in SpacetimeDB tables on the server. The client **never mutates state locally** — it calls server reducers and subscribes to table changes via the SpacetimeDB SDK. Mouse drag events are sent to the server reducer `handle_mouse_event`, which runs collision detection server-side using `rapier2d` and updates unit positions.

### Server (`server/src/lib.rs`)

A single-file Rust SpacetimeDB module. Key tables:

| Table | Purpose |
|---|---|
| `unit` | Movable game pieces per game |
| `terrain` | Static map features (traversable or blocking) |
| `underlay` / `overlay` | Decorative layers drawn below/above units |
| `action` | Append-only event log (dice rolls, chat, with optional `GameState` snapshot) |
| `games` | Registry of named games |
| `selected_unit` | Ephemeral drag state (which unit is being moved) |

All shapes share the same `ShapeType` enum (Circle, Rectangle, Line, Polygon, Text) and `position: Vec<Position>` / `size: Vec<u32>` encoding. Collision detection is handled by building a `rapier2d` `QueryPipeline` from the current table rows on each reducer call — there is no persistent physics world.

### Client (`client/src/`)

| File/Dir | Purpose |
|---|---|
| `main.ts` | Entry point — game selector UI, instantiates `Game` |
| `game.ts` | `Game` class — manages four stacked canvas layers, SpacetimeDB subscriptions, dirty-layer rendering loop, and the tab-based UI |
| `renderer.ts` | `Renderer` class — stateless shape drawing onto a `CanvasRenderingContext2D` |
| `input.ts` | Mouse/touch event forwarding to the `handle_mouse_event` reducer |
| `tabs/GameSetupTab.ts` | Add/delete units, terrain, underlays, overlays |
| `tabs/ActionsTab.ts` | Dice roll button and chat UI |
| `components/ActionLog.ts` | Live action log sidebar |
| `module_bindings/` | **Auto-generated** by `spacetime generate` — do not edit manually |

### Rendering pipeline

`Game` maintains four overlapping `<canvas>` elements (z-index 1–4): terrain → underlay → units → overlay. Each layer has an independent dirty flag. When a SpacetimeDB table update fires its callback, the relevant layer is marked dirty and a `requestAnimationFrame` is scheduled. Only dirty layers are redrawn.

Clicking an entry in the action log calls `drawFromGameState(actionId)`, which replaces the live render with the `GameState` snapshot stored inside that `Action` row. Input events are blocked while a historical state is displayed.

### Multi-game support

Every table row carries a `game_id: u64`. The client subscribes with per-game SQL filters (`SELECT * FROM unit WHERE game_id = N`), so multiple game instances can coexist in the same SpacetimeDB module without interfering.

## Important conventions

- `module_bindings/` is generated code — regenerate with `update_bindings.sh` after any server schema change, then selectively stage only the diffs you need.
- The board is fixed at 600×400 px. Border walls are created as `Terrain` line segments in `border_terrain_lines()` on `init`.
- `position` for Circle and Rectangle stores the **center** point; for Line and Polygon it stores the endpoint/vertex list.
- Collision checks skip traversable terrain (`traversable: true`) so units can move over grass/open ground but not through walls or obstacles.
