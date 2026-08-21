@echo off
title Komatsu Login
echo ===================================================
echo Opening Komatsu Login Window...
echo Please log in with your credentials in the browser.
echo When finished, simply close the browser window.
echo ===================================================
cd /d "%~dp0"
python login.py
echo.
echo Login finished! You can return to the web app.
pause
