import os
import sys
import time
import glob
import json
import tempfile
import pandas as pd
from playwright.sync_api import sync_playwright

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATE_FILE = os.path.join(BASE_DIR, "auth_state.json")
USER_DATA_DIR = os.path.join(BASE_DIR, "browser_session")
INQUIRY_URL = "https://www.komatsu.ae/kmewebportal/StockInquiry/MultiplePartsStockInquiry"
LOGIN_URL = "https://www.komatsu.ae/kmewebportal/StockInquiry/MultiplePartsStockInquiry"

def open_login_browser():
    """
    Opens a visible browser for the user to log into Microsoft SSO / Komatsu.
    Saves authentication state (cookies/tokens) to auth_state.json.
    """
    print("1. Launching Chromium browser...")
    with sync_playwright() as p:
        try:
            # Try launching edge channel if available, or chromium
            browser = p.chromium.launch(
                headless=False,
                channel="msedge",
                args=["--start-maximized"]
            )
        except Exception:
            browser = p.chromium.launch(
                headless=False,
                args=["--start-maximized"]
            )

        print("2. Opening new browser context...")
        context = browser.new_context(
            no_viewport=True,
            accept_downloads=True
        )
        page = context.new_page()
        
        print(f"3. Navigating to: {LOGIN_URL}...")
        try:
            page.goto(LOGIN_URL, wait_until="domcontentloaded", timeout=60000)
        except Exception as nav_e:
            print(f"Navigation notice: {nav_e}")
            
        print("\n" + "=" * 60)
        print(">>> Browser is now OPEN! <<<")
        print("Please complete your login in the opened browser window.")
        print("Once you reach the inquiry page, simply close the browser window.")
        print("=" * 60 + "\n")
        
        # Keep browser open until user closes it or navigates past login
        try:
            while True:
                time.sleep(1)
                try:
                    if page.is_closed() or len(context.pages) == 0:
                        break
                    url = page.url
                    # If user is on the portal, save cookies / state continuously
                    if "kmewebportal" in url or "StockInquiry" in url:
                        context.storage_state(path=STATE_FILE)
                except Exception:
                    break
        finally:
            try:
                context.storage_state(path=STATE_FILE)
                context.close()
                browser.close()
            except Exception:
                pass
    print(f"Login completed. Auth state saved to {STATE_FILE}")
    return True


class KomatsuScraper:
    def __init__(self, headless=False, progress_callback=None):
        self.headless = headless
        self.progress_callback = progress_callback
        self.temp_download_dir = tempfile.mkdtemp(prefix="komatsu_downloads_")

    def log(self, message, step=0, total=0, df=None):
        print(f"[{step}/{total}] {message}" if total else f"[*] {message}")
        if self.progress_callback:
            self.progress_callback(step, total, message, df)

    def _find_part_inputs(self, page):
        """
        Locates the 12 input boxes for part numbers on the PDX portal.
        """
        inputs = page.query_selector_all("input[type='text']")
        part_inputs = []
        for inp in inputs:
            try:
                if not inp.is_visible():
                    continue
                inp_id = (inp.get_attribute("id") or "").lower()
                inp_name = (inp.get_attribute("name") or "").lower()
                
                # Exclude file upload path box or filter boxes
                if any(x in inp_id or x in inp_name for x in ["file", "upload", "browse", "filter"]):
                    continue
                part_inputs.append(inp)
            except Exception:
                continue

        if len(part_inputs) > 12:
            part_inputs = part_inputs[:12]
        return part_inputs

    def _scrape_html_table(self, page):
        """
        Extracts parts data directly from the on-screen table if export is unavailable.
        """
        rows_data = []
        try:
            tables = page.query_selector_all("table")
            for table in tables:
                rows = table.query_selector_all("tbody tr, tr")
                for r in rows:
                    cells = r.query_selector_all("td")
                    if len(cells) >= 8:
                        row_vals = [c.inner_text().strip() for c in cells]
                        if "Part No" in row_vals[0] or "Sequence" in row_vals[0]:
                            continue
                        rows_data.append(row_vals)
        except Exception as e:
            print(f"HTML table extraction error: {e}")
        return rows_data

    def process_batches(self, part_records):
        """
        part_records: list of dicts [{'Part_Number': '6742-01-4540', 'Quantity': 6}, ...]
        Returns a consolidated pandas DataFrame with all Komatsu results.
        """
        from utils import chunk_list
        batches = list(chunk_list(part_records, 12))
        total_batches = len(batches)
        
        all_results_dfs = []
        
        self.log(f"Starting bulk inquiry for {len(part_records)} parts ({total_batches} batches)...", 0, total_batches)

        with sync_playwright() as p:
            browser = None
            is_cdp = False
            
            # 1. First try connecting to active Edge instance via CDP
            try:
                browser = p.chromium.connect_over_cdp("http://localhost:9222", timeout=3000)
                is_cdp = True
                self.log("Connected directly to active Microsoft Edge session (Port 9222)!", 0, total_batches)
            except Exception:
                pass

            # 2. Fallback to launching browser
            if not browser:
                try:
                    browser = p.chromium.launch(
                        headless=self.headless,
                        args=["--start-maximized", "--new-window"]
                    )
                except Exception as b_err:
                    self.log(f"Browser launch error: {b_err}", 0, total_batches)
                    raise

            if is_cdp:
                context = browser.contexts[0] if browser.contexts else browser.new_context()
            else:
                context_kwargs = {"accept_downloads": True, "no_viewport": True}
                if os.path.exists(STATE_FILE):
                    context_kwargs["storage_state"] = STATE_FILE
                context = browser.new_context(**context_kwargs)

            page = context.pages[0] if context.pages else context.new_page()

            for batch_idx, batch in enumerate(batches, start=1):
                batch_parts = [item['Part_Number'] for item in batch]
                self.log(f"Processing Batch {batch_idx}/{total_batches} ({len(batch_parts)} parts)...", batch_idx - 1, total_batches)

                try:
                    page.goto(INQUIRY_URL, wait_until="domcontentloaded", timeout=60000)
                    time.sleep(1.5)

                    # Check if redirected to Microsoft login
                    if "login.microsoftonline.com" in page.url:
                        self.log("Session expired or login required. Please open login window first.", batch_idx, total_batches)
                        raise Exception("LOGIN_REQUIRED")

                    # Save updated auth state
                    context.storage_state(path=STATE_FILE)

                    part_inputs = self._find_part_inputs(page)
                    if not part_inputs:
                        time.sleep(2)
                        part_inputs = self._find_part_inputs(page)

                    if not part_inputs:
                        self.log(f"Warning: Could not find input boxes on page. URL: {page.url}", batch_idx, total_batches)
                        continue

                    # Fill the part numbers
                    for i in range(12):
                        if i < len(part_inputs):
                            try:
                                part_inputs[i].fill("")
                                if i < len(batch_parts):
                                    part_inputs[i].fill(str(batch_parts[i]))
                            except Exception:
                                pass

                    time.sleep(0.5)

                    # Click Search Button
                    search_btn = page.locator("button:has-text('Search'), input[value='Search'], a:has-text('Search'), button.btn-search").first
                    if search_btn.is_visible():
                        search_btn.click()
                    else:
                        page.keyboard.press("Enter")

                    # Wait for results
                    time.sleep(3)
                    try:
                        page.wait_for_load_state("networkidle", timeout=15000)
                    except Exception:
                        pass

                    # Try to click 'Export Data'
                    batch_df = None
                    export_btn = page.locator("button:has-text('Export Data'), input[value*='Export Data'], a:has-text('Export Data')").first
                    
                    if export_btn.is_visible():
                        try:
                            with page.expect_download(timeout=8000) as download_info:
                                export_btn.click()
                            download = download_info.value
                            download_path = os.path.join(self.temp_download_dir, f"batch_{batch_idx}_{download.suggested_filename}")
                            download.save_as(download_path)
                            
                            if download_path.endswith('.csv'):
                                batch_df = pd.read_csv(download_path, encoding='latin1')
                            elif download_path.endswith(('.xlsx', '.xls')):
                                batch_df = pd.read_excel(download_path)
                        except Exception as dl_err:
                            print(f"Export download: {dl_err}. Falling back to table extraction.")

                    # Fallback: Scrape HTML table
                    if batch_df is None or batch_df.empty:
                        table_data = self._scrape_html_table(page)
                        if table_data:
                            standard_cols = [
                                "Part No", "Status/Int", "Part Description", "CC", "IC", 
                                "Latest Part Number", "KME Stock", "KME EOR", "KME On Order", 
                                "Regional Inventory", "KLTD Total", "KMEQA", "DNet Price", 
                                "Weight(gm)", "KLTD LT", "MOR", "OR"
                            ]
                            max_cols = max(len(r) for r in table_data)
                            if max_cols > len(standard_cols):
                                cols = standard_cols + [f"Col_{i}" for i in range(len(standard_cols), max_cols)]
                            else:
                                cols = standard_cols[:max_cols]
                            batch_df = pd.DataFrame(table_data, columns=cols)

                    if batch_df is not None and not batch_df.empty:
                        all_results_dfs.append(batch_df)
                        self.log(f"Batch {batch_idx}/{total_batches} successfully fetched ({len(batch_df)} rows)", batch_idx, total_batches, pd.concat(all_results_dfs, ignore_index=True))
                    else:
                        self.log(f"Batch {batch_idx}/{total_batches}: No data returned.", batch_idx, total_batches)

                except Exception as e:
                    if str(e) == "LOGIN_REQUIRED":
                        raise
                    print(f"Error on batch {batch_idx}: {e}")
                    self.log(f"Error on Batch {batch_idx}: {str(e)}", batch_idx, total_batches)

            try:
                context.close()
                browser.close()
            except Exception:
                pass

        if all_results_dfs:
            final_df = pd.concat(all_results_dfs, ignore_index=True)
            self.log(f"Completed! Total {len(final_df)} records retrieved.", total_batches, total_batches, final_df)
            return final_df
        else:
            return pd.DataFrame()
