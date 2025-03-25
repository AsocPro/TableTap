import { Unit } from "./unit";
import { rollD6 } from "./dice";
import { Renderer } from "./renderer";
import { handleInput } from "./input";

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private units: Unit[];
    private renderer: Renderer;

    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext("2d")!;
        this.canvas.width = 600;
        this.canvas.height = 400;
        this.units = [new Unit(50, 50), new Unit(100,100)]; // Initial unit
        this.renderer = new Renderer(this.ctx, this.units);
	handleInput(this.canvas, this.units);
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

