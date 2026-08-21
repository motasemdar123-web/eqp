import re

with open("pdx_search_result.html", "r", encoding="utf-8") as f:
    html = f.read()

# Look at the first row's TDs with classes and attributes
tbody_match = re.search(r'<tbody>(.*?)</tbody>', html, re.DOTALL | re.IGNORECASE)
if tbody_match:
    trs = re.findall(r'<tr[^>]*>(.*?)</tr>', tbody_match.group(1), re.DOTALL | re.IGNORECASE)
    first_tr = trs[0]
    tds = re.findall(r'<td([^>]*)>(.*?)</td>', first_tr, re.DOTALL | re.IGNORECASE)
    print(f"Total TDs in row: {len(tds)}")
    for idx, (attrs, content) in enumerate(tds):
        clean_c = re.sub(r'<[^>]+>', ' ', content).replace('&nbsp;', ' ').strip()
        print(f"TD #{idx}: text='{clean_c}' | attrs='{attrs.strip()}'")
