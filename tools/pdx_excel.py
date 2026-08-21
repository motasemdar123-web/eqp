import os
import re
import pandas as pd
from typing import List, Dict, Any, Optional

DEFAULT_EXCEL_PATH = r"C:\Users\Motasem.ghanem\Downloads\Default Dashboard_Machine List_21_08_2026, 23_25_45.xlsx"

class FleetManager:
    def __init__(self, file_path: str = DEFAULT_EXCEL_PATH):
        self.file_path = file_path
        self.machines: List[Dict[str, Any]] = []
        self.customers: List[str] = []
        self.machine_types: List[str] = []
        self.models: List[str] = []
        self.load_data()

    def load_data(self, file_path: Optional[str] = None):
        if file_path:
            self.file_path = file_path
            
        if not os.path.exists(self.file_path):
            return

        try:
            df = pd.read_excel(self.file_path)
            # Normalize column names
            col_map = {}
            for col in df.columns:
                c_clean = str(col).strip().lower()
                if 'machine' in c_clean and 'type' in c_clean:
                    col_map[col] = 'machine_type'
                elif 'model' in c_clean:
                    col_map[col] = 'model'
                elif 'serial' in c_clean:
                    col_map[col] = 'serial'
                elif 'cust' in c_clean:
                    col_map[col] = 'customer'
            
            df = df.rename(columns=col_map)
            df = df.dropna(subset=['serial', 'model'], how='all')
            
            self.machines = []
            for _, row in df.iterrows():
                cust = str(row.get('customer', '')).strip() if pd.notna(row.get('customer')) else 'Unknown'
                mtype = str(row.get('machine_type', '')).strip() if pd.notna(row.get('machine_type')) else 'Other'
                model = str(row.get('model', '')).strip() if pd.notna(row.get('model')) else ''
                serial = str(row.get('serial', '')).strip() if pd.notna(row.get('serial')) else ''
                if serial.endswith('.0'):
                    serial = serial[:-2]
                    
                if model or serial:
                    self.machines.append({
                        'customer': cust,
                        'machine_type': mtype,
                        'model': model,
                        'serial': serial
                    })
            
            self.customers = sorted(list(set(m['customer'] for m in self.machines if m['customer'])))
            self.machine_types = sorted(list(set(m['machine_type'] for m in self.machines if m['machine_type'])))
            self.models = sorted(list(set(m['model'] for m in self.machines if m['model'])))
        except Exception as e:
            print(f"Error loading Excel file: {e}")

    def get_customers(self) -> List[str]:
        return self.customers

    def get_machine_types(self, customer: Optional[str] = None) -> List[str]:
        if not customer:
            return self.machine_types
        types = set(m['machine_type'] for m in self.machines if m['customer'].lower() == customer.lower())
        return sorted(list(types))

    def get_models(self, customer: Optional[str] = None, machine_type: Optional[str] = None) -> List[str]:
        filtered = self.machines
        if customer:
            filtered = [m for m in filtered if m['customer'].lower() == customer.lower()]
        if machine_type:
            filtered = [m for m in filtered if m['machine_type'].lower() == machine_type.lower()]
        return sorted(list(set(m['model'] for m in filtered if m['model'])))

    def get_machines(self, customer: Optional[str] = None, machine_type: Optional[str] = None, model: Optional[str] = None) -> List[Dict[str, Any]]:
        filtered = self.machines
        if customer:
            filtered = [m for m in filtered if m['customer'].lower() == customer.lower()]
        if machine_type:
            filtered = [m for m in filtered if m['machine_type'].lower() == machine_type.lower()]
        if model:
            filtered = [m for m in filtered if m['model'].lower() == model.lower()]
        return filtered

    def filter_by_compatible_models(self, compatible_models: List[str], customer: Optional[str] = None) -> List[Dict[str, Any]]:
        if not compatible_models:
            return self.get_machines(customer=customer)
            
        norm_compat = [re.sub(r'[\s\-_\/]', '', cm).upper() for cm in compatible_models]
        
        results = []
        pool = self.get_machines(customer=customer)
        for m in pool:
            m_norm = re.sub(r'[\s\-_\/]', '', m['model']).upper()
            matched = False
            for c_norm in norm_compat:
                if m_norm == c_norm or m_norm in c_norm or c_norm in m_norm:
                    matched = True
                    break
            if matched:
                results.append(m)
        return results

    def add_custom_machine(self, customer: str, machine_type: str, model: str, serial: str):
        item = {
            'customer': customer.strip(),
            'machine_type': machine_type.strip() or 'Custom',
            'model': model.strip(),
            'serial': serial.strip()
        }
        self.machines.append(item)
        if item['customer'] and item['customer'] not in self.customers:
            self.customers.append(item['customer'])
            self.customers.sort()
        if item['model'] and item['model'] not in self.models:
            self.models.append(item['model'])
            self.models.sort()
        return item
