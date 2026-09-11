@echo off
title Outlook Local Bridge - Parts Inquiry Ingestion Gateway
color 0B
echo ===================================================================
echo               OUTLOOK LOCAL BRIDGE COMPANION SERVER
echo         Direct Desktop Outlook Gateway for Inquiry Ingestion
echo ===================================================================
echo.

cd /d "%~dp0tools\outlook-bridge"
node bridge-server.js
pause
