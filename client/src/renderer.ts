import type { Unit, Terrain, Obstacle } from "./module_bindings";

export class Renderer {
    private ctx: CanvasRenderingContext2D;
    private units: Map<number, Unit>;
    private obstacles: Map<number, Obstacle>;
    private terrain: Map<number, Terrain>;

    constructor(ctx: CanvasRenderingContext2D, units: Map<number, Unit>, obstacles: Map<number, Obstacle>, terrain: Map<number, Terrain>) {
        this.ctx = ctx;
        this.units = units;
        this.obstacles = obstacles;
        this.terrain = terrain;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        // Draw terrain first (green rectangles - traversable)
        this.terrain.forEach((terrain) => {
            this.ctx.fillStyle = "#4CAF50"; // Green color for terrain
            this.ctx.fillRect(terrain.x, terrain.y, terrain.length, terrain.height);
        });
        
        // Draw obstacles (gray rectangles - blocking)
        this.obstacles.forEach((obstacle) => {
            this.ctx.fillStyle = "#888888"; // Gray color for obstacles
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.length, obstacle.height);
        });

        // Draw units last (on top of everything)
        this.units.forEach((unit) => {
            this.ctx.fillStyle = unit.color;
            this.ctx.beginPath();
            this.ctx.arc(unit.x + unit.size/2, unit.y + unit.size/2, unit.size/2, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
}

