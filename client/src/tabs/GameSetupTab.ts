import { DbConnection } from '../module_bindings';

export class GameSetupTab {
    private container: HTMLDivElement;
    private dbConnection: DbConnection;
    private deleteMode: boolean = false;
    private canvas: HTMLCanvasElement;

    constructor(container: HTMLDivElement, dbConnection: DbConnection, canvas: HTMLCanvasElement) {
        this.container = container;
        this.dbConnection = dbConnection;
        this.canvas = canvas;
        this.createContent();
    }

    private createContent() {
        const setupContainer = document.createElement('div');
        setupContainer.style.display = 'grid';
        setupContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
        setupContainer.style.gap = '20px';
        
        // Create forms for each object type
        ['unit', 'obstacle', 'terrain'].forEach(type => {
            const form = document.createElement('form');
            form.style.backgroundColor = '#fff';
            form.style.padding = '10px';
            form.style.borderRadius = '5px';
            
            const title = document.createElement('h3');
            title.textContent = type.charAt(0).toUpperCase() + type.slice(1);
            title.style.marginTop = '0';
            title.style.marginBottom = '10px';
            form.appendChild(title);
            
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
            const inputs: Record<string, HTMLInputElement> = {};
            fields.forEach(field => {
                const label = document.createElement('label');
                label.textContent = field.name.charAt(0).toUpperCase() + field.name.slice(1) + ':';
                label.style.display = 'block';
                label.style.marginBottom = '5px';
                
                const input = document.createElement('input');
                input.type = field.type;
                input.value = field.value;
                input.id = `${type}-${field.name}`;
                input.style.width = '100%';
                input.style.marginBottom = '10px';
                inputs[field.name] = input;
                
                form.appendChild(label);
                form.appendChild(input);
            });
            
            // Create add button
            const addButton = document.createElement('button');
            addButton.textContent = `Add ${type.charAt(0).toUpperCase() + type.slice(1)}`;
            addButton.type = 'button';
            addButton.style.width = '100%';
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
                        const color = inputs['color']?.value;
                        if (!color) return;
                        
                        const hexToName: {[key: string]: string} = {
                            '#3498db': 'blue',
                            '#e74c3c': 'red',
                            '#2ecc71': 'green',
                            '#f39c12': 'orange',
                            '#9b59b6': 'purple'
                        };
                        
                        const colorName = hexToName[color] || color;
                        this.dbConnection.reducers.addUnit(
                            BigInt(Date.now()),
                            parseInt(inputs['x']?.value || '100'),
                            parseInt(inputs['y']?.value || '100'),
                            parseInt(inputs['size']?.value || '28'),
                            colorName
                        );
                        break;
                    case 'obstacle':
                        this.dbConnection.reducers.addObstacle(
                            BigInt(Date.now()),
                            parseInt(inputs['x']?.value || '100'),
                            parseInt(inputs['y']?.value || '100'),
                            parseInt(inputs['length']?.value || '100'),
                            parseInt(inputs['height']?.value || '50')
                        );
                        break;
                    case 'terrain':
                        this.dbConnection.reducers.addTerrain(
                            BigInt(Date.now()),
                            parseInt(inputs['x']?.value || '100'),
                            parseInt(inputs['y']?.value || '100'),
                            parseInt(inputs['length']?.value || '100'),
                            parseInt(inputs['height']?.value || '50')
                        );
                        break;
                }
            });
            
            form.appendChild(addButton);
            setupContainer.appendChild(form);
        });
        
        this.container.appendChild(setupContainer);

        // Create delete button
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete Mode';
        deleteButton.style.marginTop = '20px';
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
        
        this.container.appendChild(deleteButton);
    }

    private deleteListener = (e: MouseEvent) => {
        if (!this.deleteMode) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Send coordinates to server for deletion
        this.dbConnection.reducers.deleteAtCoordinates(x, y);
    };
    
    private setupDeleteListener() {
        this.canvas.addEventListener('click', this.deleteListener);
    }
    
    private removeDeleteListener() {
        this.canvas.removeEventListener('click', this.deleteListener);
    }
} 