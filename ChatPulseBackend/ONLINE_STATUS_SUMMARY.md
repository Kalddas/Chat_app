# Online/Offline Status - Implementation Summary

## ✅ What Was Implemented

### 1. Middleware Registration
- **File:** `bootstrap/app.php`
- **Change:** Registered `UpdateLastSeen` middleware as `'update.last.seen'`
- **Purpose:** Makes middleware available for use in routes

### 2. Routes Updated
- **File:** `routes/api.php`
- **Changes:** Added `'update.last.seen'` middleware to:
  - Protected routes (auth:sanctum)
  - User profile routes
  - Chat routes
- **Purpose:** Automatically track user activity on all authenticated requests

### 3. User Model Methods
- **File:** `app/Models/User.php`
- **New Methods:**
  - `isOnline(): bool` - Returns true if user is online (active in last 5 minutes)
  - `getOnlineStatusText(): string` - Returns human-readable status ("Online", "Offline", "Hidden", "Last seen X ago")
- **Purpose:** Easy access to online status information

### 4. API Response Updates
- **File:** `app/Http/Controllers/ChatController.php`
- **Methods Updated:**
  - `listUserConversations()` - Added online status to user object
  - `chatlist()` - Added online status to user object
- **New Fields in Response:**
  ```json
  {
    "user": {
      "is_online": true,
      "online_status": "Online",
      "last_seen_at": "2026-02-25 14:22:02"
    }
  }
  ```

## 🎯 How It Works

### Automatic Tracking
1. User makes any API request (login, send message, view profile, etc.)
2. `UpdateLastSeen` middleware intercepts the request
3. If user has `show_online_status` enabled:
   - Checks if last update was > 2 minutes ago
   - Updates `last_seen_at` to current timestamp
4. Request continues normally

### Privacy Control
Users can toggle online status visibility:
```bash
POST /api/user/privacy/toggle-online-status
```

When disabled:
- ❌ `last_seen_at` is NOT updated
- ❌ `isOnline()` returns false
- ❌ Other users see "Hidden" status
- ✅ User's privacy is protected

### Online Detection
A user is considered "online" if:
- ✅ `show_online_status` is enabled
- ✅ `last_seen_at` exists
- ✅ `last_seen_at` is within last 5 minutes

## 📊 Test Results

```
✅ Privacy columns exist in users table
✅ UpdateLastSeen middleware is registered
✅ isOnline() method works correctly
✅ getOnlineStatusText() returns correct values
✅ Privacy settings respected (hidden status works)
✅ API responses include online status
```

## 🔧 Frontend Integration

### Display Online Status
```javascript
function UserStatus({ user }) {
  return (
    <div className="user-status">
      {/* Green dot if online, gray if offline */}
      <div className={`status-dot ${user.is_online ? 'online' : 'offline'}`} />
      
      {/* Display status text */}
      <span>{user.online_status}</span>
    </div>
  );
}
```

### Check if User is Online
```javascript
const isOnline = user.is_online; // boolean
const statusText = user.online_status; // "Online", "Offline", "Hidden", etc.
const lastSeen = user.last_seen_at; // timestamp or null
```

## 🎨 UI Examples

### Chat List
```
John Doe          🟢 Online
Jane Smith        🔵 Last seen 10 minutes ago
Bob Johnson       ⚫ Hidden
Alice Williams    ⚫ Offline
```

### Chat Header
```
┌─────────────────────────────────┐
│ 🟢 John Doe - Online            │
│ ← Back                          │
└─────────────────────────────────┘
```

### Settings Toggle
```
Privacy & Security
├─ Read Receipts          [ON]
└─ Show Online Status     [ON]
```

## 📝 API Endpoints

### Get Conversations (includes online status)
```
GET /api/chat/users/{userId}/conversations
Authorization: Bearer {token}
```

### Get Chat List (includes online status)
```
GET /api/chat/chat-list
Authorization: Bearer {token}
```

### Toggle Online Status
```
POST /api/user/privacy/toggle-online-status
Authorization: Bearer {token}
```

## 🧪 Testing

### Run Test Script
```bash
cd ChatPulseBackend
php test-online-status.php
```

### Manual Test
1. **Login as User A**
2. **Make some API requests** (triggers middleware)
3. **Login as User B**
4. **View conversations** - should see User A as "Online"
5. **Wait 6 minutes**
6. **Refresh** - should see User A as "Last seen X minutes ago"

### Test Privacy
1. **User A disables online status:**
   ```bash
   POST /api/user/privacy/toggle-online-status
   ```
2. **User B views conversations** - should see "Hidden"
3. **User A makes requests** - `last_seen_at` NOT updated

## 🚀 Performance

### Optimizations Applied
- ✅ Updates throttled to every 2 minutes (reduces DB writes)
- ✅ Only updates when `show_online_status` is enabled
- ✅ Middleware is lightweight and fast
- ✅ No additional API calls needed

### Recommended Indexes
```sql
ALTER TABLE users ADD INDEX idx_online_status (show_online_status, last_seen_at);
```

## 🔒 Security & Privacy

### Privacy Features
- ✅ User can disable online status tracking
- ✅ When disabled, no tracking occurs
- ✅ Other users see "Hidden" status
- ✅ `last_seen_at` only returned if user allows it

### Default Settings
- ✅ `show_online_status` defaults to `true` (enabled)
- ✅ Users can change it anytime
- ✅ Setting is per-user, not global

## 📚 Documentation

- **Implementation Guide:** `ONLINE_STATUS_IMPLEMENTATION.md`
- **Test Script:** `test-online-status.php`
- **Privacy Settings:** `PRIVACY_SETTINGS_IMPLEMENTATION.md`

## ✅ Status: COMPLETE

All online/offline status features are implemented and tested:
- ✅ Middleware registered and working
- ✅ User model methods added
- ✅ API responses include online status
- ✅ Privacy controls working
- ✅ Test script passes all tests
- ✅ Documentation complete

## 🎉 Ready for Frontend Integration!

The backend is ready. Frontend can now:
1. Display online/offline status in chat lists
2. Show real-time status in chat headers
3. Allow users to toggle online status visibility
4. Display "Last seen X ago" timestamps
