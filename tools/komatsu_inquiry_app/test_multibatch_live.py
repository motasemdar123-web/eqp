import time
import pandas as pd
from http_connector import run_http_bulk_inquiry

test_records = [
    {"Part_Number": "6742-01-4540", "Quantity": 6},
    {"Part_Number": "600-319-3750", "Quantity": 6},
    {"Part_Number": "6261-31-2130", "Quantity": 6},
    {"Part_Number": "6261-31-2030", "Quantity": 6},
    {"Part_Number": "6211-22-2220", "Quantity": 6},
    {"Part_Number": "6210-21-2270", "Quantity": 6},
    {"Part_Number": "6210-21-2240", "Quantity": 6},
    {"Part_Number": "6210-21-2230", "Quantity": 6},
    {"Part_Number": "6261-31-1200", "Quantity": 1},
    {"Part_Number": "6261-31-3100", "Quantity": 2},
    {"Part_Number": "6210-21-8010", "Quantity": 7},
    {"Part_Number": "6261-41-5420", "Quantity": 1},
    {"Part_Number": "6261-41-5520", "Quantity": 1},
    {"Part_Number": "6210-21-8050", "Quantity": 1},
]

print(f"Testing multi-batch query with {len(test_records)} parts (2 batches)...")
start_t = time.time()
res_df = run_http_bulk_inquiry(test_records)
elapsed = time.time() - start_t

print(f"\nCompleted in {elapsed:.2f} seconds! Retrieved {len(res_df)} total records:")
print(res_df[['Item Type', 'Part Number', 'Requested Qty', 'Part Description', 'Latest Part Number (LPN)', 'KME Stock', 'DNet Price', 'Weight (gm)']].to_string())
