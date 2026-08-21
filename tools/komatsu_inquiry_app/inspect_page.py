import os
import sys
import time
from playwright.sync_api import sync_playwright

USER_DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "browser_session")
TARGET_URL = "https://www.komatsu.ae/kmewebportal/StockInquiry/PartsMasterInquiry"

def inspect_inquiry_page():
    os.makedirs(USER_DATA_DIR, exist_ok=True)
    print("=" * 70)
    print("Opening KME Parts Master Inquiry page...")
    print(f"Target: {TARGET_URL}")
    print("If prompted, please log in.")
    print("=" * 70)
    
    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            user_data_dir=USER_DATA_DIR,
            headless=False,
            viewport={"width": 1400, "height": 900},
            args=["--start-maximized"]
        )
        page = context.pages[0] if context.pages else context.new_page()
        
        # Track all network requests
        def on_response(resp):
            try:
                if "komatsu.ae" in resp.url and not resp.url.endswith((".js", ".css", ".png", ".jpg", ".svg", ".woff", ".woff2", ".ico")):
                    print(f"[API/Request] {resp.request.method} {resp.url} -> {resp.status}")
            except Exception:
                pass
        page.on("response", on_response)
        
        page.goto(TARGET_URL)
        
        print("\nBrowser is open. Waiting for you to reach the PartsMasterInquiry page...")
        
        captured = False
        while True:
            try:
                current_url = page.url
            except Exception:
                print("Browser closed.")
                break
                
            if "StockInquiry" in current_url or "PartsMasterInquiry" in current_url or "kmewebportal" in current_url:
                if not captured:
                    print(f"\n>>> DETECTED PORTAL PAGE: {current_url} <<<")
                    # Wait a moment for dynamic rendering
                    time.sleep(3)
                    
                    # Dump HTML
                    html_content = page.content()
                    html_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "portal_page.html")
                    with open(html_path, "w", encoding="utf-8") as f:
                        f.write(html_content)
                    print(f"Saved page HTML to: {html_path}")
                    
                    # Take screenshot
                    ss_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "portal_screenshot.png")
                    page.screenshot(path=ss_path)
                    print(f"Saved screenshot to: {ss_path}")
                    
                    # Inspect form elements
                    try:
                        file_inputs = page.query_selector_all("input[type='file']")
                        print(f"\n[FILE INPUTS] ({len(file_inputs)} found):")
                        for idx, fi in enumerate(file_inputs):
                            print(f"  #{idx+1}: id='{fi.get_attribute('id')}' name='{fi.get_attribute('name')}' class='{fi.get_attribute('class')}' accept='{fi.get_attribute('accept')}'")
                            
                        text_inputs = page.query_selector_all("input[type='text'], textarea")
                        print(f"\n[TEXT INPUTS / TEXTAREAS] ({len(text_inputs)} found):")
                        for idx, ti in enumerate(text_inputs[:15]):
                            print(f"  #{idx+1}: tag={ti.evaluate('e => e.tagName')} id='{ti.get_attribute('id')}' name='{ti.get_attribute('name')}' placeholder='{ti.get_attribute('placeholder')}'")
                            
                        buttons = page.query_selector_all("button, input[type='submit'], input[type='button'], a.btn, a.button")
                        print(f"\n[BUTTONS] ({len(buttons)} found):")
                        for idx, b in enumerate(buttons[:20]):
                            btn_text = b.inner_text().strip() if b.evaluate('e => e.innerText') else b.get_attribute('value')
                            print(f"  #{idx+1}: text='{btn_text}' id='{b.get_attribute('id')}' name='{b.get_attribute('name')}' class='{b.get_attribute('class')}'")
                            
                        tables = page.query_selector_all("table")
                        print(f"\n[TABLES] ({len(tables)} found):")
                        for idx, t in enumerate(tables):
                            headers = t.eval_on_selector_all("th", "ths => ths.map(th => th.innerText.trim())")
                            print(f"  Table #{idx+1} id='{t.get_attribute('id')}' class='{t.get_attribute('class')}' headers={headers}")
                    except Exception as e:
                        print(f"Error inspecting elements: {e}")
                        
                    captured = True
                    print("\n" + "=" * 70)
                    print("Page successfully analyzed! You can keep testing or close the browser.")
                    print("=" * 70)
                    
            time.sleep(2)
            
        context.close()

if __name__ == "__main__":
    inspect_inquiry_page()
