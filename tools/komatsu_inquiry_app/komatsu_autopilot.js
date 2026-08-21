/**
 * Komatsu PDX In-Browser Auto-Pilot
 * Paste this in your Microsoft Edge DevTools Console (F12) while on:
 * https://www.komatsu.ae/kmewebportal/StockInquiry/MultiplePartsStockInquiry
 */
(function () {
    // Remove existing overlay if any
    const existing = document.getElementById('komatsu-autopilot-overlay');
    if (existing) existing.remove();

    // Create Floating UI
    const container = document.createElement('div');
    container.id = 'komatsu-autopilot-overlay';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 480px;
        max-height: 90vh;
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        z-index: 999999;
        font-family: 'Segoe UI', Arial, sans-serif;
        color: #333;
        border: 2px solid #0d3b66;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    `;

    container.innerHTML = `
        <div style="background: #0d3b66; color: white; padding: 14px 18px; font-weight: bold; font-size: 16px; display: flex; justify-content: space-between; align-items: center;">
            <span>🚜 Komatsu PDX Auto-Pilot</span>
            <button id="kap-close-btn" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; line-height: 1;">&times;</button>
        </div>
        <div style="padding: 18px; overflow-y: auto; font-size: 13px;">
            <p style="margin: 0 0 10px 0; color: #555;">Paste your serial / part numbers & quantities below (from Excel or text, one per line):</p>
            <textarea id="kap-input" placeholder="6742-01-4540, 6&#10;600-319-3750, 6&#10;6261-31-2130, 2" style="width: 100%; height: 140px; border: 1px solid #ccc; border-radius: 6px; padding: 8px; font-family: monospace; font-size: 12px; box-sizing: border-box; resize: vertical;"></textarea>
            
            <div id="kap-stats" style="margin: 8px 0; font-size: 12px; color: #0d3b66; font-weight: 600;">Ready to parse items.</div>
            
            <div style="display: flex; gap: 8px; margin-top: 10px;">
                <button id="kap-start-btn" style="flex: 1; background: #0d3b66; color: white; border: none; padding: 10px 14px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px;">▶️ Start Auto-Pilot Query</button>
                <button id="kap-stop-btn" style="background: #e63946; color: white; border: none; padding: 10px 14px; border-radius: 6px; font-weight: bold; cursor: pointer; display: none; font-size: 13px;">⏹ Stop</button>
            </div>

            <div id="kap-progress-box" style="display: none; margin-top: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px;">
                <div style="display: flex; justify-content: space-between; font-weight: 600; margin-bottom: 5px; font-size: 12px;">
                    <span id="kap-status-text">Processing...</span>
                    <span id="kap-percent-text">0%</span>
                </div>
                <div style="width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                    <div id="kap-progress-bar" style="width: 0%; height: 100%; background: #0d3b66; transition: width 0.3s;"></div>
                </div>
            </div>

            <div id="kap-results-box" style="display: none; margin-top: 14px;">
                <div id="kap-results-msg" style="color: #2b8a3e; font-weight: bold; margin-bottom: 8px;"></div>
                <button id="kap-download-btn" style="width: 100%; background: #2b8a3e; color: white; border: none; padding: 10px 14px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px;">📥 Download Consolidated CSV</button>
            </div>
        </div>
    `;

    document.body.appendChild(container);

    // Elements
    const closeBtn = document.getElementById('kap-close-btn');
    const inputArea = document.getElementById('kap-input');
    const statsDiv = document.getElementById('kap-stats');
    const startBtn = document.getElementById('kap-start-btn');
    const stopBtn = document.getElementById('kap-stop-btn');
    const progressBox = document.getElementById('kap-progress-box');
    const statusText = document.getElementById('kap-status-text');
    const percentText = document.getElementById('kap-percent-text');
    const progressBar = document.getElementById('kap-progress-bar');
    const resultsBox = document.getElementById('kap-results-box');
    const resultsMsg = document.getElementById('kap-results-msg');
    const downloadBtn = document.getElementById('kap-download-btn');

    closeBtn.onclick = () => container.remove();

    let shouldStop = false;
    let masterData = [];

    // Parse input on typing
    inputArea.oninput = () => {
        const items = parseInput(inputArea.value);
        if (items.length > 0) {
            const batches = Math.ceil(items.length / 12);
            statsDiv.innerText = `Detected ${items.length} parts (Will run ${batches} batches of 12).`;
        } else {
            statsDiv.innerText = 'Ready to parse items.';
        }
    };

    function parseInput(text) {
        const lines = text.split('\n');
        const list = [];
        for (let line of lines) {
            line = line.trim();
            if (!line) continue;
            // Handle tab or comma
            const parts = line.split(/[\t,;]+/).map(s => s.trim()).filter(s => s.length > 0);
            if (parts.length === 0) continue;
            const partNo = parts[0];
            if (/^(sn|part|item|part number|number)$/i.test(partNo)) continue;
            let qty = 1;
            if (parts.length > 1) {
                const parsedQty = parseInt(parts[1], 10);
                if (!isNaN(parsedQty)) qty = parsedQty;
            }
            list.push({ partNo, qty });
        }
        return list;
    }

    function chunkArray(array, size) {
        const result = [];
        for (let i = 0; i < array.length; i += size) {
            result.push(array.slice(i, i + size));
        }
        return result;
    }

    function findInputBoxes() {
        const allInputs = Array.from(document.querySelectorAll("input[type='text']"));
        return allInputs.filter(inp => {
            if (!inp.offsetParent) return false; // must be visible
            const id = (inp.id || '').toLowerCase();
            const name = (inp.name || '').toLowerCase();
            if (id.includes('browse') || id.includes('file') || id.includes('filter') || name.includes('file')) return false;
            return true;
        }).slice(0, 12);
    }

    function findButtonByText(text) {
        const elements = Array.from(document.querySelectorAll("button, input[type='button'], input[type='submit'], a.btn, a"));
        return elements.find(el => {
            const val = (el.innerText || el.value || '').trim().toLowerCase();
            return val.includes(text.toLowerCase());
        });
    }

    function scrapeCurrentTable() {
        const rows = [];
        const tables = document.querySelectorAll("table");
        tables.forEach(table => {
            const trs = table.querySelectorAll("tbody tr, tr");
            trs.forEach(tr => {
                const tds = Array.from(tr.querySelectorAll("td"));
                if (tds.length >= 8) {
                    const rowData = tds.map(td => td.innerText.trim().replace(/[\r\n]+/g, ' '));
                    if (!rowData[0].toLowerCase().includes("part no") && !rowData[0].toLowerCase().includes("sequence")) {
                        rows.push(rowData);
                    }
                }
            });
        });
        return rows;
    }

    startBtn.onclick = async () => {
        const parts = parseInput(inputArea.value);
        if (parts.length === 0) {
            alert("Please paste your part numbers first!");
            return;
        }

        const inputBoxes = findInputBoxes();
        if (inputBoxes.length === 0) {
            alert("Could not find the 12 input boxes on this page. Make sure you are on MultiplePartsStockInquiry!");
            return;
        }

        shouldStop = false;
        masterData = [];
        startBtn.style.display = 'none';
        stopBtn.style.display = 'block';
        progressBox.style.display = 'block';
        resultsBox.style.display = 'none';

        const batches = chunkArray(parts, 12);
        const totalBatches = batches.length;

        for (let bIdx = 0; bIdx < totalBatches; bIdx++) {
            if (shouldStop) break;

            const batch = batches[bIdx];
            const batchNum = bIdx + 1;
            const pct = Math.round((bIdx / totalBatches) * 100);

            statusText.innerText = `Batch ${batchNum}/${totalBatches}: Filling ${batch.length} parts...`;
            percentText.innerText = `${pct}%`;
            progressBar.style.width = `${pct}%`;

            // Clear and fill boxes
            for (let i = 0; i < inputBoxes.length; i++) {
                const box = inputBoxes[i];
                if (i < batch.length) {
                    box.value = batch[i].partNo;
                } else {
                    box.value = '';
                }
                box.dispatchEvent(new Event('input', { bubbles: true }));
                box.dispatchEvent(new Event('change', { bubbles: true }));
            }

            await new Promise(r => setTimeout(r, 600));

            // Click Search
            statusText.innerText = `Batch ${batchNum}/${totalBatches}: Clicking Search...`;
            const searchBtn = findButtonByText("Search");
            if (searchBtn) {
                searchBtn.click();
            } else {
                console.warn("Search button not found, trying enter key.");
                inputBoxes[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            }

            // Wait for results
            statusText.innerText = `Batch ${batchNum}/${totalBatches}: Waiting for Komatsu results...`;
            await new Promise(r => setTimeout(r, 3500));

            // Trigger Export Data download
            const exportBtn = findButtonByText("Export Data");
            if (exportBtn) {
                try { exportBtn.click(); } catch(e) {}
            }

            // Scrape table
            const tableRows = scrapeCurrentTable();
            if (tableRows.length > 0) {
                tableRows.forEach(r => masterData.push(r));
            }

            await new Promise(r => setTimeout(r, 1200));
        }

        // Finish
        percentText.innerText = `100%`;
        progressBar.style.width = `100%`;
        startBtn.style.display = 'block';
        stopBtn.style.display = 'none';

        if (shouldStop) {
            statusText.innerText = "Stopped by user.";
        } else {
            statusText.innerText = "Completed all batches!";
            resultsBox.style.display = 'block';
            resultsMsg.innerText = `✅ Processed ${parts.length} parts (${masterData.length} records captured)!`;
        }
    };

    stopBtn.onclick = () => {
        shouldStop = true;
        stopBtn.innerText = "Stopping...";
    };

    // Download Consolidated CSV
    downloadBtn.onclick = () => {
        if (masterData.length === 0) {
            alert("No table data captured, but your individual batch files were downloaded by Edge.");
            return;
        }

        const headers = [
            "Part No", "Status/Int", "Part Description", "CC", "IC", "Latest Part Number",
            "KME Stock", "KME EOR", "KME On Order", "Regional Inventory", "KLTD Total",
            "KMEQA", "DNet Price", "Weight(gm)", "KLTD LT", "MOR", "OR"
        ];

        let csv = headers.map(h => `"${h}"`).join(",") + "\n";
        masterData.forEach(row => {
            csv += row.map(val => `"${(val || '').replace(/"/g, '""')}"`).join(",") + "\n";
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Komatsu_Consolidated_Inquiry_${new Date().toISOString().slice(0,10)}.csv`;
        link.click();
    };
})();
