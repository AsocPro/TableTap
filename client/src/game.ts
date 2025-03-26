import { rollD6 } from "./dice";
import { Renderer } from "./renderer";
import { handleInput } from "./input";
import { DbConnection } from './module_bindings';
import type { EventContext, Unit, Terrain, Obstacle } from './module_bindings';
import { Identity } from '@clockworklabs/spacetimedb-sdk';
//import type { DbConnection, DbConnectionBuilder, Identity, ConnectionId, Event, ReducerEvent } from '@clockworklabs/spacetimedb-sdk';


export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private units: Map<number, Unit>;
    private obstacles: Map<number, Obstacle>;
    private terrain: Map<number, Terrain>;
    private renderer: Renderer;
    private dbConnection: DbConnection;
    private deleteMode: boolean = false;

    constructor(canvasId: string) {
        this.dbConnection = DbConnection.builder()
            .withUri('ws://localhost:3000') // Replace with your server address
            //.withUri('ws://nubita.asoc.pro:3002') // Replace with your server address
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
        
        // Create tabs for different object types
        const tabContainer = document.createElement('div');
        tabContainer.style.display = 'flex';
        tabContainer.style.marginBottom = '10px';
        
        const tabs = ['Unit', 'Obstacle', 'Terrain'];
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
            
            // Populate content based on tab
            this.populateTabContent(contentPanel, tabName.toLowerCase());
        });
        
        uiContainer.appendChild(tabContainer);
        contentPanels.forEach(panel => uiContainer.appendChild(panel));
        
        // Create delete button
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete Mode';
        deleteButton.style.marginTop = '10px';
        deleteButton.style.padding = '8px 16px';
        deleteButton.style.backgroundColor = '#ccc';
        deleteButton.style.border = 'none';
        deleteButton.style.borderRadius = '5px';
        deleteButton.style.cursor = 'pointer';
        
        deleteButton.addEventListener('click', () => {
            this.deleteMode = !this.deleteMode;
            deleteButton.style.backgroundColor = this.deleteMode ? '#ff6b6b' : '#ccc';
            
            if (this.deleteMode) {
                this.canvas.style.cursor = 'crosshair';
                this.setupDeleteListener();
            } else {
                this.canvas.style.cursor = 'default';
                this.removeDeleteListener();
            }
        });
        
        uiContainer.appendChild(deleteButton);
        
        // Append UI to the document
        const canvasParent = this.canvas.parentElement;
        if (canvasParent) {
            canvasParent.insertBefore(uiContainer, this.canvas.nextSibling);
        } else {
            document.body.appendChild(uiContainer);
        }
    }
    
    private populateTabContent(container: HTMLDivElement, type: string) {
        const form = document.createElement('form');
        form.style.display = 'grid';
        form.style.gridTemplateColumns = 'auto 1fr';
        form.style.gap = '8px';
        form.style.alignItems = 'center';
        
        let fields: {name: string, type: string, value: any}[] = [];
        
        // Define fields based on object type
        switch (type) {
            case 'unit':
                fields = [
                    { name: 'x', type: 'number', value: 100 },
                    { name: 'y', type: 'number', value: 100 },
                    { name: 'size', type: 'number', value: 28 },
                    { name: 'color', type: 'color', value: '#3498db' }
                ];
                break;
            case 'obstacle':
            case 'terrain':
                fields = [
                    { name: 'x', type: 'number', value: 100 },
                    { name: 'y', type: 'number', value: 100 },
                    { name: 'length', type: 'number', value: 100 },
                    { name: 'height', type: 'number', value: 50 }
                ];
                break;
        }
        
        // Create input fields
        const inputs: { [key: string]: HTMLInputElement } = {};
        fields.forEach(field => {
            const label = document.createElement('label');
            label.textContent = field.name.charAt(0).toUpperCase() + field.name.slice(1) + ':';
            
            const input = document.createElement('input');
            input.type = field.type;
            input.value = field.value;
            input.id = `${type}-${field.name}`;
            inputs[field.name] = input;
            
            form.appendChild(label);
            form.appendChild(input);
        });
        
        // Create add button
        const addButton = document.createElement('button');
        addButton.textContent = `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
        addButton.type = 'button';
        addButton.style.gridColumn = '1 / span 2';
        addButton.style.marginTop = '10px';
        addButton.style.padding = '8px';
        addButton.style.backgroundColor = '#4CAF50';
        addButton.style.color = 'white';
        addButton.style.border = 'none';
        addButton.style.borderRadius = '4px';
        addButton.style.cursor = 'pointer';
        
        // Add event listener to the button
        addButton.addEventListener('click', () => {
            switch (type) {
                case 'unit':
                    const color = inputs['color'].value;
                    const hexToName: {[key: string]: string} = {
                        '#3498db': 'blue',
                        '#e74c3c': 'red',
                        '#2ecc71': 'green',
                        '#f39c12': 'orange',
                        '#9b59b6': 'purple'
                    };
                    
                    const colorName = hexToName[color] || color;
                    this.dbConnection.reducers.addUnit(
                        BigInt(Date.now()), // Use timestamp as ID
                        parseInt(inputs['x'].value),
                        parseInt(inputs['y'].value),
                        parseInt(inputs['size'].value),
                        colorName
                    );
                    break;
                case 'obstacle':
                    this.dbConnection.reducers.addObstacle(
                        BigInt(Date.now()),
                        parseInt(inputs['x'].value),
                        parseInt(inputs['y'].value),
                        parseInt(inputs['length'].value),
                        parseInt(inputs['height'].value)
                    );
                    break;
                case 'terrain':
                    this.dbConnection.reducers.addTerrain(
                        BigInt(Date.now()),
                        parseInt(inputs['x'].value),
                        parseInt(inputs['y'].value),
                        parseInt(inputs['length'].value),
                        parseInt(inputs['height'].value)
                    );
                    break;
            }
        });
        
        form.appendChild(addButton);
        container.appendChild(form);
    }
    
    private deleteListener = (e: MouseEvent) => {
        if (!this.deleteMode) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if click is on a unit
        this.units.forEach((unit) => {
            const centerX = unit.x + unit.size/2;
            const centerY = unit.y + unit.size/2;
            const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            
            if (distance <= unit.size/2) {
                this.dbConnection.reducers.deleteUnit(unit.id);
                return;
            }
        });
        
        // Check if click is on an obstacle
        this.obstacles.forEach((obstacle) => {
            if (x >= obstacle.x && x <= obstacle.x + obstacle.length &&
                y >= obstacle.y && y <= obstacle.y + obstacle.height) {
                this.dbConnection.reducers.deleteObstacle(obstacle.id);
                return;
            }
        });
        
        // Check if click is on terrain
        this.terrain.forEach((terrain) => {
            if (x >= terrain.x && x <= terrain.x + terrain.length &&
                y >= terrain.y && y <= terrain.y + terrain.height) {
                this.dbConnection.reducers.deleteTerrain(terrain.id);
                return;
            }
        });
    };
    
    private setupDeleteListener() {
        this.canvas.addEventListener('click', this.deleteListener);
    }
    
    private removeDeleteListener() {
        this.canvas.removeEventListener('click', this.deleteListener);
    }
}

