import { DbConnection } from '../module_bindings';

export class Chat {
    private container: HTMLDivElement;
    private dbConnection: DbConnection;
    private messageContainer!: HTMLDivElement;
    private messageInput!: HTMLInputElement;
    private sendButton!: HTMLButtonElement;
    private MAX_MESSAGES = 100;
    private game_id: bigint;

    constructor(container: HTMLDivElement, dbConnection: DbConnection, game_id: bigint) {
        this.container = container;
        this.dbConnection = dbConnection;
        this.game_id = game_id;
        this.createChatInterface();
        this.setupMessageListener();
    }

    private createChatInterface() {
        // Create chat container
        const chatContainer = document.createElement('div');
        chatContainer.style.height = '100%';
        chatContainer.style.display = 'flex';
        chatContainer.style.flexDirection = 'column';
        chatContainer.style.backgroundColor = '#fff';
        chatContainer.style.borderRadius = '4px';
        chatContainer.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';

        // Create title
        const title = document.createElement('h3');
        title.textContent = 'Chat';
        title.style.margin = '0 0 10px 0';
        title.style.padding = '10px';
        title.style.borderBottom = '1px solid #eee';

        // Create message container
        this.messageContainer = document.createElement('div');
        this.messageContainer.style.flexGrow = '1';
        this.messageContainer.style.overflowY = 'auto';
        this.messageContainer.style.padding = '10px';
        this.messageContainer.style.display = 'flex';
        this.messageContainer.style.flexDirection = 'column-reverse'; // Newest messages at bottom

        // Create input container
        const inputContainer = document.createElement('div');
        inputContainer.style.padding = '10px';
        inputContainer.style.borderTop = '1px solid #eee';
        inputContainer.style.display = 'flex';
        inputContainer.style.gap = '10px';

        // Create message input
        this.messageInput = document.createElement('input');
        this.messageInput.type = 'text';
        this.messageInput.placeholder = 'Type a message...';
        this.messageInput.style.flexGrow = '1';
        this.messageInput.style.padding = '8px';
        this.messageInput.style.border = '1px solid #ddd';
        this.messageInput.style.borderRadius = '4px';

        // Create send button
        this.sendButton = document.createElement('button');
        this.sendButton.textContent = 'Send';
        this.sendButton.style.padding = '8px 16px';
        this.sendButton.style.backgroundColor = '#3498db';
        this.sendButton.style.color = 'white';
        this.sendButton.style.border = 'none';
        this.sendButton.style.borderRadius = '4px';
        this.sendButton.style.cursor = 'pointer';

        // Add event listeners
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Assemble the interface
        inputContainer.appendChild(this.messageInput);
        inputContainer.appendChild(this.sendButton);
        chatContainer.appendChild(title);
        chatContainer.appendChild(this.messageContainer);
        chatContainer.appendChild(inputContainer);
        this.container.appendChild(chatContainer);
    }

    private setupMessageListener() {
        // Listen for new action entries
        const actionCallback = (_ctx: any, action: any) => {
            if (action.action_type === 'CHAT_MESSAGE') {
                this.addMessage(action);
            }
        };

        if (this.dbConnection.db.action) {
            this.dbConnection.db.action.onInsert(actionCallback);
        }
    }

    private sendMessage() {
        const message = this.messageInput.value.trim();
        if (message) {
            // Call the chat_message reducer
            this.dbConnection.reducers.chatMessage(this.game_id, message);
            this.messageInput.value = '';
        }
    }

    private addMessage(action: any) {
        const messageElement = document.createElement('div');
        messageElement.style.padding = '8px';
        messageElement.style.marginBottom = '5px';
        messageElement.style.backgroundColor = '#f8f9fa';
        messageElement.style.borderRadius = '4px';
        messageElement.style.maxWidth = '80%';

        // Format timestamp
        const timestamp = new Date(Number(action.timestamp));
        const timeString = timestamp.toLocaleTimeString();

        // Create message content
        messageElement.innerHTML = `
            <div style="font-size: 0.8em; color: #666; margin-bottom: 4px;">${timeString}</div>
            <div>${action.description}</div>
        `;

        // Add to message container
        this.messageContainer.appendChild(messageElement);

        // Scroll to bottom
        this.messageContainer.scrollTop = this.messageContainer.scrollHeight;

        // Limit number of messages
        while (this.messageContainer.children.length > this.MAX_MESSAGES) {
            this.messageContainer.removeChild(this.messageContainer.firstChild!);
        }
    }
} 