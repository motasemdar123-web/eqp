with open("pdx_get_page.html", "r", encoding="utf-8") as f:
    html = f.read()

idx = html.find('$("#btnSearch").on("click"')
if idx != -1:
    print(html[idx:idx+2500])
