import os
import sys
import uvicorn
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

# Ensure tools directory is in sys.path
sys.path.insert(0, os.path.dirname(__file__))

from pdx_core import PDXClient
from pdx_excel import FleetManager, DEFAULT_EXCEL_PATH

app = FastAPI(title="Komatsu PDX Emergency Order Batch Automation")

# Setup HTML file path
HTML_PATH = os.path.join(os.path.dirname(__file__), "templates", "pdx_dashboard.html")

# Global instances
INITIAL_COOKIES = (
    "SelectedLanguage=; "
    ".AspNet.Cookies=cqIYX_3LSAVsSB0yvBHA1Esz6Z7Nd5IRgDulEoi-WW19R66jyOkA_pcuA3J3tWkvl7DrkPwpWsMhRc8AcOnxGQ4JT-V3Qlge2OOEVBjO1g9XF7_rMu8l5qGOS6JpZFVxwr0nRaQEZEBUCHV9NKL7IkZaUEICoE35IMwNr8mlqpMRt8AOVrjzLJDFmR0R8oTzfJuxAVzqDH2g3huhvkVQVi0wcnS2gE-XYIVxksxnXb0-I6fHjSelGmMlFvTCm5Z1BMZ7YD6uaiKgIKvCYLFV81fUP0zGWLuLzpARxfbSQC_YUzdcBPTwEculK4B7Caz3oJ27h-Tc6Y_KVJsKqwg6-EIO8yVtbFt_1R20rMga5IDZiGp8hHPWBQax2Q20m7pC4ymPDZDTWpP0rNpFpbd12vjIpXkfqKYg15RiJZEQkYivi6TYu2YepVOu1pJ0M8HNcH7UzPf3zgHDEb-cHR8LZFvWJjeOL17o53kPNEIvQnMDiFf3OPFv9xVh5THfR9QgA4eaB0pDnyD8i4S6lPx4xH6yFi5-yjy98tTw4eR48wP_sW1ppU4gPzGt3F4G_klXy5XbLpvOmzUFtLbx0fVWflkBJK4zxZFmhly14D9-m9R1hddKJv3YQM-XzI-1Y1YXpvYMd9vVf6d-WvohFYcfrOOgHZozc8EnQdaGwIQe6hYHCaRftJ9b_t_YzygnrX-zJ7BCMAEDErE1JLwzBcfkqG22qEI8_GnEpoWHqx_jXRBlXUC3_gmLNIhXf8yrXRDSFMjdOIs_zhYXBg6pltzHmV1MVA9NgvPKgc4DPqdCbLSxyk9uPum2wOqWPvJ7sVjUtmVjKGrJY2P09zwOZmaF18vrjZT3DapMMNg9nzAdCTUVsCK-haC-Fq9lbXgNKb7xMKIFSX3euEx-1PCDfRWsFEnufRWyf1n8MyHvVTSJDpQkCDOdVHjEJMGuO5DDXm8cALpgOLLrbEP5e84gE2mTiKdhrVWFYFZ5kdwyAxftZz-sVCycQQAfrd4zvExB9SGzyY6qVBWSqBmqRYPnQzPG_MhO7CZ3kTcCeuCFINV6hKCITdyArNNIEwdQ7zlxglhNhZqQjH3TgRZlXah22ipdL6LT-2Pz_3A-N-OqsaXKA59_YXyoNsK93oj0jEzS_p5CQwkVGtv4Wo15iboqWLoa_XCynmtueqXJnxBwYVN1PWBfkMDphjRIb_BkbZv2Wa3PiO-5xhN59xK3Itzz72DmaqQnn72ELsjxSpp2Uk4iWOn-DUoDOT8ghcF-6CvSU3cpr1Qp9MjTseUIYvYvOj8XXbTt4-hsS8AqJetfsD5HpQQNk9hraZBJeNCHy_ClQrP9nIQPs3d5IUh_AgPvy42Mv1aI8mMJdhSW0eFlLkYc7IPbjNd5PeF7eJn4pXKltjbq23HZEbG3xQ4wP50QHx4ogQS81hftxiHh03xl-2ETm-l-r11zKapI_vZESarEeoQ_koccqaJV4-6qtCwFSkA1ApNYx9V76Vgj-fl0HaLobakaxG_IzjcqGmH6LkWR8sbtQRHqZAoA-O4jPaLHCOqFFD66tqlDQPfK6vfifDbS-yVbg_YE4XaExoeuIWafn8hnGPF2BETEz9dM3cLhLtf6O5WxbrayIYrR2OFOhW0OE7Sxqsykl63wYXIbFsWzpVB_; "
    "ASP.NET_SessionId=f33mpgny11b3ikxgvclruxcl"
)

pdx_client = PDXClient(cookies=INITIAL_COOKIES)
fleet_manager = FleetManager(DEFAULT_EXCEL_PATH)

# Request Models
class PartLookupRequest(BaseModel):
    part_no: str

class CookieUpdateRequest(BaseModel):
    cookies: str

class CustomMachineRequest(BaseModel):
    customer: str
    machine_type: str
    model: str
    serials: str

class PartItem(BaseModel):
    part_no: str
    quantity: int

class SingleOrderExecutionRequest(BaseModel):
    db_order_no: str
    model_code: str
    serial_no: str
    customer_detail: str
    comments: Optional[str] = "Urgent"
    parts: List[PartItem]
    dry_run: Optional[bool] = False

# HTML Dashboard Route
@app.get("/", response_class=HTMLResponse)
async def get_dashboard():
    with open(HTML_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    return HTMLResponse(content=content)

# API Routes
@app.get("/api/session/status")
async def get_session_status():
    active, msg = pdx_client.validate_session()
    return {
        "active": active,
        "message": msg,
        "user": pdx_client.user_id
    }

@app.post("/api/session/update")
async def update_cookies(body: CookieUpdateRequest):
    pdx_client.set_cookies(body.cookies)
    active, msg = pdx_client.validate_session()
    return {"status": "OK", "active": active, "message": msg}

@app.post("/api/session/test")
async def test_cookies(body: CookieUpdateRequest):
    temp_client = PDXClient(cookies=body.cookies)
    active, msg = temp_client.validate_session()
    return {"active": active, "message": msg}

@app.get("/api/fleet/all")
async def get_all_fleet():
    return {
        "customers": fleet_manager.get_customers(),
        "machine_types": fleet_manager.get_machine_types(),
        "models": fleet_manager.models,
        "machines": fleet_manager.machines,
        "total": len(fleet_manager.machines)
    }

@app.get("/api/fleet/filter")
async def filter_fleet(customer: Optional[str] = None, machine_type: Optional[str] = None, model: Optional[str] = None):
    machines = fleet_manager.get_machines(customer=customer, machine_type=machine_type, model=model)
    return {"machines": machines, "count": len(machines)}

@app.post("/api/fleet/add-custom")
async def add_custom_machine(body: CustomMachineRequest):
    serials = [s.strip() for s in body.serials.split(',') if s.strip()]
    for sn in serials:
        fleet_manager.add_custom_machine(
            customer=body.customer,
            machine_type=body.machine_type,
            model=body.model,
            serial=sn
        )
    return {"status": "OK", "count": len(serials)}

@app.get("/api/part/lookup")
async def lookup_part_info(part_no: str):
    try:
        data = pdx_client.lookup_part(part_no)
        return data
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/db-order-no/latest")
async def get_latest_order_no():
    try:
        next_order_no, next_seq, year = pdx_client.get_latest_db_order_no()
        return {
            "next_order_no": next_order_no,
            "next_seq": next_seq,
            "year": year
        }
    except Exception as e:
        return {"error": str(e), "next_order_no": "R153/2026"}

@app.post("/api/order/execute")
async def execute_order(order: SingleOrderExecutionRequest):
    if order.dry_run:
        # Simulation mode: generate mock quotation number
        import random
        mock_qtn = f"0000{random.randint(280350, 289999)}"
        return {
            "status": "SUCCESS",
            "quotation_no": mock_qtn,
            "db_order_no": order.db_order_no,
            "model_code": order.model_code,
            "serial_no": order.serial_no,
            "customer": order.customer_detail,
            "dry_run": True
        }
        
    try:
        parts_list = [{"part_no": p.part_no, "quantity": p.quantity} for p in order.parts]
        res = pdx_client.place_single_emergency_order(
            db_order_no=order.db_order_no,
            model_code=order.model_code,
            serial_no=order.serial_no,
            customer_detail=order.customer_detail,
            parts=parts_list,
            comments=order.comments or "Urgent"
        )
        return res
    except Exception as e:
        return {
            "status": "FAILED",
            "error": str(e),
            "db_order_no": order.db_order_no
        }

if __name__ == "__main__":
    print("Starting Komatsu PDX Emergency Order Automation Server on http://localhost:5055 ...")
    uvicorn.run("app_pdx:app", host="127.0.0.1", port=5055, reload=False)
