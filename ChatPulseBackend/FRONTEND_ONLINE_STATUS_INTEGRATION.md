# Frontend Integration Guide - Online Status

## Problem Identified

Users show as "Offline" because the frontend is not calling the backend frequently enough to update `last_seen_at`.

## Solution

The frontend needs to implement a "heartbeat" mechanism that periodically calls the backend to update online status.

## New API Endpoint

### POST /api/user/heartbeat
Updates the authenticated user's `last_seen_at` timestamp.

**Request:**
```bash
POST http://127.0.0.1:8000/api/user/heartbeat
Authorization: Bearer {token}
```

**Response:**
```json
{
  "status": "success",
  "is_online": true,
  "online_status": "Online",
  "last_seen_at": "2026-02-25 14:45:00"
}
```

**Purpose:**
- Keeps user's online status updated
- Should be called every 30-60 seconds
- Automatically updates `last_seen_at` in database

## Frontend Implementation

### 1. Create Heartbeat Service

```javascript
// services/heartbeatService.js
class HeartbeatService {
  constructor() {
    this.intervalId = null;
    this.intervalMs = 30000; // 30 seconds
  }

  start(token) {
    if (this.intervalId) {
      this.stop(); // Clear existing interval
    }

    // Send initial heartbeat
    this.sendHeartbeat(token);

    // Set up periodic heartbeat
    this.intervalId = setInterval(() => {
      this.sendHeartbeat(token);
    }, this.intervalMs);

    console.log('Heartbeat service started');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Heartbeat service stopped');
    }
  }

  async sendHeartbeat(token) {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/user/heartbeat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Heartbeat sent:', data.online_status);
        return data;
      } else {
        console.error('Heartbeat failed:', response.status);
      }
    } catch (error) {
      console.error('Heartbeat error:', error);
    }
  }
}

export default new HeartbeatService();
```

### 2. Start Heartbeat on Login

```javascript
// In your login component or auth service
import heartbeatService from './services/heartbeatService';

async function handleLogin(email, password) {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
      // Store token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Start heartbeat service
      heartbeatService.start(data.token);

      // Navigate to chat
      navigate('/chat');
    }
  } catch (error) {
    console.error('Login error:', error);
  }
}
```

### 3. Stop Heartbeat on Logout

```javascript
// In your logout function
import heartbeatService from './services/heartbeatService';

async function handleLogout() {
  try {
    const token = localStorage.getItem('token');

    // Stop heartbeat first
    heartbeatService.stop();

    // Call logout API
    await fetch('http://127.0.0.1:8000/api/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Navigate to login
    navigate('/login');
  } catch (error) {
    console.error('Logout error:', error);
  }
}
```

### 4. Resume Heartbeat on Page Load

```javascript
// In your App.jsx or main component
import { useEffect } from 'react';
import heartbeatService from './services/heartbeatService';

function App() {
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    
    if (token) {
      // Resume heartbeat service
      heartbeatService.start(token);
    }

    // Cleanup on unmount
    return () => {
      heartbeatService.stop();
    };
  }, []);

  return (
    // Your app components
  );
}
```

### 5. Handle Page Visibility

```javascript
// Pause heartbeat when tab is hidden, resume when visible
import { useEffect } from 'react';
import heartbeatService from './services/heartbeatService';

function App() {
  useEffect(() => {
    const handleVisibilityChange = () => {
      const token = localStorage.getItem('token');
      
      if (document.hidden) {
        // Tab is hidden - optionally stop heartbeat to save resources
        console.log('Tab hidden - heartbeat continues');
        // heartbeatService.stop(); // Uncomment to stop when hidden
      } else {
        // Tab is visible - ensure heartbeat is running
        if (token) {
          heartbeatService.start(token);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    // Your app components
  );
}
```

## React Hook Implementation

```javascript
// hooks/useHeartbeat.js
import { useEffect } from 'react';
import heartbeatService from '../services/heartbeatService';

export function useHeartbeat(token) {
  useEffect(() => {
    if (token) {
      heartbeatService.start(token);
    }

    return () => {
      heartbeatService.stop();
    };
  }, [token]);
}

// Usage in component
function ChatApp() {
  const token = localStorage.getItem('token');
  useHeartbeat(token);

  return (
    // Your chat UI
  );
}
```

## Polling for Other Users' Status

```javascript
// services/onlineStatusService.js
class OnlineStatusService {
  constructor() {
    this.pollIntervalId = null;
    this.pollIntervalMs = 30000; // 30 seconds
    this.listeners = new Set();
  }

  startPolling(token) {
    if (this.pollIntervalId) {
      this.stopPolling();
    }

    // Poll immediately
    this.pollConversations(token);

    // Set up periodic polling
    this.pollIntervalId = setInterval(() => {
      this.pollConversations(token);
    }, this.pollIntervalMs);

    console.log('Online status polling started');
  }

  stopPolling() {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
      console.log('Online status polling stopped');
    }
  }

  async pollConversations(token) {
    try {
      const userId = JSON.parse(localStorage.getItem('user')).id;
      const response = await fetch(`http://127.0.0.1:8000/api/chat/users/${userId}/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Notify all listeners
        this.listeners.forEach(listener => {
          listener(data.conversations);
        });

        return data;
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}

export default new OnlineStatusService();
```

## Complete React Example

```jsx
// App.jsx
import { useEffect, useState } from 'react';
import heartbeatService from './services/heartbeatService';
import onlineStatusService from './services/onlineStatusService';

function ChatApp() {
  const [conversations, setConversations] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;

    // Start heartbeat for current user
    heartbeatService.start(token);

    // Start polling for other users' status
    onlineStatusService.startPolling(token);

    // Subscribe to status updates
    const unsubscribe = onlineStatusService.subscribe((updatedConversations) => {
      setConversations(updatedConversations);
    });

    // Cleanup
    return () => {
      heartbeatService.stop();
      onlineStatusService.stopPolling();
      unsubscribe();
    };
  }, [token]);

  return (
    <div className="chat-app">
      <h1>Conversations</h1>
      {conversations.map(conv => (
        <div key={conv.conversation_id} className="conversation-item">
          <div className="user-info">
            <img src={conv.user.profile_picture_url} alt={conv.user.first_name} />
            <div>
              <h3>{conv.user.first_name} {conv.user.last_name}</h3>
              <div className="online-status">
                <span className={`status-dot ${conv.user.is_online ? 'online' : 'offline'}`} />
                <span>{conv.user.online_status}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

## CSS for Online Status

```css
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 5px;
}

.status-dot.online {
  background-color: #22c55e;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
  animation: pulse 2s infinite;
}

.status-dot.offline {
  background-color: #94a3b8;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.online-status {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: #64748b;
}
```

## Testing the Integration

### 1. Manual Test with cURL

```bash
# Login
curl -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@test.com","password":"password123"}'

# Save token as TOKEN

# Send heartbeat
curl -X POST http://127.0.0.1:8000/api/user/heartbeat \
  -H "Authorization: Bearer $TOKEN"

# Check conversations (should show user as online)
curl -X GET http://127.0.0.1:8000/api/chat/users/1/conversations \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Browser Console Test

```javascript
// In browser console after login
const token = localStorage.getItem('token');

// Send heartbeat
fetch('http://127.0.0.1:8000/api/user/heartbeat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log('Heartbeat:', data));

// Check conversations
const userId = JSON.parse(localStorage.getItem('user')).id;
fetch(`http://127.0.0.1:8000/api/chat/users/${userId}/conversations`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log('Conversations:', data));
```

## Troubleshooting

### Users Still Show Offline

1. **Check if heartbeat is running:**
   ```javascript
   console.log('Heartbeat running:', heartbeatService.intervalId !== null);
   ```

2. **Check network tab:**
   - Look for POST requests to `/api/user/heartbeat`
   - Should see requests every 30 seconds
   - Check response status (should be 200)

3. **Check backend:**
   ```bash
   php diagnose-online-issue.php
   ```

### Messages Not Delivering

1. **Check conversation exists:**
   - Users must have an accepted chat request
   - Conversation must be created

2. **Check message API:**
   ```bash
   curl -X POST http://127.0.0.1:8000/api/chat/conversations/1/messages/send \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"text":"Test message","receiver_id":2}'
   ```

3. **Check for errors in browser console**

## Performance Considerations

### Heartbeat Frequency
- **30 seconds:** Good balance (recommended)
- **60 seconds:** Lower server load, less accurate
- **15 seconds:** More accurate, higher server load

### Optimization
```javascript
// Only send heartbeat if tab is visible
if (!document.hidden) {
  heartbeatService.sendHeartbeat(token);
}

// Increase interval when tab is hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    heartbeatService.setInterval(120000); // 2 minutes
  } else {
    heartbeatService.setInterval(30000); // 30 seconds
  }
});
```

## Summary

✅ **Backend Ready:**
- Heartbeat endpoint created: `POST /api/user/heartbeat`
- Middleware updates `last_seen_at` on any API request
- Online status detection working

✅ **Frontend Needs:**
- Implement heartbeat service (call every 30 seconds)
- Start heartbeat on login
- Stop heartbeat on logout
- Poll conversations to get other users' status

✅ **Quick Fix for Testing:**
Run this to set users online manually:
```bash
php set-users-online.php 1 2 3 4
```

Then refresh the frontend - users should show as "Online"!
