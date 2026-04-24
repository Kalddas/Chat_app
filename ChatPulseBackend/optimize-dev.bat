@echo off
echo ========================================
echo   ChatPulse Dev Optimization
echo ========================================
echo.

echo [1/3] Clearing caches...
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

echo.
echo [2/3] Optimizing autoloader...
composer dump-autoload -o

echo.
echo [3/3] Caching configuration...
php artisan config:cache

echo.
echo ========================================
echo   Dev Optimization Complete!
echo ========================================
echo.
echo Note: Routes and views are NOT cached
echo in dev mode for easier development.
echo.
pause
