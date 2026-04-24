# Testing Notification Retrieval

## Current Status

✅ **Notifications ARE being saved to database**
- User ID 1 ("kal dass") has 2 unread warning notifications
- Admin message: "your account has been reported"
- Notifications created at: 2026-02-20 13:42:37 and 13:42:42

❌ **WebSocket broadcast is failing**
- Error: "Failed to connect to 127.0.0.1 port 6001"
- This means real-time notifications won't work
- But database notifications should still be retrievable via API

## Test the Notifications API

### 1. Get User's Token
First, login as the user to get their auth token:

```bash
curl -X POST http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "kaldass@gmail.com",
    "password": "PASSWORD_HERE"
  }'
```

### 2. Fetch Notifications
Use the token from step 1:

```bash
curl -X GET http://127.0.0.1:8000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### Expected Response
```json
{
  "notifications": [
    {
      "id": "aea4c1e6-5167-4aec-a71a-9c321587d9be",
      "type": "account_reported_warning",
      "data": {
        "type": "account_reported_warning",
        "report_id": 4,
        "message": "Your account has been reported. Message from the admin: your account has been reported",
        "admin_message": "your account has been reported",
        "created_at": "2026-02-20 13:42:42"
      },
      "read_at": null,
      "created_at": "2026-02-20T13:42:42.000000Z"
    },
    {
      "id": "363c3d8a-fb74-426c-bf71-3787e213baeb",
      "type": "account_reported_warning",
      "data": {
        "type": "account_reported_warning",
        "report_id": 4,
        "message": "Your account has been reported. Message from the admin: your account has been reported",
        "admin_message": "your account has been reported",
        "created_at": "2026-02-20 13:42:37"
      },
      "read_at": null,
      "created_at": "2026-02-20T13:42:37.000000Z"
    }
  ],
  "unread_count": 2
}
```

## Frontend Integration Check

### Check if Frontend is Calling the API

The frontend should be calling `/api/notifications` when:
1. User logs in
2. User navigates to notifications page
3. Periodically (polling) if WebSocket is not available

### React/JavaScript Example

```javascript
// Fetch notifications
const fetchNotifications = async () => {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/notifications', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Notifications:', data.notifications);
    console.log('Unread count:', data.unread_count);
    
    // Display notifications
    data.notifications.forEach(notif => {
      if (notif.type === 'account_reported_warning') {
        console.log('Admin warning:', notif.data.admin_message);
        // Show in UI
        showWarningNotification(notif.data.message);
      }
    });
    
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
  }
};

// Call on component mount
useEffect(() => {
  fetchNotifications();
}, []);
```

## Fix WebSocket Issue (Optional)

To enable real-time notifications, start the Laravel WebSocket server:

### Option 1: Laravel WebSockets Package

```bash
# Install package
composer require beyondcode/laravel-websockets

# Publish config
php artisan vendor:publish --provider="BeyondCode\LaravelWebSockets\WebSocketsServiceProvider"

# Run migrations
php artisan migrate

# Start WebSocket server
php artisan websockets:serve
```

### Option 2: Use Pusher (Cloud Service)

Update `.env`:
```env
BROADCAST_DRIVER=pusher

PUSHER_APP_ID=your_app_id
PUSHER_APP_KEY=your_app_key
PUSHER_APP_SECRET=your_app_secret
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https
PUSHER_APP_CLUSTER=mt1
```

### Option 3: Disable Broadcast (Database Only)

If you don't need real-time notifications, remove broadcast from notification:

```php
// In AccountReportedWarningNotification.php
public function via($notifiable): array
{
    // Remove 'broadcast' to only use database
    return ['database'];
}
```

## Troubleshooting

### User Not Seeing Notifications

1. **Check if frontend is calling the API**
   - Open browser DevTools > Network tab
   - Look for `/api/notifications` request
   - Check if it's being called with correct auth token

2. **Check if notifications exist in database**
   ```bash
   php artisan tinker
   >>> App\Models\User::find(1)->notifications()->count()
   ```

3. **Check if user is authenticated**
   - Verify token is valid
   - Check if token is being sent in Authorization header

4. **Check frontend notification display logic**
   - Verify the UI component is rendering notifications
   - Check if notification type is being handled correctly
   - Look for JavaScript console errors

### Badge Count Not Updating

The badge showing "3" in the screenshot suggests:
- Frontend IS fetching unread count
- But may not be displaying the actual notifications

Check:
1. Is `/api/notifications/unread-count` being called?
2. Is the notification list component rendering?
3. Are there filters hiding the warning notifications?

## Database Verification

```sql
-- Check all notifications for user 1
SELECT * FROM notifications WHERE notifiable_id = 1;

-- Check unread notifications
SELECT * FROM notifications WHERE notifiable_id = 1 AND read_at IS NULL;

-- Check notification data
SELECT id, type, data, created_at FROM notifications WHERE notifiable_id = 1;
```

## Summary

✅ **Backend is working correctly**
- Notifications are being created
- Admin messages are being saved
- Database storage is working

❌ **WebSocket is not running**
- Real-time updates won't work
- But polling/manual refresh should work

🔍 **Check Frontend**
- Verify API calls are being made
- Check notification display logic
- Ensure auth token is valid
- Look for JavaScript errors
