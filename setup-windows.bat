@echo off
echo Monthly Updates - Windows Setup
echo ================================

echo.
echo Step 1: Setting up Backend Server...
cd server
call npm run install:windows
if %errorlevel% neq 0 (
    echo Backend setup failed. Check the error messages above.
    pause
    exit /b 1
)

echo.
echo Step 2: Setting up Frontend...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo Frontend setup failed. Check the error messages above.
    pause
    exit /b 1
)

echo.
echo ================================
echo Setup completed successfully!
echo ================================
echo.
echo To start the application:
echo 1. Backend: cd server ^&^& npm run dev
echo 2. Frontend: cd frontend ^&^& npm run start:windows
echo.
echo Make sure to:
echo - Create .env files in both server and frontend directories
echo - Set up your MySQL database
echo - Run database migrations: cd server ^&^& npm run migrate
echo.
pause