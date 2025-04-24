import { DbConnection } from '../module_bindings';
import { Chat } from '../components/Chat';

export class ActionsTab {
    private container: HTMLDivElement;
    private dbConnection: DbConnection;
    private game_id: bigint;

    constructor(container: HTMLDivElement, dbConnection: DbConnection, game_id: bigint) {
        this.container = container;
        this.dbConnection = dbConnection;
        this.game_id = game_id;
        this.createContent();
    }

    private createContent() {
        // Create main content container
        const contentContainer = document.createElement('div');
        contentContainer.style.display = 'flex';
        contentContainer.style.flexDirection = 'column';
        contentContainer.style.gap = '20px';
        contentContainer.style.height = '100%';

        // Create actions section
        const actionsSection = document.createElement('div');
        actionsSection.style.display = 'grid';
        actionsSection.style.gap = '10px';
        
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
            this.dbConnection.reducers.rollDice(this.game_id);
        });
        
        actionsSection.appendChild(rollButton);
        
        // Add result display
        const resultDisplay = document.createElement('div');
        resultDisplay.style.marginTop = '10px';
        resultDisplay.style.padding = '10px';
        resultDisplay.style.backgroundColor = '#fff';
        resultDisplay.style.borderRadius = '4px';
        resultDisplay.textContent = 'Roll the dice to see results in the Action Log';
        
        actionsSection.appendChild(resultDisplay);

        // Create chat section
        const chatSection = document.createElement('div');
        chatSection.style.flexGrow = '1';
        chatSection.style.minHeight = '200px';
        chatSection.style.maxHeight = '300px';

        // Add sections to content container
        contentContainer.appendChild(actionsSection);
        contentContainer.appendChild(chatSection);

        // Initialize chat component
        new Chat(chatSection, this.dbConnection, this.game_id);

        // Add content container to main container
        this.container.appendChild(contentContainer);
    }
} 