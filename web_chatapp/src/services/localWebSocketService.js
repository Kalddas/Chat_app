// Local WebSocket simulation for development/testing
class LocalWebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.isConnecting = false;
    this.connectionState = 'disconnected';
    this.messages = [];
    this.connectedUsers = new Set();
    this.typingUsers = new Map();
  }

  connect(userId, token) {
    console.log('Local WebSocket: Simulating connection for user:', userId);
    
    this.isConnecting = true;
    this.connectionState = 'connecting';
    
    // Simulate connection delay
    setTimeout(() => {
      this.socket = { 
        readyState: 1, // WebSocket.OPEN
        send: (data) => this.handleLocalSend(data),
        close: () => this.handleLocalClose()
      };
      
      this.connectionState = 'connected';
      this.isConnecting = false;
      this.connectedUsers.add(userId);
      
      console.log('Local WebSocket: Connected successfully');
      this.emit('connected', { type: 'open' });
      
      // Simulate receiving a welcome message
      setTimeout(() => {
        this.handleLocalMessage({
          event: 'welcome',
          data: {
            message: 'Connected to local WebSocket simulation',
            userId: 'system',
            timestamp: new Date().toISOString()
          }
        });
      }, 1000);
      
    }, 1000);
  }

  handleLocalSend(data) {
    console.log('Local WebSocket: Sending message:', data);
    
    try {
      const message = typeof data === 'string' ? JSON.parse(data) : data;
      
      // Simulate message processing
      if (message.event === 'chat_message') {
        // Broadcast to all connected users (simulation)
        setTimeout(() => {
          this.handleLocalMessage({
            event: 'chat_message',
            data: {
              ...message.data,
              messageId: `local_${Date.now()}_${Math.random()}`,
              timestamp: new Date().toISOString()
            }
          });
        }, 100);
      } else if (message.event === 'typing') {
        // Handle typing indicators
        setTimeout(() => {
          this.handleLocalMessage({
            event: 'typing',
            data: {
              ...message.data,
              timestamp: new Date().toISOString()
            }
          });
        }, 50);
      }
      
    } catch (error) {
      console.error('Local WebSocket: Error processing message:', error);
    }
  }

  handleLocalMessage(message) {
    console.log('Local WebSocket: Received message:', message);
    this.emit('message', message);
    
    if (message.event) {
      this.emit(message.event, message);
    }
  }

  handleLocalClose() {
    console.log('Local WebSocket: Connection closed');
    this.connectionState = 'disconnected';
    this.socket = null;
    this.emit('disconnected', { type: 'close' });
  }

  disconnect() {
    if (this.socket) {
      this.handleLocalClose();
    }
  }

  send(data) {
    if (this.socket && this.socket.readyState === 1) {
      this.handleLocalSend(data);
      return true;
    } else {
      console.warn('Local WebSocket: Not connected, cannot send message');
      return false;
    }
  }

  // WebSocket actions
  sendMessage(conversationId, userId, message, messageId) {
    return this.send({
      event: 'chat_message',
      data: {
        conversation_id: conversationId,
        user_id: userId,
        message: message,
        message_id: messageId,
        timestamp: new Date().toISOString()
      }
    });
  }

  sendTyping(conversationId, userId, isTyping) {
    return this.send({
      event: 'typing',
      data: {
        conversation_id: conversationId,
        user_id: userId,
        is_typing: isTyping,
        timestamp: new Date().toISOString()
      }
    });
  }

  joinConversation(conversationId, userId) {
    return this.send({
      event: 'join_conversation',
      data: {
        conversation_id: conversationId,
        user_id: userId,
        timestamp: new Date().toISOString()
      }
    });
  }

  leaveConversation(conversationId, userId) {
    return this.send({
      event: 'leave_conversation',
      data: {
        conversation_id: conversationId,
        user_id: userId,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Event listener management
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
          console.error(`Error in Local WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Get connection status
  getConnectionState() {
    return this.connectionState;
  }

  // Check if connected
  isConnected() {
    return this.socket && this.socket.readyState === 1;
  }
}

// Create a singleton instance
const localWebSocketService = new LocalWebSocketService();

export default localWebSocketService;
