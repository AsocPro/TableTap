import { DbConnection } from '../module_bindings';
import { ShapeType } from '../module_bindings/shape_type_type';

export class GameSetupTab {
    private container: HTMLDivElement;
    private dbConnection: DbConnection;
    private deleteMode: boolean = false;
    private deleteOneMode: boolean = false;
    private canvas: HTMLCanvasElement;
    private game_id: bigint;

    constructor(container: HTMLDivElement, dbConnection: DbConnection, canvas: HTMLCanvasElement, game_id: bigint) {
        this.container = container;
        this.dbConnection = dbConnection;
        this.canvas = canvas;
        this.game_id = game_id;
        this.createContent();
    }

    private createContent() {
        const setupContainer = document.createElement('div');
        setupContainer.style.display = 'flex';
        setupContainer.style.flexDirection = 'column';
        setupContainer.style.gap = '20px';
        
        // Top-level form
        const form = document.createElement('form');
        form.style.backgroundColor = '#fff';
        form.style.padding = '10px';
        form.style.display = 'flex';
        form.style.flexDirection = 'column';
        form.style.gap = '10px';

        // What to add
        const whatToAddLabel = document.createElement('label');
        whatToAddLabel.textContent = 'Add type:';
        const whatToAddSelect = document.createElement('select');
        whatToAddSelect.innerHTML = `
            <option value="unit">Unit</option>
            <option value="terrain">Terrain</option>
            <option value="underlay">Underlay</option>
            <option value="overlay">Overlay</option>
        `;
        form.appendChild(whatToAddLabel);
        form.appendChild(whatToAddSelect);

        // Shape type
        const shapeTypeLabel = document.createElement('label');
        shapeTypeLabel.textContent = 'Shape Type:';
        const shapeTypeSelect = document.createElement('select');
        shapeTypeSelect.innerHTML = `
            <option value="Circle">Circle</option>
            <option value="Rectangle">Rectangle</option>
            <option value="Line">Line</option>
            <option value="Polygon">Polygon</option>
        `;
        form.appendChild(shapeTypeLabel);
        form.appendChild(shapeTypeSelect);

        // Dynamic fields container
        const dynamicFields = document.createElement('div');
        dynamicFields.style.display = 'flex';
        dynamicFields.style.flexDirection = 'column';
        dynamicFields.style.gap = '8px';
        form.appendChild(dynamicFields);

        // Helper to clear and generate fields
        function generateFields() {
            dynamicFields.innerHTML = '';
            const shapeType = shapeTypeSelect.value;
            const whatToAdd = whatToAddSelect.value;
            // Position fields
            if (shapeType === 'Circle' || shapeType === 'Rectangle') {
                dynamicFields.appendChild(makeNumberField('x', 100));
                dynamicFields.appendChild(makeNumberField('y', 100));
            } else if (shapeType === 'Line') {
                dynamicFields.appendChild(makeNumberField('x1', 100));
                dynamicFields.appendChild(makeNumberField('y1', 100));
                dynamicFields.appendChild(makeNumberField('x2', 200));
                dynamicFields.appendChild(makeNumberField('y2', 200));
            } else if (shapeType === 'Polygon') {
                // For simplicity, ask for 3 points
                for (let i = 1; i <= 3; ++i) {
                    dynamicFields.appendChild(makeNumberField(`x${i}`, 100 * i));
                    dynamicFields.appendChild(makeNumberField(`y${i}`, 100 * i));
                }
            }
            // Size fields
            if (shapeType === 'Circle') {
                dynamicFields.appendChild(makeNumberField('size', 28));
            } else if (shapeType === 'Rectangle') {
                dynamicFields.appendChild(makeNumberField('width', 100));
                dynamicFields.appendChild(makeNumberField('height', 50));
            } else if (shapeType === 'Line') {
                dynamicFields.appendChild(makeNumberField('thickness', 1));
            } else if (shapeType === 'Polygon') {
                dynamicFields.appendChild(makeNumberField('thickness', 1));
            }
            // Color
            dynamicFields.appendChild(makeColorField('color', '#3498db'));
            // Traversable (only if terrain)
            if (whatToAdd === 'terrain') {
                const traversableDiv = document.createElement('div');
                traversableDiv.style.display = 'flex';
                traversableDiv.style.alignItems = 'center';
                const traversableCheckbox = document.createElement('input');
                traversableCheckbox.type = 'checkbox';
                traversableCheckbox.id = 'traversable';
                traversableCheckbox.name = 'traversable';
                const traversableLabel = document.createElement('label');
                traversableLabel.htmlFor = 'traversable';
                traversableLabel.textContent = 'Traversable';
                traversableDiv.appendChild(traversableLabel);
                traversableDiv.appendChild(traversableCheckbox);
                dynamicFields.appendChild(traversableDiv);
            }
        }

        function makeNumberField(name: string, defaultValue: number) {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            const label = document.createElement('label');
            label.textContent = name + ':';
            label.style.width = '80px';
            const input = document.createElement('input');
            input.type = 'number';
            input.name = name;
            input.value = defaultValue.toString();
            input.style.marginLeft = '8px';
            div.appendChild(label);
            div.appendChild(input);
            return div;
        }
        function makeColorField(name: string, defaultValue: string) {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            const label = document.createElement('label');
            label.textContent = name + ':';
            label.style.width = '80px';
            const input = document.createElement('input');
            input.type = 'color';
            input.name = name;
            input.value = defaultValue;
            input.style.marginLeft = '8px';
            div.appendChild(label);
            div.appendChild(input);
            return div;
        }

        whatToAddSelect.addEventListener('change', generateFields);
        shapeTypeSelect.addEventListener('change', generateFields);
        generateFields(); // Initial call

        // Add button
        const addButton = document.createElement('button');
        addButton.textContent = 'Add';
        addButton.type = 'button';
        addButton.style.marginTop = '10px';
        form.appendChild(addButton);

        addButton.addEventListener('click', () => {
            // Gather values
            const whatToAdd = whatToAddSelect.value;
            const shapeType = shapeTypeSelect.value;
            const fields: {[k: string]: string} = {};
            for (const input of form.querySelectorAll('input')) {
                fields[input.name] = input.value;
            }
            // Color name
            const color = fields['color'] || '#3498db';
            const hexToName: {[key: string]: string} = {
                '#3498db': 'blue',
                '#e74c3c': 'red',
                '#2ecc71': 'green',
                '#f39c12': 'orange',
                '#9b59b6': 'purple'
            };
            const colorName = hexToName[color] || color;
            // Position and size by shape
            let size: number[] = [];
            let position: any[] = [];
            if (shapeType === 'Circle') {
                size = [parseInt(fields['size'] || '28')];
                position = [{ x: parseInt(fields['x'] || '100'), y: parseInt(fields['y'] || '100') }];
            } else if (shapeType === 'Rectangle') {
                size = [parseInt(fields['width'] || '100'), parseInt(fields['height'] || '50')];
                position = [{ x: parseInt(fields['x'] || '100'), y: parseInt(fields['y'] || '100') }];
            } else if (shapeType === 'Line') {
                size = [parseInt(fields['thickness'] || '1')];
                position = [
                    { x: parseInt(fields['x1'] || '100'), y: parseInt(fields['y1'] || '100') },
                    { x: parseInt(fields['x2'] || '200'), y: parseInt(fields['y2'] || '200') }
                ];
            } else if (shapeType === 'Polygon') {
                size = [parseInt(fields['thickness'] || '1')];
                position = [
                    { x: parseInt(fields['x1'] || '100'), y: parseInt(fields['y1'] || '100') },
                    { x: parseInt(fields['x2'] || '200'), y: parseInt(fields['y2'] || '200') },
                    { x: parseInt(fields['x3'] || '300'), y: parseInt(fields['y3'] || '300') }
                ];
            }
            // ShapeType enum mapping (should match backend)
            const shapeTypeEnum: {[k: string]: any} = {
                'Circle': ShapeType.Circle,
                'Rectangle': ShapeType.Rectangle,
                'Line': ShapeType.Line,
                'Polygon': ShapeType.Polygon
            };
            // Dispatch to correct reducer
            if (whatToAdd === 'unit') {
                this.dbConnection.reducers.addUnit(
                    this.game_id,
                    shapeTypeEnum[shapeType],
                    size,
                    colorName,
                    position
                );
            } else if (whatToAdd === 'terrain') {
                const traversable = !!form.querySelector('input[name=traversable]') && (form.querySelector('input[name=traversable]') as HTMLInputElement).checked;
                this.dbConnection.reducers.addTerrain(
                    this.game_id,
                    shapeTypeEnum[shapeType],
                    size,
                    colorName,
                    position,
                    traversable
                );
            } else if (whatToAdd === 'underlay') {
                this.dbConnection.reducers.addUnderlay(
                    this.game_id,
                    shapeTypeEnum[shapeType],
                    size,
                    colorName,
                    position
                );
            } else if (whatToAdd === 'overlay') {
                this.dbConnection.reducers.addOverlay(
                    this.game_id,
                    shapeTypeEnum[shapeType],
                    size,
                    colorName,
                    position
                );
            }
        });

        setupContainer.appendChild(form);
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
                this.dbConnection.reducers.deleteAll(this.game_id);
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
        this.dbConnection.reducers.deleteAtCoordinates(this.game_id, x, y);
        
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