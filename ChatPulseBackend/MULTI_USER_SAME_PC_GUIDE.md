# Multiple Users on Same PC - Implementation Guide

## Overview
The application fully supports multiple users logging in simultaneously on the same PC. This is possible because of the token-based authentication system (Laravel Sanctum).

## How It Works

### 1. Token-Based Authentication
Each user receives a unique bearer token upon login:
```json
{
  "token": "1|abc123...",
  "user": {...}
}
```

This token is:
- ✅ Unique per user
- ✅ Independent of browser sessions
- ✅ Stored in frontend (localStorage/sessionStorage)
- ✅ Sent with each API request in the `Authorization` header

### 2. Stateless API
The backend API is stateless:
- ❌ No server-side sessions
- ❌ No cookies for authentication
- ✅ Each request is authenticated via token
- ✅ Multiple tokens can be active simultaneously

### 3. Independent Tracking
The `UpdateLastSeen` middleware tracks each user independently:
- Each API request includes the user's token
- Middleware identifies the user from the token
- Updates that specific user's `last_seen_at`
- No interference between users

## Testing Multiple Users on Same PC

### Method 1: Multiple Browser Windows (Recommended)

#### Step 1: Open Two Browser Windows
```
Window 1: http://localhost:3000
Window 2: http://localhost:3000 (incognito/private mode)
```

#### Step 2: Login as Different Users
**Window 1:**
```
Email: user1@example.com
Password: password123
```

**Window 2:**
```
Email: user2@example.com
Password: password123
```

#### Step 3: Verify Both Are Online
- In Window 1: Check if User 2 shows as "Online"
- In Window 2: Check if User 1 shows as "Online"
- Both should see each other as online

#### Step 4: Send Messages
- User 1 sends message to User 2
- User 2 receives message in real-time (if WebSocket enabled) or on refresh
- User 2 replies
- User 1 receives reply

### Method 2: Different Browsers
```
Browser 1 (Chrome): Login as User 1
Browser 2 (Firefox): Login as User 2
Browser 3 (Edge): Login as User 3
```

All users can be active simultaneously.

### Method 3: Multiple Tabs (Same Browser)
```
Tab 1: Login as User 1
Tab 2: Login as User 2 (will logout User 1 if using same localStorage)
```

⚠️ **Note:** This may not work if frontend stores token in localStorage without user-specific keys.

## Frontend Implementation Requirements

### 1. Token Storage
Store tokens with user-specific keys:

```javascript
// ❌ BAD: Single token storage (users will overwrite each other)
localStorage.setItem('token', token);

// ✅ GOOD: User-specific token storage
localStorage.setItem(`token_${userId}`, token);
// or
localStorage.setItem(`token_${email}`, token);
```

### 2. Multiple User Support
```javascript
// Store active users
const activeUsers = JSON.parse(localStorage.getItem('activeUsers') || '[]');

// Add new user on login
activeUsers.push({
  id: user.id,
  email: user.email,
  token: token,
  loginTime: new Date().toISOString()
});

localStorage.setItem('activeUsers', JSON.stringify(activeUsers));

// Switch between users
function switchUser(userId) {
  const user = activeUsers.find(u => u.id === userId);
  if (user) {
    setCurrentToken(user.token);
    setCurrentUser(user);
  }
}
```

### 3. API Request Headers
Each request must include the correct token:

```javascript
const makeRequest = async (url, userId) => {
  const token = localStorage.getItem(`token_${userId}`);
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return response.json();
};
```

## Backend Verification

### Check Active Tokens
```bash
php artisan tinker
```

```php
// Get all active tokens
$tokens = DB::table('personal_access_tokens')->get();

// Count tokens per user
$tokenCounts = DB::table('personal_access_tokens')
    ->select('tokenable_id', DB::raw('count(*) as token_count'))
    ->groupBy('tokenable_id')
    ->get();

// Find users with multiple active tokens
$multipleTokens = DB::table('personal_access_tokens')
    ->select('tokenable_id', DB::raw('count(*) as token_count'))
    ->groupBy('tokenable_id')
    ->having('token_count', '>', 1)
    ->get();
```

### Check Online Users
```php
// Get currently online users
$onlineUsers = User::where('show_online_status', true)
    ->where('last_seen_at', '>=', now()->subMinutes(5))
    ->get();

foreach ($onlineUsers as $user) {
    echo "{$user->email} - Last seen: {$user->last_seen_at}\n";
}
```

## Testing Scenarios

### Scenario 1: Two Users Chat
1. **User A** logs in (Window 1)
2. **User B** logs in (Window 2)
3. Both should show as "Online"
4. User A sends message to User B
5. User B receives message
6. User B replies
7. User A receives reply

### Scenario 2: Online Status Updates
1. **User A** logs in and makes requests
2. **User B** logs in and views User A's status
3. User B should see User A as "Online"
4. User A stops making requests for 6 minutes
5. User B refreshes and should see "Last seen 6 minutes ago"

### Scenario 3: Privacy Settings
1. **User A** disables online status
2. **User B** views User A's status
3. User B should see "Hidden"
4. User A makes requests (last_seen_at NOT updated)
5. User B still sees "Hidden"

### Scenario 4: Multiple Conversations
1. **User A** logs in
2. **User B** logs in
3. **User C** logs in
4. User A chats with User B
5. User A chats with User C
6. All three should see each other as online
7. Messages should not interfere

## Common Issues & Solutions

### Issue 1: Users Overwriting Each Other's Tokens
**Problem:** Second user login logs out first user

**Cause:** Frontend stores token in same localStorage key

**Solution:**
```javascript
// Use user-specific keys
localStorage.setItem(`token_${user.id}`, token);
localStorage.setItem(`currentUserId`, user.id);

// Get current user's token
const currentUserId = localStorage.getItem('currentUserId');
const token = localStorage.getItem(`token_${currentUserId}`);
```

### Issue 2: Only One User Shows as Online
**Problem:** Only the last logged-in user appears online

**Cause:** Middleware not updating both users' last_seen_at

**Solution:** Verify middleware is working:
```bash
# Check if middleware is registered
php artisan route:list | grep update.last.seen

# Check last_seen_at updates
php artisan tinker
>>> User::find(1)->last_seen_at;
>>> User::find(2)->last_seen_at;
```

### Issue 3: Messages Not Appearing
**Problem:** User A sends message but User B doesn't see it

**Cause:** WebSocket server not running (real-time) or frontend not polling

**Solution:**
- For real-time: Start WebSocket server
- For polling: Frontend should poll `/api/chat/conversations/{id}/messages` every few seconds
- Or: Refresh page to fetch new messages

## API Testing with cURL

### Login Two Users
```bash
# Login User 1
curl -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@example.com","password":"password123"}'

# Save token: TOKEN_1=...

# Login User 2
curl -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user2@example.com","password":"password123"}'

# Save token: TOKEN_2=...
```

### Check Both Users' Online Status
```bash
# User 1 checks conversations (should see User 2 as online)
curl -X GET http://127.0.0.1:8000/api/chat/users/1/conversations \
  -H "Authorization: Bearer $TOKEN_1"

# User 2 checks conversations (should see User 1 as online)
curl -X GET http://127.0.0.1:8000/api/chat/users/2/conversations \
  -H "Authorization: Bearer $TOKEN_2"
```

### Send Messages Between Users
```bash
# User 1 sends message to User 2
curl -X POST http://127.0.0.1:8000/api/chat/conversations/1/messages/send \
  -H "Authorization: Bearer $TOKEN_1" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello from User 1!","receiver_id":2}'

# User 2 sends message to User 1
curl -X POST http://127.0.0.1:8000/api/chat/conversations/1/messages/send \
  -H "Authorization: Bearer $TOKEN_2" \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello from User 2!","receiver_id":1}'
```

## Database Verification

### Check Active Sessions
```sql
-- Count active tokens per user
SELECT 
    u.id,
    u.email,
    COUNT(pat.id) as active_tokens,
    MAX(pat.last_used_at) as last_token_use
FROM users u
LEFT JOIN personal_access_tokens pat ON u.id = pat.tokenable_id
GROUP BY u.id, u.email
HAVING active_tokens > 0;

-- Check online status
SELECT 
    id,
    email,
    show_online_status,
    last_seen_at,
    TIMESTAMPDIFF(MINUTE, last_seen_at, NOW()) as minutes_ago
FROM users
WHERE last_seen_at IS NOT NULL
ORDER BY last_seen_at DESC;
```

## Performance Considerations

### 1. Token Cleanup
Regularly clean up old tokens:
```bash
php artisan sanctum:prune-expired --hours=24
```

### 2. Limit Tokens Per User
Optionally limit tokens per user:
```php
// In LoginController::login()
// Delete old tokens before creating new one
$user->tokens()->delete();
$token = $user->createToken('auth-token')->plainTextToken;
```

### 3. Monitor Active Users
```php
// Get count of currently active users
$activeCount = User::where('last_seen_at', '>=', now()->subMinutes(5))
    ->where('show_online_status', true)
    ->count();
```

## Security Considerations

### 1. Token Security
- ✅ Tokens are unique and unpredictable
- ✅ Tokens are hashed in database
- ✅ Tokens can be revoked individually
- ✅ Tokens expire after inactivity

### 2. User Isolation
- ✅ Each user can only access their own data
- ✅ Middleware validates token on every request
- ✅ No cross-user data leakage
- ✅ Privacy settings respected per user

### 3. Rate Limiting
Consider adding rate limiting:
```php
// In routes/api.php
Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    // Your routes
});
```

## Summary

✅ **Multiple Users Supported:**
- Token-based authentication allows unlimited simultaneous users
- Each user has independent session
- No interference between users

✅ **Online Status Works:**
- Each user's `last_seen_at` tracked independently
- Both users show as online when active
- Privacy settings respected per user

✅ **Conversations Work:**
- Users can chat simultaneously
- Messages are user-specific
- No cross-contamination

✅ **Testing Methods:**
- Multiple browser windows (recommended)
- Different browsers
- Incognito/private mode
- Multiple devices

✅ **Backend Ready:**
- No changes needed
- Already supports multiple simultaneous users
- Stateless API design

## Next Steps

1. **Test with two browser windows** (one normal, one incognito)
2. **Login as different users** in each window
3. **Verify both show as online** in each other's chat lists
4. **Send messages** between the users
5. **Confirm messages appear** in both windows

The backend is fully ready for multiple simultaneous users on the same PC!
