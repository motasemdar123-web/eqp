@echo off
title SAP Local Bridge - Dar Al Hai Office Network Runner
color 0A
echo ===================================================================
echo               SAP B1 LOCAL BRIDGE COMPANION SERVER
echo         Direct Office Network Gateway for SAP PO Automation
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
        call npx playwright install chromium
    )
)

echo [INFO] Starting SAP Local Bridge on port 5005...
echo [INFO] Keep this window OPEN while running SAP Automations from the web app.
echo.
node bridge-server.js

if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Bridge process exited with error code %errorlevel%.
    pause
)
