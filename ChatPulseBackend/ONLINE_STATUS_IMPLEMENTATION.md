# Online/Offline Status Implementation

## Overview
Complete implementation of online/offline status tracking with privacy controls.

## Features Implemented

### 1. Database Schema
**Columns added to `users` table:**
- `show_online_status` (boolean, default: true) - Controls if user's online status is visible
- `last_seen_at` (timestamp, nullable) - Tracks when user was last active

### 2. Middleware - UpdateLastSeen
**File:** `app/Http/Middleware/UpdateLastSeen.php`

**Functionality:**
- Automatically updates `last_seen_at` for authenticated users
- Only updates if `show_online_status` is enabled
- Throttled to update every 2 minutes (prevents excessive DB writes)
- Applied to all authenticated API routes

**Registration:**
```php
// bootstrap/app.php
$middleware->alias([
    'update.last.seen' => App\Http\Middleware\UpdateLastSeen::class,
]);

// routes/api.php
Route::middleware(['auth:sanctum', 'update.last.seen'])->group(function () {
    // Your routes
});
```

### 3. User Model Methods
**File:** `app/Models/User.php`

**New Methods:**

#### `isOnline(): bool`
Checks if user is currently online (active in last 5 minutes).

```php
$user = User::find(1);
if ($user->isOnline()) {
    echo "User is online!";
}
```

**Logic:**
- Returns `false` if `show_online_status` is disabled
- Returns `false` if `last_seen_at` is null
- Returns `true` if last seen within 5 minutes

#### `getOnlineStatusText(): string`
Returns human-readable online status text.

```php
$user = User::find(1);
echo $user->getOnlineStatusText();
// Outputs: "Online", "Offline", "Hidden", or "Last seen 10 minutes ago"
```

**Possible Values:**
- `"Hidden"` - User has disabled online status visibility
- `"Offline"` - No last_seen_at timestamp
- `"Online"` - Active in last 5 minutes
- `"Last seen X ago"` - Relative time since last activity

### 4. API Endpoints

#### Get Conversations with Online Status
```
GET /api/chat/users/{userId}/conversations
Authorization: Bearer {token}
```

**Response includes:**
```json
{
  "user_id": 1,
  "conversations": [
    {
      "conversation_id": 1,
      "user": {
        "id": 2,
        "first_name": "John",
        "last_name": "Doe",
        "user_name": "johndoe",
        "profile_picture_url": "...",
        "is_online": true,
        "online_status": "Online",
        "last_seen_at": "2026-02-25 10:30:00"
      },
      "last_message": {...},
      "unread_count": 3
    }
  ]
}
```

#### Get Chat List with Online Status
```
GET /api/chat/chat-list
Authorization: Bearer {token}
```

**Response includes:**
```json
{
  "user_id": 1,
  "chats": [
    {
      "conversation_id": 1,
      "user": {
        "id": 2,
        "first_name": "John",
        "last_name": "Doe",
        "user_name": "johndoe",
        "profile_picture_url": "...",
        "is_online": false,
        "online_status": "Last seen 2 hours ago",
        "last_seen_at": null
      },
      "last_message": {...},
      "unread_count": 0
    }
  ]
}
```

#### Toggle Online Status Visibility
```
POST /api/user/privacy/toggle-online-status
Authorization: Bearer {token}
```

**Response:**
```json
{
  "status": "success",
  "message": "Online status visibility enabled",
  "show_online_status": true
}
```

## How It Works

### Automatic Tracking
1. User makes any API request (chat, profile, etc.)
2. `UpdateLastSeen` middleware intercepts the request
3. If user has `show_online_status` enabled:
   - Check if last update was > 2 minutes ago
   - If yes, update `last_seen_at` to current timestamp
4. Request continues normally

### Privacy Control
Users can disable online status tracking:
```bash
curl -X POST http://127.0.0.1:8000/api/user/privacy/toggle-online-status \
  -H "Authorization: Bearer {token}"
```

When disabled:
- `last_seen_at` is NOT updated
- `isOnline()` returns `false`
- `getOnlineStatusText()` returns `"Hidden"`
- Other users see no online status

### Frontend Display

#### Check if User is Online
```javascript
const isUserOnline = (user) => {
  return user.is_online === true;
};

const getStatusColor = (user) => {
  if (user.is_online) return 'green';
  if (user.online_status === 'Hidden') return 'gray';
  return 'gray';
};
```

#### Display Online Status
```jsx
function UserStatus({ user }) {
  return (
    <div className="user-status">
      <div className={`status-dot ${user.is_online ? 'online' : 'offline'}`} />
      <span className="status-text">{user.online_status}</span>
    </div>
  );
}
```

#### CSS for Status Indicator
```css
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 5px;
}

.status-dot.online {
  background-color: #22c55e; /* green */
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2);
}

.status-dot.offline {
  background-color: #94a3b8; /* gray */
}
```

## Testing

### Run Test Script
```bash
php ChatPulseBackend/test-online-status.php
```

This will test:
- Database schema
- User model methods
- Online/offline detection
- Privacy settings
- Middleware registration

### Manual Testing

#### Test 1: Enable Online Status
```bash
# User A enables online status
curl -X POST http://127.0.0.1:8000/api/user/privacy/toggle-online-status \
  -H "Authorization: Bearer USER_A_TOKEN"

# User A makes some API requests (triggers middleware)
curl -X GET http://127.0.0.1:8000/api/user/profile \
  -H "Authorization: Bearer USER_A_TOKEN"

# User B checks conversations (should see User A as online)
curl -X GET http://127.0.0.1:8000/api/chat/users/2/conversations \
  -H "Authorization: Bearer USER_B_TOKEN"
```

#### Test 2: Disable Online Status
```bash
# User A disables online status
curl -X POST http://127.0.0.1:8000/api/user/privacy/toggle-online-status \
  -H "Authorization: Bearer USER_A_TOKEN"

# User A makes API requests (last_seen_at NOT updated)
curl -X GET http://127.0.0.1:8000/api/user/profile \
  -H "Authorization: Bearer USER_A_TOKEN"

# User B checks conversations (should see "Hidden" status)
curl -X GET http://127.0.0.1:8000/api/chat/users/2/conversations \
  -H "Authorization: Bearer USER_B_TOKEN"
```

#### Test 3: Check Online Status in Database
```sql
-- Check user's online status settings
SELECT id, email, show_online_status, last_seen_at 
FROM users 
WHERE id = 1;

-- Find currently online users (last 5 minutes)
SELECT id, email, last_seen_at,
       TIMESTAMPDIFF(MINUTE, last_seen_at, NOW()) as minutes_ago
FROM users 
WHERE show_online_status = 1 
  AND last_seen_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE);

-- Find users with hidden status
SELECT id, email, show_online_status 
FROM users 
WHERE show_online_status = 0;
```

## Performance Considerations

### 1. Throttled Updates
- `last_seen_at` only updates every 2 minutes
- Prevents excessive database writes
- Reduces server load

### 2. Indexed Columns
Add indexes for faster queries:
```sql
ALTER TABLE users ADD INDEX idx_last_seen (last_seen_at);
ALTER TABLE users ADD INDEX idx_show_online (show_online_status);
ALTER TABLE users ADD INDEX idx_online_status (show_online_status, last_seen_at);
```

### 3. Caching Online Users
Cache the list of online users:
```php
use Illuminate\Support\Facades\Cache;

$onlineUserIds = Cache::remember('online_users', 60, function() {
    return User::where('show_online_status', true)
        ->where('last_seen_at', '>=', now()->subMinutes(5))
        ->pluck('id')
        ->toArray();
});
```

### 4. Batch Queries
When displaying multiple users, eager load relationships:
```php
$conversations = Conversation::with(['users' => function($query) {
    $query->select('id', 'show_online_status', 'last_seen_at');
}])->get();
```

## Frontend Integration Examples

### React Hook for Online Status
```javascript
import { useState, useEffect } from 'react';

function useOnlineStatus(userId) {
  const [isOnline, setIsOnline] = useState(false);
  const [statusText, setStatusText] = useState('Offline');

  useEffect(() => {
    // Fetch user's online status
    const fetchStatus = async () => {
      const response = await fetch(`/api/chat/users/${userId}/conversations`);
      const data = await response.json();
      
      if (data.conversations.length > 0) {
        const user = data.conversations[0].user;
        setIsOnline(user.is_online);
        setStatusText(user.online_status);
      }
    };

    fetchStatus();
    
    // Poll every 30 seconds for status updates
    const interval = setInterval(fetchStatus, 30000);
    
    return () => clearInterval(interval);
  }, [userId]);

  return { isOnline, statusText };
}

// Usage
function ChatHeader({ userId }) {
  const { isOnline, statusText } = useOnlineStatus(userId);
  
  return (
    <div className="chat-header">
      <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`} />
      <span>{statusText}</span>
    </div>
  );
}
```

### Real-time Updates (with WebSocket)
If you have WebSocket server running:
```javascript
import Echo from 'laravel-echo';

const echo = new Echo({
  broadcaster: 'pusher',
  key: process.env.REACT_APP_PUSHER_KEY,
  cluster: process.env.REACT_APP_PUSHER_CLUSTER,
  wsHost: window.location.hostname,
  wsPort: 6001,
  forceTLS: false,
});

// Listen for user online status changes
echo.private(`user.${currentUserId}`)
  .listen('UserOnlineStatusChanged', (e) => {
    console.log('User status changed:', e.user_id, e.is_online);
    // Update UI
  });
```

## Security & Privacy

### 1. User Control
- Users can enable/disable online status anytime
- Setting is per-user, not global
- Default is enabled (can be changed in migration)

### 2. Privacy Respected
- If `show_online_status` is false, `last_seen_at` is NOT updated
- Other users see "Hidden" status
- No tracking when disabled

### 3. No Leaking Information
- `last_seen_at` only returned if user has enabled visibility
- API respects privacy settings
- Frontend cannot bypass privacy controls

## Troubleshooting

### Issue: last_seen_at not updating
**Possible causes:**
1. Middleware not registered
2. User has disabled `show_online_status`
3. Less than 2 minutes since last update

**Solution:**
```bash
# Check middleware registration
php artisan route:list | grep update.last.seen

# Check user settings
php artisan tinker
>>> $user = User::find(1);
>>> $user->show_online_status;
>>> $user->last_seen_at;
```

### Issue: Users always show as offline
**Possible causes:**
1. `last_seen_at` is null
2. `last_seen_at` is older than 5 minutes
3. User has disabled online status

**Solution:**
```bash
# Manually update last_seen_at
php artisan tinker
>>> $user = User::find(1);
>>> $user->last_seen_at = now();
>>> $user->show_online_status = true;
>>> $user->save();
```

### Issue: Middleware not working
**Check registration:**
```bash
php artisan route:list --columns=uri,middleware
```

Look for routes with `update.last.seen` middleware.

## Summary

✅ **Online Status Tracking:**
- Automatic tracking via middleware
- Updates every 2 minutes when user is active
- Respects privacy settings

✅ **Privacy Controls:**
- Users can enable/disable online status visibility
- When disabled, no tracking occurs
- Other users see "Hidden" status

✅ **API Integration:**
- Online status included in conversation lists
- `is_online` boolean for quick checks
- `online_status` text for display
- `last_seen_at` timestamp (if visible)

✅ **User Model Methods:**
- `isOnline()` - Check if user is online
- `getOnlineStatusText()` - Get display text

✅ **Performance:**
- Throttled updates (every 2 minutes)
- Indexable columns
- Cacheable queries

✅ **Frontend Ready:**
- JSON API responses
- Easy to integrate with React/Vue
- Real-time updates possible with WebSocket
