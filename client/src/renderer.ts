import type { Unit, Terrain, Obstacle, GameState } from "./module_bindings";

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
        this.clearCanvases();
        this.drawTerrain();
        this.drawObstacles();
        this.drawUnits();
    }

    // Draw from a specific game state
    drawFromGameState(gameState: GameState) {
        this.clearCanvases();
        
        // Draw terrain from game state
        for (const terrain of gameState.terrains) {
            this.drawTerrainItem(terrain);
        }
        
        // Draw obstacles from game state
        for (const obstacle of gameState.obstacles) {
            this.drawObstacleItem(obstacle);
        }
        
        // Draw units from game state
        for (const unit of gameState.units) {
            this.drawUnitItem(unit);
        }
    }

    // Draw from a specific action with embedded state data
    drawFromActionState(action: any) {
        this.clearCanvases();
        
        // Draw terrain from action state
        if (action.terrains && Array.isArray(action.terrains)) {
            for (const terrain of action.terrains) {
                this.drawTerrainItem(terrain);
            }
        }
        
        // Draw obstacles from action state
        if (action.obstacles && Array.isArray(action.obstacles)) {
            for (const obstacle of action.obstacles) {
                this.drawObstacleItem(obstacle);
            }
        }
        
        // Draw units from action state
        if (action.units && Array.isArray(action.units)) {
            for (const unit of action.units) {
                this.drawUnitItem(unit);
            }
        }
    }

    private clearCanvases() {
        const { underlay, terrain, units, overlay } = this.contexts;
        
        // Clear each canvas
        underlay.clearRect(0, 0, underlay.canvas.width, underlay.canvas.height);
        terrain.clearRect(0, 0, terrain.canvas.width, terrain.canvas.height);
        units.clearRect(0, 0, units.canvas.width, units.canvas.height);
        overlay.clearRect(0, 0, overlay.canvas.width, overlay.canvas.height);
    }

    private drawTerrain() {
        for (const terrain of this.terrain.values()) {
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

    private drawObstacles() {
        for (const obstacle of this.obstacles.values()) {
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

    private drawUnits() {
        for (const unit of this.units.values()) {
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
        const centerX = unit.x + unit.size/2;
        const centerY = unit.y + unit.size/2;
        const radius = unit.size/2;
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    }
}

