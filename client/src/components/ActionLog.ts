import { DbConnection } from '../module_bindings';
import { Game } from '../game';
import type { Timestamp } from '@clockworklabs/spacetimedb-sdk';

export class ActionLog {
    private container: HTMLDivElement;
    private logContainer: HTMLDivElement;
    private dbConnection: DbConnection;
    private logEntries: HTMLDivElement[] = [];
    private activeEntry: HTMLDivElement | null = null;
    private gameInstance: Game;
    private MAX_ENTRIES = 100;

    constructor(container: HTMLDivElement, dbConnection: DbConnection, gameInstance: Game) {
        this.container = container;
        this.dbConnection = dbConnection;
        this.gameInstance = gameInstance;
        this.logContainer = this.createLogViewer();
        this.setupActionListeners();
    }

    private createLogViewer(): HTMLDivElement {
        const logViewerContainer = document.createElement('div');
        logViewerContainer.style.height = '100%';
        logViewerContainer.style.display = 'flex';
        logViewerContainer.style.flexDirection = 'column';
        
        const logTitle = document.createElement('h3');
        logTitle.textContent = 'Action Log';
        logTitle.style.margin = '0 0 10px 0';
        
        const logContainer = document.createElement('div');
        logContainer.style.backgroundColor = '#f8f8f8';
        logContainer.style.border = '1px solid #ddd';
        logContainer.style.borderRadius = '4px';
        logContainer.style.padding = '10px';
        logContainer.style.flexGrow = '1';
        logContainer.style.overflowY = 'auto';
        logContainer.style.fontFamily = 'monospace';
        logContainer.style.fontSize = '14px';
        
        // Add reset button at the bottom
        const resetButton = document.createElement('button');
        resetButton.textContent = 'Clear History View';
        resetButton.style.marginTop = '10px';
        resetButton.style.padding = '5px 10px';
        resetButton.style.backgroundColor = '#f44336';
        resetButton.style.color = 'white';
        resetButton.style.border = 'none';
        resetButton.style.borderRadius = '4px';
        resetButton.style.cursor = 'pointer';
        resetButton.style.width = '100%';
        
        resetButton.addEventListener('click', () => {
            this.resetView();
        });
        
        logViewerContainer.appendChild(logTitle);
        logViewerContainer.appendChild(logContainer);
        logViewerContainer.appendChild(resetButton);
        this.container.appendChild(logViewerContainer);
        
        return logContainer;
    }
    
    private setupActionListeners() {
        // Listen for new action entries
        const actionCallback = (_ctx: any, action: any) => {
            try {
                this.addLogEntry(action);
            } catch (error) {
                console.error("Error processing action:", error);
            }
        };
        
        // Check if action table exists in the db connection
        if (this.dbConnection.db.action) {
            this.dbConnection.db.action.onInsert(actionCallback);
        } else {
            console.error("Action table is not available in the database connection");
            
            // Create a placeholder in the log viewer
            const placeholderEntry = document.createElement('div');
            placeholderEntry.style.padding = '10px';
            placeholderEntry.style.color = '#999';
            placeholderEntry.textContent = 'Waiting for action data...';
            this.logContainer.appendChild(placeholderEntry);
        }
    }
    
    private addLogEntry(action: any) {
        try {
            // Create log entry element
            const logEntry = document.createElement('div');
            logEntry.style.padding = '8px';
            logEntry.style.marginBottom = '5px';
            logEntry.style.borderBottom = '1px solid #eee';
            logEntry.style.cursor = 'pointer';
            logEntry.style.transition = 'background-color 0.2s';
            
            try {
                // Format timestamp
                const date = Date(action.timestamp);// Convert nanoseconds to milliseconds
                const formattedTime = date.toLocaleString();
                
                // Create content based on action type
                let content = '';
                
                switch (action.actionType) {
                    case 'DICE_ROLL':
                        logEntry.style.backgroundColor = '#e6f7ff';
                        content = `<strong>${action.description}</strong>`;
                        break;
                    default:
                        logEntry.style.backgroundColor = '#f5f5f5';
                        content = action.description || 'Unknown action';
                }
                
                logEntry.innerHTML = `<div><span style="color: #666;">[${formattedTime}]</span> ${content}</div>`;
                
                // Check if this action has embedded game state data
                if (action.gameState) {
                    // Make the entry clickable to show this game state
                    logEntry.addEventListener('click', () => {
                        this.activateGameState(action.timestamp, logEntry);
                    });
                    
                    // Add visual indicator that it's clickable
                    logEntry.style.borderLeft = '4px solid #1e88e5';
                    logEntry.title = 'Click to view game state at this point';
                    
                    // Add hover effect
                    logEntry.addEventListener('mouseover', () => {
                        if (this.activeEntry !== logEntry) {
                            logEntry.style.backgroundColor = '#d1e7ff';
                        }
                    });
                    
                    logEntry.addEventListener('mouseout', () => {
                        if (this.activeEntry !== logEntry) {
                            logEntry.style.backgroundColor = '#e6f7ff';
                        }
                    });
                }
            } catch (error) {
                // If we had an error formatting, still show something
                console.error("Error formatting log entry:", error);
                logEntry.textContent = `Action at ${action.timestamp}: ${action.description || 'No description'}`;
            }
            
            // Add to log container at the top
            if (this.logContainer.firstChild) {
                this.logContainer.insertBefore(logEntry, this.logContainer.firstChild);
            } else {
                this.logContainer.appendChild(logEntry);
            }
            
            // Store entry in array
            this.logEntries.unshift(logEntry);
            
            // Limit entries to keep performance good
            if (this.logEntries.length > this.MAX_ENTRIES) {
                // Remove oldest entry
                const oldestEntry = this.logEntries.pop();
                if (oldestEntry && oldestEntry.parentNode) {
                    oldestEntry.parentNode.removeChild(oldestEntry);
                }
            }
        } catch (error) {
            console.error("Error adding log entry:", error);
        }
    }
    
    private activateGameState(gameStateId: any, logEntry: HTMLDivElement) {
        // First, restore previous active entry if exists
        if (this.activeEntry) {
            this.activeEntry.style.backgroundColor = '#e6f7ff';
            this.activeEntry.style.fontWeight = 'normal';
        }
        
        // Mark this entry as active
        logEntry.style.backgroundColor = '#bbdefb';
        logEntry.style.fontWeight = 'bold';
        this.activeEntry = logEntry;
        
        // Tell the game to use this game state
        this.gameInstance.drawFromGameState(gameStateId);
    }
    
    private resetView() {
        // Return to current state view
        if (this.activeEntry) {
            this.activeEntry.style.backgroundColor = '#e6f7ff';
            this.activeEntry.style.fontWeight = 'normal';
            this.activeEntry = null;
        }
        
        // Tell the game to use live data
        this.gameInstance.drawFromGameState(null);
    }
} 