class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.isConnecting = false;
    this.connectionUrl = 'wss://chat-2swc.onrender.com';
    this.heartbeatInterval = null;
    this.heartbeatIntervalMs = 30000; // 30 seconds
    this.reverbConfig = {
      appId: '917573',
      appKey: '89pbiicfbhrz8hbnb8ai',
      appSecret: 'nee7rytvgel9hovtxinn',
      host: '0.0.0.0'
    };
  }

  connect(userId, token) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    if (this.isConnecting) {
      console.log('WebSocket connection already in progress');
      return;
    }

    this.isConnecting = true;
    
    try {
      // Try different connection formats
      const baseUrl = this.connectionUrl;
      
      // Try multiple connection formats
      const connectionAttempts = [
        // Format 1: With all Reverb parameters
        `${baseUrl}?userId=${userId}&token=${token}&appId=${this.reverbConfig.appId}&appKey=${this.reverbConfig.appKey}`,
        // Format 2: Simple auth only
        `${baseUrl}?userId=${userId}&token=${token}`,
        // Format 3: Just the base URL
        baseUrl,
        // Format 4: With Reverb in path
        `${baseUrl}/reverb?userId=${userId}&token=${token}&appId=${this.reverbConfig.appId}&appKey=${this.reverbConfig.appKey}`
      ];
      
      console.log('Attempting WebSocket connection...');
      console.log('User ID:', userId);
      console.log('Token:', token ? 'Present' : 'Missing');
      console.log('Connection attempts:', connectionAttempts);
      
      // Try the first connection format
      const wsUrl = connectionAttempts[0];
      console.log('Trying connection URL:', wsUrl);
      
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = (event) => {
        console.log('WebSocket connected successfully:', event);
        console.log('Connection URL:', wsUrl);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.emit('connected', event);
      };

      this.socket.onmessage = (event) => {
        try {
          console.log('Raw WebSocket message received:', event.data);
          const data = JSON.parse(event.data);
          console.log('Parsed WebSocket message:', data);
          this.emit('message', data);
          
          // Handle specific message types
          if (data.type) {
            this.emit(data.type, data);
          }
          if (data.event) {
            this.emit(data.event, data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          console.error('Raw data:', event.data);
          this.emit('error', { error: 'Failed to parse message', data: event.data });
        }
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket disconnected:', event);
        this.isConnecting = false;
        this.stopHeartbeat();
        this.emit('disconnected', event);
        
        // Attempt to reconnect if not a manual close
        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect(userId, token);
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        console.error('Error details:', {
          type: error.type,
          target: error.target,
          readyState: this.socket?.readyState,
          url: wsUrl
        });
        this.isConnecting = false;
        this.emit('error', error);
        
        // Try alternative connection methods
        this.tryAlternativeConnection(userId, token, 1);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      this.emit('error', error);
    }
  }

  scheduleReconnect(userId, token) {
    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectInterval}ms`);
    
    setTimeout(() => {
      this.connect(userId, token);
    }, this.reconnectInterval);
  }

  disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'Manual disconnect');
      this.socket = null;
    }
    this.stopHeartbeat();
    this.listeners.clear();
    this.reconnectAttempts = 0;
  }

  startHeartbeat() {
    this.stopHeartbeat(); // Clear any existing heartbeat
    this.heartbeatInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        console.log('Sending WebSocket heartbeat');
        this.send({ event: 'ping', data: { timestamp: new Date().toISOString() } });
      }
    }, this.heartbeatIntervalMs);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  tryAlternativeConnection(userId, token, attemptIndex) {
    const connectionAttempts = [
      // Format 1: With all Reverb parameters
      `${this.connectionUrl}?userId=${userId}&token=${token}&appId=${this.reverbConfig.appId}&appKey=${this.reverbConfig.appKey}`,
      // Format 2: Simple auth only
      `${this.connectionUrl}?userId=${userId}&token=${token}`,
      // Format 3: Just the base URL
      this.connectionUrl,
      // Format 4: With Reverb in path
      `${this.connectionUrl}/reverb?userId=${userId}&token=${token}&appId=${this.reverbConfig.appId}&appKey=${this.reverbConfig.appKey}`
    ];

    if (attemptIndex < connectionAttempts.length) {
      console.log(`Trying alternative connection ${attemptIndex + 1}:`, connectionAttempts[attemptIndex]);
      
      setTimeout(() => {
        try {
          this.socket = new WebSocket(connectionAttempts[attemptIndex]);
          
          this.socket.onopen = (event) => {
            console.log(`Alternative connection ${attemptIndex + 1} successful:`, event);
            this.isConnecting = false;
            this.reconnectAttempts = 0;
            this.startHeartbeat();
            this.emit('connected', event);
          };

          this.socket.onerror = (error) => {
            console.error(`Alternative connection ${attemptIndex + 1} failed:`, error);
            this.tryAlternativeConnection(userId, token, attemptIndex + 1);
          };

          this.socket.onclose = (event) => {
            console.log(`Alternative connection ${attemptIndex + 1} closed:`, event);
            this.isConnecting = false;
            this.stopHeartbeat();
            this.emit('disconnected', event);
          };

          this.socket.onmessage = (event) => {
            try {
              console.log('Raw WebSocket message received:', event.data);
              const data = JSON.parse(event.data);
              console.log('Parsed WebSocket message:', data);
              this.emit('message', data);
              
              if (data.type) {
                this.emit(data.type, data);
              }
              if (data.event) {
                this.emit(data.event, data);
              }
            } catch (error) {
              console.error('Error parsing WebSocket message:', error);
              console.error('Raw data:', event.data);
              this.emit('error', { error: 'Failed to parse message', data: event.data });
            }
          };

        } catch (error) {
          console.error(`Failed to create alternative connection ${attemptIndex + 1}:`, error);
          this.tryAlternativeConnection(userId, token, attemptIndex + 1);
        }
      }, 2000); // Wait 2 seconds before trying next connection
    } else {
      console.error('All connection attempts failed');
      this.isConnecting = false;
      this.emit('error', { error: 'All connection attempts failed' });
    }
  }

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        const message = typeof data === 'string' ? data : JSON.stringify(data);
        console.log('Sending WebSocket message:', data);
        console.log('Serialized message:', message);
        this.socket.send(message);
        console.log('WebSocket message sent successfully');
        return true;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        this.emit('error', { error: 'Failed to send message', data });
        return false;
      }
    } else {
      console.warn('WebSocket is not connected. Cannot send message:', data);
      console.warn('Socket state:', this.socket ? this.socket.readyState : 'No socket');
      return false;
    }
  }

  // Send a chat message
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

  // Send typing indicator
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

  // Join a conversation room
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

  // Leave a conversation room
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
          console.error(`Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Get connection status
  getConnectionState() {
    if (!this.socket) return 'disconnected';
    
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }

  // Check if connected
  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }
}

// Create a singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;
