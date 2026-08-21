import os
import sys
import time
import json
from playwright.sync_api import sync_playwright

USER_DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "browser_session")
DASHBOARD_URL = "https://www.komatsu.ae/SSO/Dashboard"

def run_discovery():
    os.makedirs(USER_DATA_DIR, exist_ok=True)
    print("=" * 60)
    print("Launching browser for Komatsu Portal Login & Discovery...")
    print("A browser window will open on your screen.")
    print("1. Please log in with your Microsoft / Komatsu credentials.")
    print("2. Once logged in, navigate to the Parts Inquiry page.")
    print("=" * 60)
    
    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            user_data_dir=USER_DATA_DIR,
            headless=False,
            viewport={"width": 1280, "height": 800},
            args=["--start-maximized"]
        )
        
        page = context.pages[0] if context.pages else context.new_page()
        
        # Track network requests to inspect any background APIs
        def on_response(response):
            try:
                url = response.url
                if "komatsu.ae" in url and not url.endswith((".js", ".css", ".png", ".jpg", ".svg", ".woff", ".woff2", ".ico")):
                    print(f"[Network] {response.request.method} {url} -> Status: {response.status}")
            except Exception:
                pass
                
        page.on("response", on_response)
        
        print(f"Navigating to {DASHBOARD_URL}...")
        page.goto(DASHBOARD_URL)
        
        print("\nWaiting for you to log in and reach the Parts Inquiry page...")
        print("Keep the browser open and perform the login. When you reach the parts inquiry page, this script will automatically inspect the page.")
        
        last_url = ""
        for i in range(300):
            try:
                current_url = page.url
            except Exception:
                print("Browser closed by user.")
                break
                
            if current_url != last_url:
                print(f"\n[Page Navigation Detected]: {current_url}")
                last_url = current_url
                
                # Check if we are past login
                if "login.microsoftonline.com" not in current_url and "komatsu.ae" in current_url:
                    print("--> You are on Komatsu Portal!")
                    
                    try:
                        # Inspect available links / menus
                        links = page.eval_on_selector_all("a", "elements => elements.map(e => ({ text: e.innerText.trim(), href: e.href })).filter(e => e.text.length > 0)")
                        print(f"Found {len(links)} navigation links on page:")
                        for l in links[:20]:
                            if any(k in l['text'].lower() for k in ['part', 'inquiry', 'price', 'order', 'csv', 'bulk', 'stock']):
                                print(f"   Relevant Link: '{l['text']}' -> {l['href']}")
                    except Exception:
                        pass
                    
                    try:
                        # Check for file inputs
                        file_inputs = page.query_selector_all("input[type='file']")
                        if file_inputs:
                            print(f"   [FOUND FILE UPLOAD]: {len(file_inputs)} file input(s) detected!")
                            for idx, fi in enumerate(file_inputs):
                                print(f"      Input #{idx+1} id={fi.get_attribute('id')} name={fi.get_attribute('name')} accept={fi.get_attribute('accept')}")
                                
                        # Check for tables
                        tables = page.query_selector_all("table")
                        if tables:
                            print(f"   [FOUND TABLES]: {len(tables)} table(s) detected!")
                            for idx, t in enumerate(tables):
                                headers = t.eval_on_selector_all("th", "ths => ths.map(th => th.innerText.trim())")
                                print(f"      Table #{idx+1} Headers: {headers}")
                                
                        # Check for forms and buttons
                        buttons = page.eval_on_selector_all("button, input[type='submit'], input[type='button']", "btns => btns.map(b => ({ text: b.innerText || b.value, id: b.id, name: b.name }))")
                        if buttons:
                            print(f"   [FOUND BUTTONS]: {len(buttons)} button(s):")
                            for b in buttons[:10]:
                                print(f"      Button: text='{b.get('text')}' id='{b.get('id')}' name='{b.get('name')}'")
                                
                    except Exception:
                        pass
                    
                    # Save a screenshot
                    try:
                        screenshot_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "page_screenshot.png")
                        page.screenshot(path=screenshot_path)
                    except Exception:
                        pass
                    
            time.sleep(2)
            
        print("\nSession saved in browser_session. Closing context...")
        context.close()

if __name__ == "__main__":
    run_discovery()
