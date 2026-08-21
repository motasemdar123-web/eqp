@echo off
title Launch Edge with Automation Connection
echo =============================================================
echo Opening Microsoft Edge connected to Komatsu Automation...
echo =============================================================
start msedge.exe --remote-debugging-port=9222 "https://www.komatsu.ae/kmewebportal/StockInquiry/MultiplePartsStockInquiry"
echo Edge launched on port 9222.
