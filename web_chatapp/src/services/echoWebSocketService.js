import echo from './echo';

class EchoWebSocketService {
    constructor() {
        this.connectionState = 'disconnected';
        this.listeners = new Map();
        this.subscribedChannels = new Map();
        this.userId = null;
        this.token = null;
    }

    connect(userId, token) {
        this.userId = userId;
        this.token = token;
        
        console.log('Connecting to local Laravel Echo Soketi...', {
            wsHost: '127.0.0.1',
            wsPort: 6001,
            key: '89pbiicfbhrz8hbnb8ai'
        });
        
        // Update auth headers with current token
        if (echo.connector && echo.connector.pusher) {
            echo.connector.pusher.config.auth.headers.Authorization = `Bearer ${token}`;
        }

        // Listen for connection events
        echo.connector.pusher.connection.bind('connecting', () => {
            console.log('Echo connecting...');
            this.connectionState = 'connecting';
        });

        echo.connector.pusher.connection.bind('connected', () => {
            console.log('Echo connected successfully');
            this.connectionState = 'connected';
            this.emit('connected');
        });

        echo.connector.pusher.connection.bind('disconnected', () => {
            console.log('Echo disconnected');
            this.connectionState = 'disconnected';
            this.emit('disconnected');
        });

        echo.connector.pusher.connection.bind('error', (error) => {
            console.error('Echo connection error:', error);
            this.connectionState = 'error';
            this.emit('error', error);
        });

        echo.connector.pusher.connection.bind('unavailable', () => {
            console.error('Echo connection unavailable');
            this.connectionState = 'unavailable';
            this.emit('error', new Error('Connection unavailable'));
        });

        // Subscribe to public chat channel for real-time messages
        this.subscribeToPublicChat();
    }

    subscribeToPublicChat() {
        const channel = echo.channel('public-chat');
        
        channel.listen('ChatEvent', (data) => {
            console.log('Received chat message via Echo:', data);
            
            // Transform Laravel Echo data to our format
            const messageData = {
                event: 'chat_message',
                data: {
                    message_id: data.id,
                    conversation_id: data.conversation_id || 'public', // You might need to adjust this
                    user_id: data.user.id,
                    message: data.message,
                    timestamp: new Date(data.created_at).toISOString(),
                    user: data.user
                }
            };
            
            this.emit('message', messageData);
        });

        this.subscribedChannels.set('public-chat', channel);
    }

    subscribeToPrivateChat(conversationId) {
        const channelName = `private-chat.${conversationId}`;
        
        if (this.subscribedChannels.has(channelName)) {
            return; // Already subscribed
        }

        const channel = echo.private(channelName);
        
        channel.listen('ChatEvent', (data) => {
            console.log('Received private chat message via Echo:', data);
            
            const messageData = {
                event: 'chat_message',
                data: {
                    message_id: data.id,
                    conversation_id: conversationId,
                    user_id: data.user.id,
                    message: data.message,
                    timestamp: new Date(data.created_at).toISOString(),
                    user: data.user
                }
            };
            
            this.emit('message', messageData);
        });

        this.subscribedChannels.set(channelName, channel);
    }

    unsubscribeFromChannel(channelName) {
        const channel = this.subscribedChannels.get(channelName);
        if (channel) {
            echo.leaveChannel(channelName);
            this.subscribedChannels.delete(channelName);
        }
    }

    sendMessage(conversationId, userId, message, messageId) {
        // For now, we'll rely on the API to send messages
        // Laravel Echo is primarily for receiving real-time updates
        console.log('Message sending should be handled via API, Echo is for receiving');
        return true;
    }

    sendTyping(conversationId, userId, isTyping) {
        // You can implement typing indicators via Echo if needed
        console.log('Typing indicator:', { conversationId, userId, isTyping });
        return true;
    }

    joinConversation(conversationId, userId) {
        console.log('Joining conversation via Echo:', conversationId);
        this.subscribeToPrivateChat(conversationId);
        return true;
    }

    leaveConversation(conversationId, userId) {
        console.log('Leaving conversation via Echo:', conversationId);
        this.unsubscribeFromChannel(`private-chat.${conversationId}`);
        return true;
    }

    disconnect() {
        console.log('Disconnecting from Echo...');
        
        // Unsubscribe from all channels
        this.subscribedChannels.forEach((channel, channelName) => {
            echo.leaveChannel(channelName);
        });
        this.subscribedChannels.clear();
        
        // Disconnect Echo
        if (echo.connector && echo.connector.pusher) {
            echo.connector.pusher.disconnect();
        }
        
        this.connectionState = 'disconnected';
        this.userId = null;
        this.token = null;
    }

    isConnected() {
        return this.connectionState === 'connected';
    }

    getConnectionState() {
        return this.connectionState;
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
                    console.error('Error in event callback:', error);
                }
            });
        }
    }
}

// Create and export a singleton instance
const echoWebSocketService = new EchoWebSocketService();
export default echoWebSocketService;
