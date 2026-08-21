import re

with open("pdx_get_page.html", "r", encoding="utf-8") as f:
    html = f.read()

print("--- Form Action & Method ---")
forms = re.findall(r'<form[^>]*>', html, re.IGNORECASE)
for form in forms:
    print(form)

print("\n--- Search & Export elements ---")
matches = re.findall(r'<[^>]+(?:search|export|import|btn|click|stock)[^>]*>', html, re.IGNORECASE)
for m in matches[:30]:
    print(m)

print("\n--- Scripts or AJAX calls ---")
scripts = re.findall(r'<script[^>]*>(.*?)</script>', html, re.DOTALL | re.IGNORECASE)
for s in scripts:
    if any(k in s.lower() for k in ['search', 'post', 'ajax', 'inquiry', 'export', 'txtpart']):
        print(s[:500])
        print("=" * 40)
