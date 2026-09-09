@echo off
title SAP Local Bridge - Dar Al Hai Office Network Runner
color 0A
echo ===================================================================
echo               SAP B1 LOCAL BRIDGE COMPANION SERVER
echo         Direct Office Network Gateway for SAP PO Automation
echo ===================================================================
echo.

cd /d "%~dp0tools\sap-local-bridge"
call start-bridge.bat
