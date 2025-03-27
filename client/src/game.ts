import { rollD6 } from "./dice";
import { Renderer } from "./renderer";
import { handleInput } from "./input";
import { DbConnection } from './module_bindings';
import type { EventContext, Unit, Terrain, Obstacle } from './module_bindings';
import { Identity } from '@clockworklabs/spacetimedb-sdk';
import { GameSetupTab } from './tabs/GameSetupTab';
import { ActionsTab } from './tabs/ActionsTab';

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private units: Map<number, Unit>;
    private obstacles: Map<number, Obstacle>;
    private terrain: Map<number, Terrain>;
    private renderer: Renderer;
    private dbConnection: DbConnection;

    constructor(canvasId: string) {
        this.dbConnection = DbConnection.builder()
            .withUri('ws://localhost:3000')
            .withModuleName('tabletap')
            .onConnect((dbConnection, identity, token) => {
                dbConnection.subscriptionBuilder()
                    .onApplied((ctx) => {
                        console.log("Subscription applied");
                    })
                    .subscribe(["SELECT * FROM unit", "SELECT * FROM obstacle", "SELECT * FROM terrain"]);
            })
            .build();

        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = this.canvas.getContext("2d")!;
        this.canvas.width = 600;
        this.canvas.height = 400;
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
        
        this.renderer = new Renderer(this.ctx, this.units, this.obstacles, this.terrain);
        handleInput(this.dbConnection, this.canvas, this.units);
        
        // Create UI elements
        this.createUI();
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
    
    private createUI() {
        // Create container for the UI
        const uiContainer = document.createElement('div');
        uiContainer.style.width = '600px';
        uiContainer.style.margin = '10px auto';
        uiContainer.style.padding = '10px';
        uiContainer.style.backgroundColor = '#f0f0f0';
        uiContainer.style.borderRadius = '5px';
        
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
                new GameSetupTab(contentPanel, this.dbConnection, this.canvas);
            } else if (tabName === 'Actions') {
                new ActionsTab(contentPanel, this.dbConnection);
            }
        });
        
        uiContainer.appendChild(tabContainer);
        contentPanels.forEach(panel => uiContainer.appendChild(panel));
        
        // Append UI to the document
        const canvasParent = this.canvas.parentElement;
        if (canvasParent) {
            canvasParent.insertBefore(uiContainer, this.canvas.nextSibling);
        } else {
            document.body.appendChild(uiContainer);
        }
    }
}

