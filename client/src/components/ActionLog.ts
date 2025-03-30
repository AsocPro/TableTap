import { DbConnection } from '../module_bindings';

export class ActionLog {
    private container: HTMLDivElement;
    private logContainer: HTMLDivElement;
    private dbConnection: DbConnection;
    private logEntries: Map<number, HTMLDivElement> = new Map();

    constructor(container: HTMLDivElement, dbConnection: DbConnection) {
        this.container = container;
        this.dbConnection = dbConnection;
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
        
        logViewerContainer.appendChild(logTitle);
        logViewerContainer.appendChild(logContainer);
        this.container.appendChild(logViewerContainer);
        
        return logContainer;
    }
    
    private setupActionListeners() {
        // Listen for new action entries
        const actionCallback = (_ctx: any, action: any) => {
            this.addLogEntry(action);
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
        
        // Create log entry element
        const logEntry = document.createElement('div');
        logEntry.style.padding = '5px';
        logEntry.style.marginBottom = '5px';
        logEntry.style.borderBottom = '1px solid #eee';
        
        // Format timestamp
        const date =  Date(action.timestamp); // Convert nanoseconds to milliseconds
        const formattedTime = date.toLocaleString();
        
        // Create content based on action type
        let content = '';
        logEntry.style.backgroundColor = '#e6f7ff';
        content = `<strong>${action.description}</strong>`;
        
        logEntry.innerHTML = `<div><span style="color: #666;">[${formattedTime}]</span> ${content}</div>`;
        
        // Add to log container at the top
        if (this.logContainer.firstChild) {
            this.logContainer.insertBefore(logEntry, this.logContainer.firstChild);
        } else {
            this.logContainer.appendChild(logEntry);
        }
        
        // Store in map
        this.logEntries.set(action.timestamp, logEntry);
        
        // Limit entries to keep performance good
        if (this.logEntries.size > 100) {
            // Remove oldest entries
            const oldestTimestamp = Math.min(...this.logEntries.keys());
            const oldestEntry = this.logEntries.get(oldestTimestamp);
            if (oldestEntry && oldestEntry.parentNode) {
                oldestEntry.parentNode.removeChild(oldestEntry);
            }
            this.logEntries.delete(oldestTimestamp);
        }
    }
} 