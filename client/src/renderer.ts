import type { Unit } from "./module_bindings";

export class Renderer {
    private ctx: CanvasRenderingContext2D;
    private units: Unit[];

    constructor(ctx: CanvasRenderingContext2D, units: Unit[]) {
        this.ctx = ctx;
        this.units = units;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        // Draw grid
//        const gridSize = 50;
//        for (let x = 0; x < this.ctx.canvas.width; x += gridSize) {
//            for (let y = 0; y < this.ctx.canvas.height; y += gridSize) {
//                this.ctx.strokeStyle = "#aaa";
//                this.ctx.strokeRect(x, y, gridSize, gridSize);
//            }
//        }

        // Draw units
        this.units.forEach((unit, id) => {
            this.ctx.fillStyle = "blue";
            this.ctx.fillRect(unit.x, unit.y, 28, 28);
        });
    }
}

