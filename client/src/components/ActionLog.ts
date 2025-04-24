import { DbConnection } from '../module_bindings';
import { Game } from '../game';

export class ActionLog {
    private logViewer!: HTMLDivElement;
    private game_id: bigint;

    constructor(container: HTMLElement, dbConnection: DbConnection, game_id: bigint) {
        this.game_id = game_id;
        this.createLogViewer(container);
        this.setupActionListeners(dbConnection);
    }

    private createLogViewer(container: HTMLElement) {
        // Create log viewer container
        this.logViewer = document.createElement('div');
        this.logViewer.style.cssText = `
            height: 100%;
            overflow-y: auto;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 4px;
        `;

        // Create title
        const title = document.createElement('h3');
        title.textContent = 'Action Log';
        title.style.margin = '0 0 10px 0';

        // Create log entries container
        const logEntries = document.createElement('div');
        logEntries.id = 'log-entries';

        // Create reset button
        const resetButton = document.createElement('button');
        resetButton.textContent = 'Reset View';
        resetButton.style.cssText = `
            margin-top: 10px;
            padding: 5px 10px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
        resetButton.addEventListener('click', () => this.resetView());

        // Assemble the log viewer
        this.logViewer.appendChild(title);
        this.logViewer.appendChild(logEntries);
        this.logViewer.appendChild(resetButton);
        container.appendChild(this.logViewer);
    }

    private setupActionListeners(dbConnection: DbConnection) {
        // Check if action table exists
        if (!dbConnection.db.action) {
            console.error('Action table not found');
            return;
        }

        // Listen for new action entries
        dbConnection.db.action.onInsert((_ctx, action) => {
            this.addLogEntry(action);
        });
    }

    private addLogEntry(action: any) {
        const logEntries = document.getElementById('log-entries');
        if (!logEntries) return;

        const logEntry = document.createElement('div');
        logEntry.style.cssText = `
            padding: 8px;
            margin-bottom: 5px;
            background: white;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        `;

        try {
            // Format timestamp
            const timestamp = Date(action.timestamp);
            const timeString = timestamp.toLocaleString();
            
            // Create entry content
            const content = document.createElement('div');
            content.textContent = `${timeString} - ${action.description}`;
            
            // If this action has a game state, make it clickable
            if (action.gameState) {
                logEntry.style.cursor = 'pointer';
                logEntry.style.borderLeft = '3px solid #4CAF50';
                
                logEntry.addEventListener('click', () => {
                    this.activateGameState(logEntry, action.id);
                });

                logEntry.addEventListener('mouseover', () => {
                    logEntry.style.background = '#f0f0f0';
                });

                logEntry.addEventListener('mouseout', () => {
                    logEntry.style.background = 'white';
                });
            } else {
                logEntry.style.borderLeft = '3px solid #ccc';
            }

            logEntry.appendChild(content);
            logEntries.appendChild(logEntry);
        } catch (error) {
            console.error('Error formatting log entry:', error);
            const errorEntry = document.createElement('div');
            errorEntry.textContent = 'Error displaying action';
            errorEntry.style.color = 'red';
            logEntries.appendChild(errorEntry);
        }
    }

    private activateGameState(logEntry: HTMLDivElement, actionId: number) {
        // Remove active state from all entries
        const entries = this.logViewer.querySelectorAll('div[style*="border-left: 3px solid #4CAF50"]');
        entries.forEach(entry => {
            (entry as HTMLDivElement).style.background = 'white';
        });

        // Add active state to selected entry
        logEntry.style.background = '#e8f5e9';

        // Update game state
        this.game.drawFromGameState(actionId);
    }

    private resetView() {
        // Remove active state from all entries
        const entries = this.logViewer.querySelectorAll('div[style*="border-left: 3px solid #4CAF50"]');
        entries.forEach(entry => {
            (entry as HTMLDivElement).style.background = 'white';
        });

        // Reset to current state
        this.game.drawFromGameState(null);
    }
} 