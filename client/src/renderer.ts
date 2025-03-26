import type { Unit, Terrain } from "./module_bindings";

export class Renderer {
    private ctx: CanvasRenderingContext2D;
    private units: Map<number, Unit>;
    private terrain: Map<number, Terrain>;

    constructor(ctx: CanvasRenderingContext2D, units: Map<number, Unit>, terrain: Map<number, Terrain>) {
        this.ctx = ctx;
        this.units = units;
        this.terrain = terrain;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        // Draw terrain first (so units appear on top)
        this.terrain.forEach((terrain) => {
            this.ctx.fillStyle = "#888888"; // Gray color for terrain
            this.ctx.fillRect(terrain.x, terrain.y, terrain.length, terrain.height);
        });

        // Draw units
        this.units.forEach((unit) => {
            this.ctx.fillStyle = unit.color;
            this.ctx.beginPath();
            this.ctx.arc(unit.x + unit.size/2, unit.y + unit.size/2, unit.size/2, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
}

