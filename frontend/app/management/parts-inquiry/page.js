'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import SystemShell from '../../../components/SystemShell';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Field from '../../../components/ui/Field';
import Toast from '../../../components/ui/Toast';
import {
  getKomatsuStatus,
  saveKomatsuCookie,
  runKomatsuInquiry,
  getKomatsuFleet,
  lookupKomatsuPart,
  getKomatsuLatestOrderNo,
  executeKomatsuEoOrder,
  addKomatsuCustomMachine,
  getKomatsuQuotations,
  confirmKomatsuQuotation,
  copyKomatsuQuotationToSo,
} from '../../../lib/api';

const SAMPLE_PARTS = [
  '6742-01-4540, 6',
  '600-319-3750, 6',
  '6261-31-2130, 2',
  '07143-10605, 4',
  '14X-27-11240, 1',
  '07000-12010, 10',
  '6732-71-6120, 3',
  '6754-11-7110, 2',
  '600-185-4100, 2',
  '20Y-26-22230, 1',
  '07000-13038, 8',
  '6735-61-1500, 1',
  '6215-61-1310, 2',
  '6743-81-8040, 1',
];

function parseInputText(text) {
  if (!text) return [];
  const lines = text.split('\n');
  const rows = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx].trim();
    if (!rawLine) continue;

    const tokens = rawLine
      .replace(/\t/g, ',')
      .replace(/;/g, ',')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (tokens.length === 0) continue;
    const partNo = tokens[0];

    if (['sn', 'part number', 'part no', 'part_number', 'item', 'part', 'number'].includes(partNo.toLowerCase())) {
      continue;
    }

    let qty = 1;
    if (tokens.length > 1) {
      const parsed = parseInt(tokens[1], 10);
      if (!Number.isNaN(parsed) && parsed > 0) qty = parsed;
    }

    rows.push({
      partNumber: partNo,
      quantity: qty,
      originalRow: idx + 1,
    });
  }

  return rows;
}

export default function SparePartsPage() {
  const [activeTab, setActiveTab] = useState('eo-dispatcher'); // 'eo-dispatcher' | 'so-converter' | 'inquiry' | 'split' | 'fleet'
  const [status, setStatus] = useState({ connected: false, message: 'Checking PDX status...' });
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [cookieModalOpen, setCookieModalOpen] = useState(false);
  const [cookieInput, setCookieInput] = useState('');
  const [savingCookie, setSavingCookie] = useState(false);
  const [toast, setToast] = useState(null);

  // ==========================================
  // TAB 1: EMERGENCY ORDER (EO) DISPATCHER STATE
  // ==========================================
  const [eoPartNo, setEoPartNo] = useState('6745-12-3100');
  const [eoLookingUp, setEoLookingUp] = useState(false);
  const [eoPartInfo, setEoPartInfo] = useState(null);
  const [eoTotalQty, setEoTotalQty] = useState(30);
  const [eoMaxQtyPerOrder, setEoMaxQtyPerOrder] = useState(6);
  const [eoComments, setEoComments] = useState('Urgent');
  const [eoStartingOrderNo, setEoStartingOrderNo] = useState('R153/2026');
  const [eoDryRun, setEoDryRun] = useState(false);

  // Fleet Selection
  const [fleetData, setFleetData] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedMachineType, setSelectedMachineType] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customForm, setCustomForm] = useState({ customer: '', machine_type: 'Excavator', model: '', serials: '' });

  // Execution Engine
  const [plannedOrders, setPlannedOrders] = useState([]);
  const [isExecutingEo, setIsExecutingEo] = useState(false);
  const [eoExecutionIndex, setEoExecutionIndex] = useState(0);
  const [eoLogs, setEoLogs] = useState([]);
  const shouldStopEoRef = useRef(false);
  const terminalBottomRef = useRef(null);

  // ==========================================
  // TAB 2: QUOTATION TO SO CONVERTER STATE
  // ==========================================
  const [inProcessQuotations, setInProcessQuotations] = useState([]);
  const [loadingQuotations, setLoadingQuotations] = useState(false);
  const [qtnStatusFilter, setQtnStatusFilter] = useState('1'); // '1' = In-Process, '2' = Confirmed, '' = All
  const [qtnSearchFilter, setQtnSearchFilter] = useState('');
  const [qtnLimit, setQtnLimit] = useState('100'); // '10', '25', '50', '100'
  const [qtnPage, setQtnPage] = useState(1);
  const [selectedQtnNumbers, setSelectedQtnNumbers] = useState(new Set());
  const [isConvertingSo, setIsConvertingSo] = useState(false);
  const [soConversionProgress, setSoConversionProgress] = useState(null);
  const [soLogs, setSoLogs] = useState([]);
  const shouldStopSoRef = useRef(false);
  const soTerminalBottomRef = useRef(null);

  // ==========================================
  // TAB 3 & 4: BULK INQUIRY STATE
  // ==========================================
  const [pastedText, setPastedText] = useState(SAMPLE_PARTS.join('\n'));
  const [parsedQueue, setParsedQueue] = useState([]);
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryProgress, setQueryProgress] = useState(null);
  const [results, setResults] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [fleetSearchFilter, setFleetSearchFilter] = useState('');

  useEffect(() => {
    loadConnectionStatus();
    loadFleetDatabase();
    loadLatestOrderNumber();
  }, []);

  useEffect(() => {
    const parsed = parseInputText(pastedText);
    setParsedQueue(parsed);
  }, [pastedText]);

  useEffect(() => {
    generatePlan();
  }, [eoPartNo, eoTotalQty, eoMaxQtyPerOrder, selectedCustomer, selectedModel, eoStartingOrderNo, fleetData]);

  useEffect(() => {
    terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [eoLogs]);

  useEffect(() => {
    soTerminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [soLogs]);

  // Load In-Process quotations when switching to so-converter tab
  useEffect(() => {
    if (activeTab === 'so-converter' && inProcessQuotations.length === 0) {
      loadInProcessQuotations();
    }
  }, [activeTab]);

  async function loadConnectionStatus() {
    try {
      setLoadingStatus(true);
      const res = await getKomatsuStatus();
      setStatus(res || { connected: false, message: 'Offline' });
    } catch (err) {
      setStatus({ connected: false, message: err.message || 'Unable to connect to PDX server' });
    } finally {
      setLoadingStatus(false);
    }
  }

  async function loadFleetDatabase() {
    try {
      const res = await getKomatsuFleet();
      if (res && res.machines) {
        setFleetData(res.machines || []);
        setAllCustomers(res.customers || []);
        if (!selectedCustomer && res.customers?.length > 0) {
          setSelectedCustomer(res.customers[0]);
        }
      }
    } catch (err) {
      addLog(`Failed to load fleet database: ${err.message}`, 'error');
    }
  }

  async function loadLatestOrderNumber() {
    try {
      const res = await getKomatsuLatestOrderNo();
      if (res && res.next_order_no) {
        setEoStartingOrderNo(res.next_order_no);
      }
    } catch {
      // Non-blocking fallback
    }
  }

  async function handleSaveCookie(e) {
    e.preventDefault();
    if (!cookieInput.trim()) {
      setToast({ type: 'error', message: 'Please paste your cookie string' });
      return;
    }

    try {
      setSavingCookie(true);
      const res = await saveKomatsuCookie(cookieInput.trim());
      setStatus(res);
      if (res.connected) {
        setToast({ type: 'success', message: 'PDX session authenticated successfully!' });
        setCookieModalOpen(false);
        setCookieInput('');
        loadLatestOrderNumber();
        if (activeTab === 'so-converter') loadInProcessQuotations();
      } else {
        setToast({ type: 'error', message: res.message || 'Cookie verification failed' });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to save cookie' });
    } finally {
      setSavingCookie(false);
    }
  }

  function addLog(msg, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    setEoLogs((prev) => [...prev, { timestamp, text: msg, type }]);
  }

  function addSoLog(msg, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    setSoLogs((prev) => [...prev, { timestamp, text: msg, type }]);
  }

  // ==========================================
  // TAB 1: EO DISPATCHER LOGIC
  // ==========================================
  async function handleLookupPart() {
    const pNo = eoPartNo.trim();
    if (!pNo) {
      setToast({ type: 'error', message: 'Please enter a Part Number' });
      return;
    }

    try {
      setEoLookingUp(true);
      const res = await lookupKomatsuPart(pNo);
      if (res && !res.error) {
        setEoPartInfo(res);
        if (res.qty_by_unit && res.qty_by_unit > 0) {
          setEoMaxQtyPerOrder(res.qty_by_unit);
        }
        addLog(`[Lookup Success] ${res.part_no}: ${res.description} (QtyByUnit: ${res.qty_by_unit}, ${res.models?.length || 0} compatible models)`, 'success');
        setToast({ type: 'success', message: `Part verified: ${res.description}` });
      } else {
        setToast({ type: 'error', message: res.error || 'Part not found in PDX Master' });
      }
    } catch (err) {
      addLog(`Lookup failed for ${pNo}: ${err.message}`, 'error');
      setToast({ type: 'error', message: err.message || 'Failed to lookup part' });
    } finally {
      setEoLookingUp(false);
    }
  }

  const availableModels = useMemo(() => {
    let filtered = fleetData;
    if (selectedCustomer) {
      filtered = filtered.filter((m) => m.customer.toLowerCase() === selectedCustomer.toLowerCase());
    }
    if (selectedMachineType) {
      filtered = filtered.filter((m) => m.machine_type.toLowerCase() === selectedMachineType.toLowerCase());
    }
    const distinct = [...new Set(filtered.map((m) => m.model).filter(Boolean))].sort();

    const compatModels = eoPartInfo?.models ? eoPartInfo.models.map((m) => m.toUpperCase()) : [];

    return distinct.map((m) => {
      const isCompat = compatModels.some((cm) => cm.includes(m.toUpperCase()) || m.toUpperCase().includes(cm));
      return { model: m, isCompat };
    });
  }, [fleetData, selectedCustomer, selectedMachineType, eoPartInfo]);

  const availableMachineTypes = useMemo(() => {
    let filtered = fleetData;
    if (selectedCustomer) {
      filtered = filtered.filter((m) => m.customer.toLowerCase() === selectedCustomer.toLowerCase());
    }
    return [...new Set(filtered.map((m) => m.machine_type).filter(Boolean))].sort();
  }, [fleetData, selectedCustomer]);

  const matchingMachines = useMemo(() => {
    let filtered = fleetData;
    if (selectedCustomer) filtered = filtered.filter((m) => m.customer.toLowerCase() === selectedCustomer.toLowerCase());
    if (selectedMachineType) filtered = filtered.filter((m) => m.machine_type.toLowerCase() === selectedMachineType.toLowerCase());
    if (selectedModel) filtered = filtered.filter((m) => m.model.toLowerCase() === selectedModel.toLowerCase());
    return filtered;
  }, [fleetData, selectedCustomer, selectedMachineType, selectedModel]);

  function generatePlan() {
    const totalQty = parseInt(eoTotalQty, 10) || 0;
    const maxPerOrder = parseInt(eoMaxQtyPerOrder, 10) || 1;
    const pNo = eoPartNo.trim() || '6745-12-3100';
    const cust = selectedCustomer || 'DAR AL HAI';
    const model = selectedModel || (availableModels[0]?.model || 'PC500LC-10R');

    if (totalQty <= 0) {
      setPlannedOrders([]);
      return;
    }

    let machinesPool = matchingMachines;
    if (machinesPool.length === 0) {
      machinesPool = [{ customer: cust, model: model, serial: '100433' }];
    }

    const match = eoStartingOrderNo.match(/R(\d+)\/(\d{4})/);
    let seq = match ? parseInt(match[1], 10) : 1;
    let year = match ? match[2] : '2026';

    let remainingQty = totalQty;
    const orders = [];
    let orderIdx = 0;

    while (remainingQty > 0) {
      const batchQty = Math.min(remainingQty, maxPerOrder);
      remainingQty -= batchQty;
      orderIdx++;

      const currentDbOrderNo = `R${seq}/${year}`;
      seq++;

      const machineIdx = (orderIdx - 1) % machinesPool.length;
      const cycleNum = Math.floor((orderIdx - 1) / machinesPool.length) + 1;
      const machine = machinesPool[machineIdx];

      orders.push({
        index: orderIdx,
        db_order_no: currentDbOrderNo,
        customer: cust,
        model: machine.model,
        serial: machine.serial,
        part_no: pNo,
        quantity: batchQty,
        cycle_num: cycleNum,
        quotation_no: '',
        status: 'READY',
      });
    }

    setPlannedOrders(orders);
  }

  async function handleAddCustomMachine(e) {
    e.preventDefault();
    if (!customForm.customer || !customForm.model || !customForm.serials) {
      setToast({ type: 'error', message: 'Please fill all required custom machine fields' });
      return;
    }

    try {
      const res = await addKomatsuCustomMachine(customForm);
      if (res && res.machines) {
        setFleetData(res.machines);
        setAllCustomers(res.customers);
        setSelectedCustomer(customForm.customer);
        setSelectedModel(customForm.model);
        setCustomModalOpen(false);
        setCustomForm({ customer: '', machine_type: 'Excavator', model: '', serials: '' });
        setToast({ type: 'success', message: 'Custom machine added to fleet.' });
        addLog(`Added custom machine ${customForm.model} for customer ${customForm.customer}`, 'success');
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to add custom machine' });
    }
  }

  async function startBatchExecution() {
    if (plannedOrders.length === 0) {
      setToast({ type: 'error', message: 'No orders to execute' });
      return;
    }

    if (!eoDryRun) {
      const confirmed = window.confirm(`Are you sure you want to dispatch ${plannedOrders.length} LIVE Emergency Orders on Komatsu PDX?`);
      if (!confirmed) return;
    }

    setIsExecutingEo(true);
    shouldStopEoRef.current = false;
    addLog(`[START] Dispatching ${plannedOrders.length} orders - Mode: ${eoDryRun ? 'DRY-RUN (Simulated)' : 'LIVE PDX'}`, 'info');

    let successCount = 0;
    const updatedOrders = [...plannedOrders];

    for (let i = 0; i < updatedOrders.length; i++) {
      if (shouldStopEoRef.current) {
        addLog('[HALTED] Order execution stopped by user.', 'warn');
        break;
      }

      setEoExecutionIndex(i + 1);
      const current = updatedOrders[i];
      current.status = 'RUNNING';
      setPlannedOrders([...updatedOrders]);

      addLog(`[#${current.index}] Creating ${current.db_order_no} (Serial: ${current.serial}, Model: ${current.model}, Part: ${current.part_no}, Qty: ${current.quantity})...`, 'info');

      try {
        const payload = {
          db_order_no: current.db_order_no,
          model_code: current.model,
          serial_no: current.serial,
          customer_detail: current.customer,
          comments: eoComments,
          parts: [{ part_no: current.part_no, quantity: current.quantity }],
          dryRun: eoDryRun,
        };

        const res = await executeKomatsuEoOrder(payload);

        if (res && (res.status === 'SUCCESS' || res.quotation_no)) {
          current.quotation_no = res.quotation_no;
          current.status = 'SUCCESS';
          successCount++;
          addLog(`✅ [#${current.index} SUCCESS] Created Quotation: ${res.quotation_no} for ${current.db_order_no}`, 'success');
        } else {
          current.status = 'FAILED';
          addLog(`❌ [#${current.index} FAILED] ${current.db_order_no}: ${res.error || 'Unknown error'}`, 'error');
        }
      } catch (err) {
        current.status = 'ERROR';
        addLog(`❌ [#${current.index} ERROR] ${err.message}`, 'error');
      }

      setPlannedOrders([...updatedOrders]);
      await new Promise((r) => setTimeout(r, 600));
    }

    setIsExecutingEo(false);
    addLog(`[FINISHED] Execution complete: ${successCount} / ${updatedOrders.length} orders created successfully.`, 'success');
    setToast({ type: 'success', message: `Batch complete: ${successCount} / ${updatedOrders.length} orders placed.` });
  }

  function stopBatchExecution() {
    shouldStopEoRef.current = true;
    addLog('Stopping execution after current order...', 'warn');
  }

  function downloadEoCsv() {
    if (plannedOrders.length === 0) return;
    const headers = ['Order Index', 'DB Order No', 'Customer', 'Machine Model', 'Serial No', 'Part No', 'Batch Qty', 'Quotation No', 'Status', 'Cycle'];
    const rows = plannedOrders.map((o) => [
      o.index,
      `"${o.db_order_no}"`,
      `"${o.customer}"`,
      `"${o.model}"`,
      `"${o.serial}"`,
      `"${o.part_no}"`,
      o.quantity,
      `"${o.quotation_no || ''}"`,
      `"${o.status}"`,
      `"Cycle ${o.cycle_num}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `komatsu-eo-batch-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setToast({ type: 'success', message: 'Emergency Order report downloaded.' });
  }

  // ==========================================
  // TAB 2: QUOTATION TO SO CONVERTER LOGIC
  // ==========================================
  async function loadInProcessQuotations(pageToLoad = qtnPage, limitToLoad = qtnLimit, statusToLoad = qtnStatusFilter) {
    try {
      setLoadingQuotations(true);
      addSoLog(`Searching Komatsu PDX quotations (Status: ${statusToLoad || 'ALL'}, Limit: ${limitToLoad}, Page: ${pageToLoad})...`, 'info');
      const res = await getKomatsuQuotations({ status: statusToLoad, limit: limitToLoad, page: pageToLoad });
      if (res && res.quotations) {
        setInProcessQuotations(res.quotations);
        // Select all by default
        const newSet = new Set(res.quotations.map((q) => q.quotation_no));
        setSelectedQtnNumbers(newSet);
        addSoLog(`Loaded ${res.quotations.length} quotations matching filter (Limit: ${limitToLoad}).`, 'success');
      }
    } catch (err) {
      addSoLog(`Failed to fetch quotations: ${err.message}`, 'error');
      setToast({ type: 'error', message: err.message || 'Failed to fetch quotations from PDX' });
    } finally {
      setLoadingQuotations(false);
    }
  }

  const filteredQuotations = useMemo(() => {
    const q = qtnSearchFilter.trim().toLowerCase();
    if (!q) return inProcessQuotations;
    return inProcessQuotations.filter(
      (item) =>
        item.quotation_no?.toLowerCase().includes(q) ||
        item.db_order_no?.toLowerCase().includes(q) ||
        item.customer_name?.toLowerCase().includes(q) ||
        item.person_in_charge?.toLowerCase().includes(q) ||
        item.sales_order_no?.toLowerCase().includes(q)
    );
  }, [inProcessQuotations, qtnSearchFilter]);

  function toggleSelectAllQuotations() {
    if (selectedQtnNumbers.size === filteredQuotations.length) {
      setSelectedQtnNumbers(new Set());
    } else {
      setSelectedQtnNumbers(new Set(filteredQuotations.map((q) => q.quotation_no)));
    }
  }

  function toggleSelectQuotation(qNo) {
    const next = new Set(selectedQtnNumbers);
    if (next.has(qNo)) next.delete(qNo);
    else next.add(qNo);
    setSelectedQtnNumbers(next);
  }

  // Step 1: Confirm single quotation
  async function handleConfirmSingle(qtnItem) {
    try {
      addSoLog(`Confirming quotation ${qtnItem.quotation_no}...`, 'info');
      const res = await confirmKomatsuQuotation({ quotationNo: qtnItem.quotation_no, seqNo: qtnItem.revision_no || '00' });
      if (res && res.status === 'CONFIRMED') {
        addSoLog(`✅ Quotation ${qtnItem.quotation_no} Status changed to Confirmed.`, 'success');
        setInProcessQuotations((prev) =>
          prev.map((q) => (q.quotation_no === qtnItem.quotation_no ? { ...q, status: 'Confirmed' } : q))
        );
        setToast({ type: 'success', message: `Quotation ${qtnItem.quotation_no} confirmed.` });
      }
    } catch (err) {
      addSoLog(`❌ Failed to confirm ${qtnItem.quotation_no}: ${err.message}`, 'error');
      setToast({ type: 'error', message: err.message || 'Confirm failed' });
    }
  }

  // Step 2: Copy single quotation to SO
  async function handleCopySingleToSo(qtnItem) {
    try {
      addSoLog(`Copying quotation ${qtnItem.quotation_no} to Sales Order (SO)...`, 'info');
      const res = await copyKomatsuQuotationToSo({ quotationNo: qtnItem.quotation_no, seqNo: qtnItem.revision_no || '00' });
      if (res && res.status === 'COPIED_TO_SO') {
        addSoLog(`🎉 Quotation ${qtnItem.quotation_no} successfully transferred to Sales Order!`, 'success');
        setInProcessQuotations((prev) =>
          prev.map((q) => (q.quotation_no === qtnItem.quotation_no ? { ...q, status: 'Transferred to SO' } : q))
        );
        setToast({ type: 'success', message: `Quotation ${qtnItem.quotation_no} copied to SO!` });
      }
    } catch (err) {
      addSoLog(`❌ Failed to copy ${qtnItem.quotation_no} to SO: ${err.message}`, 'error');
      setToast({ type: 'error', message: err.message || 'Copy to SO failed' });
    }
  }

  // Step 3: Full Batch Confirm & Copy to SO
  async function startBatchConfirmAndCopy(actionType = 'FULL_CONVERT') {
    const selectedList = inProcessQuotations.filter((q) => selectedQtnNumbers.has(q.quotation_no));
    if (selectedList.length === 0) {
      setToast({ type: 'error', message: 'Please select at least one quotation from the table' });
      return;
    }

    const actionName =
      actionType === 'FULL_CONVERT'
        ? 'Confirm & Transfer to Sales Order (SO)'
        : actionType === 'CONFIRM_ONLY'
        ? 'Confirm Status'
        : 'Copy to Sales Order (SO)';

    const confirmed = window.confirm(`Are you sure you want to ${actionName} for ${selectedList.length} selected quotations on Komatsu PDX?`);
    if (!confirmed) return;

    setIsConvertingSo(true);
    shouldStopSoRef.current = false;
    addSoLog(`[START] Running batch ${actionName} for ${selectedList.length} quotations...`, 'info');

    let successCount = 0;

    for (let i = 0; i < selectedList.length; i++) {
      if (shouldStopSoRef.current) {
        addSoLog('[HALTED] Batch conversion stopped by user.', 'warn');
        break;
      }

      const q = selectedList[i];
      setSoConversionProgress({ current: i + 1, total: selectedList.length, quotation: q.quotation_no });

      try {
        // 1. Confirm if needed
        if (actionType === 'FULL_CONVERT' || actionType === 'CONFIRM_ONLY') {
          if (q.status !== 'Confirmed') {
            addSoLog(`[#${i + 1}] Step 1/2: Setting Status to Confirmed for ${q.quotation_no} (${q.db_order_no})...`, 'info');
            await confirmKomatsuQuotation({ quotationNo: q.quotation_no, seqNo: q.revision_no || '00' });
            q.status = 'Confirmed';
            setInProcessQuotations((prev) =>
              prev.map((item) => (item.quotation_no === q.quotation_no ? { ...item, status: 'Confirmed' } : item))
            );
            addSoLog(`  ✓ Status Confirmed for ${q.quotation_no}`, 'success');
            await new Promise((r) => setTimeout(r, 400));
          }
        }

        // 2. Copy to SO if needed
        if (actionType === 'FULL_CONVERT' || actionType === 'COPY_ONLY') {
          addSoLog(`[#${i + 1}] Step 2/2: Executing Copy to Sales Order for ${q.quotation_no}...`, 'info');
          await copyKomatsuQuotationToSo({ quotationNo: q.quotation_no, seqNo: q.revision_no || '00' });
          q.status = 'Transferred to SO';
          setInProcessQuotations((prev) =>
            prev.map((item) => (item.quotation_no === q.quotation_no ? { ...item, status: 'Transferred to SO' } : item))
          );
          addSoLog(`  🎉 [#${i + 1} SUCCESS] Quotation ${q.quotation_no} (${q.db_order_no}) successfully transferred to Sales Order!`, 'success');
        }

        successCount++;
      } catch (err) {
        addSoLog(`  ❌ [#${i + 1} ERROR] Failed ${q.quotation_no}: ${err.message}`, 'error');
      }

      await new Promise((r) => setTimeout(r, 600));
    }

    setIsConvertingSo(false);
    setSoConversionProgress(null);
    addSoLog(`[FINISHED] Process complete: ${successCount} / ${selectedList.length} quotations processed successfully.`, 'success');
    setToast({ type: 'success', message: `Batch complete: ${successCount} / ${selectedList.length} processed.` });
  }

  function stopSoBatch() {
    shouldStopSoRef.current = true;
    addSoLog('Stopping batch conversion after current item...', 'warn');
  }

  function downloadSoCsv() {
    if (inProcessQuotations.length === 0) return;
    const headers = ['Quotation No', 'Rev', 'DB Order No', 'DB Code', 'Customer Code', 'Customer Name', 'Person In Charge', 'Status', 'Total Amount (USD)'];
    const rows = inProcessQuotations.map((q) => [
      `"${q.quotation_no}"`,
      `"${q.revision_no}"`,
      `"${q.db_order_no}"`,
      `"${q.db_code}"`,
      `"${q.customer_code}"`,
      `"${q.customer_name}"`,
      `"${q.person_in_charge}"`,
      `"${q.status}"`,
      q.total_amount,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `komatsu-quotations-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setToast({ type: 'success', message: 'Quotations report downloaded.' });
  }

  // ==========================================
  // BULK INQUIRY LOGIC
  // ==========================================
  function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = String(e.target.result || '');
      setPastedText(content);
      setToast({ type: 'info', message: `Loaded file: ${file.name}` });
    };
    reader.readAsText(file);
  }

  async function executeInquiry() {
    if (parsedQueue.length === 0) {
      setToast({ type: 'error', message: 'Please provide at least one part number' });
      return;
    }

    try {
      setIsQuerying(true);
      const totalBatches = Math.ceil(parsedQueue.length / 12);
      setQueryProgress({ currentBatch: 1, totalBatches, totalParts: parsedQueue.length });

      const response = await runKomatsuInquiry(parsedQueue);
      if (response && response.results) {
        setResults(response.results);
        setToast({
          type: 'success',
          message: `Inquiry completed: ${response.results.length} total records retrieved.`,
        });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Inquiry query failed' });
    } finally {
      setIsQuerying(false);
      setQueryProgress(null);
    }
  }

  const filteredResults = useMemo(() => {
    const query = searchFilter.trim().toLowerCase();
    return results.filter((item) => {
      const matchesSearch =
        !query ||
        item.partNumber?.toLowerCase().includes(query) ||
        item.rawPartNumber?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.lpn?.toLowerCase().includes(query);

      const matchesType =
        typeFilter === 'ALL' ||
        (typeFilter === 'MAIN' && !item.isAlternative) ||
        (typeFilter === 'IN_STOCK' && Number(item.kmeStock || 0) > 0);

      return matchesSearch && matchesType;
    });
  }, [results, searchFilter, typeFilter]);

  const stats = useMemo(() => {
    const totalRecords = results.length;
    const mainParts = results.filter((r) => !r.isAlternative).length;
    const alternativeParts = results.filter((r) => r.isAlternative).length;
    const inStockKme = results.filter((r) => Number(r.kmeStock || 0) > 0).length;
    const totalValue = results.reduce((acc, r) => acc + Number(r.dnetPrice || 0) * Number(r.requestedQty || 1), 0);

    return {
      totalRecords,
      mainParts,
      alternativeParts,
      inStockKme,
      totalValue: totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    };
  }, [results]);

  function downloadCsv() {
    if (results.length === 0) return;
    const headers = [
      'Item Type',
      'Part Number',
      'Requested Qty',
      'Description',
      'Latest Part Number (LPN)',
      'KME Stock',
      'DNet Price (USD)',
      'KME On Order',
      'Weight (gm)',
      'Lead Time',
      'Character Code (CC)',
      'Interchangeable Code (IC)',
      'Japan (KLTD)',
    ];

    const rows = results.map((r) => [
      `"${r.itemType || ''}"`,
      `"${r.partNumber || ''}"`,
      r.requestedQty || 1,
      `"${(r.description || '').replace(/"/g, '""')}"`,
      `"${r.lpn || ''}"`,
      r.kmeStock || 0,
      r.dnetPrice || 0,
      r.onOrder || 0,
      r.weight || 0,
      `"${r.leadTime || ''}"`,
      `"${r.characterCode || ''}"`,
      `"${r.interchangeableCode || ''}"`,
      r.kltdTotal || 0,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `komatsu-pdx-inquiry-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setToast({ type: 'success', message: 'CSV report downloaded.' });
  }

  function download12ItemBatches() {
    if (parsedQueue.length === 0) return;
    const batches = [];
    for (let i = 0; i < parsedQueue.length; i += 12) {
      batches.push(parsedQueue.slice(i, i + 12));
    }

    batches.forEach((batch, bIdx) => {
      const csv = '\uFEFF' + ['Part Number,Quantity', ...batch.map((p) => `"${p.partNumber}",${p.quantity}`)].join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pdx-batch-${bIdx + 1}-of-${batches.length}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    });

    setToast({ type: 'success', message: `Downloaded ${batches.length} batch CSV files.` });
  }

  const filteredFleetTable = useMemo(() => {
    const q = fleetSearchFilter.trim().toLowerCase();
    if (!q) return fleetData;
    return fleetData.filter(
      (m) =>
        m.customer?.toLowerCase().includes(q) ||
        m.machine_type?.toLowerCase().includes(q) ||
        m.model?.toLowerCase().includes(q) ||
        m.serial?.toLowerCase().includes(q)
    );
  }, [fleetData, fleetSearchFilter]);

  return (
    <SystemShell
      activePath="/management/parts-inquiry"
      eyebrow="KOMATSU PDX & FLEET LOGISTICS"
      title="Spare Parts Hub"
      description="Automate Emergency Orders (EO), confirm in-process quotations, batch transfer to Sales Orders (SO), and query live Komatsu PDX catalog."
      actions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={status.connected ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => setCookieModalOpen(true)}
          >
            <span className={`h-2 w-2 rounded-full mr-1.5 ${status.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {status.connected ? 'PDX Connected' : 'Configure PDX Cookie'}
          </Button>
          {activeTab === 'eo-dispatcher' && plannedOrders.length > 0 && (
            <Button type="button" variant="secondary" size="sm" onClick={downloadEoCsv}>
              Export Order Plan
            </Button>
          )}
          {activeTab === 'so-converter' && inProcessQuotations.length > 0 && (
            <Button type="button" variant="secondary" size="sm" onClick={downloadSoCsv}>
              Export Quotations CSV
            </Button>
          )}
          {activeTab === 'inquiry' && results.length > 0 && (
            <Button type="button" variant="secondary" size="sm" onClick={downloadCsv}>
              Download Inquiry CSV
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Connection status banner */}
        <div className={`ds-alert ${status.connected ? 'ds-alert-success' : 'ds-alert-warning'} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">
              {status.connected ? '🟢 Komatsu PDX Live Portal Connected' : '🟡 Action Required: Connect to Komatsu PDX'}
            </span>
            <span className="text-xs text-slate-600">— {status.message}</span>
          </div>
          <button
            type="button"
            className="text-xs font-bold underline hover:opacity-80 ml-4 cursor-pointer"
            onClick={() => setCookieModalOpen(true)}
          >
            {status.connected ? 'Update Session' : 'Connect in 10s'}
          </button>
        </div>

        {/* Workspace Mode Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'eo-dispatcher' ? 'bg-amber-500 text-slate-950 shadow-sm font-black' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            onClick={() => setActiveTab('eo-dispatcher')}
          >
            <span>🚨</span> Emergency Order (EO) Dispatcher
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'so-converter' ? 'bg-amber-500 text-slate-950 shadow-sm font-black' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            onClick={() => setActiveTab('so-converter')}
          >
            <span>📑</span> Quotation to Sales Order (SO) Converter
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'inquiry' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            onClick={() => setActiveTab('inquiry')}
          >
            <span>🔍</span> Stock & Price Bulk Inquiry
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'split' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            onClick={() => setActiveTab('split')}
          >
            <span>📦</span> 12-Item Batch Splitter
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'fleet' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            onClick={() => setActiveTab('fleet')}
          >
            <span>🚜</span> Customer Machine Fleet ({fleetData.length})
          </button>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: EMERGENCY ORDER (EO) DISPATCHER */}
        {/* ============================================================ */}
        {activeTab === 'eo-dispatcher' && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Part Setup & Quantities (5 cols) */}
              <Card className="p-5 space-y-4 lg:col-span-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="text-amber-500 font-black">1.</span> Part Number & Quantity Rules
                    </h2>
                    <p className="text-xs text-slate-500">Auto-detects max unit capacity (txtQBYU)</p>
                  </div>
                  <Badge tone="warning">Step 1</Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Part Number</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="ds-input font-mono uppercase text-xs flex-1 font-bold"
                        value={eoPartNo}
                        onChange={(e) => setEoPartNo(e.target.value)}
                        placeholder="e.g. 6745-12-3100"
                      />
                      <Button type="button" variant="primary" size="sm" onClick={handleLookupPart} disabled={eoLookingUp}>
                        {eoLookingUp ? '...' : 'Lookup'}
                      </Button>
                    </div>
                  </div>

                  {eoPartInfo && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Description</span>
                          <span className="font-bold text-slate-900">{eoPartInfo.description || '—'}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">Qty By Unit (txtQBYU)</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-xs bg-emerald-100 text-emerald-800">
                            {eoPartInfo.qty_by_unit} pcs / machine
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200 text-slate-600 text-[11px]">
                        <div>Price: <strong className="text-slate-900">${eoPartInfo.price}</strong></div>
                        <div>Weight: <strong className="text-slate-900">{eoPartInfo.weight}g</strong></div>
                        <div>Rank: <strong className="text-slate-900">{eoPartInfo.rank || '—'}</strong></div>
                      </div>
                      <div className="pt-1 border-t border-slate-200">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Compatible Models ({eoPartInfo.models?.length || 0})</span>
                        <p className="font-mono text-[11px] text-slate-700 bg-white p-1.5 rounded border border-slate-200 max-h-16 overflow-y-auto leading-tight">
                          {eoPartInfo.models?.join('; ') || 'No restrictions listed'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <Field label="Total Qty Needed">
                      <input
                        type="number"
                        min="1"
                        className="ds-input font-mono font-bold text-sm"
                        value={eoTotalQty}
                        onChange={(e) => setEoTotalQty(e.target.value)}
                      />
                    </Field>
                    <Field label="Max Qty / Machine">
                      <input
                        type="number"
                        min="1"
                        className="ds-input font-mono font-bold text-sm"
                        value={eoMaxQtyPerOrder}
                        onChange={(e) => setEoMaxQtyPerOrder(e.target.value)}
                      />
                    </Field>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-xs text-amber-900 block font-medium">Orders Required:</span>
                      <span className="text-lg font-black text-amber-900">{plannedOrders.length} Orders</span>
                    </div>
                    <div className="text-right text-xs text-amber-950 font-medium">
                      <div>Alloc: <strong>{eoMaxQtyPerOrder} pcs × {plannedOrders.length}</strong></div>
                      <div>Total: <strong>{eoTotalQty} pcs</strong></div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Customer & Machine Fleet Matching (7 cols) */}
              <Card className="p-5 space-y-4 lg:col-span-7">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="text-amber-500 font-black">2.</span> Customer Fleet & Model Matching
                    </h2>
                    <p className="text-xs text-slate-500">Auto-matches machines from your Excel fleet register</p>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-bold text-amber-600 hover:text-amber-700 underline cursor-pointer"
                    onClick={() => setCustomModalOpen(true)}
                  >
                    + Custom / Unlisted Machine
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Customer">
                      <select
                        className="ds-input text-xs"
                        value={selectedCustomer}
                        onChange={(e) => setSelectedCustomer(e.target.value)}
                      >
                        <option value="">-- All Customers --</option>
                        {allCustomers.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Machine Type">
                      <select
                        className="ds-input text-xs"
                        value={selectedMachineType}
                        onChange={(e) => setSelectedMachineType(e.target.value)}
                      >
                        <option value="">-- All Types --</option>
                        {availableMachineTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <Field label="Machine Model">
                    <select
                      className="ds-input text-xs font-semibold"
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                    >
                      <option value="">-- Select Model --</option>
                      {availableModels.map((item) => (
                        <option key={item.model} value={item.model} className={item.isCompat ? 'font-bold text-amber-600' : ''}>
                          {item.isCompat ? `⭐ ${item.model} (Compatible)` : item.model}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-bold text-slate-700">Available Machine Serials in Fleet:</span>
                      <span className="font-mono text-slate-500">{matchingMachines.length} machines</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg max-h-28 overflow-y-auto flex flex-wrap gap-1.5">
                      {matchingMachines.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">No machines match current selection.</span>
                      ) : (
                        matchingMachines.map((m, idx) => (
                          <span
                            key={`${m.serial}-${idx}`}
                            className="inline-flex items-center px-2 py-1 rounded bg-white border border-slate-300 text-[11px] font-mono text-slate-700 shadow-2xs"
                          >
                            <strong className="text-slate-900 mr-1">{m.model}</strong> SN: {m.serial}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <Field label="Starting DB Order No">
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          className="ds-input font-mono uppercase text-xs font-bold"
                          value={eoStartingOrderNo}
                          onChange={(e) => setEoStartingOrderNo(e.target.value)}
                        />
                        <Button type="button" variant="ghost" size="sm" onClick={loadLatestOrderNumber} title="Detect latest DB order number">
                          🔄
                        </Button>
                      </div>
                    </Field>
                    <Field label="Comments">
                      <input
                        type="text"
                        className="ds-input text-xs"
                        value={eoComments}
                        onChange={(e) => setEoComments(e.target.value)}
                      />
                    </Field>
                  </div>
                </div>
              </Card>
            </div>

            {/* Batch Order Plan Preview Card */}
            <Card className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="text-amber-500 font-black">3.</span> Batch Order Plan Preview
                  </h2>
                  <p className="text-xs text-slate-500">Review sequence of emergency orders before automated dispatch</p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
                    <input
                      type="checkbox"
                      className="rounded text-amber-500 focus:ring-0"
                      checked={eoDryRun}
                      onChange={(e) => setEoDryRun(e.target.checked)}
                    />
                    <span className="font-semibold">Safe Dry-Run</span>
                  </label>

                  <Button type="button" variant="secondary" size="sm" onClick={generatePlan}>
                    Refresh Plan
                  </Button>

                  {!isExecutingEo ? (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={plannedOrders.length === 0}
                      onClick={startBatchExecution}
                    >
                      🚀 Execute Orders ({plannedOrders.length})
                    </Button>
                  ) : (
                    <Button type="button" variant="danger" size="sm" onClick={stopBatchExecution}>
                      ⏹ Stop Execution
                    </Button>
                  )}
                </div>
              </div>

              {isExecutingEo && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1.5 animate-pulse">
                  <div className="flex justify-between text-xs font-bold text-amber-900">
                    <span>Dispatching Emergency Orders to Komatsu PDX...</span>
                    <span>Order {eoExecutionIndex} / {plannedOrders.length}</span>
                  </div>
                  <div className="h-2 w-full bg-amber-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all duration-300"
                      style={{ width: `${Math.round((eoExecutionIndex / plannedOrders.length) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="ds-table-wrap">
                <table className="ds-table font-mono text-xs">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>DB Order No</th>
                      <th>Customer</th>
                      <th>Machine Model</th>
                      <th>Serial No</th>
                      <th>Part No</th>
                      <th className="text-center">Batch Qty</th>
                      <th className="text-center">Cycle</th>
                      <th>Quotation No</th>
                      <th className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plannedOrders.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-6 text-slate-400 font-sans">
                          No orders planned. Configure parameters above to generate plan.
                        </td>
                      </tr>
                    ) : (
                      plannedOrders.map((o) => (
                        <tr key={o.index} className={o.status === 'RUNNING' ? 'bg-amber-50 font-bold' : o.status === 'SUCCESS' ? 'bg-emerald-50/50' : 'bg-white'}>
                          <td className="font-semibold text-slate-500">{o.index}</td>
                          <td className="font-bold text-slate-900">{o.db_order_no}</td>
                          <td className="font-sans text-slate-700 truncate max-w-xs">{o.customer}</td>
                          <td className="font-bold text-slate-900">{o.model}</td>
                          <td className="text-slate-700">{o.serial}</td>
                          <td className="text-slate-900">{o.part_no}</td>
                          <td className="text-center font-bold text-emerald-700">{o.quantity}</td>
                          <td className="text-center">
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">
                              Cycle {o.cycle_num}
                            </span>
                          </td>
                          <td className="font-bold text-amber-600">{o.quotation_no || '—'}</td>
                          <td className="text-center">
                            <Badge
                              tone={
                                o.status === 'SUCCESS'
                                  ? 'success'
                                  : o.status === 'RUNNING'
                                  ? 'warning'
                                  : o.status === 'FAILED' || o.status === 'ERROR'
                                  ? 'danger'
                                  : 'neutral'
                              }
                            >
                              {o.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <span>🖥️</span> Live Execution Terminal
                  </span>
                  <div className="flex items-center gap-2">
                    <button type="button" className="text-slate-400 hover:text-slate-600 text-xs" onClick={() => setEoLogs([])}>
                      Clear
                    </button>
                    {plannedOrders.length > 0 && (
                      <button type="button" className="text-amber-600 font-bold hover:underline text-xs" onClick={downloadEoCsv}>
                        Download Report (CSV)
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg font-mono text-[11px] h-36 overflow-y-auto text-emerald-400 space-y-1 border border-slate-800">
                  {eoLogs.length === 0 ? (
                    <div className="text-slate-500">[Ready] Komatsu PDX Emergency Order Automation Engine ready.</div>
                  ) : (
                    eoLogs.map((l, i) => (
                      <div
                        key={i}
                        className={
                          l.type === 'success'
                            ? 'text-emerald-400 font-semibold'
                            : l.type === 'error'
                            ? 'text-rose-400 font-semibold'
                            : l.type === 'warn'
                            ? 'text-amber-400'
                            : 'text-slate-300'
                        }
                      >
                        [{l.timestamp}] {l.text}
                      </div>
                    ))
                  )}
                  <div ref={terminalBottomRef} />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: QUOTATION TO SALES ORDER (SO) CONVERTER */}
        {/* ============================================================ */}
        {activeTab === 'so-converter' && (
          <div className="space-y-6">
            <Card className="p-5 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>📑</span> In-Process Quotations & Sales Order (SO) Transfer
                  </h2>
                  <p className="text-xs text-slate-500">
                    Fetch In-Process quotations, confirm condition, and batch convert directly to Komatsu Sales Orders (SO).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={loadingQuotations || isConvertingSo}
                    onClick={loadInProcessQuotations}
                  >
                    {loadingQuotations ? 'Fetching...' : '🔄 Refresh Quotations'}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isConvertingSo || selectedQtnNumbers.size === 0}
                    onClick={() => startBatchConfirmAndCopy('CONFIRM_ONLY')}
                  >
                    ✓ Confirm Selected ({selectedQtnNumbers.size})
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isConvertingSo || selectedQtnNumbers.size === 0}
                    onClick={() => startBatchConfirmAndCopy('COPY_ONLY')}
                  >
                    📋 Copy to SO ({selectedQtnNumbers.size})
                  </Button>

                  {!isConvertingSo ? (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={selectedQtnNumbers.size === 0}
                      onClick={() => startBatchConfirmAndCopy('FULL_CONVERT')}
                    >
                      ⚡ Auto Confirm & Copy to SO ({selectedQtnNumbers.size})
                    </Button>
                  ) : (
                    <Button type="button" variant="danger" size="sm" onClick={stopSoBatch}>
                      ⏹ Stop Conversion
                    </Button>
                  )}
                </div>
              </div>

              {/* Filters & Pagination Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-4">
                  <Field label="Status Filter">
                    <select
                      className="ds-input text-xs font-semibold"
                      value={qtnStatusFilter}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        setQtnStatusFilter(newStatus);
                        setQtnPage(1);
                        loadInProcessQuotations(1, qtnLimit, newStatus);
                      }}
                    >
                      <option value="1">Status: In-Process (Pending Confirmation)</option>
                      <option value="2">Status: Confirmed (Ready for Copy to SO)</option>
                      <option value="">Status: All Quotations</option>
                    </select>
                  </Field>
                </div>

                <div className="sm:col-span-3">
                  <Field label="Orders to Load">
                    <select
                      className="ds-input text-xs font-bold text-amber-600"
                      value={qtnLimit}
                      onChange={(e) => {
                        const newLimit = e.target.value;
                        setQtnLimit(newLimit);
                        setQtnPage(1);
                        loadInProcessQuotations(1, newLimit, qtnStatusFilter);
                      }}
                    >
                      <option value="10">Show: 10 Orders</option>
                      <option value="25">Show: 25 Orders</option>
                      <option value="50">Show: 50 Orders</option>
                      <option value="100">Show: 100 Orders (Full Page)</option>
                    </select>
                  </Field>
                </div>

                <div className="sm:col-span-5">
                  <Field label="Search by Quotation / Order / Customer">
                    <input
                      type="text"
                      placeholder="Filter quotation no, DB.R.NO, customer..."
                      className="ds-input text-xs"
                      value={qtnSearchFilter}
                      onChange={(e) => setQtnSearchFilter(e.target.value)}
                    />
                  </Field>
                </div>
              </div>

              {/* Pagination Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">
                    Loaded: <strong className="text-slate-900">{filteredQuotations.length}</strong> orders
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-amber-700 font-semibold">
                    Selected: <strong>{selectedQtnNumbers.size}</strong> for batch actions
                  </span>
                </div>

                <div className="flex items-center gap-1 font-mono text-xs">
                  <button
                    type="button"
                    disabled={qtnPage <= 1 || loadingQuotations}
                    onClick={() => {
                      const p = 1;
                      setQtnPage(p);
                      loadInProcessQuotations(p, qtnLimit, qtnStatusFilter);
                    }}
                    className="px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                    title="First Page"
                  >
                    &lt;&lt;
                  </button>
                  <button
                    type="button"
                    disabled={qtnPage <= 1 || loadingQuotations}
                    onClick={() => {
                      const p = Math.max(1, qtnPage - 1);
                      setQtnPage(p);
                      loadInProcessQuotations(p, qtnLimit, qtnStatusFilter);
                    }}
                    className="px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                    title="Previous Page"
                  >
                    &lt;
                  </button>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((pNum) => (
                    <button
                      key={pNum}
                      type="button"
                      disabled={loadingQuotations}
                      onClick={() => {
                        setQtnPage(pNum);
                        loadInProcessQuotations(pNum, qtnLimit, qtnStatusFilter);
                      }}
                      className={`px-2.5 py-1 rounded font-bold transition-all ${
                        qtnPage === pNum
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {pNum}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={loadingQuotations}
                    onClick={() => {
                      const p = qtnPage + 1;
                      setQtnPage(p);
                      loadInProcessQuotations(p, qtnLimit, qtnStatusFilter);
                    }}
                    className="px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                    title="Next Page"
                  >
                    &gt;
                  </button>
                </div>
              </div>

              {/* Progress Bar (Visible during SO conversion) */}
              {isConvertingSo && soConversionProgress && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-1.5 animate-pulse">
                  <div className="flex justify-between text-xs font-bold text-amber-900">
                    <span>Converting Quotation {soConversionProgress.quotation} to Sales Order...</span>
                    <span>{soConversionProgress.current} / {soConversionProgress.total}</span>
                  </div>
                  <div className="h-2 w-full bg-amber-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 transition-all duration-300"
                      style={{ width: `${Math.round((soConversionProgress.current / soConversionProgress.total) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Quotations Data Grid */}
              <div className="ds-table-wrap">
                <table className="ds-table text-xs">
                  <thead>
                    <tr>
                      <th className="w-10 text-center">
                        <input
                          type="checkbox"
                          className="rounded text-amber-500 focus:ring-0 cursor-pointer"
                          checked={filteredQuotations.length > 0 && selectedQtnNumbers.size === filteredQuotations.length}
                          onChange={toggleSelectAllQuotations}
                        />
                      </th>
                      <th>Quotation No</th>
                      <th>Rev</th>
                      <th>DB Order No</th>
                      <th>Customer Name</th>
                      <th>Person in Charge</th>
                      <th>Status</th>
                      <th className="text-right">Total (USD)</th>
                      <th className="text-center">Single Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingQuotations ? (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-slate-500">
                          <span className="inline-block animate-spin mr-2">⏳</span> Loading quotations from Komatsu PDX...
                        </td>
                      </tr>
                    ) : filteredQuotations.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-slate-400">
                          No quotations found matching filter. Click &ldquo;Refresh Quotations&rdquo; to load.
                        </td>
                      </tr>
                    ) : (
                      filteredQuotations.map((q) => {
                        const isSelected = selectedQtnNumbers.has(q.quotation_no);
                        const isConfirmed = q.status?.toLowerCase().includes('confirmed');
                        const isConverted = q.status?.toLowerCase().includes('so') || q.status?.toLowerCase().includes('sales');

                        return (
                          <tr
                            key={q.quotation_no}
                            className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-amber-50/30' : 'bg-white'}`}
                          >
                            <td className="text-center">
                              <input
                                type="checkbox"
                                className="rounded text-amber-500 focus:ring-0 cursor-pointer"
                                checked={isSelected}
                                onChange={() => toggleSelectQuotation(q.quotation_no)}
                              />
                            </td>
                            <td className="font-mono font-bold text-slate-900">{q.quotation_no}</td>
                            <td className="font-mono text-slate-500">{q.revision_no}</td>
                            <td className="font-mono font-bold text-amber-600">{q.db_order_no || '—'}</td>
                            <td className="font-semibold text-slate-700 truncate max-w-xs">{q.customer_name || 'DAR AL HAI'}</td>
                            <td className="text-slate-600">{q.person_in_charge}</td>
                            <td>
                              <Badge tone={isConverted ? 'success' : isConfirmed ? 'info' : 'warning'}>
                                {q.status || 'In-Process'}
                              </Badge>
                            </td>
                            <td className="font-mono text-right font-bold text-slate-900">${q.total_amount}</td>
                            <td className="text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {!isConfirmed && !isConverted && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={isConvertingSo}
                                    onClick={() => handleConfirmSingle(q)}
                                    title="Change status to Confirmed"
                                  >
                                    Confirm
                                  </Button>
                                )}
                                {!isConverted && (
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    disabled={isConvertingSo}
                                    onClick={() => handleCopySingleToSo(q)}
                                    title="Copy directly to Sales Order (SO)"
                                  >
                                    Copy to SO
                                  </Button>
                                )}
                                {isConverted && (
                                  <span className="text-[11px] font-bold text-emerald-600">✓ In Sales Order</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Conversion Terminal */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <span>🖥️</span> Sales Order (SO) Conversion Terminal
                  </span>
                  <div className="flex items-center gap-2">
                    <button type="button" className="text-slate-400 hover:text-slate-600 text-xs" onClick={() => setSoLogs([])}>
                      Clear
                    </button>
                    {inProcessQuotations.length > 0 && (
                      <button type="button" className="text-amber-600 font-bold hover:underline text-xs" onClick={downloadSoCsv}>
                        Download Report (CSV)
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg font-mono text-[11px] h-36 overflow-y-auto text-emerald-400 space-y-1 border border-slate-800">
                  {soLogs.length === 0 ? (
                    <div className="text-slate-500">[Ready] Quotation Confirmation & SO Transfer Engine ready.</div>
                  ) : (
                    soLogs.map((l, i) => (
                      <div
                        key={i}
                        className={
                          l.type === 'success'
                            ? 'text-emerald-400 font-semibold'
                            : l.type === 'error'
                            ? 'text-rose-400 font-semibold'
                            : l.type === 'warn'
                            ? 'text-amber-400'
                            : 'text-slate-300'
                        }
                      >
                        [{l.timestamp}] {l.text}
                      </div>
                    ))
                  )}
                  <div ref={soTerminalBottomRef} />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: STOCK & PRICE BULK INQUIRY */}
        {/* ============================================================ */}
        {activeTab === 'inquiry' && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <Card className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">1. Part Numbers & Quantities</h2>
                    <p className="text-xs text-slate-500">Paste your list or upload a file (unlimited items).</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="ds-button ds-button-secondary ds-button-small cursor-pointer">
                      <span>Upload File (.csv, .txt)</span>
                      <input type="file" className="hidden" accept=".csv,.txt,.xlsx,.xls" onChange={handleFileUpload} />
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPastedText(SAMPLE_PARTS.join('\n'))}
                    >
                      Load Sample
                    </Button>
                  </div>
                </div>

                <Field label="Part Numbers & Quantities (One per line: PartNo, Qty)">
                  <textarea
                    rows={8}
                    className="ds-input font-mono text-xs"
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="6742-01-4540, 6&#10;600-319-3750, 6&#10;6261-31-2130, 2"
                  />
                </Field>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-500 font-medium">
                    Detected: <strong>{parsedQueue.length} parts</strong> ({Math.ceil(parsedQueue.length / 12)} PDX Batches)
                  </span>
                  <Button
                    type="button"
                    variant="primary"
                    disabled={isQuerying || parsedQueue.length === 0}
                    onClick={executeInquiry}
                  >
                    {isQuerying ? 'Querying Komatsu PDX...' : `Start Bulk Inquiry (${parsedQueue.length} Parts)`}
                  </Button>
                </div>

                {isQuerying && queryProgress && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1.5 animate-pulse">
                    <div className="flex justify-between text-xs font-bold text-blue-900">
                      <span>Querying Komatsu PDX Portal...</span>
                      <span>Batch {queryProgress.currentBatch} / {queryProgress.totalBatches}</span>
                    </div>
                    <div className="h-2 w-full bg-blue-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${Math.round((queryProgress.currentBatch / queryProgress.totalBatches) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </Card>

              <Card className="p-5 space-y-4 h-fit">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">Bulk Inquiry Capabilities</h3>
                  <p className="text-xs text-slate-500">Live multi-warehouse catalog queries</p>
                </div>
                <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span><strong>12-Item Limit Bypassed</strong>: Auto-batched in background.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span><strong>Interchangeable Parts</strong>: Finds superseded & alternative parts (`↳`).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span><strong>Multi-Warehouse Stock</strong>: KME Dubai, Japan KLTD, Regional, QA.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span><strong>DNet Price & Weight</strong>: Commercial and shipping weights.</span>
                  </div>
                </div>
              </Card>
            </div>

            {results.length > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                    <span className="text-xs font-bold uppercase text-slate-400">Total Items</span>
                    <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.totalRecords}</p>
                  </div>
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                    <span className="text-xs font-bold uppercase text-slate-400">Main Queried</span>
                    <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.mainParts}</p>
                  </div>
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                    <span className="text-xs font-bold uppercase text-slate-400">Alternatives</span>
                    <p className="text-xl font-bold text-purple-600 mt-0.5">{stats.alternativeParts}</p>
                  </div>
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                    <span className="text-xs font-bold uppercase text-slate-400">In Stock (KME)</span>
                    <p className="text-xl font-bold text-emerald-600 mt-0.5">{stats.inStockKme}</p>
                  </div>
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                    <span className="text-xs font-bold uppercase text-slate-400">Est. Total (USD)</span>
                    <p className="text-xl font-bold text-amber-600 mt-0.5">${stats.totalValue}</p>
                  </div>
                </div>

                <Card className="overflow-hidden">
                  <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="Filter by part number or description..."
                        className="ds-input text-xs w-64"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                      />
                      <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg text-xs">
                        <button
                          type="button"
                          className={`px-2.5 py-1 rounded font-semibold transition-all ${typeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
                          onClick={() => setTypeFilter('ALL')}
                        >
                          All ({results.length})
                        </button>
                        <button
                          type="button"
                          className={`px-2.5 py-1 rounded font-semibold transition-all ${typeFilter === 'MAIN' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
                          onClick={() => setTypeFilter('MAIN')}
                        >
                          Main ({stats.mainParts})
                        </button>
                        <button
                          type="button"
                          className={`px-2.5 py-1 rounded font-semibold transition-all ${typeFilter === 'IN_STOCK' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}
                          onClick={() => setTypeFilter('IN_STOCK')}
                        >
                          In Stock ({stats.inStockKme})
                        </button>
                      </div>
                    </div>
                    <Button type="button" variant="secondary" size="sm" onClick={downloadCsv}>
                      Export CSV
                    </Button>
                  </div>

                  <div className="ds-table-wrap">
                    <table className="ds-table">
                      <thead>
                        <tr>
                          <th>Item Type</th>
                          <th>Part Number</th>
                          <th>Req Qty</th>
                          <th>Description</th>
                          <th>LPN</th>
                          <th>KME Stock</th>
                          <th>DNet Price (USD)</th>
                          <th>On Order</th>
                          <th>Weight (gm)</th>
                          <th>Lead Time</th>
                          <th>Japan (KLTD)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredResults.map((item, idx) => {
                          const hasStock = Number(item.kmeStock || 0) > 0;
                          return (
                            <tr
                              key={`${item.rawPartNumber}-${idx}`}
                              className={item.isAlternative ? 'bg-slate-50/50' : 'bg-white font-medium'}
                            >
                              <td>
                                <Badge tone={item.isAlternative ? 'neutral' : 'info'}>
                                  {item.itemType}
                                </Badge>
                              </td>
                              <td className="font-mono font-bold text-slate-900">{item.partNumber}</td>
                              <td className="font-mono text-center font-bold">{item.requestedQty}</td>
                              <td className="max-w-xs truncate text-slate-700" title={item.description}>{item.description}</td>
                              <td className="font-mono text-xs text-slate-500">{item.lpn}</td>
                              <td>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded font-bold text-xs ${hasStock ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                                  {item.kmeStock}
                                </span>
                              </td>
                              <td className="font-mono text-slate-900 font-bold">${item.dnetPrice}</td>
                              <td className="font-mono text-slate-600">{item.onOrder}</td>
                              <td className="font-mono text-slate-500">{item.weight}</td>
                              <td className="text-xs text-slate-500">{item.leadTime || '—'}</td>
                              <td className="font-mono text-slate-600">{item.kltdTotal || '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: 12-ITEM BATCH SPLITTER */}
        {/* ============================================================ */}
        {activeTab === 'split' && (
          <Card className="p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Split Large Master List into 12-Item PDX CSVs</h2>
              <p className="text-xs text-slate-500">
                Generate individual 12-part CSVs for manual portal uploads.
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-700 font-semibold">
                Loaded Queue: <strong>{parsedQueue.length} Parts</strong> ➔ Will generate <strong>{Math.ceil(parsedQueue.length / 12)} separate CSV batch files</strong>.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              disabled={parsedQueue.length === 0}
              onClick={download12ItemBatches}
            >
              Download All 12-Item Batch CSVs ({Math.ceil(parsedQueue.length / 12)} files)
            </Button>
          </Card>
        )}

        {/* ============================================================ */}
        {/* TAB 5: CUSTOMER FLEET REGISTER */}
        {/* ============================================================ */}
        {activeTab === 'fleet' && (
          <Card className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span>🚜</span> Customer Machine Fleet Register ({fleetData.length} Total Machines)
                </h2>
                <p className="text-xs text-slate-500">All registered customer equipment and serial numbers</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Filter customer, model, serial..."
                  className="ds-input text-xs w-64"
                  value={fleetSearchFilter}
                  onChange={(e) => setFleetSearchFilter(e.target.value)}
                />
                <Button type="button" variant="primary" size="sm" onClick={() => setCustomModalOpen(true)}>
                  + Add Machine
                </Button>
              </div>
            </div>

            <div className="ds-table-wrap max-h-96">
              <table className="ds-table text-xs">
                <thead className="sticky top-0 bg-slate-50">
                  <tr>
                    <th>Customer Name</th>
                    <th>Machine Type</th>
                    <th>Model - Type</th>
                    <th>Serial Number</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFleetTable.map((m, idx) => (
                    <tr key={`${m.serial}-${idx}`} className="hover:bg-slate-50/70">
                      <td className="font-bold text-slate-900">{m.customer}</td>
                      <td className="text-slate-600">{m.machine_type}</td>
                      <td className="font-mono font-bold text-amber-600">{m.model}</td>
                      <td className="font-mono font-bold text-slate-800">{m.serial}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Configure Cookie Modal */}
      {cookieModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Configure Komatsu PDX Session</h3>
                <p className="text-xs text-slate-500">Connect to the Komatsu Middle East PDX portal</p>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                onClick={() => setCookieModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
              <strong>How to get your session cookie in 10 seconds:</strong>
              <ol className="list-decimal list-inside space-y-0.5 mt-1">
                <li>Open your <strong>Komatsu PDX</strong> tab in Microsoft Edge.</li>
                <li>Press <strong>F12</strong> to open Developer Tools.</li>
                <li>Click <strong>Console</strong>, type <code>copy(document.cookie)</code> and press Enter.</li>
                <li>Paste the copied text below:</li>
              </ol>
            </div>

            <form onSubmit={handleSaveCookie} className="space-y-4">
              <Field label="Cookie string or cURL command">
                <textarea
                  rows={4}
                  className="ds-input font-mono text-xs"
                  placeholder="ASP.NET_SessionId=...; .AspNet.Cookies=..."
                  value={cookieInput}
                  onChange={(e) => setCookieInput(e.target.value)}
                  required
                />
              </Field>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="secondary" onClick={() => setCookieModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={savingCookie}>
                  {savingCookie ? 'Testing Connection...' : 'Save & Test Connection'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Add Custom Machine Modal */}
      {customModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add Custom Machine / Customer</h3>
                <p className="text-xs text-slate-500">Add unlisted fleet machines to the database</p>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
                onClick={() => setCustomModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomMachine} className="space-y-3 text-xs">
              <Field label="Customer Name">
                <input
                  type="text"
                  className="ds-input text-xs"
                  placeholder="e.g. LAALA AL-KUWAIT REAL ESTATE"
                  value={customForm.customer}
                  onChange={(e) => setCustomForm({ ...customForm, customer: e.target.value })}
                  required
                />
              </Field>
              <Field label="Machine Type">
                <input
                  type="text"
                  className="ds-input text-xs"
                  placeholder="e.g. Excavator"
                  value={customForm.machine_type}
                  onChange={(e) => setCustomForm({ ...customForm, machine_type: e.target.value })}
                />
              </Field>
              <Field label="Model Code">
                <input
                  type="text"
                  className="ds-input font-mono uppercase text-xs"
                  placeholder="e.g. PC500LC-10R"
                  value={customForm.model}
                  onChange={(e) => setCustomForm({ ...customForm, model: e.target.value })}
                  required
                />
              </Field>
              <Field label="Serial Numbers (comma-separated)">
                <input
                  type="text"
                  className="ds-input font-mono text-xs"
                  placeholder="e.g. 100433, 100434, 100435"
                  value={customForm.serials}
                  onChange={(e) => setCustomForm({ ...customForm, serials: e.target.value })}
                  required
                />
              </Field>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="secondary" onClick={() => setCustomModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Add to Fleet
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </SystemShell>
  );
}
