import { Renderer } from "./renderer";
import { handleInput } from "./input";
import { DbConnection } from './module_bindings';
import type { EventContext, Unit, Terrain, Underlay, Overlay, GameState } from './module_bindings';
import { Identity, Timestamp } from '@clockworklabs/spacetimedb-sdk';
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
    private dirtyLayers: {
        terrain: boolean;
        units: boolean;
        underlay: boolean;
        overlay: boolean;
    }
    private currentGameState: GameState;
    private renderer: Renderer;
    private dbConnection: DbConnection;
    private selectedAction: number | null = null;
    private actionStates: Map<number, GameState> = new Map();
    private renderScheduled: boolean;

    constructor(canvasId: string) {
        this.dbConnection = DbConnection.builder()
            .withUri('ws://localhost:3000')
            .withModuleName('tabletap')
            .onConnect((dbConnection, identity, token) => {
                dbConnection.subscriptionBuilder()
                    .onApplied((ctx) => {
                        console.log("Subscription applied");
                    })
                    .subscribe([
                        "SELECT * FROM unit", 
                        "SELECT * FROM terrain", 
                        "SELECT * FROM action",
                        "SELECT * FROM underlay",
                        "SELECT * FROM overlay"
                    ]);
            })
            .build();

        // Initialize empty game state
        this.currentGameState = {
            terrains: [],
            units: [],
            underlays: [],
            overlays: []
        };

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

        this.dirtyLayers = {
          terrain: false,
          units: false,
          underlay: false,
          overlay: false,
        };
    
        this.renderScheduled = false;
        
        // Initialize renderer with empty game state
        this.renderer = new Renderer(this.ctx);
        
        // Set up database callbacks
        this.setupDatabaseCallbacks();
        
        // Set up input handling
        handleInput(this.dbConnection, this.canvasLayers.overlay, () => this.selectedAction !== null);
        
        // Create UI elements
        this.createUI();
    }

    private setupEntityCallbacks<T extends { id: bigint }>(
        collection: { 
            onInsert: (cb: (ctx: EventContext, row: T) => void) => void;
            onUpdate: (cb: (ctx: EventContext, row: T) => void) => void;
            onDelete: (cb: (ctx: EventContext, row: T) => void) => void;
        },
        entities: T[],
        layerName: 'terrain' | 'units' | 'underlay' | 'overlay'
    ) {
        const upsertCallback = (_ctx: EventContext, row: T) => {
            const index = entities.findIndex(e => e.id === row.id);
            if (index >= 0) {
                entities[index] = row;
            } else {
                entities.push(row);
            }
            this.markLayerDirty(layerName);
        };

        const deleteCallback = (_ctx: EventContext, row: T) => {
            const index = entities.findIndex(e => e.id === row.id);
            if (index >= 0) {
                entities.splice(index, 1); // Remove the item from the array in-place
                this.markLayerDirty(layerName);
            }
        };

        collection.onInsert(upsertCallback);
        collection.onUpdate(upsertCallback);
        collection.onDelete(deleteCallback);
    }

    private setupDatabaseCallbacks() {
        // Handle all entity types
        this.setupEntityCallbacks<Unit>(
            this.dbConnection.db.unit,
            this.currentGameState.units,
            'units'
        );
        
        this.setupEntityCallbacks<Terrain>(
            this.dbConnection.db.terrain,
            this.currentGameState.terrains,
            'terrain'
        );
        
        this.setupEntityCallbacks<Underlay>(
            this.dbConnection.db.underlay,
            this.currentGameState.underlays,
            'underlay'
        );
        
        this.setupEntityCallbacks<Overlay>(
            this.dbConnection.db.overlay,
            this.currentGameState.overlays,
            'overlay'
        );

        // Handle action data to extract game states
        const actionCallback = (_ctx: EventContext, action: any) => {
            if (action.gameState) {
                this.actionStates.set(action.id, action.gameState);
            }
        }
        this.dbConnection.db.action.onInsert(actionCallback);
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
    
    private markLayerDirty(layer: keyof typeof this.dirtyLayers) {
      this.dirtyLayers[layer] = true;
      if (!this.renderScheduled) {
        this.renderScheduled = true;
        requestAnimationFrame(this.render.bind(this, this.currentGameState));
      }
    }
    private forceRenderGameState(gameState: GameState) {
        for (const key of Object.keys(this.dirtyLayers)) {
            this.dirtyLayers[key as keyof typeof this.dirtyLayers] = true;
        }
        requestAnimationFrame(this.render.bind(this, gameState));
    }

    
    private render(gameState: GameState) {
      this.renderScheduled = false;
    
      if (this.dirtyLayers.terrain) {
        this.renderer.clearLayer('terrain');
        this.renderer.drawShapes(this.ctx.terrain, gameState.terrains);
        this.dirtyLayers.terrain = false;
      }
      if (this.dirtyLayers.units) {
        this.renderer.clearLayer('units');
        this.renderer.drawShapes(this.ctx.units, gameState.units);
        this.dirtyLayers.units = false;
      }
      if (this.dirtyLayers.underlay) {
        this.renderer.clearLayer('underlay');
        this.renderer.drawShapes(this.ctx.underlay, gameState.underlays);
        this.dirtyLayers.underlay = false;
      }
      if (this.dirtyLayers.overlay) {
        this.renderer.clearLayer('overlay');
        this.renderer.drawShapes(this.ctx.overlay, gameState.overlays);
        this.dirtyLayers.overlay = false;
      }
    }

    // Draw from a specific action state instead of live data
    public drawFromGameState(actionId: number | null) {
        if (actionId === null) {
            // Reset to live data
            this.selectedAction = null;
            this.forceRenderGameState(this.currentGameState);
            return;
        }
        
        if (this.actionStates.has(actionId)) {
            this.selectedAction = actionId;
            const gameState = this.actionStates.get(actionId)!;
            this.forceRenderGameState(gameState);
        } else {
            console.error(`Action with ID ${actionId} not found`);
        }
    }

    start() {
        this.forceRenderGameState(this.currentGameState);
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
}
