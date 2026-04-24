@echo off
echo ========================================
echo   ChatPulse Backend Optimization
echo ========================================
echo.

echo [1/7] Clearing all caches...
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan event:clear

echo.
echo [2/7] Optimizing configuration...
php artisan config:cache

echo.
echo [3/7] Optimizing routes...
php artisan route:cache

echo.
echo [4/7] Optimizing views...
php artisan view:cache

echo.
echo [5/7] Optimizing events...
php artisan event:cache

echo.
echo [6/7] Optimizing autoloader...
composer dump-autoload -o --no-dev 2>nul || composer dump-autoload -o

echo.
echo [7/7] Running final optimization...
php artisan optimize

echo.
echo ========================================
echo   Optimization Complete!
echo ========================================
echo.
echo Your application should now load faster.
echo Run this script whenever you:
echo   - Update routes
echo   - Change configuration
echo   - Deploy to production
echo.
pause
