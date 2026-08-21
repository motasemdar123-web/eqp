import requests
from http_connector import save_cookie, test_pdx_connection

cookie_val = "SelectedLanguage=; ASP.NET_SessionId=2n3e5jnvjkeb4fukb543klom"
save_cookie(cookie_val)
ok, msg = test_pdx_connection()
print(f"Connection result: ok={ok}, message={msg}")
