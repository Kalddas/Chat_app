# Video Send Fix - Step by Step

## Problem
Videos are not sending - getting `ERR_CONNECTION_RESET` error.

## Root Cause
The Laravel server is crashing when trying to process video uploads because:
1. The broadcast system was trying to send large video data through WebSocket
2. The server configuration changes weren't applied (server needs restart)

## Solution Applied
I've reverted the problematic broadcast changes and disabled WebSocket broadcasting for now.

## CRITICAL: You MUST Restart the Laravel Server

### Step 1: Stop the Current Laravel Server
1. Go to the terminal where `php artisan serve` is running
2. Press `Ctrl + C` to stop it
3. Wait for it to fully stop

### Step 2: Clear Laravel Cache
Run these commands in the `ChatPulseBackend` directory:
```bash
cd ChatPulseBackend
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

### Step 3: Restart Laravel Server
```bash
php artisan serve
```

### Step 4: Test Video Upload
1. Go to your chat application
2. Try sending a video message
3. It should now upload successfully without crashing

## What Changed
- ✅ Broadcast driver set to `log` (disables WebSocket for now)
- ✅ Removed broadcast event that was crashing the server
- ✅ Simplified ChatEvent back to basic configuration
- ✅ Videos will save to database and display on sender's side
- ⚠️ Videos won't appear in real-time for the receiver (they need to refresh)

## If Still Not Working

### Check 1: Verify .env Changes
Open `ChatPulseBackend/.env` and verify:
```
BROADCAST_DRIVER=log
```

### Check 2: Check PHP Upload Limits
The video size limit is 100MB. If your video is larger, it will fail.

### Check 3: Check Storage Permissions
Make sure the storage folder is writable:
```bash
cd ChatPulseBackend
chmod -R 775 storage
chmod -R 775 bootstrap/cache
```

### Check 4: Verify Storage Link
```bash
php artisan storage:link
```

## Next Steps (After Videos Work)
Once videos are uploading successfully, we can work on enabling real-time delivery via WebSocket in a way that doesn't crash the server.
