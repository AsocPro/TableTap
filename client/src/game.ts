import { Renderer } from "./renderer";
import { handleInput } from "./input";
import { DbConnection } from './module_bindings';
import type { EventContext, Unit, Terrain, Obstacle, GameState } from './module_bindings';
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
    private selectedGameState: GameState | null = null;
    private gameStates: Map<string, GameState> = new Map();
    private selectedAction: any = null;
    private actionStates: Map<Timestamp, any> = new Map();

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
                this.actionStates.set(action.timestamp, action);
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
        // Store a reference to the parent before we detach the canvas container
        const canvasParent = this.canvasContainer.parentElement;
        
        // Create the main layout container
        const mainContainer = document.createElement('div');
        mainContainer.style.margin = '0 auto';
        mainContainer.style.maxWidth = '1200px';
        
        // Create a top section container for canvas and log side by side
        const topSection = document.createElement('div');
        topSection.style.display = 'flex';
        topSection.style.marginBottom = '20px';
        
        // Detach canvas container from its current parent before adding it to the new parent
        if (this.canvasContainer.parentElement) {
            this.canvasContainer.parentElement.removeChild(this.canvasContainer);
        }
        
        // 1. Left section (canvas)
        const canvasSection = document.createElement('div');
        canvasSection.style.flex = '0 0 600px';
        canvasSection.appendChild(this.canvasContainer);
        
        // 2. Right section (action log)
        const logSection = document.createElement('div');
        logSection.style.flex = '0 0 250px';
        logSection.style.height = '400px'; // Match canvas height
        logSection.style.margin = '0 0 0 20px';
        
        // Initialize the action log with a reference to the game instance
        new ActionLog(logSection, this.dbConnection, this);
        
        // Add canvas and log to top section
        topSection.appendChild(canvasSection);
        topSection.appendChild(logSection);
        
        // 3. Bottom section (UI tabs)
        const uiSection = document.createElement('div');
        uiSection.style.width = '600px'; // Match canvas width
        uiSection.style.padding = '10px';
        uiSection.style.backgroundColor = '#f0f0f0';
        uiSection.style.borderRadius = '5px';
        
        // Create tabs for different sections
        const tabContainer = document.createElement('div');
        tabContainer.style.display = 'flex';
        tabContainer.style.marginBottom = '10px';
        
        const tabs = ['Game Setup', 'Actions'];
        const tabElements: HTMLDivElement[] = [];
        const contentPanels: HTMLDivElement[] = [];
        
        tabs.forEach((tabName, index) => {
            const tab = document.createElement('div');
            tab.textContent = tabName;
            tab.style.padding = '8px 16px';
            tab.style.backgroundColor = index === 0 ? '#ddd' : '#ccc';
            tab.style.cursor = 'pointer';
            tab.style.borderRadius = '5px 5px 0 0';
            tab.style.marginRight = '2px';
            
            tab.addEventListener('click', () => {
                tabElements.forEach((t, i) => {
                    t.style.backgroundColor = i === index ? '#ddd' : '#ccc';
                });
                
                contentPanels.forEach((panel, i) => {
                    panel.style.display = i === index ? 'block' : 'none';
                });
            });
            
            tabElements.push(tab);
            tabContainer.appendChild(tab);
            
            // Create content panel for each tab
            const contentPanel = document.createElement('div');
            contentPanel.style.display = index === 0 ? 'block' : 'none';
            contentPanel.style.padding = '10px';
            contentPanel.style.backgroundColor = '#ddd';
            contentPanel.style.borderRadius = '0 5px 5px 5px';
            
            contentPanels.push(contentPanel);
            
            // Initialize tab content
            if (tabName === 'Game Setup') {
                new GameSetupTab(contentPanel, this.dbConnection, this.canvasLayers.overlay);
            } else if (tabName === 'Actions') {
                new ActionsTab(contentPanel, this.dbConnection);
            }
        });
        
        uiSection.appendChild(tabContainer);
        contentPanels.forEach(panel => uiSection.appendChild(panel));
        
        // Assemble the layout - top section first, then tabs below
        mainContainer.appendChild(topSection);
        mainContainer.appendChild(uiSection);
        
        // Add the main container to the parent
        if (canvasParent) {
            canvasParent.appendChild(mainContainer);
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
        
        const action = this.actionStates.get(actionId);
        if (action) {
            this.selectedAction = action;
        } else {
            console.error(`Action with ID ${actionId} not found`);
        }
    }
}

