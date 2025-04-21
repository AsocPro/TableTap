import { DbConnection } from '../module_bindings';

export class GameSetupTab {
    private container: HTMLDivElement;
    private dbConnection: DbConnection;
    private deleteMode: boolean = false;
    private deleteOneMode: boolean = false;
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
        setupContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
        setupContainer.style.gap = '20px';
        
        // Create forms for each object type
        ['unit', 'terrain'].forEach(type => {
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
            
            // Add traversable checkbox for terrain
            if (type === 'terrain') {
                const traversableCheckbox = document.createElement('input');
                traversableCheckbox.type = 'checkbox';
                traversableCheckbox.id = 'traversable';
                traversableCheckbox.name = 'traversable';
                inputs['traversable'] = traversableCheckbox;
                
                const label = document.createElement('label');
                label.htmlFor = 'traversable';
                label.textContent = 'Traversable';
                form.appendChild(label);
                form.appendChild(traversableCheckbox);
            }
            
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
                            parseInt(inputs['x']?.value || '100'),
                            parseInt(inputs['y']?.value || '100'),
                            parseInt(inputs['size']?.value || '28'),
                            colorName
                        );
                        break;
                    case 'terrain':
                        // Rectangle terrain by default, but you could add UI for other types
                        const shapeType = 1; // Assuming 1 = Rectangle, or use the correct enum value from your bindings
                        this.dbConnection.reducers.addTerrain(
                            shapeType,
                            [parseInt(inputs['length']?.value || '100'), parseInt(inputs['height']?.value || '50')],
                            colorName,
                            [
                                { x: parseInt(inputs['x']?.value || '100'), y: parseInt(inputs['y']?.value || '100') }
                            ],
                            (inputs['traversable'] as HTMLInputElement).checked
                        );
                        break;
                }
            });
            
            form.appendChild(addButton);
            setupContainer.appendChild(form);
        });
        
        this.container.appendChild(setupContainer);

        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'grid';
        buttonContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
        buttonContainer.style.gap = '20px';
        buttonContainer.style.marginTop = '20px';
        
        // Create delete one button
        const deleteOneButton = document.createElement('button');
        deleteOneButton.textContent = 'Delete One';
        deleteOneButton.style.padding = '8px 16px';
        deleteOneButton.style.backgroundColor = '#ccc';
        deleteOneButton.style.border = 'none';
        deleteOneButton.style.borderRadius = '5px';
        deleteOneButton.style.cursor = 'pointer';
        
        // Create delete multiple button
        const deleteMultipleButton = document.createElement('button');
        deleteMultipleButton.textContent = 'Delete Multiple';
        deleteMultipleButton.style.padding = '8px 16px';
        deleteMultipleButton.style.backgroundColor = '#ccc';
        deleteMultipleButton.style.border = 'none';
        deleteMultipleButton.style.borderRadius = '5px';
        deleteMultipleButton.style.cursor = 'pointer';
        
        // Create clear button
        const clearButton = document.createElement('button');
        clearButton.textContent = 'Clear All';
        clearButton.style.padding = '8px 16px';
        clearButton.style.backgroundColor = '#ff4444';
        clearButton.style.color = 'white';
        clearButton.style.border = 'none';
        clearButton.style.borderRadius = '5px';
        clearButton.style.cursor = 'pointer';
        
        // Add event listeners
        deleteOneButton.addEventListener('click', () => {
            if (this.deleteOneMode) {
                // If already in delete one mode, turn it off
                this.deleteOneMode = false;
                this.deleteMode = false;
                deleteOneButton.style.backgroundColor = '#ccc';
                deleteMultipleButton.style.backgroundColor = '#ccc';
                this.canvas.style.cursor = 'default';
                this.removeDeleteListener();
            } else {
                // Turn on delete one mode
                this.deleteOneMode = true;
                this.deleteMode = false;
                deleteOneButton.style.backgroundColor = '#ff6b6b';
                deleteMultipleButton.style.backgroundColor = '#ccc';
                this.canvas.style.cursor = 'crosshair';
                this.setupDeleteListener();
            }
        });
        
        deleteMultipleButton.addEventListener('click', () => {
            if (this.deleteMode) {
                // If already in delete multiple mode, turn it off
                this.deleteMode = false;
                this.deleteOneMode = false;
                deleteMultipleButton.style.backgroundColor = '#ccc';
                deleteOneButton.style.backgroundColor = '#ccc';
                this.canvas.style.cursor = 'default';
                this.removeDeleteListener();
            } else {
                // Turn on delete multiple mode
                this.deleteMode = true;
                this.deleteOneMode = false;
                deleteMultipleButton.style.backgroundColor = '#ff6b6b';
                deleteOneButton.style.backgroundColor = '#ccc';
                this.canvas.style.cursor = 'crosshair';
                this.setupDeleteListener();
            }
        });
        
        clearButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete all objects? This action cannot be undone.')) {
                this.dbConnection.reducers.deleteAll();
                // Reset delete modes
                this.deleteMode = false;
                this.deleteOneMode = false;
                deleteOneButton.style.backgroundColor = '#ccc';
                deleteMultipleButton.style.backgroundColor = '#ccc';
                this.canvas.style.cursor = 'default';
                this.removeDeleteListener();
            }
        });
        
        buttonContainer.appendChild(deleteOneButton);
        buttonContainer.appendChild(deleteMultipleButton);
        buttonContainer.appendChild(clearButton);
        this.container.appendChild(buttonContainer);
    }

    private deleteListener = (e: MouseEvent | TouchEvent) => {
        if (!this.deleteMode && !this.deleteOneMode) return;
        
        const rect = this.canvas.getBoundingClientRect();
        let x: number;
        let y: number;

        if ('touches' in e && e.touches.length > 0) {
            const touch = e.touches[0]!;
            x = touch.clientX - rect.left;
            y = touch.clientY - rect.top;
        } else if (e instanceof MouseEvent) {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        } else {
            return;
        }
        
        // Send coordinates to server for deletion
        this.dbConnection.reducers.deleteAtCoordinates(x, y);
        
        // If in delete one mode, turn it off after one deletion
        if (this.deleteOneMode) {
            this.deleteOneMode = false;
            this.canvas.style.cursor = 'default';
            this.removeDeleteListener();
            // Reset the delete one button color
            const deleteOneButton = this.container.querySelector('button:nth-child(1)') as HTMLButtonElement;
            if (deleteOneButton) {
                deleteOneButton.style.backgroundColor = '#ccc';
            }
        }
    };
    
    private setupDeleteListener() {
        this.canvas.addEventListener('click', this.deleteListener);
        this.canvas.addEventListener('touchstart', this.deleteListener, { passive: false });
    }
    
    private removeDeleteListener() {
        this.canvas.removeEventListener('click', this.deleteListener);
        this.canvas.removeEventListener('touchstart', this.deleteListener);
    }
} 