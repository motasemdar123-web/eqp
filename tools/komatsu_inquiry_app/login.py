import os
from scraper import open_login_browser

if __name__ == "__main__":
    print("=" * 60)
    print("Opening Komatsu Login Window...")
    print("Please log in with your Microsoft / Komatsu credentials.")
    print("When finished, simply close the browser window.")
    print("=" * 60)
    open_login_browser()
    print("Login browser closed. Session saved successfully!")
