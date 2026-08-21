@echo off
title Komatsu PDX Parts Inquiry Hub
echo ===================================================
echo Starting Komatsu PDX Parts Inquiry Hub...
echo ===================================================
cd /d "%~dp0"
python -m streamlit run app.py
pause
