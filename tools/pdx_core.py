import requests
import json
import re
import time
from typing import Dict, Any, List, Optional, Tuple

class PDXClient:
    def __init__(self, cookies: Optional[str] = None, user_id: str = "motasemgha", db_code: str = "536K", db_name: str = "DAR AL HAI"):
        self.base_url = "https://www.komatsu.ae/kmewebportal"
        self.user_id = user_id
        self.db_code = db_code
        self.db_name = db_name
        self.session = requests.Session()
        self.session.verify = False  # Disable SSL verification for enterprise intranet compatibility
        
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',
            'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
            'Origin': 'https://www.komatsu.ae',
        }
        
        if cookies:
            self.set_cookies(cookies)

    def set_cookies(self, cookie_str: str):
        self.session.cookies.clear()
        for item in cookie_str.split(';'):
            item = item.strip()
            if not item:
                continue
            if '=' in item:
                k, v = item.split('=', 1)
                self.session.cookies.set(k.strip(), v.strip())

    def get_cookie_header(self) -> str:
        return "; ".join([f"{c.name}={c.value}" for c in self.session.cookies])

    def validate_session(self) -> Tuple[bool, str]:
        """Check if session is currently active and authenticated"""
        try:
            url = f"{self.base_url}/Inquiry/QuotationInquiry"
            resp = self.session.get(url, headers=self.headers, timeout=10)
            if resp.status_code == 200 and "motasemgha" in resp.text:
                return True, "Session Active (User: motasemgha)"
            elif resp.status_code == 200 and "Quotation Inquiry" in resp.text:
                return True, "Session Active"
            elif "login" in resp.url.lower() or "sso" in resp.url.lower() or resp.status_code in [401, 403]:
                return False, "Session Expired / Unauthenticated"
            else:
                return False, f"Unexpected response (Status: {resp.status_code})"
        except Exception as e:
            return False, f"Connection error: {str(e)}"

    def lookup_part(self, part_no: str) -> Dict[str, Any]:
        """Lookup part details and compatible models from Part Master Inquiry"""
        url = f"{self.base_url}/StockInquiry/PartsMasterInquirySearch"
        headers = dict(self.headers)
        headers.update({
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        })
        data = {'txtPartNo': part_no.strip()}
        
        resp = self.session.post(url, data=data, headers=headers, timeout=15)
        if resp.status_code != 200:
            raise Exception(f"Failed to lookup part {part_no}: HTTP {resp.status_code}")
            
        res = resp.json()
        if not res or not isinstance(res, dict):
            raise Exception(f"Invalid response format for part {part_no}")
            
        desc = res.get('txtPNAM', '')
        qty_by_unit_str = res.get('txtQBYU', '1')
        try:
            qty_by_unit = int(float(qty_by_unit_str)) if qty_by_unit_str else 1
            if qty_by_unit <= 0:
                qty_by_unit = 1
        except Exception:
            qty_by_unit = 1
            
        raw_models = res.get('txtModelInfo', '') or ''
        models = [m.strip() for m in raw_models.split(';') if m.strip()]
        
        return {
            'part_no': part_no.strip(),
            'description': desc,
            'qty_by_unit': qty_by_unit,
            'models': models,
            'raw_models': raw_models,
            'price': res.get('txtKMELstPrc', '0.00'),
            'weight': res.get('txtUWEI', '0'),
            'rank': res.get('txtKMERank', ''),
            'raw_json': res
        }

    def get_latest_db_order_no(self, customer_code: str = "REG") -> Tuple[str, int, int]:
        """Fetch latest DB Order No (e.g. R152/2026) and return (next_order_no, next_seq, year)"""
        url = f"{self.base_url}/Inquiry/SearchResult"
        headers = dict(self.headers)
        headers.update({
            'Accept': '*/*',
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        })
        data = {
            'QuotationNo': '',
            'QuotationSubNo': '',
            'DistributerOrderNo': '',
            'SalesOrderNo': '',
            'Status': '',
            'FromDate': '',
            'ToDate': '',
            'PersonIncharge': '',
            'CustomerCode': customer_code,
            'page': '1'
        }
        
        resp = self.session.post(url, data=data, headers=headers, timeout=15)
        if resp.status_code != 200:
            raise Exception(f"Failed to fetch Quotation Inquiry list: HTTP {resp.status_code}")
            
        matches = re.findall(r'R(\d+)/(\d{4})', resp.text)
        if not matches:
            # Default fallback
            return "R1/2026", 1, 2026
            
        max_num = 0
        cur_year = 2026
        for num_str, year_str in matches:
            num = int(num_str)
            cur_year = int(year_str)
            if num > max_num:
                max_num = num
                
        next_seq = max_num + 1
        next_order_no = f"R{next_seq}/{cur_year}"
        return next_order_no, next_seq, cur_year

    def create_quotation_condition(
        self,
        db_order_no: str,
        model_code: str,
        serial_no: str,
        customer_detail: str,
        comments: str = "Urgent",
        order_type: str = "EO",
        customer_code: str = "REG",
        quotation_no: str = ""
    ) -> Dict[str, Any]:
        """Save Quotation Condition and return assigned Quotation Number"""
        # Reset ASP.NET form session state by calling QuotationCondition/Index
        init_url = f"{self.base_url}/QuotationCondition/Index"
        self.session.get(init_url, headers=self.headers, timeout=15)

        url = f"{self.base_url}/QuotationCondition/Save"
        headers = dict(self.headers)
        headers.update({
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/json',
            'Referer': init_url
        })
        
        rates = [
            {"QuotationNo": "", "QuotationSubNo": "", "RateType": "1", "CommodityGroupCode": grp, "RateValue": "0.00"}
            for grp in ["A", "B", "C", "D", "DA", "E", "F", "NA", "Other", "S"]
        ]
        
        payload = {
            "objQuotationConditionPostModel": {
                "OrigQuotationNo": "0000000000",
                "OrigQuotationSeqNo": "00",
                "QuotationNo": quotation_no or "",
                "QuotationSeqNo": "00",
                "DistributerOrderNo": db_order_no,
                "DistributerCodes": self.db_code,
                "DistributerName": self.db_name,
                "SalesPriceList": "USD037",
                "Currency": "USD",
                "ExchangeRate": "1",
                "OrderType": order_type,
                "Usance": "30",
                "TaxRate": "0",
                "Transportation": "RD",
                "DeliveryTerms": "DDU",
                "PaymentTerms": "T2",
                "OrderPRobability": "A",
                "Region": "AE",
                "Status": "1",
                "LoadingPort": "JEA",
                "UnloadingPort": "KWI",
                "PersonIncharge": self.user_id,
                "QuotationValidity": "08/29/2026",
                "RequestedDeliveryTime": "08/22/2026",
                "PriceCalculationMethod": "D",
                "DiscountRateOther": "0",
                "PremiumRate": "13.3",
                "BillingRateA": "0",
                "BillingRateB": "0",
                "BillingRateC": "0",
                "BillingRateD": "0",
                "BillingRateE": "0",
                "BillingRateF": "0",
                "ShipToAddress": "DAR AL HAI\nKUWAIT GENERAL TRADING. Al-Rai Industrial Area  Plot # 1732  Block # 2  Street # 4  Behind the Avenues  Kuwait",
                "AvailableMark": True,
                "UseHSCode": False,
                "ReserverStock": False,
                "DontConsiderEORes": False,
                "FixPrice": False,
                "Memo": "",
                "Comments": comments,
                "ModelCode": model_code,
                "SerialNo": serial_no,
                "EngineSrNo": "-",
                "CustomerDetails": customer_detail,
                "ModelInfoMark": True,
                "jobCard": "",
                "Warranty": "",
                "TSINumber": "",
                "ModelSVREMark": False,
                "ExitPoint": "JEA",
                "CustomerCode": customer_code,
                "lstRates": rates,
                "MarkingCode": "MCOIL"
            }
        }
        
        resp = self.session.post(url, json=payload, headers=headers, timeout=20)
        if resp.status_code != 200:
            raise Exception(f"QuotationCondition Save failed: HTTP {resp.status_code} - {resp.text[:200]}")
            
        res_json = resp.json()
        new_qtn = res_json.get("NewQuotaioonNumber") or res_json.get("NewQuotationNumber")
        if not new_qtn and res_json.get("RecordUpdated") == 1:
            new_qtn = quotation_no
            
        if not new_qtn:
            raise Exception(f"QuotationCondition Save did not return quotation number: {res_json}")
            
        return {
            'quotation_no': new_qtn,
            'response': res_json
        }

    def add_parts_and_update(
        self,
        quotation_no: str,
        parts: List[Dict[str, Any]],
        cto: str = "ZZ"
    ) -> Dict[str, Any]:
        """Load details page, search/initialize session context, add parts, and run update details calculation"""
        # 1. Initialize detail session context
        detail_url = f"{self.base_url}/QuotationDetails/Index?strQUTN={quotation_no}&strQutnSubNo=0&DBCode={self.db_code}"
        self.session.get(detail_url, headers=self.headers, timeout=15)
        
        # 2. Search / Load quotation data into session
        search_url = f"{self.base_url}/QuotationDetails/Search"
        headers_search = dict(self.headers)
        headers_search.update({
            'Accept': '*/*',
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Referer': detail_url
        })
        search_data = {
            'qtno': quotation_no,
            'subqtno': '0',
            'DBCode': self.db_code
        }
        self.session.post(search_url, data=search_data, headers=headers_search, timeout=15)

        # 3. Add New Parts
        add_url = f"{self.base_url}/QuotationDetails/AddNewParts"
        headers_add = dict(self.headers)
        headers_add.update({
            'Accept': '*/*',
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Referer': detail_url
        })
        
        new_parts_payload = []
        for p in parts:
            new_parts_payload.append({
                "RequestedPartNo": str(p['part_no']).strip(),
                "Requested_Quantity": str(p['quantity']).strip(),
                "Unit_Price": "0",
                "Discount": "0",
                "CTO": cto,
                "DCOD": self.db_code
            })
            
        add_data = {
            'userID': self.user_id,
            'strNewParts': json.dumps(new_parts_payload),
            'page': ''
        }
        
        resp_add = self.session.post(add_url, data=add_data, headers=headers_add, timeout=20)
        if resp_add.status_code != 200:
            raise Exception(f"AddNewParts failed: HTTP {resp_add.status_code}")
            
        # 4. Update Details
        update_url = f"{self.base_url}/QuotationDetails/UpdateDetails"
        headers_upd = dict(self.headers)
        headers_upd.update({
            'Accept': '*/*',
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Referer': detail_url
        })
        update_data = {
            'userID': self.user_id,
            'currency': 'USD',
            'tax': '0.00',
            'nameOfOtherCharges1': '',
            'nameOfOtherCharges2': '',
            'otherCharges1': '0.00',
            'otherCharges2': '0.00',
            'sellingPrice': '0.00',
            'shippingCharges': '0.00'
        }
        
        resp_upd = self.session.post(update_url, data=update_data, headers=headers_upd, timeout=20)
        if resp_upd.status_code != 200:
            raise Exception(f"UpdateDetails failed: HTTP {resp_upd.status_code}")
            
        return {
            'status': 'SUCCESS',
            'quotation_no': quotation_no,
            'parts_added': len(parts)
        }

    def place_single_emergency_order(
        self,
        db_order_no: str,
        model_code: str,
        serial_no: str,
        customer_detail: str,
        parts: List[Dict[str, Any]],
        comments: str = "Urgent"
    ) -> Dict[str, Any]:
        """Complete end-to-end execution of a single Emergency Order"""
        # Step 1: Save Quotation Condition
        qtn_res = self.create_quotation_condition(
            db_order_no=db_order_no,
            model_code=model_code,
            serial_no=serial_no,
            customer_detail=customer_detail,
            comments=comments
        )
        new_qtn_no = qtn_res['quotation_no']
        
        # Small delay for backend processing
        time.sleep(0.5)
        
        # Step 2: Add Parts & Update
        det_res = self.add_parts_and_update(
            quotation_no=new_qtn_no,
            parts=parts
        )
        
        return {
            'status': 'SUCCESS',
            'quotation_no': new_qtn_no,
            'db_order_no': db_order_no,
            'model_code': model_code,
            'serial_no': serial_no,
            'customer': customer_detail,
            'parts': parts
        }
