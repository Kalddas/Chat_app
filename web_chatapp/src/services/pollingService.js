class PollingService {
    constructor() {
        this.pollingInterval = null;
        this.isPolling = false;
        this.listeners = new Map();
        this.lastMessageId = null;
    }

    startPolling(conversationId, interval = 2000) {
        if (this.isPolling) {
            return;
        }

        console.log('Starting message polling...');
        this.isPolling = true;
        
        this.pollingInterval = setInterval(async () => {
            try {
                await this.fetchNewMessages(conversationId);
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, interval);
    }

    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        this.isPolling = false;
        console.log('Stopped message polling');
    }

    async fetchNewMessages(conversationId) {
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            
            if (!token || !user.id) {
                return;
            }

            const response = await fetch(
                `http://localhost:8000/api/chat/conversations/${selectedChat}/messages?user_id=${user.id}&since=${this.lastMessageId || ''}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                const messages = Array.isArray(data) ? data : (data.messages || []);
                
                // Process new messages
                messages.forEach(message => {
                    if (!this.lastMessageId || message.id > this.lastMessageId) {
                        this.lastMessageId = message.id;
                        
                        // Emit message event
                        this.emit('message', {
                            event: 'chat_message',
                            data: {
                                message_id: message.id,
                                conversation_id: conversationId,
                                user_id: message.user_id,
                                message: message.message,
                                timestamp: message.created_at,
                                user: {
                                    id: message.user_id,
                                    first_name: message.user?.first_name || 'Unknown'
                                }
                            }
                        });
                    }
                });
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    }

    // Event emitter methods
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in polling callback:', error);
                }
            });
        }
    }

    isConnected() {
        return this.isPolling;
    }

    getConnectionState() {
        return this.isPolling ? 'connected' : 'disconnected';
    }
}

// Create and export a singleton instance
const pollingService = new PollingService();
export default pollingService;
