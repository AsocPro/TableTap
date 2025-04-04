import type { GameState, Unit, Terrain, Obstacle, Underlay, Overlay } from "./module_bindings";
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

    draw(gameState: GameState) {
        this.clearCanvases();
        this.drawUnderlays(gameState.underlays);
        this.drawTerrain(gameState.terrains);
        this.drawObstacles(gameState.obstacles);
        this.drawUnits(gameState.units);
        this.drawOverlays(gameState.overlays);
    }

    private clearCanvases() {
        const { underlay, terrain, units, overlay } = this.contexts;
        
        // Clear each canvas
        underlay.clearRect(0, 0, underlay.canvas.width, underlay.canvas.height);
        terrain.clearRect(0, 0, terrain.canvas.width, terrain.canvas.height);
        units.clearRect(0, 0, units.canvas.width, units.canvas.height);
        overlay.clearRect(0, 0, overlay.canvas.width, overlay.canvas.height);
    }

    private drawTerrain(terrains: Terrain[]) {
        for (const terrain of terrains) {
            this.drawTerrainItem(terrain);
        }
    }
    
    private drawTerrainItem(terrain: Terrain) {
        // Get terrain layer context
        const ctx = this.contexts.terrain;
        ctx.fillStyle = "#8fbc8f"; // Dark sea green for terrain
        ctx.strokeStyle = "#2e8b57"; // Sea green for terrain border
        ctx.lineWidth = 2;
        
        // Draw the rectangle
        ctx.fillRect(terrain.x, terrain.y, terrain.length, terrain.height);
        ctx.strokeRect(terrain.x, terrain.y, terrain.length, terrain.height);
    }

    private drawObstacles(obstacles: Obstacle[]) {
        for (const obstacle of obstacles) {
            this.drawObstacleItem(obstacle);
        }
    }
    
    private drawObstacleItem(obstacle: Obstacle) {
        // Get obstacle layer context
        const ctx = this.contexts.underlay;
        ctx.fillStyle = "#a0522d"; // Sienna for obstacles
        ctx.strokeStyle = "#8b4513"; // Saddle brown for obstacle border
        ctx.lineWidth = 2;
        
        // Draw the rectangle
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.length, obstacle.height);
        ctx.strokeRect(obstacle.x, obstacle.y, obstacle.length, obstacle.height);
    }

    private drawUnits(units: Unit[]) {
        for (const unit of units) {
            this.drawUnitItem(unit);
        }
    }
    
    private drawUnitItem(unit: Unit) {
        // Get units layer context
        const ctx = this.contexts.units;
        
        // Set circle style
        ctx.fillStyle = unit.color;
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        
        // Draw the circle
        ctx.beginPath();
        const centerX = unit.x;
        const centerY = unit.y;
        const radius = unit.size/2;
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    }

    private drawUnderlays(underlays: Underlay[]) {
        const ctx = this.contexts.underlay;
        for (const underlay of underlays) {
            this.drawShape(ctx, underlay);
        }
    }

    private drawOverlays(overlays: Overlay[]) {
        const ctx = this.contexts.overlay;
        for (const overlay of overlays) {
            this.drawShape(ctx, overlay);
        }
    }

    private drawShape(ctx: CanvasRenderingContext2D, shape: Underlay | Overlay) {
        ctx.fillStyle = shape.color;
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = 2;

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

    private drawCircle(ctx: CanvasRenderingContext2D, shape: Underlay | Overlay) {
        if (shape.position.length < 1) return;
        const center = shape.position[0];
        if (!center) return;
        ctx.beginPath();
        ctx.arc(center.x, center.y, shape.size / 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    }

    private drawRectangle(ctx: CanvasRenderingContext2D, shape: Underlay | Overlay) {
        if (shape.position.length < 2) return;
        const topLeft = shape.position[0];
        const bottomRight = shape.position[1];
        if (!topLeft || !bottomRight) return;
        const width = bottomRight.x - topLeft.x;
        const height = bottomRight.y - topLeft.y;
        ctx.fillRect(topLeft.x, topLeft.y, width, height);
        ctx.strokeRect(topLeft.x, topLeft.y, width, height);
    }

    private drawLine(ctx: CanvasRenderingContext2D, shape: Underlay | Overlay) {
        if (shape.position.length < 2) return;
        const start = shape.position[0];
        const end = shape.position[1];
        if (!start || !end) return;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
    }

    private drawPolygon(ctx: CanvasRenderingContext2D, shape: Underlay | Overlay) {
        if (shape.position.length < 3) return;
        const firstPoint = shape.position[0];
        if (!firstPoint) return;
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

    private drawText(ctx: CanvasRenderingContext2D, shape: Underlay | Overlay) {
        if (shape.position.length < 1) return;
        const pos = shape.position[0];
        if (!pos) return;
        ctx.font = `${shape.size}px Arial`;
        ctx.fillText(shape.color, pos.x, pos.y);
    }
}

