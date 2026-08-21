import re
import requests
import pandas as pd
from http_connector import get_session

session = get_session()
search_url = "https://www.komatsu.ae/kmewebportal/StockInquiry/MultiPartsStockInqSearch"

post_data = {
    "txtPart1": "6742-01-4540",
    "txtPart2": "600-319-3750",
    "txtPart3": "",
    "txtPart4": "",
    "txtPart5": "",
    "txtPart6": "",
    "txtPart7": "",
    "txtPart8": "",
    "txtPart9": "",
    "txtPart10": "",
    "txtPart11": "",
    "txtPart12": "",
    "ddlManufacturer": "0000",
    "ddlStockPoint": ""
}

print(f"Posting to {search_url}...")
resp = session.post(search_url, data=post_data)
print(f"Status: {resp.status_code}, Length: {len(resp.text)} bytes")

with open("pdx_search_result.html", "w", encoding="utf-8") as f:
    f.write(resp.text)

print("First 1000 chars of result:")
print(resp.text[:1000])

# Parse table rows
trs = re.findall(r'<tr[^>]*>(.*?)</tr>', resp.text, re.DOTALL | re.IGNORECASE)
print(f"\nFound {len(trs)} <tr> elements in result HTML:")
for idx, tr in enumerate(trs):
    tds = re.findall(r'<td[^>]*>(.*?)</td>', tr, re.DOTALL | re.IGNORECASE)
    clean_tds = [re.sub(r'<[^>]+>', ' ', td).replace('&nbsp;', ' ').strip() for td in tds]
    clean_tds = [re.sub(r'\s+', ' ', td) for td in clean_tds if td]
    if clean_tds:
        print(f"Row #{idx}: {clean_tds}")
