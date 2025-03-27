import type { Unit, Terrain, Obstacle } from "./module_bindings";

export class Renderer {
    private contexts: {
        underlay: CanvasRenderingContext2D;
        terrain: CanvasRenderingContext2D;
        units: CanvasRenderingContext2D;
        overlay: CanvasRenderingContext2D;
    };
    private units: Map<number, Unit>;
    private obstacles: Map<number, Obstacle>;
    private terrain: Map<number, Terrain>;

    constructor(
        contexts: {
            underlay: CanvasRenderingContext2D;
            terrain: CanvasRenderingContext2D;
            units: CanvasRenderingContext2D;
            overlay: CanvasRenderingContext2D;
        },
        units: Map<number, Unit>,
        obstacles: Map<number, Obstacle>,
        terrain: Map<number, Terrain>
    ) {
        this.contexts = contexts;
        this.units = units;
        this.obstacles = obstacles;
        this.terrain = terrain;
    }

    draw() {
        // Clear all canvases
        this.clearAllCanvases();

        // Draw terrain on the terrain canvas
        this.drawTerrain();
        
        // Draw obstacles on the terrain canvas
        this.drawObstacles();

        // Draw units on the units canvas
        this.drawUnits();
    }

    private clearAllCanvases() {
        const { underlay, terrain, units, overlay } = this.contexts;
        
        // Clear each canvas
        underlay.clearRect(0, 0, underlay.canvas.width, underlay.canvas.height);
        terrain.clearRect(0, 0, terrain.canvas.width, terrain.canvas.height);
        units.clearRect(0, 0, units.canvas.width, units.canvas.height);
        overlay.clearRect(0, 0, overlay.canvas.width, overlay.canvas.height);
    }

    private drawTerrain() {
        const ctx = this.contexts.terrain;
        // Draw terrain (green rectangles - traversable)
        this.terrain.forEach((terrain) => {
            ctx.fillStyle = "#4CAF50"; // Green color for terrain
            ctx.fillRect(terrain.x, terrain.y, terrain.length, terrain.height);
        });
    }

    private drawObstacles() {
        const ctx = this.contexts.terrain;
        // Draw obstacles (gray rectangles - blocking)
        this.obstacles.forEach((obstacle) => {
            ctx.fillStyle = "#888888"; // Gray color for obstacles
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.length, obstacle.height);
        });
    }

    private drawUnits() {
        const ctx = this.contexts.units;
        // Draw units
        this.units.forEach((unit) => {
            ctx.fillStyle = unit.color;
            ctx.beginPath();
            ctx.arc(unit.x + unit.size/2, unit.y + unit.size/2, unit.size/2, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

