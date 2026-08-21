with open("pdx_get_page.html", "r", encoding="utf-8") as f:
    html = f.read()

idx = html.find('function DownloadData')
if idx != -1:
    print(html[idx:idx+1500])
