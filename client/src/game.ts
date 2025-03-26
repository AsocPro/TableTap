import { rollD6 } from "./dice";
import { Renderer } from "./renderer";
import { handleInput } from "./input";
import { DbConnection } from './module_bindings';
import type { EventContext, Unit, Terrain, Obstacle } from './module_bindings';
import { Identity } from '@clockworklabs/spacetimedb-sdk';
//import type { DbConnection, DbConnectionBuilder, Identity, ConnectionId, Event, ReducerEvent } from '@clockworklabs/spacetimedb-sdk';


export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private units: Map<number, Unit>;
    private obstacles: Map<number, Obstacle>;
    private terrain: Map<number, Terrain>;
    private renderer: Renderer;

    constructor(canvasId: string) {
	const dbConnection: DbConnection = DbConnection.builder()
      .withUri('ws://localhost:3000') // Replace with your server address
      //.withUri('ws://nubita.asoc.pro:3002') // Replace with your server address
      .withModuleName('tabletap')
      .onConnect((dbConnection, identity, token) => {
	    dbConnection.subscriptionBuilder()
            .onApplied((ctx) => {
                 console.log("Subscription applied");
              })
            .subscribe(["SELECT * FROM unit", "SELECT * FROM obstacle", "SELECT * FROM terrain"]);
      })
      .build();

        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext("2d")!;
        this.canvas.width = 600;
        this.canvas.height = 400;
        this.units = new Map([]);
        this.obstacles = new Map([]);
        this.terrain = new Map([]);
        
        // Handle unit data
        const unitCallback = (_ctx: EventContext, unit: Unit) => {
            this.units.set(Number(unit.id), unit);
        }
        dbConnection.db.unit.onInsert(unitCallback);
        const unitUpdateCallback = (_ctx: EventContext, unit: Unit) => {
            this.units.set(Number(unit.id), unit);
        }
        dbConnection.db.unit.onUpdate(unitUpdateCallback);
        
        // Handle obstacle data
        const obstacleCallback = (_ctx: EventContext, obstacle: Obstacle) => {
            this.obstacles.set(Number(obstacle.id), obstacle);
        }
        dbConnection.db.obstacle.onInsert(obstacleCallback);
        const obstacleUpdateCallback = (_ctx: EventContext, obstacle: Obstacle) => {
            this.obstacles.set(Number(obstacle.id), obstacle);
        }
        dbConnection.db.obstacle.onUpdate(obstacleUpdateCallback);
        
        // Handle terrain data
        const terrainCallback = (_ctx: EventContext, terrain: Terrain) => {
            this.terrain.set(Number(terrain.id), terrain);
        }
        dbConnection.db.terrain.onInsert(terrainCallback);
        const terrainUpdateCallback = (_ctx: EventContext, terrain: Terrain) => {
            this.terrain.set(Number(terrain.id), terrain);
        }
        dbConnection.db.terrain.onUpdate(terrainUpdateCallback);
        
        this.renderer = new Renderer(this.ctx, this.units, this.obstacles, this.terrain);
        handleInput(dbConnection, this.canvas, this.units);
    }

    start() {
        this.update();
    }

    update() {
        this.renderer.draw();
        requestAnimationFrame(() => this.update());
    }

    rollDice(): number {
        return rollD6();
    }
}

