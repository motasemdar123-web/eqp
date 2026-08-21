import re

with open("pdx_get_page.html", "r", encoding="utf-8") as f:
    html = f.read()

# Search for btnSearch in scripts
idx = html.find("btnSearch")
while idx != -1:
    print(html[max(0, idx - 100):min(len(html), idx + 800)])
    print("=" * 60)
    idx = html.find("btnSearch", idx + 1)
