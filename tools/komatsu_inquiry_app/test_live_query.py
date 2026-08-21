import requests
import pandas as pd
from http_connector import get_session, query_pdx_batch_http

session = get_session()
test_parts = ["6742-01-4540", "600-319-3750"]
print(f"Submitting test query for {test_parts}...")

try:
    df = query_pdx_batch_http(session, test_parts)
    print(f"\nQuery returned {len(df)} rows:")
    print(df.to_string())
except Exception as e:
    print(f"Error querying batch: {e}")
    # Let's inspect the page HTML if error
    r = session.get("https://www.komatsu.ae/kmewebportal/StockInquiry/MultiplePartsStockInquiry")
    with open("debug_pdx_page.html", "w", encoding="utf-8") as f:
        f.write(r.text)
    print("Saved debug_pdx_page.html for inspection")
