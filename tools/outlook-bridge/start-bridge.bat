@echo off
title Outlook Local Bridge - Desktop Email Ingestion Server
color 0B
echo ===================================================================
echo               OUTLOOK LOCAL BRIDGE COMPANION SERVER
echo     Direct Desktop Outlook Gateway for Customer Inquiry Ingestion
echo ===================================================================
echo.

node -v >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Starting Outlook Bridge Server on port 5008...
node bridge-server.js
pause
