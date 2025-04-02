import { Renderer } from "./renderer";
import { handleInput } from "./input";
import { DbConnection } from './module_bindings';
import type { EventContext, Unit, Terrain, Obstacle } from './module_bindings';
import { Identity } from '@clockworklabs/spacetimedb-sdk';
import { GameSetupTab } from './tabs/GameSetupTab';
import { ActionsTab } from './tabs/ActionsTab';
import { ActionLog } from './components/ActionLog';

export class Game {
    private canvasContainer: HTMLDivElement;
    private canvasLayers: {
        terrain: HTMLCanvasElement;
        underlay: HTMLCanvasElement;
        units: HTMLCanvasElement;
        overlay: HTMLCanvasElement;
    };
    private ctx: {
        terrain: CanvasRenderingContext2D;
        underlay: CanvasRenderingContext2D;
        units: CanvasRenderingContext2D;
        overlay: CanvasRenderingContext2D;
    };
    private units: Map<number, Unit>;
    private obstacles: Map<number, Obstacle>;
    private terrain: Map<number, Terrain>;
    private renderer: Renderer;
    private dbConnection: DbConnection;
    private selectedGameState: any | null = null;
    private gameStates: Map<string, any> = new Map();
    private selectedAction: any = null;
    private actionStates: Map<number, any> = new Map();

    constructor(canvasId: string) {
        this.dbConnection = DbConnection.builder()
            .withUri('ws://192.168.1.222:3000')
            .withModuleName('tabletap')
            .onConnect((dbConnection, identity, token) => {
                dbConnection.subscriptionBuilder()
                    .onApplied((ctx) => {
                        console.log("Subscription applied");
                    })
                    .subscribe([
                        "SELECT * FROM unit", 
                        "SELECT * FROM obstacle", 
                        "SELECT * FROM terrain", 
                        "SELECT * FROM action"
                    ]);
            })
            .build();

        // Get the existing canvas and replace it with a container for multiple canvases
        const existingCanvas = document.getElementById(canvasId) as HTMLCanvasElement;
        const canvasWidth = 600;
        const canvasHeight = 400;
        
        // Create a container for all canvases
        this.canvasContainer = document.createElement('div');
        this.canvasContainer.style.position = 'relative';
        this.canvasContainer.style.width = `${canvasWidth}px`;
        this.canvasContainer.style.height = `${canvasHeight}px`;
        this.canvasContainer.style.margin = '0 auto';
        
        // Replace the existing canvas with our container
        if (existingCanvas.parentNode) {
            existingCanvas.parentNode.replaceChild(this.canvasContainer, existingCanvas);
        }

        // Create the four canvas layers
        this.canvasLayers = {
            terrain: this.createCanvasLayer(canvasWidth, canvasHeight, 1),
            underlay: this.createCanvasLayer(canvasWidth, canvasHeight, 2),
            units: this.createCanvasLayer(canvasWidth, canvasHeight, 3),
            overlay: this.createCanvasLayer(canvasWidth, canvasHeight, 4)
        };
        
        // Get the 2D contexts for each canvas
        this.ctx = {
            terrain: this.canvasLayers.terrain.getContext('2d')!,
            underlay: this.canvasLayers.underlay.getContext('2d')!,
            units: this.canvasLayers.units.getContext('2d')!,
            overlay: this.canvasLayers.overlay.getContext('2d')!
        };
        
	this.units = new Map([]);
        this.obstacles = new Map([]);
        this.terrain = new Map([]);
        
        // Handle unit data
        const unitCallback = (_ctx: EventContext, unit: Unit) => {
            this.units.set(Number(unit.id), unit);
        }
        this.dbConnection.db.unit.onInsert(unitCallback);
        
        const unitUpdateCallback = (_ctx: EventContext, unit: Unit) => {
            this.units.set(Number(unit.id), unit);
        }
        this.dbConnection.db.unit.onUpdate(unitUpdateCallback);
        
        const unitDeleteCallback = (_ctx: EventContext, unit: Unit) => {
            this.units.delete(Number(unit.id));
        }
        this.dbConnection.db.unit.onDelete(unitDeleteCallback);
        
        // Handle obstacle data
        const obstacleCallback = (_ctx: EventContext, obstacle: Obstacle) => {
            this.obstacles.set(Number(obstacle.id), obstacle);
        }
        this.dbConnection.db.obstacle.onInsert(obstacleCallback);
        
        const obstacleUpdateCallback = (_ctx: EventContext, obstacle: Obstacle) => {
            this.obstacles.set(Number(obstacle.id), obstacle);
        }
        this.dbConnection.db.obstacle.onUpdate(obstacleUpdateCallback);
        
        const obstacleDeleteCallback = (_ctx: EventContext, obstacle: Obstacle) => {
            this.obstacles.delete(Number(obstacle.id));
        }
        this.dbConnection.db.obstacle.onDelete(obstacleDeleteCallback);
        
        // Handle terrain data
        const terrainCallback = (_ctx: EventContext, terrain: Terrain) => {
            this.terrain.set(Number(terrain.id), terrain);
        }
        this.dbConnection.db.terrain.onInsert(terrainCallback);
        
        const terrainUpdateCallback = (_ctx: EventContext, terrain: Terrain) => {
            this.terrain.set(Number(terrain.id), terrain);
        }
        this.dbConnection.db.terrain.onUpdate(terrainUpdateCallback);
        
        const terrainDeleteCallback = (_ctx: EventContext, terrain: Terrain) => {
            this.terrain.delete(Number(terrain.id));
        }
        this.dbConnection.db.terrain.onDelete(terrainDeleteCallback);
        
        // Handle action data to extract game states
        const actionCallback = (_ctx: EventContext, action: any) => {
            // If the action has state data (units, terrains, obstacles)
            if (action.units || action.terrains || action.obstacles) {
                this.actionStates.set(Number(action.timestamp), action);
            }
        }
        this.dbConnection.db.action.onInsert(actionCallback);
        
        this.renderer = new Renderer(this.ctx, this.units, this.obstacles, this.terrain);
        handleInput(this.dbConnection, this.canvasLayers.overlay, this.units);
        
        // Create UI elements
        this.createUI();
    }

    private createCanvasLayer(width: number, height: number, zIndex: number): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.style.position = 'absolute';
        canvas.style.left = '0';
        canvas.style.top = '0';
        canvas.style.zIndex = zIndex.toString();
        this.canvasContainer.appendChild(canvas);
        return canvas;
    }

    start() {
        this.update();
    }

    update() {
        if (this.selectedAction) {
            // Draw from selected action state
            this.renderer.drawFromActionState(this.selectedAction);
        } else {
            // Draw from live data
            this.renderer.draw();
        }
        requestAnimationFrame(() => this.update());
    }

    private createUI() {
        // Create main container
        const mainContainer = document.createElement('div');
        mainContainer.style.display = 'flex';
        mainContainer.style.flexDirection = 'column';
        mainContainer.style.gap = '20px';
        mainContainer.style.padding = '20px';

        // Create top section for canvas and action log
        const topSection = document.createElement('div');
        topSection.style.display = 'flex';
        topSection.style.gap = '20px';

        // Create canvas section
        const canvasSection = document.createElement('div');
        canvasSection.style.width = '600px';
        canvasSection.style.height = '400px';
        canvasSection.style.position = 'relative';
        canvasSection.style.backgroundColor = '#f0f0f0';
        canvasSection.style.borderRadius = '4px';
        canvasSection.style.overflow = 'hidden';

        // Detach canvas container from its current parent if it exists
        const parent = this.canvasContainer.parentElement;
        if (parent) {
            parent.removeChild(this.canvasContainer);
        }
        canvasSection.appendChild(this.canvasContainer);

        // Create log section
        const logSection = document.createElement('div');
        logSection.style.width = '250px';
        logSection.style.height = '400px';

        // Create UI section for tabs
        const uiSection = document.createElement('div');
        uiSection.style.width = '100%';
        uiSection.style.backgroundColor = '#fff';
        uiSection.style.borderRadius = '4px';
        uiSection.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';

        // Create tab container
        const tabContainer = document.createElement('div');
        tabContainer.style.display = 'flex';
        tabContainer.style.borderBottom = '1px solid #eee';

        // Create tabs
        const gameSetupTab = document.createElement('div');
        gameSetupTab.textContent = 'Game Setup';
        gameSetupTab.style.padding = '10px';
        gameSetupTab.style.cursor = 'pointer';
        gameSetupTab.style.borderBottom = '2px solid #3498db';

        const actionsTab = document.createElement('div');
        actionsTab.textContent = 'Actions';
        actionsTab.style.padding = '10px';
        actionsTab.style.cursor = 'pointer';

        // Create content panels
        const gameSetupContent = document.createElement('div');
        gameSetupContent.style.padding = '20px';
        gameSetupContent.style.display = 'block';

        const actionsContent = document.createElement('div');
        actionsContent.style.padding = '20px';
        actionsContent.style.display = 'none';

        // Add tab click handlers
        gameSetupTab.addEventListener('click', () => {
            gameSetupTab.style.borderBottom = '2px solid #3498db';
            actionsTab.style.borderBottom = 'none';
            gameSetupContent.style.display = 'block';
            actionsContent.style.display = 'none';
        });

        actionsTab.addEventListener('click', () => {
            actionsTab.style.borderBottom = '2px solid #3498db';
            gameSetupTab.style.borderBottom = 'none';
            actionsContent.style.display = 'block';
            gameSetupContent.style.display = 'none';
        });

        // Assemble tabs
        tabContainer.appendChild(gameSetupTab);
        tabContainer.appendChild(actionsTab);
        uiSection.appendChild(tabContainer);
        uiSection.appendChild(gameSetupContent);
        uiSection.appendChild(actionsContent);

        // Initialize components
        new GameSetupTab(gameSetupContent, this.dbConnection, this.canvasLayers.overlay);
        new ActionsTab(actionsContent, this.dbConnection);
        new ActionLog(logSection, this.dbConnection, this);

        // Assemble layout
        topSection.appendChild(canvasSection);
        topSection.appendChild(logSection);
        mainContainer.appendChild(topSection);
        mainContainer.appendChild(uiSection);

        // Add to DOM
        if (parent) {
            parent.appendChild(mainContainer);
        } else {
            document.body.appendChild(mainContainer);
        }
    }

    // Draw from a specific action state instead of live data
    public drawFromGameState(actionId: string | null) {
        if (actionId === null) {
            // Reset to live data
            this.selectedAction = null;
            return;
        }
        
        const action = this.actionStates.get(Number(actionId));
        if (action) {
            this.selectedAction = action;
        } else {
            console.error(`Action with ID ${actionId} not found`);
        }
    }

    private handleAction(action: any) {
        if (action.action_type === 'DICE_ROLL') {
            // Store the game state at this action
            this.actionStates.set(Number(action.timestamp), {
                units: this.units,
                obstacles: this.obstacles,
                terrain: this.terrain
            });
        }
    }
}

