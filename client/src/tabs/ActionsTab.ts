import { DbConnection } from '../module_bindings';

export class ActionsTab {
    private container: HTMLDivElement;
    private dbConnection: DbConnection;

    constructor(container: HTMLDivElement, dbConnection: DbConnection) {
        this.container = container;
        this.dbConnection = dbConnection;
        this.createContent();
    }

    private createContent() {
        const actionsContainer = document.createElement('div');
        actionsContainer.style.display = 'grid';
        actionsContainer.style.gap = '10px';
        
        // Create dice roll button
        const rollButton = document.createElement('button');
        rollButton.textContent = 'Roll Dice';
        rollButton.style.padding = '8px 16px';
        rollButton.style.backgroundColor = '#3498db';
        rollButton.style.color = 'white';
        rollButton.style.border = 'none';
        rollButton.style.borderRadius = '4px';
        rollButton.style.cursor = 'pointer';
        
        rollButton.addEventListener('click', () => {
            // Server-side reducer is roll_dice but TypeScript binding might have converted it to camelCase
            this.dbConnection.reducers.rollDice();
        });
        
        actionsContainer.appendChild(rollButton);
        this.container.appendChild(actionsContainer);
        
        // Add result display
        const resultDisplay = document.createElement('div');
        resultDisplay.style.marginTop = '10px';
        resultDisplay.style.padding = '10px';
        resultDisplay.style.backgroundColor = '#fff';
        resultDisplay.style.borderRadius = '4px';
        resultDisplay.textContent = 'Roll the dice to see results in the Action Log';
        
        actionsContainer.appendChild(resultDisplay);
    }
} 