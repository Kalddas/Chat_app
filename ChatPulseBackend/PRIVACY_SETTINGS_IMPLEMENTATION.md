# Privacy & Security Settings Implementation

## Overview
Implementation of Read Receipts and Show Online Status privacy features.

## Database Changes

### Migration
**File:** `database/migrations/2026_02_20_000001_add_privacy_settings_to_users_table.php`

**New Columns:**
- `read_receipts_enabled` (boolean, default: true) - Controls if user sends read receipts
- `show_online_status` (boolean, default: true) - Controls if user's online status is visible
- `last_seen_at` (timestamp, nullable) - Tracks when user was last active

### Run Migration
```bash
php artisan migrate
```

## API Endpoints

### 1. Get Privacy Settings
```
GET /api/user/privacy
Authorization: Bearer {token}
```

**Response:**
```json
{
  "status": "success",
  "settings": {
    "read_receipts_enabled": true,
    "show_online_status": true
  }
}
```

### 2. Update Privacy Settings
```
PATCH /api/user/privacy
Authorization: Bearer {token}
Content-Type: application/json

{
  "read_receipts_enabled": false,
  "show_online_status": true
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Privacy settings updated successfully",
  "settings": {
    "read_receipts_enabled": false,
    "show_online_status": true
  }
}
```

### 3. Toggle Read Receipts
```
POST /api/user/privacy/toggle-read-receipts
Authorization: Bearer {token}
```

**Response:**
```json
{
  "status": "success",
  "message": "Read receipts disabled",
  "read_receipts_enabled": false
}
```

### 4. Toggle Online Status
```
POST /api/user/privacy/toggle-online-status
Authorization: Bearer {token}
```

**Response:**
```json
{
  "status": "success",
  "message": "Online status visibility disabled",
  "show_online_status": false
}
```

## How It Works

### Read Receipts

**When Enabled (default):**
- Messages are marked as read when user views them
- Other users can see when their messages were read
- `read_at` timestamp is set on messages

**When Disabled:**
- Messages are NOT marked as read in database
- Other users cannot see read status
- `read_at` remains null even if message is viewed

**Implementation:**
```php
// In ChatController::markAsRead()
if ($authUser->read_receipts_enabled) {
    $conversation->messages()
        ->where('receiver_id', $authUser->id)
        ->whereNull('read_at')
        ->update(['read_at' => now()]);
}
```

**Frontend Display:**
```php
// In ChatController::fetchMessages()
$showReadStatus = $msg->sender && $msg->sender->read_receipts_enabled;

return [
    // ... other fields
    'read_at' => $showReadStatus ? $msg->read_at : null,
];
```

### Show Online Status

**When Enabled (default):**
- User's `last_seen_at` is updated every 2 minutes
- Other users can see when user was last online
- User appears as "Online" if active in last 5 minutes

**When Disabled:**
- `last_seen_at` is NOT updated
- Other users see "Last seen: Hidden" or no status
- User's presence is not tracked

**Implementation:**
```php
// In UpdateLastSeen middleware
if ($user->show_online_status) {
    if (!$lastUpdate || $lastUpdate->diffInMinutes(now()) >= 2) {
        $user->last_seen_at = now();
        $user->save();
    }
}
```

## Frontend Integration

### React Example

```javascript
// Fetch privacy settings
const fetchPrivacySettings = async () => {
  const response = await fetch('/api/user/privacy', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  return data.settings;
};

// Toggle read receipts
const toggleReadReceipts = async () => {
  const response = await fetch('/api/user/privacy/toggle-read-receipts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  console.log(data.message); // "Read receipts enabled/disabled"
  return data.read_receipts_enabled;
};

// Toggle online status
const toggleOnlineStatus = async () => {
  const response = await fetch('/api/user/privacy/toggle-online-status', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  const data = await response.json();
  console.log(data.message); // "Online status visibility enabled/disabled"
  return data.show_online_status;
};

// Update both settings at once
const updatePrivacySettings = async (settings) => {
  const response = await fetch('/api/user/privacy', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(settings)
  });
  return await response.json();
};
```

### UI Component Example

```jsx
import { useState, useEffect } from 'react';
import { Switch } from '@radix-ui/react-switch';

function PrivacySettings() {
  const [readReceipts, setReadReceipts] = useState(true);
  const [showOnline, setShowOnline] = useState(true);

  useEffect(() => {
    // Load settings on mount
    fetchPrivacySettings().then(settings => {
      setReadReceipts(settings.read_receipts_enabled);
      setShowOnline(settings.show_online_status);
    });
  }, []);

  const handleReadReceiptsToggle = async () => {
    const newValue = await toggleReadReceipts();
    setReadReceipts(newValue);
  };

  const handleOnlineStatusToggle = async () => {
    const newValue = await toggleOnlineStatus();
    setShowOnline(newValue);
  };

  return (
    <div className="privacy-settings">
      <h2>Privacy & Security</h2>
      
      <div className="setting-item">
        <div>
          <h3>Read Receipts</h3>
          <p>Let others know when you've read their messages</p>
        </div>
        <Switch
          checked={readReceipts}
          onCheckedChange={handleReadReceiptsToggle}
        />
      </div>

      <div className="setting-item">
        <div>
          <h3>Show Online Status</h3>
          <p>Let others see when you're online</p>
        </div>
        <Switch
          checked={showOnline}
          onCheckedChange={handleOnlineStatusToggle}
        />
      </div>
    </div>
  );
}
```

## Displaying Online Status

### Check if User is Online

```javascript
const isUserOnline = (lastSeenAt, showOnlineStatus) => {
  if (!showOnlineStatus) return false; // User has hidden status
  if (!lastSeenAt) return false;
  
  const lastSeen = new Date(lastSeenAt);
  const now = new Date();
  const diffMinutes = (now - lastSeen) / 1000 / 60;
  
  return diffMinutes < 5; // Online if active in last 5 minutes
};

const getOnlineStatusText = (lastSeenAt, showOnlineStatus) => {
  if (!showOnlineStatus) return 'Hidden';
  if (!lastSeenAt) return 'Offline';
  
  if (isUserOnline(lastSeenAt, showOnlineStatus)) {
    return 'Online';
  }
  
  // Show relative time
  return `Last seen ${formatDistanceToNow(new Date(lastSeenAt), { addSuffix: true })}`;
};
```

### Display in UI

```jsx
function UserStatus({ user }) {
  const isOnline = isUserOnline(user.last_seen_at, user.show_online_status);
  const statusText = getOnlineStatusText(user.last_seen_at, user.show_online_status);
  
  return (
    <div className="user-status">
      <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`} />
      <span>{statusText}</span>
    </div>
  );
}
```

## Displaying Read Receipts

### In Chat Messages

```jsx
function Message({ message, currentUserId }) {
  const isSentByMe = message.sender.id === currentUserId;
  const isRead = message.read_at !== null;
  
  return (
    <div className={`message ${isSentByMe ? 'sent' : 'received'}`}>
      <p>{message.message}</p>
      
      {isSentByMe && (
        <div className="message-status">
          {isRead ? (
            <span className="read-receipt">
              ✓✓ Read {formatDistanceToNow(new Date(message.read_at), { addSuffix: true })}
            </span>
          ) : (
            <span className="delivered">✓ Delivered</span>
          )}
        </div>
      )}
    </div>
  );
}
```

## Middleware Setup (Optional)

To automatically update `last_seen_at`, add the middleware to your API routes:

**File:** `app/Http/Kernel.php`

```php
protected $middlewareGroups = [
    'api' => [
        // ... other middleware
        \App\Http\Middleware\UpdateLastSeen::class,
    ],
];
```

Or apply to specific routes:

```php
Route::middleware(['auth:sanctum', \App\Http\Middleware\UpdateLastSeen::class])
    ->group(function () {
        // Your routes
    });
```

## Testing

### Test Read Receipts

1. **User A enables read receipts:**
   ```bash
   curl -X POST http://127.0.0.1:8000/api/user/privacy/toggle-read-receipts \
     -H "Authorization: Bearer USER_A_TOKEN"
   ```

2. **User B sends message to User A**

3. **User A reads the message:**
   ```bash
   curl -X POST http://127.0.0.1:8000/api/chat/conversations/1/read \
     -H "Authorization: Bearer USER_A_TOKEN"
   ```

4. **User B fetches messages and sees read_at timestamp**

5. **User A disables read receipts:**
   ```bash
   curl -X POST http://127.0.0.1:8000/api/user/privacy/toggle-read-receipts \
     -H "Authorization: Bearer USER_A_TOKEN"
   ```

6. **User B sends another message**

7. **User A reads it, but User B doesn't see read_at (remains null)**

### Test Online Status

1. **User A enables online status:**
   ```bash
   curl -X POST http://127.0.0.1:8000/api/user/privacy/toggle-online-status \
     -H "Authorization: Bearer USER_A_TOKEN"
   ```

2. **User A makes API requests (last_seen_at updates)**

3. **User B checks User A's profile (sees "Online" or "Last seen X minutes ago")**

4. **User A disables online status:**
   ```bash
   curl -X POST http://127.0.0.1:8000/api/user/privacy/toggle-online-status \
     -H "Authorization: Bearer USER_A_TOKEN"
   ```

5. **User B checks User A's profile (sees "Hidden" or no status)**

## Database Queries

### Check user's privacy settings
```sql
SELECT read_receipts_enabled, show_online_status, last_seen_at 
FROM users 
WHERE id = 1;
```

### Find users with read receipts disabled
```sql
SELECT id, email, read_receipts_enabled 
FROM users 
WHERE read_receipts_enabled = 0;
```

### Find users currently online (last 5 minutes)
```sql
SELECT id, email, last_seen_at 
FROM users 
WHERE show_online_status = 1 
  AND last_seen_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE);
```

## Security Considerations

1. **Privacy by Default:** Both settings default to `true` (enabled)
2. **User Control:** Users can toggle settings anytime
3. **Respect Settings:** Backend enforces privacy settings
4. **No Tracking When Disabled:** `last_seen_at` not updated if `show_online_status` is false
5. **Read Receipts Optional:** Messages not marked as read if setting is disabled

## Performance Optimization

1. **Throttled Updates:** `last_seen_at` only updates every 2 minutes
2. **Indexed Columns:** Add indexes for faster queries
   ```sql
   ALTER TABLE users ADD INDEX idx_last_seen (last_seen_at);
   ALTER TABLE users ADD INDEX idx_show_online (show_online_status);
   ```

3. **Caching:** Cache online users list
   ```php
   Cache::remember('online_users', 60, function() {
       return User::where('show_online_status', true)
           ->where('last_seen_at', '>=', now()->subMinutes(5))
           ->pluck('id');
   });
   ```

## Summary

✅ **Read Receipts Feature:**
- Users can enable/disable sending read receipts
- When disabled, messages are not marked as read
- Other users don't see read status

✅ **Show Online Status Feature:**
- Users can enable/disable online status visibility
- When disabled, last_seen_at is not updated
- Other users see "Hidden" status

✅ **API Endpoints:**
- GET /api/user/privacy - Get settings
- PATCH /api/user/privacy - Update settings
- POST /api/user/privacy/toggle-read-receipts - Toggle read receipts
- POST /api/user/privacy/toggle-online-status - Toggle online status

✅ **Database:**
- Migration created
- User model updated
- Privacy settings stored per user

✅ **Implementation:**
- Backend respects privacy settings
- Frontend can toggle settings
- Real-time updates supported
