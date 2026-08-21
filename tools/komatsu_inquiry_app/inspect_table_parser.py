import re
import pandas as pd

with open("pdx_search_result.html", "r", encoding="utf-8") as f:
    html = f.read()

# Extract the table header
headers = []
th_matches = re.findall(r'<td[^>]*class="[^"]*customHeader[^"]*"[^>]*>(.*?)</td>', html, re.DOTALL | re.IGNORECASE)
headers = [re.sub(r'<[^>]+>', '', h).strip() for h in th_matches if re.sub(r'<[^>]+>', '', h).strip()]
print(f"Header columns ({len(headers)}): {headers}")

# Extract rows
tbody_match = re.search(r'<tbody>(.*?)</tbody>', html, re.DOTALL | re.IGNORECASE)
if tbody_match:
    tbody = tbody_match.group(1)
    trs = re.findall(r'<tr[^>]*>(.*?)</tr>', tbody, re.DOTALL | re.IGNORECASE)
    print(f"\nFound {len(trs)} data rows in tbody:")
    parsed_rows = []
    for tr in trs:
        tds = re.findall(r'<td[^>]*>(.*?)</td>', tr, re.DOTALL | re.IGNORECASE)
        clean = []
        for td in tds:
            txt = re.sub(r'<[^>]+>', ' ', td).replace('&nbsp;', ' ').strip()
            txt = re.sub(r'\s+', ' ', txt)
            clean.append(txt)
        print("Row:", clean[:18])
        parsed_rows.append(clean)
