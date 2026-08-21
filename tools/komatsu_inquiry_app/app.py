import os
import sys
import io
import time
import zipfile
import pandas as pd
import streamlit as st

# Set page layout
st.set_page_config(
    page_title="Komatsu PDX Parts Inquiry",
    page_icon="🚜",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling
st.markdown("""
<style>
    .main-header {
        font-size: 2.2rem;
        font-weight: 700;
        color: #0d3b66;
        margin-bottom: 0.2rem;
    }
    .sub-header {
        font-size: 1rem;
        color: #555;
        margin-bottom: 1.5rem;
    }
    .metric-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 15px;
        text-align: center;
    }
    .metric-val {
        font-size: 1.8rem;
        font-weight: bold;
        color: #1a365d;
    }
    .metric-label {
        font-size: 0.85rem;
        color: #64748b;
    }
    .stButton>button {
        border-radius: 6px;
        font-weight: 600;
    }
</style>
""", unsafe_allow_html=True)

from utils import parse_input_data, chunk_list, generate_styled_excel
from http_connector import save_cookie, load_cookie, test_pdx_connection, run_http_bulk_inquiry

# App Title
st.markdown('<div class="main-header">🚜 Komatsu PDX Parts Inquiry Hub</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-header">Automate multi-part inquiries without the 12-item limit. Upload your list, query Komatsu PDX directly, and export consolidated reports with interchangeable parts.</div>', unsafe_allow_html=True)

# Sidebar: Cookie Authentication Setup
with st.sidebar:
    st.header("🔐 PDX Connection")
    
    is_connected, status_msg = test_pdx_connection()
    if is_connected:
        st.success(f"🟢 **Status**: {status_msg}")
    else:
        st.warning(f"🟡 **Status**: {status_msg}")

    st.markdown("---")
    st.subheader("Connect in 10 Seconds")
    st.markdown("""
    **How to get your session cookie:**
    1. Go to your open **Komatsu PDX** tab in Edge.
    2. Press **F12** (or Right-Click ➔ Inspect).
    3. Click **Console**, paste this and press Enter:
       `copy(document.cookie)`
    4. Paste the copied text below:
    """)
    
    current_cookie = load_cookie()
    cookie_input = st.text_area("Paste Cookie / cURL here:", value=current_cookie, height=90)
    
    if st.button("💾 Save & Test Connection", use_container_width=True, type="primary"):
        if cookie_input.strip():
            save_cookie(cookie_input)
            ok, msg = test_pdx_connection()
            if ok:
                st.success(f"🎉 {msg}")
                time.sleep(1)
                st.rerun()
            else:
                st.error(f"❌ {msg}")
        else:
            st.error("Please paste your cookie first!")

    st.markdown("---")
    st.caption("Direct HTTP API: **No browser popups needed. 100% Reliable & Fast.**")

# Session state initialization
if "parsed_input_df" not in st.session_state:
    st.session_state.parsed_input_df = None
if "results_df" not in st.session_state:
    st.session_state.results_df = None
if "is_running" not in st.session_state:
    st.session_state.is_running = False

# Main Area Tabs
tab_auto, tab_split, tab_merge = st.tabs(["🚀 Automated Inquiry", "📦 Split into 12-Item CSVs", "📑 Merge Result Files"])

# --- TAB 1: AUTOMATED INQUIRY ---
with tab_auto:
    st.markdown("#### 1. Provide Parts & Quantities")
    in_col1, in_col2 = st.columns([1, 1])
    
    with in_col1:
        uploaded_file = st.file_uploader(
            "Upload Master File (Excel .xlsx / .xls or CSV)",
            type=["xlsx", "xls", "csv"],
            key="auto_upload"
        )
        if uploaded_file is not None:
            parsed_df = parse_input_data(uploaded_file)
            if not parsed_df.empty:
                st.session_state.parsed_input_df = parsed_df

    with in_col2:
        pasted_text = st.text_area(
            "Or Paste Part Numbers and Quantities (one per line)",
            height=130,
            placeholder="6742-01-4540, 6\n600-319-3750, 6\n6261-31-2130, 2"
        )
        if st.button("Load Pasted Text", key="btn_load_text"):
            if pasted_text.strip():
                parsed_df = parse_input_data(pasted_text)
                if not parsed_df.empty:
                    st.session_state.parsed_input_df = parsed_df
                    st.success(f"Loaded {len(parsed_df)} parts!")

    # Display Uploaded Queue
    if st.session_state.parsed_input_df is not None and not st.session_state.parsed_input_df.empty:
        input_df = st.session_state.parsed_input_df
        total_parts = len(input_df)
        total_batches = (total_parts + 11) // 12

        st.markdown("---")
        st.markdown("#### 2. Inquiry Queue Summary")
        
        mcol1, mcol2, mcol3 = st.columns(3)
        with mcol1:
            st.markdown(f'<div class="metric-card"><div class="metric-val">{total_parts}</div><div class="metric-label">Total Unique Parts</div></div>', unsafe_allow_html=True)
        with mcol2:
            st.markdown(f'<div class="metric-card"><div class="metric-val">{total_batches}</div><div class="metric-label">Batches to Process (12/batch)</div></div>', unsafe_allow_html=True)
        with mcol3:
            st.markdown(f'<div class="metric-card"><div class="metric-val">{int(input_df["Quantity"].sum())}</div><div class="metric-label">Total Required Quantity</div></div>', unsafe_allow_html=True)

        with st.expander("View Uploaded Items Table", expanded=False):
            st.dataframe(input_df, use_container_width=True)

        st.markdown("<br>", unsafe_allow_html=True)
        start_btn = st.button("🚀 Start Automated Komatsu Inquiry", type="primary", use_container_width=True)

        if start_btn:
            st.session_state.is_running = True
            progress_bar = st.progress(0.0)
            status_text = st.empty()
            live_table_holder = st.empty()

            records = input_df[['Part_Number', 'Quantity']].to_dict('records')

            def on_progress(step, total, message, current_df):
                if total > 0:
                    progress_bar.progress(min(step / total, 1.0))
                status_text.info(f"⏳ **Status**: {message}")
                if current_df is not None and not current_df.empty:
                    live_table_holder.dataframe(current_df.tail(15), use_container_width=True)

            try:
                final_results = run_http_bulk_inquiry(records, progress_callback=on_progress)
                
                if not final_results.empty:
                    st.session_state.results_df = final_results
                    progress_bar.progress(1.0)
                    status_text.success(f"🎉 **Inquiry Completed!** Retrieved {len(final_results)} records across {total_batches} batches.")
                else:
                    status_text.warning("Inquiry completed, but no records were extracted. Please check your session cookie.")
            except Exception as e:
                if "LOGIN_REQUIRED" in str(e):
                    status_text.error("❌ **Session expired**: Please update your session cookie in the sidebar.")
                else:
                    status_text.error(f"❌ **Error during inquiry**: {e}")
            finally:
                st.session_state.is_running = False

    # Display Results
    if st.session_state.results_df is not None and not st.session_state.results_df.empty:
        st.markdown("---")
        st.markdown("### 📊 Inquiry Results")
        
        results = st.session_state.results_df
        
        search_query = st.text_input("🔍 Filter results by part number or description:", "")
        if search_query.strip():
            mask = results.astype(str).apply(lambda row: row.str.contains(search_query, case=False).any(), axis=1)
            filtered_results = results[mask]
        else:
            filtered_results = results

        st.dataframe(filtered_results, use_container_width=True, height=480)

        # Export Buttons
        excel_bytes = generate_styled_excel(results)
        csv_bytes = results.to_csv(index=False).encode('utf-8')
        
        dcol1, dcol2 = st.columns(2)
        with dcol1:
            st.download_button(
                label="📥 Download Consolidated Excel (.xlsx)",
                data=excel_bytes,
                file_name=f"Komatsu_Parts_Inquiry_{time.strftime('%Y%m%d_%H%M%S')}.xlsx",
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                type="primary",
                use_container_width=True
            )
        with dcol2:
            st.download_button(
                label="📄 Download CSV (.csv)",
                data=csv_bytes,
                file_name=f"Komatsu_Parts_Inquiry_{time.strftime('%Y%m%d_%H%M%S')}.csv",
                mime="text/csv",
                use_container_width=True
            )

# --- TAB 2: BATCH SPLITTER ---
with tab_split:
    st.markdown("### 📦 1-Click 12-Item CSV Batch Generator")
    st.info("Upload your master file and download a ZIP file containing pre-formatted 12-item CSVs ready to upload to Komatsu PDX (`SN`, `Qty`).")
    
    split_file = st.file_uploader("Upload Master File to Split", type=["xlsx", "xls", "csv"], key="split_uploader")
    if split_file:
        df_to_split = parse_input_data(split_file)
        if not df_to_split.empty:
            batches = list(chunk_list(df_to_split.to_dict('records'), 12))
            st.success(f"Generated **{len(batches)} batches** from {len(df_to_split)} parts!")
            
            zip_buffer = io.BytesIO()
            with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
                for idx, b in enumerate(batches, start=1):
                    batch_df = pd.DataFrame(b)[['Part_Number', 'Quantity']]
                    batch_df.columns = ['SN', 'Qty']
                    csv_content = batch_df.to_csv(index=False)
                    zip_file.writestr(f"Komatsu_Batch_{idx:02d}.csv", csv_content)
            
            zip_buffer.seek(0)
            st.download_button(
                label=f"📥 Download All {len(batches)} Batches as ZIP",
                data=zip_buffer.getvalue(),
                file_name="Komatsu_12_Item_Batches.zip",
                mime="application/zip",
                type="primary",
                use_container_width=True
            )

# --- TAB 3: BATCH MERGER ---
with tab_merge:
    st.markdown("### 📑 Merge Downloaded Result Files")
    st.info("If you downloaded multiple result files from Komatsu PDX, drop them here to combine them into a single consolidated Excel report.")
    
    downloaded_files = st.file_uploader(
        "Upload Komatsu Export Files (CSV / Excel)", 
        type=["csv", "xlsx", "xls"], 
        accept_multiple_files=True,
        key="merge_uploader"
    )
    if downloaded_files:
        merged_dfs = []
        for f in downloaded_files:
            try:
                if f.name.endswith('.csv'):
                    m_df = pd.read_csv(f, encoding='latin1')
                else:
                    m_df = pd.read_excel(f)
                merged_dfs.append(m_df)
            except Exception as e:
                st.warning(f"Could not read {f.name}: {e}")
        
        if merged_dfs:
            combined_df = pd.concat(merged_dfs, ignore_index=True)
            st.success(f"Combined {len(downloaded_files)} files into {len(combined_df)} total records!")
            st.dataframe(combined_df, use_container_width=True)
            
            merged_excel = generate_styled_excel(combined_df)
            st.download_button(
                label="📥 Download Consolidated Excel (.xlsx)",
                data=merged_excel,
                file_name=f"Komatsu_Merged_Report_{time.strftime('%Y%m%d_%H%M%S')}.xlsx",
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                type="primary",
                use_container_width=True
            )
