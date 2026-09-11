@echo off
title Outlook Local Bridge - Desktop Email Ingestion Server
color 0B
echo ===================================================================
echo               OUTLOOK LOCAL BRIDGE COMPANION SERVER
echo     Direct Desktop Outlook Gateway for Customer Inquiry Ingestion
echo ===================================================================
echo.

cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is required but not found in PATH!
    echo Please install Node.js (v18+) from https://nodejs.org
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    if exist "..\..\backend\node_modules" (
        echo [INFO] Using parent repository node_modules environment...
        set "NODE_PATH=%~dp0..\..\backend\node_modules;%NODE_PATH%"
    ) else (
        echo [INFO] First-time setup: Installing required bridge dependencies...
        call npm install --no-audit --no-fund
    )
)

echo [INFO] Starting Outlook Local Bridge on port 5008...
echo [INFO] Keep this window OPEN to sync emails from Desktop Outlook.
echo.
node bridge-server.js

if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Bridge process exited with error code %errorlevel%.
    pause
)
