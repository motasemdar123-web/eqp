import os
import re
import io
import time
import json
import urllib.parse
import requests
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
COOKIE_FILE = os.path.join(BASE_DIR, "pdx_cookies.txt")
INQUIRY_PAGE_URL = "https://www.komatsu.ae/kmewebportal/StockInquiry/MultiplePartsStockInquiry"
SEARCH_API_URL = "https://www.komatsu.ae/kmewebportal/StockInquiry/MultiPartsStockInqSearch"

def parse_cookie_input(raw_input):
    """
    Parses raw cookie string, document.cookie output, or a copied cURL command.
    """
    raw_input = raw_input.strip()
    if not raw_input:
        return ""
        
    if "curl" in raw_input.lower() or "invoke-webrequest" in raw_input.lower() or "fetch(" in raw_input:
        cookie_match = re.search(r'-(?:H|-header)\s+[\'"](?:cookie:\s*)?([^\'"]+)[\'"]', raw_input, re.IGNORECASE)
        if cookie_match:
            return cookie_match.group(1).strip()
        cookie_match2 = re.search(r'["\']?cookie["\']?\s*:\s*["\']([^"\']+)["\']', raw_input, re.IGNORECASE)
        if cookie_match2:
            return cookie_match2.group(1).strip()
            
    for line in raw_input.splitlines():
        line = line.strip()
        if line.lower().startswith("cookie:"):
            return line[7:].strip()
        
    return raw_input

def save_cookie(raw_input):
    cookie_str = parse_cookie_input(raw_input)
    if cookie_str:
        with open(COOKIE_FILE, "w", encoding="utf-8") as f:
            f.write(cookie_str)
    return cookie_str

def load_cookie():
    if os.path.exists(COOKIE_FILE):
        with open(COOKIE_FILE, "r", encoding="utf-8") as f:
            return f.read().strip()
    return ""

def get_session():
    session = requests.Session()
    cookie_str = load_cookie()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
        "Accept": "text/html, */*; q=0.01",
        "Accept-Language": "en-US,en;q=0.9",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": INQUIRY_PAGE_URL,
        "Cookie": cookie_str
    })
    return session

def test_pdx_connection():
    """
    Tests if the saved cookie connects to PDX.
    """
    cookie_str = load_cookie()
    if not cookie_str:
        return False, "No session cookie saved yet."

    session = get_session()
    try:
        resp = session.get(INQUIRY_PAGE_URL, timeout=12, allow_redirects=True)
        if "login.microsoftonline.com" in resp.url or "Sign in to your account" in resp.text:
            return False, "Session expired. Please copy fresh cookies from Edge."
            
        if "MultiplePartsStockInquiry" in resp.url or "PDX" in resp.text or "KOMATSU" in resp.text:
            user_match = re.search(r'([A-Za-z\s]+),\s*Database:\s*([A-Za-z0-9_]+)', resp.text)
            if user_match:
                return True, f"Connected as: {user_match.group(1).strip()} (DB: {user_match.group(2).strip()})"
            return True, "Successfully connected to Komatsu PDX!"
        else:
            return False, f"Unexpected response (Status: {resp.status_code})"
    except Exception as e:
        return False, f"Network error: {e}"

def parse_pdx_html_table(html_text, queried_parts):
    """
    Parses exact columns from Komatsu PDX search response HTML, clearly distinguishing main parts from alternatives.
    """
    tbody_match = re.search(r'<tbody>(.*?)</tbody>', html_text, re.DOTALL | re.IGNORECASE)
    if not tbody_match:
        return pd.DataFrame()

    trs = re.findall(r'<tr[^>]*>(.*?)</tr>', tbody_match.group(1), re.DOTALL | re.IGNORECASE)
    parsed_rows = []
    seen_keys = set()
    queried_set = set(str(p).strip().upper() for p in queried_parts)

    for tr in trs:
        tds = re.findall(r'<td[^>]*>(.*?)</td>', tr, re.DOTALL | re.IGNORECASE)
        clean_tds = []
        for td in tds:
            txt = re.sub(r'<[^>]+>', ' ', td).replace('&nbsp;', ' ').strip()
            txt = re.sub(r'\s+', ' ', txt)
            clean_tds.append(txt)

        if len(clean_tds) >= 22:
            raw_part_no = clean_tds[0]
            int_exists = clean_tds[1]
            desc = clean_tds[3]
            cc = clean_tds[4]
            ic = clean_tds[5]
            lpn = clean_tds[6]
            stock = clean_tds[7]
            eor = clean_tds[8]
            on_order = clean_tds[9]
            regional_inv = clean_tds[10]
            kltd_total = clean_tds[16]
            kmeqa = clean_tds[17]
            dnet_price = clean_tds[18]
            weight = clean_tds[19]
            lead_time = clean_tds[20]
            mor = clean_tds[21]
            or_rank = clean_tds[22] if len(clean_tds) > 22 else ""

            # Check if this row is a Main Part or an Alternative under it
            is_main = raw_part_no.strip().upper() in queried_set and (raw_part_no == lpn or ic == "" or ic == "000")
            
            # Deduplication key
            row_key = (raw_part_no, lpn, dnet_price, stock, on_order, is_main)
            if row_key in seen_keys:
                continue
            seen_keys.add(row_key)

            if is_main:
                item_type = "Main Part"
                part_display = raw_part_no
            else:
                item_type = "↳ Alternative Part"
                part_display = f"   ↳ {raw_part_no}"

            parsed_rows.append({
                "Item Type": item_type,
                "Part Number": part_display,
                "Raw Part Number": raw_part_no,
                "Part Description": desc,
                "Latest Part Number (LPN)": lpn,
                "KME Stock": stock,
                "KME EOR": eor,
                "KME On Order": on_order,
                "DNet Price": dnet_price,
                "Weight (gm)": weight,
                "KLTD Lead Time (wks)": lead_time,
                "Character Code (CC)": cc,
                "Interchangeable Code (IC)": ic,
                "Regional Inventory": regional_inv,
                "KLTD Total": kltd_total,
                "KMEQA": kmeqa,
                "MOR": mor,
                "Order Rank (OR)": or_rank
            })

    return pd.DataFrame(parsed_rows)

def query_pdx_batch_http(session, part_numbers):
    """
    Submits a batch of up to 12 part numbers directly to MultiPartsStockInqSearch.
    """
    post_data = {
        "ddlManufacturer": "0000",
        "ddlStockPoint": ""
    }
    for i in range(1, 13):
        if i - 1 < len(part_numbers):
            post_data[f"txtPart{i}"] = str(part_numbers[i - 1]).strip()
        else:
            post_data[f"txtPart{i}"] = ""

    resp = session.post(SEARCH_API_URL, data=post_data, timeout=20)
    
    if "login.microsoftonline.com" in resp.url or "Sign in to your account" in resp.text:
        raise Exception("LOGIN_REQUIRED")

    df = parse_pdx_html_table(resp.text, part_numbers)
    return df

def run_http_bulk_inquiry(part_records, progress_callback=None):
    """
    Queries all parts using direct HTTP in batches of 12.
    """
    from utils import chunk_list
    session = get_session()
    
    batches = list(chunk_list(part_records, 12))
    total_batches = len(batches)
    all_dfs = []

    if progress_callback:
        progress_callback(0, total_batches, f"Starting query for {len(part_records)} parts ({total_batches} batches)...", None)

    for b_idx, batch in enumerate(batches, start=1):
        batch_parts = [p['Part_Number'] for p in batch]
        if progress_callback:
            progress_callback(b_idx - 1, total_batches, f"Querying Batch {b_idx}/{total_batches} ({len(batch_parts)} parts)...", pd.concat(all_dfs, ignore_index=True) if all_dfs else None)

        try:
            df = query_pdx_batch_http(session, batch_parts)
            if not df.empty:
                # Attach requested quantities
                qty_map = {p['Part_Number']: p['Quantity'] for p in batch}
                # Main parts get the requested quantity; alternative parts show the same requested qty or "-"
                df['Requested Qty'] = df.apply(
                    lambda r: qty_map.get(r['Raw Part Number'], qty_map.get(r['Latest Part Number (LPN)'], 1)), 
                    axis=1
                )
                all_dfs.append(df)
            time.sleep(0.4)
        except Exception as e:
            if "LOGIN_REQUIRED" in str(e):
                raise
            print(f"Error on batch {b_idx}: {e}")

        if progress_callback:
            progress_callback(b_idx, total_batches, f"Batch {b_idx}/{total_batches} complete.", pd.concat(all_dfs, ignore_index=True) if all_dfs else None)

    if all_dfs:
        final_df = pd.concat(all_dfs, ignore_index=True)
        # Drop temporary raw column if present
        if 'Raw Part Number' in final_df.columns:
            final_df = final_df.drop(columns=['Raw Part Number'])
            
        # Reorder columns: Item Type, Part Number, Requested Qty, Description, Latest Part No, Stock, Price, ...
        cols = list(final_df.columns)
        primary_order = ['Item Type', 'Part Number', 'Requested Qty', 'Part Description', 'Latest Part Number (LPN)', 'KME Stock', 'DNet Price', 'KME On Order', 'KME EOR', 'Weight (gm)', 'KLTD Lead Time (wks)']
        remaining_cols = [c for c in cols if c not in primary_order]
        ordered_cols = [c for c in primary_order if c in cols] + remaining_cols
        return final_df[ordered_cols]
    return pd.DataFrame()
