import re
import requests
from http_connector import get_session, extract_aspnet_form_data, INQUIRY_URL

session = get_session()
resp = session.get(INQUIRY_URL)

with open("pdx_get_page.html", "w", encoding="utf-8") as f:
    f.write(resp.text)

print("--- Form Inputs in Page ---")
inputs = re.findall(r'<input[^>]+>', resp.text, re.IGNORECASE)
for inp in inputs:
    name_m = re.search(r'name="([^"]+)"', inp)
    id_m = re.search(r'id="([^"]+)"', inp)
    type_m = re.search(r'type="([^"]+)"', inp)
    val_m = re.search(r'value="([^"]+)"', inp)
    name = name_m.group(1) if name_m else ''
    id_val = id_m.group(1) if id_m else ''
    type_val = type_m.group(1) if type_m else 'text'
    val = val_m.group(1) if val_m else ''
    
    if type_val not in ['hidden']:
        print(f"Input: type={type_val} name={name} id={id_val} value={val}")

# Also check select/dropdowns and buttons
buttons = re.findall(r'<button[^>]*>(.*?)</button>|<input[^>]+type="(?:submit|button)"[^>]*>', resp.text, re.IGNORECASE)
print(f"\n--- Buttons ({len(buttons)}) ---")
for b in buttons:
    print(b)
