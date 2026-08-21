@echo off
title Komatsu PDX Emergency Order Automation Engine
echo =======================================================
echo   KOMATSU PDX EMERGENCY ORDER (EO) AUTOMATION ENGINE
echo =======================================================
echo.
echo Starting Web Dashboard on http://localhost:5055 ...
echo.
python "%~dp0tools\app_pdx.py"
pause
