import type { GameState, Unit, Terrain, Underlay, Overlay } from "./module_bindings";
import { ShapeType } from "./module_bindings";

export class Renderer {
    private contexts: {
        underlay: CanvasRenderingContext2D;
        terrain: CanvasRenderingContext2D;
        units: CanvasRenderingContext2D;
        overlay: CanvasRenderingContext2D;
    };

    constructor(
        contexts: {
            underlay: CanvasRenderingContext2D;
            terrain: CanvasRenderingContext2D;
            units: CanvasRenderingContext2D;
            overlay: CanvasRenderingContext2D;
        }
    ) {
        this.contexts = contexts;
    }

    clearLayer(layer: keyof typeof this.contexts) {
        const ctx = this.contexts[layer];
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    clearAllLayers() {
        this.clearLayer('underlay');
        this.clearLayer('terrain');
        this.clearLayer('units');
        this.clearLayer('overlay');
    }

    drawShapes(ctx: CanvasRenderingContext2D, shapes: Unit[] | Terrain[] | Underlay[] | Overlay[]) {
        for (const shape of shapes) {
            this.drawShape(ctx, shape);
        }
    }

    private drawShape(ctx: CanvasRenderingContext2D, shape: Unit | Terrain | Underlay | Overlay) {
        ctx.fillStyle = shape.color;
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = 2;

        // Add border for non-traversable terrain
        if ('traversable' in shape && !shape.traversable) {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
        }

        switch (shape.shapeType.tag) {
            case "Circle":
                this.drawCircle(ctx, shape);
                break;
            case "Rectangle":
                this.drawRectangle(ctx, shape);
                break;
            case "Line":
                this.drawLine(ctx, shape);
                break;
            case "Polygon":
                this.drawPolygon(ctx, shape);
                break;
            case "Text":
                this.drawText(ctx, shape);
                break;
        }
    }

    private drawCircle(ctx: CanvasRenderingContext2D, shape: Unit | Terrain | Underlay | Overlay) {
        if (!shape.position?.[0] || !shape.size?.[0]) return;
        const center = shape.position[0];
        const radius = shape.size[0] / 2;
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    }

    private drawRectangle(ctx: CanvasRenderingContext2D, shape: Unit | Terrain | Underlay | Overlay) {
        if (!shape.position?.[0] || !shape.position?.[1] || !shape.size?.[0] || !shape.size?.[1]) return;
        const start = shape.position[0];
        const end = shape.position[1];
        const width = end.x - start.x;
        const height = end.y - start.y;
        ctx.fillRect(start.x, start.y, width, height);
        ctx.strokeRect(start.x, start.y, width, height);
    }

    private drawLine(ctx: CanvasRenderingContext2D, shape: Unit | Terrain | Underlay | Overlay) {
        if (!shape.position?.[0] || !shape.position?.[1]) return;
        const start = shape.position[0];
        const end = shape.position[1];
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
    }

    private drawPolygon(ctx: CanvasRenderingContext2D, shape: Unit | Terrain | Underlay | Overlay) {
        if (!shape.position?.[0] || shape.position.length < 3) return;
        const firstPoint = shape.position[0];
        ctx.beginPath();
        ctx.moveTo(firstPoint.x, firstPoint.y);
        for (let i = 1; i < shape.position.length; i++) {
            const point = shape.position[i];
            if (!point) continue;
            ctx.lineTo(point.x, point.y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    private drawText(ctx: CanvasRenderingContext2D, shape: Unit | Terrain | Underlay | Overlay) {
        if (!shape.position?.[0] || !shape.size?.[0]) return;
        const pos = shape.position[0];
        ctx.font = `${shape.size[0]}px Arial`;
        ctx.fillText(shape.color, pos.x, pos.y);
    }
}

