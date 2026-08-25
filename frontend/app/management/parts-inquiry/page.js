'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import SystemShell from '../../../components/SystemShell';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Input, { Textarea, Select } from '../../../components/ui/Input';
import Field from '../../../components/ui/Field';
import PageHeader from '../../../components/ui/PageHeader';
import SectionHeader from '../../../components/ui/SectionHeader';
import MetricCard from '../../../components/ui/MetricCard';
import EmptyState from '../../../components/ui/EmptyState';
import Toast from '../../../components/ui/Toast';
import Dialog, { DialogHeader, DialogTitle, DialogContent, DialogFooter } from '../../../components/ui/Dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
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
  const [activeTab, setActiveTab] = useState('eo-dispatcher'); // 'eo-dispatcher' | 'so-converter' | 'inquiry' | 'fleet'
  const [status, setStatus] = useState({ connected: false, message: 'Checking PDX status...' });
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [cookieModalOpen, setCookieModalOpen] = useState(false);
  const [cookieInput, setCookieInput] = useState('');
  const [savingCookie, setSavingCookie] = useState(false);
  const [toast, setToast] = useState(null);

  // TAB 1: EMERGENCY ORDER (EO) DISPATCHER STATE
  const [eoPartNo, setEoPartNo] = useState('6745-12-3100');
  const [eoLookingUp, setEoLookingUp] = useState(false);
  const [eoPartInfo, setEoPartInfo] = useState(null);
  const [eoTotalQty, setEoTotalQty] = useState(30);
  const [eoMaxQtyPerOrder, setEoMaxQtyPerOrder] = useState(6);
  const [eoComments, setEoComments] = useState('Urgent Breakdown');
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

  // TAB 2: QUOTATION TO SO CONVERTER STATE
  const [inProcessQuotations, setInProcessQuotations] = useState([]);
  const [loadingQuotations, setLoadingQuotations] = useState(false);
  const [qtnStatusFilter, setQtnStatusFilter] = useState('1'); // '1' = In-Process, '2' = Confirmed, '' = All
  const [qtnSearchFilter, setQtnSearchFilter] = useState('');
  const [qtnLimit, setQtnLimit] = useState('10');
  const [qtnPage, setQtnPage] = useState(1);
  const [selectedQtnNumbers, setSelectedQtnNumbers] = useState(new Set());
  const [isConvertingSo, setIsConvertingSo] = useState(false);
  const [soConversionProgress, setSoConversionProgress] = useState(null);
  const [soLogs, setSoLogs] = useState([]);
  const shouldStopSoRef = useRef(false);

  // TAB 3: BULK INQUIRY STATE
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
        addLog(`Verified ${res.part_no}: ${res.description} (QtyByUnit: ${res.qty_by_unit})`, 'success');
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
      const confirmed = window.confirm(`Dispatch ${plannedOrders.length} Emergency Orders on Komatsu PDX?`);
      if (!confirmed) return;
    }

    setIsExecutingEo(true);
    shouldStopEoRef.current = false;
    addLog(`Dispatching ${plannedOrders.length} orders - Mode: ${eoDryRun ? 'DRY-RUN' : 'LIVE PDX'}`, 'info');

    let successCount = 0;
    const updatedOrders = [...plannedOrders];

    for (let i = 0; i < updatedOrders.length; i++) {
      if (shouldStopEoRef.current) {
        addLog('Order execution halted by supervisor.', 'warn');
        break;
      }

      setEoExecutionIndex(i + 1);
      const current = updatedOrders[i];
      current.status = 'RUNNING';
      setPlannedOrders([...updatedOrders]);

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
          addLog(`✓ Order #${current.index} created quotation ${res.quotation_no}`, 'success');
        } else {
          current.status = 'FAILED';
          addLog(`✕ Order #${current.index} failed: ${res.error || 'Unknown error'}`, 'error');
        }
      } catch (err) {
        current.status = 'ERROR';
        addLog(`✕ Order #${current.index} error: ${err.message}`, 'error');
      }

      setPlannedOrders([...updatedOrders]);
      await new Promise((r) => setTimeout(r, 600));
    }

    setIsExecutingEo(false);
    setToast({ type: 'success', message: `Batch complete: ${successCount} / ${updatedOrders.length} orders placed.` });
  }

  async function retryFailedOrders() {
    const failedIndices = plannedOrders
      .map((o, idx) => (['FAILED', 'ERROR'].includes(o.status) ? idx : -1))
      .filter((idx) => idx !== -1);

    if (failedIndices.length === 0) {
      setToast({ type: 'info', message: 'No failed orders to retry.' });
      return;
    }

    setIsExecutingEo(true);
    shouldStopEoRef.current = false;
    const updatedOrders = [...plannedOrders];

    for (const idx of failedIndices) {
      if (shouldStopEoRef.current) break;
      const current = updatedOrders[idx];
      current.status = 'RUNNING';
      setPlannedOrders([...updatedOrders]);

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
        } else {
          current.status = 'FAILED';
        }
      } catch {
        current.status = 'ERROR';
      }
      setPlannedOrders([...updatedOrders]);
      await new Promise((r) => setTimeout(r, 600));
    }

    setIsExecutingEo(false);
    setToast({ type: 'success', message: 'Retry cycle completed.' });
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
    link.download = `komatsu-eo-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setToast({ type: 'success', message: 'Report CSV exported.' });
  }

  // SO CONVERTER FUNCTIONS
  async function loadInProcessQuotations() {
    try {
      setLoadingQuotations(true);
      const res = await getKomatsuQuotations({ status: qtnStatusFilter, limit: qtnLimit, page: qtnPage });
      if (res && res.quotations) {
        setInProcessQuotations(res.quotations);
        setSelectedQtnNumbers(new Set(res.quotations.map((q) => q.quotation_no)));
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to fetch quotations' });
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
        item.customer_name?.toLowerCase().includes(q)
    );
  }, [inProcessQuotations, qtnSearchFilter]);

  async function startBatchConfirmAndCopy(actionType = 'FULL_CONVERT') {
    const selectedList = inProcessQuotations.filter((q) => selectedQtnNumbers.has(q.quotation_no));
    if (selectedList.length === 0) {
      setToast({ type: 'error', message: 'Select at least one quotation from the table.' });
      return;
    }

    const confirmed = window.confirm(`Convert ${selectedList.length} quotations to Sales Orders (SO) on Komatsu PDX?`);
    if (!confirmed) return;

    setIsConvertingSo(true);
    shouldStopSoRef.current = false;
    let successCount = 0;

    for (let i = 0; i < selectedList.length; i++) {
      if (shouldStopSoRef.current) break;
      const q = selectedList[i];
      setSoConversionProgress({ current: i + 1, total: selectedList.length, quotation: q.quotation_no });

      try {
        if (actionType === 'FULL_CONVERT' || actionType === 'CONFIRM_ONLY') {
          if (q.status !== 'Confirmed') {
            await confirmKomatsuQuotation({ quotationNo: q.quotation_no, seqNo: q.revision_no || '00' });
            q.status = 'Confirmed';
          }
        }
        if (actionType === 'FULL_CONVERT' || actionType === 'COPY_ONLY') {
          await copyKomatsuQuotationToSo({ quotationNo: q.quotation_no, seqNo: q.revision_no || '00' });
          q.status = 'Transferred to SO';
        }
        successCount++;
      } catch (err) {
        addSoLog(`Failed for ${q.quotation_no}: ${err.message}`, 'error');
      }
      setInProcessQuotations([...inProcessQuotations]);
      await new Promise((r) => setTimeout(r, 500));
    }

    setIsConvertingSo(false);
    setSoConversionProgress(null);
    setToast({ type: 'success', message: `Converted ${successCount} / ${selectedList.length} quotations to SO.` });
  }

  // BULK INQUIRY FUNCTIONS
  async function executeInquiry() {
    if (parsedQueue.length === 0) {
      setToast({ type: 'error', message: 'Enter at least one part number.' });
      return;
    }

    try {
      setIsQuerying(true);
      const response = await runKomatsuInquiry(parsedQueue);
      if (response && response.results) {
        setResults(response.results);
        setToast({ type: 'success', message: `Retrieved ${response.results.length} part records.` });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Inquiry query failed' });
    } finally {
      setIsQuerying(false);
    }
  }

  const filteredResults = useMemo(() => {
    const query = searchFilter.trim().toLowerCase();
    return results.filter((item) => {
      const matchesSearch =
        !query ||
        item.partNumber?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query);
      const matchesType =
        typeFilter === 'ALL' ||
        (typeFilter === 'IN_STOCK' && Number(item.kmeStock || 0) > 0);
      return matchesSearch && matchesType;
    });
  }, [results, searchFilter, typeFilter]);

  const successfulOrdersCount = plannedOrders.filter((o) => o.status === 'SUCCESS').length;
  const failedOrdersCount = plannedOrders.filter((o) => ['FAILED', 'ERROR'].includes(o.status)).length;

  return (
    <SystemShell
      activePath="/management/parts-inquiry"
      title="Spare Parts Hub"
      description="Komatsu PDX emergency orders automation, quotations to SO converter, and parts inventory inquiry."
    >
      {/* Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Supply', href: '/management/parts-inquiry' },
          { label: 'Spare Parts & PDX' },
        ]}
        title="Spare Parts & Emergency Orders (EO) Hub"
        badge={
          <Badge tone={status.connected ? 'ready' : 'pending'} dot>
            {status.connected ? 'PDX Connected' : 'PDX Offline'}
          </Badge>
        }
        description="Automate high-quantity Emergency Order dispatch across fleet assets, convert quotations to Sales Orders, and query live Komatsu parts inventory."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCookieModalOpen(true)}
            >
              🔑 PDX Cookie Session
            </Button>
          </div>
        }
      />

      {/* KPI Overview Metrics */}
      <section aria-label="Spare Parts Summary">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard
            label="PDX System Status"
            value={status.connected ? 'ONLINE' : 'AUTH REQ'}
            unit={status.connected ? 'Verified' : 'Cookie Expired'}
            subtext="Komatsu Middle East Portal"
            status={status.connected ? 'Ready' : 'Pending'}
            statusTone={status.connected ? 'ready' : 'pending'}
          />
          <MetricCard
            label="Fleet Machine Register"
            value={fleetData.length}
            unit="Assets"
            subtext={`${allCustomers.length} corporate customers`}
            status="Active"
            statusTone="active"
          />
          <MetricCard
            label="Planned EO Batches"
            value={plannedOrders.length}
            unit="Sub-Orders"
            subtext={`${eoTotalQty} total units requested`}
            status="Calculated"
            statusTone="neutral"
          />
          <MetricCard
            label="Next Order Reference"
            value={eoStartingOrderNo}
            unit="DB Reference"
            subtext="Auto-increment sequence"
            status="Next"
            statusTone="info"
          />
        </div>
      </section>

      {/* Tab Bar without emojis */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('eo-dispatcher')}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${activeTab === 'eo-dispatcher' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Emergency Order Dispatcher
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('so-converter')}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${activeTab === 'so-converter' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Quotations → SO Converter
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('inquiry')}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${activeTab === 'inquiry' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            PDX Stock & Price Inquiry
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fleet')}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${activeTab === 'fleet' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Registered Fleet Assets ({fleetData.length})
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: EMERGENCY ORDER (EO) DISPATCHER (SPLIT-PANE ~35/65) */}
      {/* ========================================================= */}
      {activeTab === 'eo-dispatcher' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Parameters & Machine Matching (~35% / 4.5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="p-4 space-y-3.5">
              <SectionHeader
                title="1. Part & Fleet Parameters"
                description="Validate Komatsu part code and allocate units"
              />

              <Field label="Part Number" required>
                <div className="flex gap-2">
                  <Input
                    value={eoPartNo}
                    onChange={(e) => setEoPartNo(e.target.value)}
                    placeholder="e.g. 6745-12-3100"
                    className="font-mono flex-1 uppercase"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleLookupPart}
                    disabled={eoLookingUp}
                  >
                    {eoLookingUp ? 'Verifying...' : 'Verify Part'}
                  </Button>
                </div>
              </Field>

              {eoPartInfo && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-0.5">
                  <p className="font-semibold text-slate-900">{eoPartInfo.description || 'Komatsu Genuine Component'}</p>
                  <p className="text-slate-500">
                    PDX Unit Limit: <span className="font-semibold text-slate-800">{eoPartInfo.qty_by_unit || 'N/A'}</span> • Models: {eoPartInfo.models?.length || 0}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Total Required Qty" required>
                  <Input
                    type="number"
                    min={1}
                    value={eoTotalQty}
                    onChange={(e) => setEoTotalQty(e.target.value)}
                  />
                </Field>
                <Field label="Max Qty / Order" required>
                  <Input
                    type="number"
                    min={1}
                    value={eoMaxQtyPerOrder}
                    onChange={(e) => setEoMaxQtyPerOrder(e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Customer Account">
                  <Select
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                  >
                    {allCustomers.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Machine Model">
                  <Select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                  >
                    {availableModels.map((m) => (
                      <option key={m.model} value={m.model}>
                        {m.model} {m.isCompat ? '✓' : ''}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Starting Order No" required>
                  <Input
                    value={eoStartingOrderNo}
                    onChange={(e) => setEoStartingOrderNo(e.target.value)}
                    placeholder="e.g. R153/2026"
                    className="font-mono uppercase"
                  />
                </Field>
                <Field label="Order Comments">
                  <Input
                    value={eoComments}
                    onChange={(e) => setEoComments(e.target.value)}
                    placeholder="e.g. Urgent Breakdown"
                  />
                </Field>
              </div>

              <div className="p-2.5 bg-amber-50/60 border border-amber-200/80 rounded-md text-xs text-amber-900 flex items-center justify-between">
                <span>Pool: <strong>{matchingMachines.length} machines</strong> allocated.</span>
                <label className="flex items-center gap-1.5 cursor-pointer select-none font-medium">
                  <input
                    type="checkbox"
                    checked={eoDryRun}
                    onChange={(e) => setEoDryRun(e.target.checked)}
                    className="rounded text-amber-600"
                  />
                  Dry-Run Mode
                </label>
              </div>
            </Card>
          </div>

          {/* Right Column: Live Dispatch Board (~65% / 7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 mb-3 border-b border-slate-100 gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                    2. Planned Orders & Live Dispatch Queue
                  </h3>
                  <p className="text-xs text-slate-500">
                    {plannedOrders.length} sub-orders generated ({eoTotalQty} units)
                    {successfulOrdersCount > 0 && ` • ${successfulOrdersCount} submitted`}
                    {failedOrdersCount > 0 && ` • ${failedOrdersCount} failed`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {failedOrdersCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={retryFailedOrders}
                      disabled={isExecutingEo}
                      className="text-red-700 border-red-200 bg-red-50 hover:bg-red-100"
                    >
                      Retry Failed ({failedOrdersCount})
                    </Button>
                  )}
                  {isExecutingEo ? (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        shouldStopEoRef.current = true;
                      }}
                    >
                      Stop Execution
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={startBatchExecution}
                      disabled={plannedOrders.length === 0}
                    >
                      Dispatch All ({plannedOrders.length})
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={downloadEoCsv}
                    disabled={plannedOrders.length === 0}
                  >
                    CSV Export
                  </Button>
                </div>
              </div>

              <Table density="compact">
                <TableHeader sticky>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>DB Order No</TableHead>
                    <TableHead>Machine Serial</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead isNumeric>Batch Qty</TableHead>
                    <TableHead>Quotation #</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plannedOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-xs text-slate-500">
                        No planned orders generated yet. Configure matching machines and click &quot;Generate Sub-Orders&quot;.
                      </TableCell>
                    </TableRow>
                  ) : (
                    plannedOrders.map((order, idx) => (
                      <TableRow key={order.index || idx}>
                        <TableCell className="font-mono text-xs text-slate-400">{order.index}</TableCell>
                        <TableCell className="font-mono text-xs font-semibold text-slate-900">{order.db_order_no}</TableCell>
                        <TableCell className="font-mono text-xs text-slate-700">{order.serial}</TableCell>
                        <TableCell className="text-xs text-slate-800">{order.model}</TableCell>
                        <TableCell isNumeric className="font-mono text-xs">{order.quantity}</TableCell>
                        <TableCell className="font-mono text-xs font-semibold text-amber-700">{order.quotation_no || '—'}</TableCell>
                        <TableCell>
                          <Badge
                            tone={
                              order.status === 'SUCCESS'
                                ? 'ready'
                                : order.status === 'RUNNING'
                                ? 'pending'
                                : order.status === 'FAILED' || order.status === 'ERROR'
                                ? 'critical'
                                : 'neutral'
                            }
                            size="sm"
                            dot={order.status === 'RUNNING'}
                          >
                            {order.status === 'SUCCESS'
                              ? 'Submitted'
                              : order.status === 'RUNNING'
                              ? 'Submitting...'
                              : order.status === 'FAILED'
                              ? 'Failed'
                              : 'Ready'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>


            {/* Collapsible Technical Audit Log (Hidden by default to eliminate pseudo-terminal) */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <details className="text-xs text-slate-500 group">
                <summary className="font-medium text-slate-700 hover:text-slate-900 cursor-pointer select-none py-1">
                  ▶ View Technical Audit Logs ({eoLogs.length} entries)
                </summary>
                <div className="mt-2 p-3 rounded-md bg-slate-900 text-slate-300 font-mono text-[11px] max-h-48 overflow-y-auto space-y-1">
                  {eoLogs.length === 0 ? (
                    <p className="text-slate-500">No log entries recorded yet.</p>
                  ) : (
                    eoLogs.map((log, idx) => (
                      <div key={idx} className="leading-relaxed">
                        <span className="text-slate-500">[{log.timestamp}]</span>{' '}
                        <span className={log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-emerald-400' : 'text-slate-200'}>
                          {log.text}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </details>
            </div>
          </Card>
        </div>
      </div>
      )}


      {/* ========================================== */}
      {/* TAB 2: QUOTATION TO SO CONVERTER            */}
      {/* ========================================== */}
      {activeTab === 'so-converter' && (
        <Card className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                Komatsu Quotation to Sales Order (SO) Converter
              </h3>
              <p className="text-xs text-slate-500">
                Batch confirm in-process quotations and copy them directly to Komatsu Sales Orders
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={loadInProcessQuotations}
                disabled={loadingQuotations || isConvertingSo}
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => startBatchConfirmAndCopy('FULL_CONVERT')}
                disabled={selectedQtnNumbers.size === 0 || isConvertingSo}
              >
                {isConvertingSo ? 'Processing...' : `1-Click Convert (${selectedQtnNumbers.size})`}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Input
              value={qtnSearchFilter}
              onChange={(e) => setQtnSearchFilter(e.target.value)}
              placeholder="Search quotation #, customer, order #..."
              className="max-w-xs text-xs"
            />
            <div className="text-xs text-slate-500">
              Selected: <strong className="text-slate-900">{selectedQtnNumbers.size}</strong> of {filteredQuotations.length}
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={selectedQtnNumbers.size === filteredQuotations.length && filteredQuotations.length > 0}
                    onChange={() => {
                      if (selectedQtnNumbers.size === filteredQuotations.length) {
                        setSelectedQtnNumbers(new Set());
                      } else {
                        setSelectedQtnNumbers(new Set(filteredQuotations.map((q) => q.quotation_no)));
                      }
                    }}
                    className="rounded text-amber-600"
                  />
                </TableHead>
                <TableHead>Quotation #</TableHead>
                <TableHead>DB Order No</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Person In Charge</TableHead>
                <TableHead isNumeric>Amount (USD)</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingQuotations ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-xs text-slate-500">
                    Loading quotations from PDX...
                  </TableCell>
                </TableRow>
              ) : filteredQuotations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-xs text-slate-500">
                    No quotations found matching filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredQuotations.map((q) => {
                  const isSelected = selectedQtnNumbers.has(q.quotation_no);
                  return (
                    <TableRow key={q.quotation_no}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            const next = new Set(selectedQtnNumbers);
                            if (next.has(q.quotation_no)) next.delete(q.quotation_no);
                            else next.add(q.quotation_no);
                            setSelectedQtnNumbers(next);
                          }}
                          className="rounded text-amber-600"
                        />
                      </TableCell>
                      <TableCell className="font-mono font-semibold text-slate-900">
                        {q.quotation_no}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-700">{q.db_order_no}</TableCell>
                      <TableCell className="text-xs text-slate-800">{q.customer_name}</TableCell>
                      <TableCell className="text-xs text-slate-500">{q.person_in_charge}</TableCell>
                      <TableCell isNumeric className="font-mono text-xs">
                        {q.total_amount || '$0.00'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          tone={
                            q.status === 'Transferred to SO'
                              ? 'ready'
                              : q.status === 'Confirmed'
                              ? 'active'
                              : 'pending'
                          }
                        >
                          {q.status || 'In-Process'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* ========================================== */}
      {/* TAB 3: BULK STOCK & PRICE INQUIRY           */}
      {/* ========================================== */}
      {activeTab === 'inquiry' && (
        <div className="space-y-6">
          <Card className="p-5">
            <SectionHeader
              title="Komatsu PDX Multi-Part Stock & Price Inquiry"
              description="Batch inquiry across Komatsu Middle East master warehouse inventory"
            />
            <div className="space-y-3">
              <Field label="Part Numbers List (One per line or comma-separated)">
                <Textarea
                  rows={4}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste part numbers and quantities..."
                  className="font-mono text-xs"
                />
              </Field>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Parsed: <strong>{parsedQueue.length} parts</strong> in queue
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={executeInquiry}
                  disabled={isQuerying || parsedQueue.length === 0}
                >
                  {isQuerying ? 'Querying PDX...' : `Run Batch Inquiry (${parsedQueue.length} parts)`}
                </Button>
              </div>
            </div>
          </Card>

          {results.length > 0 && (
            <Card className="p-5">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Inquiry Results ({results.length} records)</h3>
                <Input
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter results..."
                  className="max-w-xs text-xs"
                />
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part Number</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead isNumeric>KME Stock</TableHead>
                    <TableHead isNumeric>Unit Price (USD)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((r, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono font-semibold text-slate-900">
                        {r.partNumber || r.rawPartNumber}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">{r.description || 'Komatsu Component'}</TableCell>
                      <TableCell isNumeric className="font-mono font-semibold text-slate-800">
                        {r.kmeStock ?? 0}
                      </TableCell>
                      <TableCell isNumeric className="font-mono text-xs">
                        {r.price || '$0.00'}
                      </TableCell>
                      <TableCell>
                        <Badge tone={Number(r.kmeStock || 0) > 0 ? 'ready' : 'critical'}>
                          {Number(r.kmeStock || 0) > 0 ? 'In Stock' : 'Zero Stock'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 4: REGISTERED FLEET ASSETS              */}
      {/* ========================================== */}
      {activeTab === 'fleet' && (
        <Card className="p-5 space-y-4">
          <SectionHeader
            title="Registered Fleet Machinery Database"
            description="Machinery models, serial numbers, and customer accounts for Emergency Orders dispatch"
            actions={
              <Button variant="secondary" size="sm" onClick={() => setCustomModalOpen(true)}>
                + Add Custom Machine
              </Button>
            }
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Account</TableHead>
                <TableHead>Machine Type</TableHead>
                <TableHead>Model Code</TableHead>
                <TableHead>Serial Number</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fleetData.map((m, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-semibold text-slate-900">{m.customer}</TableCell>
                  <TableCell className="text-xs text-slate-600">{m.machine_type}</TableCell>
                  <TableCell className="text-xs font-semibold text-slate-800">{m.model}</TableCell>
                  <TableCell className="text-xs font-mono text-slate-600">{m.serial}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Modal: Cookie Session Dialog */}
      <Dialog open={cookieModalOpen} onClose={() => setCookieModalOpen(false)}>
        <DialogHeader>
          <DialogTitle>Update Komatsu PDX Cookie Session</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSaveCookie}>
          <DialogContent className="space-y-3">
            <p className="text-xs text-slate-500">
              Paste your active session cookie from the Komatsu PDX portal to authenticate Emergency Orders and Quotations.
            </p>
            <Field label="Cookie Header String" required>
              <Textarea
                rows={4}
                value={cookieInput}
                onChange={(e) => setCookieInput(e.target.value)}
                placeholder="JSESSIONID=...; BIGipServer=..."
                className="font-mono text-xs"
              />
            </Field>
          </DialogContent>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setCookieModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={savingCookie}>
              {savingCookie ? 'Authenticating...' : 'Save & Verify Cookie'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Modal: Add Custom Machine */}
      <Dialog open={customModalOpen} onClose={() => setCustomModalOpen(false)}>
        <DialogHeader>
          <DialogTitle>Add Custom Machine to Fleet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAddCustomMachine}>
          <DialogContent className="space-y-3">
            <Field label="Customer Name" required>
              <Input
                value={customForm.customer}
                onChange={(e) => setCustomForm({ ...customForm, customer: e.target.value })}
                placeholder="e.g. DAR AL HAI"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Machine Type" required>
                <Select
                  value={customForm.machine_type}
                  onChange={(e) => setCustomForm({ ...customForm, machine_type: e.target.value })}
                >
                  <option value="Excavator">Excavator</option>
                  <option value="Bulldozer">Bulldozer</option>
                  <option value="Wheel Loader">Wheel Loader</option>
                  <option value="Articulated Truck">Articulated Truck</option>
                  <option value="Motor Grader">Motor Grader</option>
                </Select>
              </Field>
              <Field label="Model Code" required>
                <Input
                  value={customForm.model}
                  onChange={(e) => setCustomForm({ ...customForm, model: e.target.value })}
                  placeholder="e.g. PC400-8R"
                />
              </Field>
            </div>
            <Field label="Serial Numbers (comma-separated)" required>
              <Input
                value={customForm.serials}
                onChange={(e) => setCustomForm({ ...customForm, serials: e.target.value })}
                placeholder="e.g. 100433, 100434, 100435"
              />
            </Field>
          </DialogContent>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setCustomModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Save Machine</Button>
          </DialogFooter>
        </form>
      </Dialog>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </SystemShell>
  );
}
