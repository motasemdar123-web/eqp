import pandas as pd
from utils import parse_input_data, chunk_list, generate_styled_excel

def test_pipeline():
    print("Testing parser with text input...")
    sample_text = """6742-01-4540, 6
600-319-3750, 6
6261-31-2130, 6
6261-31-2030, 6
6211-22-2220, 6
6210-21-2270, 6
6210-21-2240, 6
6210-21-2230, 6
6261-31-1200, 1
6261-31-3100, 2
6210-21-8010, 7
6261-41-5420, 1
6261-41-5520, 1
6210-21-8050, 1
6261-61-1204, 1
6261-51-2000, 1
6261-31-3130, 4
6210-32-3040, 4
6210-17-1814, 6
6217-11-8830, 6
6211-11-4821, 3
6261-11-7450, 1
02895-77075, 2
6212-61-6662, 2
6261-11-5880, 6"""

    parsed_df = parse_input_data(sample_text)
    print(f"Parsed {len(parsed_df)} rows. Columns: {parsed_df.columns.tolist()}")
    assert len(parsed_df) == 25
    
    batches = list(chunk_list(parsed_df.to_dict('records'), 12))
    print(f"Total batches created: {len(batches)} (Sizes: {[len(b) for b in batches]})")
    assert len(batches) == 3
    assert len(batches[0]) == 12
    assert len(batches[1]) == 12
    assert len(batches[2]) == 1

    # Test mock results export
    mock_results = pd.DataFrame([
        {
            "Sequence Number": 1,
            "Part Number": "6742-01-4540",
            "Part Description": "CARTRIDGE",
            "Latest Part Number": "6742-01-4540",
            "KME Stock": 3642,
            "KME EOR": 122,
            "KME On Order": 0,
            "DNet Price": 42.42,
            "Weight": 1610.0,
            "KLTD Lead Time": 4.5,
            "Interchangeable Code": "000"
        },
        {
            "Sequence Number": 1,
            "Part Number": "6742-01-5524",
            "Part Description": "FILTER OIL (Alternate)",
            "Latest Part Number": "6742-01-4540",
            "KME Stock": 0,
            "KME EOR": 0,
            "KME On Order": 0,
            "DNet Price": 243.37,
            "Weight": 0.0,
            "KLTD Lead Time": 16.67,
            "Interchangeable Code": "018"
        },
        {
            "Sequence Number": 2,
            "Part Number": "600-319-3750",
            "Part Description": "CARTRIDGE FUEL",
            "Latest Part Number": "600-319-3750",
            "KME Stock": 1626,
            "KME EOR": 124,
            "KME On Order": 864,
            "DNet Price": 32.00,
            "Weight": 900.0,
            "KLTD Lead Time": 0.5,
            "Interchangeable Code": "000"
        }
    ])

    excel_data = generate_styled_excel(mock_results)
    print(f"Generated styled Excel file of size: {len(excel_data)} bytes")
    assert len(excel_data) > 0
    print("All tests PASSED successfully!")

if __name__ == "__main__":
    test_pipeline()
