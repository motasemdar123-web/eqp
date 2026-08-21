import time
from playwright.sync_api import sync_playwright

def test_browser():
    print("Launching Chromium window...")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,
            args=["--start-maximized", "--new-window"]
        )
        context = browser.new_context(no_viewport=True)
        page = context.new_page()
        page.goto("https://www.komatsu.ae/kmewebportal/StockInquiry/MultiplePartsStockInquiry")
        print("Page opened. Browser will stay open for 30 seconds.")
        time.sleep(30)
        browser.close()

if __name__ == "__main__":
    test_browser()
