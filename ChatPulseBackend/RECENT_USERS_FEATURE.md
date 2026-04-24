# Recent Users Feature - Implementation

## Overview
The admin dashboard now displays the 10 most recently logged in users, sorted by their last login time.

## Changes Made

### 1. Dashboard Controller
**File**: `app/Http/Controllers/Admin/DashboaredController.php`

**What Changed**:
- Changed from "recent active users" (last 3 hours) to "recently logged in users" (all time)
- Increased limit from 5 to 10 users
- Added more user details in the response

**Query**:
```php
// Before: Only users active in last 3 hours
User::where('last_login_at', '>=', Carbon::now()->subHours(3))
    ->orderBy('last_login_at', 'desc')
    ->take(5)
    ->get();

// After: All users who have logged in, sorted by most recent
User::with('profile')
    ->whereNotNull('last_login_at')
    ->orderBy('last_login_at', 'desc')
    ->take(10)
    ->get();
```

### 2. Login Controller
**File**: `app/Http/Controllers/Api/Auth/LoginController.php`

**What Changed**:
- Added `last_login_at` timestamp update on successful login

**Code Added**:
```php
// Update last login timestamp
$user->last_login_at = now();
$user->save();
```

## API Response

### Endpoint
```
GET /api/admin/dashboard
Authorization: Bearer {admin_token}
```

### Response Structure
```json
{
  "total_users": 150,
  "user_growth_percentage": 12.5,
  "active_users": 45,
  "online_users": 342,
  "pending_reports": 3,
  "recent_users": [
    {
      "id": 5,
      "first_name": "John",
      "last_name": "Doe",
      "user_name": "johndoe",
      "email": "john@example.com",
      "profile_picture_url": "http://localhost:8000/storage/profile_pictures/abc.jpg",
      "last_login_at": "2026-02-20 14:30:00",
      "last_login_human": "5 minutes ago",
      "status": "Active",
      "role": "user"
    },
    {
      "id": 12,
      "first_name": "Jane",
      "last_name": "Smith",
      "user_name": "janesmith",
      "email": "jane@example.com",
      "profile_picture_url": null,
      "last_login_at": "2026-02-20 13:15:00",
      "last_login_human": "1 hour ago",
      "status": "Active",
      "role": "user"
    },
    {
      "id": 1,
      "first_name": "N/A",
      "last_name": "N/A",
      "user_name": "N/A",
      "email": "admin@randomchat.com",
      "profile_picture_url": null,
      "last_login_at": "2026-02-20 10:00:00",
      "last_login_human": "4 hours ago",
      "status": "Pending",
      "role": "admin"
    }
  ],
  "recent_reports": [...],
  "recent_action_logs": [...]
}
```

## Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | User ID |
| `first_name` | string | User's first name (or "N/A" if no profile) |
| `last_name` | string | User's last name (or "N/A" if no profile) |
| `user_name` | string | Username (or "N/A" if no profile) |
| `email` | string | User's email address |
| `profile_picture_url` | string\|null | Full URL to profile picture |
| `last_login_at` | string | Last login timestamp (Y-m-d H:i:s format) |
| `last_login_human` | string | Human-readable time since last login |
| `status` | string | Account status: Active, Suspended, Banned, Pending |
| `role` | string | User role: user, admin |

## Features

### 1. Shows All Recently Logged In Users
- No time restriction (shows all users who have ever logged in)
- Sorted by most recent login first
- Limited to 10 users for performance

### 2. Handles Missing Profiles
- Users without profiles show "N/A" for name fields
- Email is always available
- Status defaults to "Pending" if no profile

### 3. Multiple Time Formats
- `last_login_at`: Exact timestamp for precise tracking
- `last_login_human`: User-friendly relative time (e.g., "5 minutes ago")

### 4. Complete User Information
- Profile picture for visual identification
- Status to see account state
- Role to distinguish admins from regular users

## Frontend Integration

### Display Recent Users List

```jsx
// React Example
const RecentUsers = ({ users }) => {
  return (
    <div className="recent-users">
      <h3>Recently Logged In Users</h3>
      <ul>
        {users.map(user => (
          <li key={user.id} className="user-item">
            <img 
              src={user.profile_picture_url || '/default-avatar.png'} 
              alt={user.user_name}
              className="avatar"
            />
            <div className="user-info">
              <div className="name">
                {user.first_name} {user.last_name}
                <span className="username">@{user.user_name}</span>
              </div>
              <div className="email">{user.email}</div>
              <div className="last-login">
                Last login: {user.last_login_human}
              </div>
              <span className={`status ${user.status.toLowerCase()}`}>
                {user.status}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
```

### Fetch Dashboard Data

```javascript
const fetchDashboard = async () => {
  try {
    const response = await fetch('/api/admin/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    // Access recent users
    console.log('Recent users:', data.recent_users);
    
    // Display in UI
    setRecentUsers(data.recent_users);
    
  } catch (error) {
    console.error('Failed to fetch dashboard:', error);
  }
};
```

## Sorting & Filtering Options

If you need different views, you can add query parameters:

### By Time Range
```php
// Last 24 hours
User::with('profile')
    ->where('last_login_at', '>=', Carbon::now()->subDay())
    ->orderBy('last_login_at', 'desc')
    ->take(10)
    ->get();

// Last week
User::with('profile')
    ->where('last_login_at', '>=', Carbon::now()->subWeek())
    ->orderBy('last_login_at', 'desc')
    ->take(10)
    ->get();
```

### By Status
```php
// Only active users
User::with('profile')
    ->whereNotNull('last_login_at')
    ->whereHas('profile', function($q) {
        $q->where('status', 'Active');
    })
    ->orderBy('last_login_at', 'desc')
    ->take(10)
    ->get();
```

### By Role
```php
// Only regular users (exclude admins)
User::with('profile')
    ->whereNotNull('last_login_at')
    ->where('role', 'user')
    ->orderBy('last_login_at', 'desc')
    ->take(10)
    ->get();
```

## Performance Considerations

1. **Indexed Column**: Ensure `last_login_at` is indexed for fast sorting
   ```sql
   ALTER TABLE users ADD INDEX idx_last_login_at (last_login_at);
   ```

2. **Eager Loading**: Always use `->with('profile')` to avoid N+1 queries

3. **Limit Results**: Keep the limit reasonable (10-20 users max)

4. **Caching**: Consider caching for high-traffic dashboards
   ```php
   Cache::remember('recent_users', 60, function() {
       return User::with('profile')
           ->whereNotNull('last_login_at')
           ->orderBy('last_login_at', 'desc')
           ->take(10)
           ->get();
   });
   ```

## Testing

### Manual Test
1. Login as a regular user
2. Verify `last_login_at` is updated in database
3. Login as admin
4. Navigate to dashboard
5. Verify recent users list shows the user who just logged in at the top

### Database Check
```sql
-- Check last_login_at values
SELECT id, email, last_login_at 
FROM users 
WHERE last_login_at IS NOT NULL 
ORDER BY last_login_at DESC 
LIMIT 10;
```

### API Test
```bash
# Get dashboard data
curl -X GET http://localhost:8000/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

## Troubleshooting

### No users showing up
- Check if users have `last_login_at` set (login at least once)
- Verify the query doesn't have restrictive filters
- Check database connection

### Old login times
- Ensure LoginController is updating `last_login_at`
- Check if users are actually logging in (not using cached tokens)

### Performance issues
- Add database index on `last_login_at`
- Reduce the limit
- Implement caching
