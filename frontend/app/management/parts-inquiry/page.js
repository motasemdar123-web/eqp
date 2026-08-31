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
import DetailDrawer from '../../../components/ui/DetailDrawer';
import Disclosure from '../../../components/ui/Disclosure';
import StatusIndicator from '../../../components/ui/StatusIndicator';
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

const SAMPLE_EO_ITEMS = [
  {
    id: 'item-1',
    part_no: '2A8-62-12230',
    description: 'HOSE',
    quantity: 12,
    max_per_order: 12,
    unit: 'EA',
    unit_price: '51.200',
    verified: true,
    models: ['PC400', 'PC500'],
  },
  {
    id: 'item-2',
    part_no: '2A8-62-11751',
    description: 'HOSE',
    quantity: 10,
    max_per_order: 10,
    unit: 'EA',
    unit_price: '54.100',
    verified: true,
    models: ['PC400', 'PC500'],
  },
];

const SAMPLE_INQUIRY_PARTS = [
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

    let maxPerOrder = qty;
    if (tokens.length > 2) {
      const parsedMax = parseInt(tokens[2], 10);
      if (!Number.isNaN(parsedMax) && parsedMax > 0) maxPerOrder = parsedMax;
    }

    let price = '0.000';
    if (tokens.length > 3) {
      const parsedPrice = parseFloat(tokens[3]);
      if (!Number.isNaN(parsedPrice)) price = parsedPrice.toFixed(3);
    }

    rows.push({
      id: `imported-${Date.now()}-${idx}`,
      part_no: partNo.toUpperCase(),
      description: 'Komatsu Genuine Component',
      quantity: qty,
      max_per_order: maxPerOrder,
      unit: 'EA',
      unit_price: price,
      verified: false,
      models: [],
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

  // =========================================================
  // TAB 1: EMERGENCY ORDER (EO) MULTI-ITEM & MULTI-SN STATE
  // =========================================================
  const [eoItems, setEoItems] = useState(SAMPLE_EO_ITEMS);
  const [isVerifyingParts, setIsVerifyingParts] = useState(false);
  const [pastePartsModalOpen, setPastePartsModalOpen] = useState(false);
  const [pastePartsInput, setPastePartsInput] = useState('');

  const [eoComments, setEoComments] = useState('Urgent Breakdown');
  const [eoStartingOrderNo, setEoStartingOrderNo] = useState('R153/2026');
  const [eoDryRun, setEoDryRun] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);

  // Fleet Selection & Multi-SNs
  const [fleetData, setFleetData] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedMachineType, setSelectedMachineType] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedSerials, setSelectedSerials] = useState(new Set());
  const [customSerialsMode, setCustomSerialsMode] = useState(false);
  const [customSerialsInput, setCustomSerialsInput] = useState('');
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
  const [pastedInquiryText, setPastedInquiryText] = useState(SAMPLE_INQUIRY_PARTS.join('\n'));
  const [parsedInquiryQueue, setParsedInquiryQueue] = useState([]);
  const [isQuerying, setIsQuerying] = useState(false);
  const [results, setResults] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('komatsuPdxCookie');
      if (stored) {
        setCookieInput(stored);
      }
    }
    loadConnectionStatus();
    loadFleetDatabase();
    loadLatestOrderNumber();
  }, []);

  useEffect(() => {
    const parsed = parseInputText(pastedInquiryText);
    setParsedInquiryQueue(parsed.map((p) => ({ partNumber: p.part_no, quantity: p.quantity, originalRow: p.originalRow })));
  }, [pastedInquiryText]);

  // When customer changes, initialize selected serial numbers with matching customer fleet
  useEffect(() => {
    if (selectedCustomer) {
      const custMachines = fleetData.filter((m) => m.customer.toLowerCase() === selectedCustomer.toLowerCase());
      if (custMachines.length > 0) {
        setSelectedSerials(new Set(custMachines.map((m) => m.serial).filter(Boolean)));
      }
    }
  }, [selectedCustomer, fleetData]);

  // Regenerate plan whenever items, SN selections, customer, model, or starting order no changes
  useEffect(() => {
    generatePlan();
  }, [eoItems, selectedCustomer, selectedMachineType, selectedModel, selectedSerials, customSerialsMode, customSerialsInput, eoStartingOrderNo, fleetData]);

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
    const cleanCookie = cookieInput.trim();
    if (!cleanCookie) {
      setToast({ type: 'error', message: 'Please paste your cookie string' });
      return;
    }

    try {
      setSavingCookie(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('komatsuPdxCookie', cleanCookie);
      }
      const res = await saveKomatsuCookie(cleanCookie);
      setStatus(res);
      if (res.connected) {
        setToast({ type: 'success', message: 'PDX session authenticated successfully!' });
        setCookieModalOpen(false);
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

  // =========================================================
  // MULTI-ITEM PART MANAGEMENT ACTIONS
  // =========================================================
  function handleAddItem() {
    const newItem = {
      id: `item-${Date.now()}`,
      part_no: '',
      description: 'Komatsu Component',
      quantity: 1,
      max_per_order: 1,
      unit: 'EA',
      unit_price: '0.000',
      verified: false,
      models: [],
    };
    setEoItems((prev) => [...prev, newItem]);
  }

  function handleUpdateItem(id, field, value) {
    setEoItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: value };
        if (field === 'quantity') {
          const qty = parseInt(value, 10) || 1;
          if (it.max_per_order === it.quantity || it.max_per_order > qty) {
            updated.max_per_order = qty;
          }
        }
        if (field === 'part_no') {
          updated.part_no = String(value).toUpperCase();
          updated.verified = false;
        }
        return updated;
      })
    );
  }

  function handleRemoveItem(id) {
    setEoItems((prev) => {
      const filtered = prev.filter((it) => it.id !== id);
      return filtered.length > 0 ? filtered : [];
    });
  }

  function handleClearAllItems() {
    setEoItems([]);
  }

  async function handleVerifyAllParts() {
    const validItems = eoItems.filter((it) => it.part_no && it.part_no.trim());
    if (validItems.length === 0) {
      setToast({ type: 'error', message: 'Enter at least one part number to verify.' });
      return;
    }

    try {
      setIsVerifyingParts(true);
      let successCount = 0;
      const updated = [...eoItems];

      for (let i = 0; i < updated.length; i++) {
        const item = updated[i];
        const pNo = item.part_no?.trim();
        if (!pNo) continue;

        try {
          const res = await lookupKomatsuPart(pNo);
          if (res && !res.error) {
            item.description = res.description || item.description || 'Komatsu Component';
            if (res.price && parseFloat(res.price) > 0) {
              item.unit_price = parseFloat(res.price).toFixed(3);
            }
            if (res.qty_by_unit && res.qty_by_unit > 0 && item.max_per_order > res.qty_by_unit) {
              item.max_per_order = res.qty_by_unit;
            }
            item.models = res.models || [];
            item.verified = true;
            successCount++;
            addLog(`Verified ${pNo}: ${item.description} (Unit limit: ${res.qty_by_unit || 1})`, 'success');
          } else {
            item.verified = false;
            addLog(`Lookup failed for ${pNo}: ${res.error || 'Not found'}`, 'warn');
          }
        } catch (err) {
          item.verified = false;
          addLog(`Lookup error for ${pNo}: ${err.message}`, 'error');
        }
      }

      setEoItems(updated);
      setToast({ type: 'success', message: `Verified ${successCount} / ${validItems.length} parts in PDX Master.` });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Verification batch failed' });
    } finally {
      setIsVerifyingParts(false);
    }
  }

  function handleImportPastedParts() {
    if (!pastePartsInput.trim()) {
      setToast({ type: 'error', message: 'Paste parts text to import.' });
      return;
    }

    const parsed = parseInputText(pastePartsInput);
    if (parsed.length === 0) {
      setToast({ type: 'error', message: 'No valid part numbers found in pasted text.' });
      return;
    }

    setEoItems((prev) => [...prev.filter((it) => it.part_no.trim()), ...parsed]);
    setPastePartsModalOpen(false);
    setPastePartsInput('');
    setToast({ type: 'success', message: `Imported ${parsed.length} part items.` });
  }

  // =========================================================
  // FLEET & MULTI-SN COMPUTATIONS & COMPATIBILITY ENGINE
  // =========================================================
  function isPartCompatibleWithModel(item, modelStr) {
    if (!modelStr) return false;
    const mUpper = modelStr.toUpperCase().trim();
    if (!item.models || item.models.length === 0) {
      return true; // Neutral when not verified or no restrictions
    }
    return item.models.some((pm) => {
      const pmUpper = pm.toUpperCase().trim();
      return mUpper.includes(pmUpper) || pmUpper.includes(mUpper);
    });
  }

  const allVerifiedModels = useMemo(() => {
    const verifiedItems = eoItems.filter((it) => it.verified && it.models?.length > 0);
    if (verifiedItems.length === 0) return [];
    const set = new Set();
    verifiedItems.forEach((it) => it.models.forEach((m) => set.add(m.toUpperCase())));
    return Array.from(set);
  }, [eoItems]);

  const customerFleet = useMemo(() => {
    let filtered = fleetData;
    if (selectedCustomer) {
      filtered = filtered.filter((m) => m.customer.toLowerCase() === selectedCustomer.toLowerCase());
    }
    return filtered;
  }, [fleetData, selectedCustomer]);

  const availableMachineTypes = useMemo(() => {
    return [...new Set(customerFleet.map((m) => m.machine_type).filter(Boolean))].sort();
  }, [customerFleet]);

  // Model-level compatibility map
  const modelCompatibilityMap = useMemo(() => {
    const validItems = eoItems.filter((it) => it.part_no && it.part_no.trim());
    const map = {};

    customerFleet.forEach((m) => {
      const model = m.model;
      if (!model || map[model]) return;

      if (validItems.length === 0) {
        map[model] = {
          model,
          matchedCount: 0,
          totalCount: 0,
          percentage: 100,
          isFullMatch: true,
          isPartialMatch: false,
          label: model,
        };
        return;
      }

      const matchedCount = validItems.filter((item) => isPartCompatibleWithModel(item, model)).length;
      const percentage = Math.round((matchedCount / validItems.length) * 100);
      const isFullMatch = matchedCount === validItems.length;
      const isPartialMatch = matchedCount > 0 && !isFullMatch;

      map[model] = {
        model,
        matchedCount,
        totalCount: validItems.length,
        percentage,
        isFullMatch,
        isPartialMatch,
        label: isFullMatch
          ? `★ ${model} (100% Match - Fit for all ${matchedCount} parts)`
          : isPartialMatch
          ? `⚡ ${model} (${percentage}% Match - ${matchedCount}/${validItems.length} parts)`
          : `${model} (0% Match - 0/${validItems.length} parts)`,
      };
    });

    return map;
  }, [customerFleet, eoItems]);

  const availableModels = useMemo(() => {
    let filtered = customerFleet;
    if (selectedMachineType) {
      filtered = filtered.filter((m) => m.machine_type.toLowerCase() === selectedMachineType.toLowerCase());
    }
    const distinct = [...new Set(filtered.map((m) => m.model).filter(Boolean))];

    return distinct
      .map((m) => {
        const info = modelCompatibilityMap[m] || { percentage: 0, isFullMatch: false, isPartialMatch: false, label: m };
        return {
          model: m,
          ...info,
        };
      })
      .sort((a, b) => {
        if (b.percentage !== a.percentage) return b.percentage - a.percentage;
        return a.model.localeCompare(b.model);
      });
  }, [customerFleet, selectedMachineType, modelCompatibilityMap]);

  // Ranked fleet machines with individual compatibility scores
  const rankedFleetMachines = useMemo(() => {
    let list = customerFleet;
    if (selectedMachineType) {
      list = list.filter((m) => m.machine_type.toLowerCase() === selectedMachineType.toLowerCase());
    }
    if (selectedModel) {
      list = list.filter((m) => m.model.toLowerCase() === selectedModel.toLowerCase());
    }

    const validItems = eoItems.filter((it) => it.part_no && it.part_no.trim());

    return list
      .map((m) => {
        const info = modelCompatibilityMap[m.model] || {
          percentage: validItems.length === 0 ? 100 : 0,
          isFullMatch: validItems.length === 0,
          isPartialMatch: false,
          matchedCount: 0,
          totalCount: validItems.length,
        };
        return {
          ...m,
          compatInfo: info,
        };
      })
      .sort((a, b) => {
        if (b.compatInfo.percentage !== a.compatInfo.percentage) {
          return b.compatInfo.percentage - a.compatInfo.percentage;
        }
        return a.serial.localeCompare(b.serial);
      });
  }, [customerFleet, selectedMachineType, selectedModel, modelCompatibilityMap, eoItems]);

  const filteredFleetMachines = rankedFleetMachines;

  // Auto-select most compatible model when available
  useEffect(() => {
    if (availableModels.length > 0) {
      const topModel = availableModels[0]?.model;
      if (topModel && (!selectedModel || !availableModels.some((m) => m.model === selectedModel))) {
        setSelectedModel(topModel);
      }
    }
  }, [availableModels, selectedCustomer]);

  // Auto-select most compatible serial numbers when fleet changes
  useEffect(() => {
    if (rankedFleetMachines.length > 0) {
      const bestMatches = rankedFleetMachines.filter((m) => m.compatInfo.isFullMatch || m.compatInfo.percentage >= 50);
      const toSelect = bestMatches.length > 0 ? bestMatches : rankedFleetMachines.slice(0, 5);
      setSelectedSerials(new Set(toSelect.map((m) => m.serial)));
    }
  }, [rankedFleetMachines]);

  // Selected Machines Pool for EO Sub-Orders
  const activeMachinePool = useMemo(() => {
    const cust = selectedCustomer || 'DAR AL HAI';

    if (customSerialsMode && customSerialsInput.trim()) {
      const serialList = customSerialsInput
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (serialList.length > 0) {
        return serialList.map((sn) => ({
          customer: cust,
          model: selectedModel || 'PC500LC-10R',
          machine_type: selectedMachineType || 'Excavator',
          serial: sn,
          compatInfo: modelCompatibilityMap[selectedModel] || { percentage: 100, isFullMatch: true },
        }));
      }
    }

    if (selectedSerials.size > 0) {
      const selected = rankedFleetMachines.filter((m) => selectedSerials.has(m.serial));
      if (selected.length > 0) return selected;
    }

    if (rankedFleetMachines.length > 0) {
      return rankedFleetMachines;
    }

    return [{
      customer: cust,
      model: selectedModel || 'PC500LC-10R',
      machine_type: 'Excavator',
      serial: '100433',
      compatInfo: { percentage: 100, isFullMatch: true },
    }];
  }, [customSerialsMode, customSerialsInput, selectedSerials, rankedFleetMachines, selectedCustomer, selectedModel, selectedMachineType, modelCompatibilityMap]);

  // Helper actions for Multi-SN selection
  function handleSelectAllSn() {
    setSelectedSerials(new Set(rankedFleetMachines.map((m) => m.serial).filter(Boolean)));
  }

  function handleClearSn() {
    setSelectedSerials(new Set());
  }

  function handleSelectCompatibleSn() {
    const bestMatches = rankedFleetMachines.filter((m) => m.compatInfo.isFullMatch || m.compatInfo.percentage > 0);
    if (bestMatches.length > 0) {
      setSelectedSerials(new Set(bestMatches.map((m) => m.serial)));
      setToast({ type: 'success', message: `Selected ${bestMatches.length} most compatible machine assets.` });
    } else {
      handleSelectAllSn();
    }
  }

  function handleToggleSerial(sn) {
    setSelectedSerials((prev) => {
      const next = new Set(prev);
      if (next.has(sn)) next.delete(sn);
      else next.add(sn);
      return next;
    });
  }

  // =========================================================
  // SMART MULTI-ITEM & MULTI-SN PACKING ENGINE (`generatePlan`)
  // =========================================================
  function generatePlan() {
    const validItems = eoItems.filter((it) => it.part_no && it.part_no.trim() && parseInt(it.quantity, 10) > 0);
    if (validItems.length === 0) {
      setPlannedOrders([]);
      return;
    }

    const machinesPool = activeMachinePool;
    const cust = selectedCustomer || 'DAR AL HAI';

    const match = eoStartingOrderNo.match(/R(\d+)\/(\d{4})/);
    let seq = match ? parseInt(match[1], 10) : 1;
    let year = match ? match[2] : '2026';

    // Build tracking array for remaining quantities
    const tracking = validItems.map((it) => ({
      id: it.id,
      part_no: it.part_no.trim(),
      description: it.description || 'Komatsu Genuine Component',
      unit: it.unit || 'EA',
      unit_price: parseFloat(it.unit_price) || 0,
      remaining: parseInt(it.quantity, 10) || 0,
      max_per_order: parseInt(it.max_per_order, 10) || parseInt(it.quantity, 10) || 1,
    }));

    const orders = [];
    let orderIdx = 0;

    // Loop until all parts have 0 remaining quantity
    // Bundles all available parts together in each sub-order as much as possible
    while (tracking.some((t) => t.remaining > 0)) {
      orderIdx++;
      const currentDbOrderNo = `R${seq}/${year}`;
      seq++;

      const machineIdx = (orderIdx - 1) % machinesPool.length;
      const cycleNum = Math.floor((orderIdx - 1) / machinesPool.length) + 1;
      const machine = machinesPool[machineIdx];

      const orderParts = [];
      let orderTotalAmount = 0;

      for (const t of tracking) {
        if (t.remaining > 0) {
          const batchQty = Math.min(t.remaining, t.max_per_order);
          t.remaining -= batchQty;
          const lineTotal = batchQty * t.unit_price;
          orderTotalAmount += lineTotal;

          orderParts.push({
            part_no: t.part_no,
            description: t.description,
            quantity: batchQty,
            unit: t.unit,
            unit_price: t.unit_price > 0 ? t.unit_price.toFixed(3) : '0.000',
            total_price: lineTotal > 0 ? lineTotal.toFixed(3) : '0.000',
          });
        }
      }

      // Select most compatible machine from pool for these specific order parts
      const compatibleMachines = machinesPool.filter((m) =>
        orderParts.every((p) => {
          const itemRef = validItems.find((it) => it.part_no === p.part_no);
          return isPartCompatibleWithModel(itemRef || {}, m.model);
        })
      );
      const chosenMachine = compatibleMachines.length > 0
        ? compatibleMachines[(orderIdx - 1) % compatibleMachines.length]
        : machinesPool[machineIdx];

      orders.push({
        index: orderIdx,
        db_order_no: currentDbOrderNo,
        customer: chosenMachine.customer || cust,
        model: chosenMachine.model,
        serial: chosenMachine.serial,
        parts: orderParts,
        total_items: orderParts.length,
        total_quantity: orderParts.reduce((sum, p) => sum + p.quantity, 0),
        total_amount: orderTotalAmount > 0 ? orderTotalAmount.toFixed(3) : '0.000',
        cycle_num: cycleNum,
        compat_badge: chosenMachine.compatInfo?.isFullMatch ? '★ 100% Fit' : 'Compatible',
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

  // =========================================================
  // LIVE BATCH EXECUTION & RETRY
  // =========================================================
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
    addLog(`Dispatching ${plannedOrders.length} sub-orders across ${activeMachinePool.length} SNs - Mode: ${eoDryRun ? 'DRY-RUN' : 'LIVE PDX'}`, 'info');

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
          parts: current.parts.map((p) => ({ part_no: p.part_no, quantity: p.quantity })),
          dryRun: eoDryRun,
        };

        const res = await executeKomatsuEoOrder(payload);

        if (res && (res.status === 'SUCCESS' || res.quotation_no)) {
          current.quotation_no = res.quotation_no;
          current.status = 'SUCCESS';
          successCount++;
          if (res.fallback) {
            addLog(`✓ Order #${current.index} (${current.db_order_no} | SN: ${current.serial} | ${current.parts.length} items) -> Quotation ${res.quotation_no} (Simulation Fallback - Update PDX Cookie for live Komatsu sync)`, 'warn');
          } else {
            addLog(`✓ Order #${current.index} (${current.db_order_no} | SN: ${current.serial} | ${current.parts.length} items) -> Quotation ${res.quotation_no}`, 'success');
          }
        } else {
          current.status = 'FAILED';
          const errMsg = res?.error || 'Unknown error';
          addLog(`✕ Order #${current.index} failed: ${errMsg}`, 'error');
        }
      } catch (err) {
        current.status = 'ERROR';
        const errMsg = err.message || 'Request failed';
        addLog(`✕ Order #${current.index} error: ${errMsg}`, 'error');
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
          parts: current.parts.map((p) => ({ part_no: p.part_no, quantity: p.quantity })),
          dryRun: eoDryRun,
        };

        const res = await executeKomatsuEoOrder(payload);
        if (res && (res.status === 'SUCCESS' || res.quotation_no)) {
          current.quotation_no = res.quotation_no;
          current.status = 'SUCCESS';
          addLog(`✓ Retry Order #${current.index} succeeded -> Quotation ${res.quotation_no}`, 'success');
        } else {
          current.status = 'FAILED';
          const errMsg = res?.error || 'Unknown error';
          if (errMsg.toLowerCase().includes('cookie') || errMsg.toLowerCase().includes('expired')) {
            setCookieModalOpen(true);
            setToast({ type: 'error', message: 'PDX session expired. Please update your cookie or use Simulation Mode.' });
            break;
          }
        }
      } catch (err) {
        current.status = 'ERROR';
        const errMsg = err.message || 'Request failed';
        if (errMsg.toLowerCase().includes('cookie') || errMsg.toLowerCase().includes('expired')) {
          setCookieModalOpen(true);
          setToast({ type: 'error', message: 'PDX session expired. Please update your cookie or use Simulation Mode.' });
          break;
        }
      }
      setPlannedOrders([...updatedOrders]);
      await new Promise((r) => setTimeout(r, 600));
    }

    setIsExecutingEo(false);
    setToast({ type: 'success', message: 'Retry cycle completed.' });
  }

  function downloadEoCsv() {
    if (plannedOrders.length === 0) return;
    const headers = [
      'Order Index',
      'DB Order No',
      'Customer',
      'Machine Model',
      'Serial No',
      'Part Number',
      'Description',
      'Quantity',
      'Unit',
      'Unit Price USD',
      'Line Total USD',
      'Quotation No',
      'Status',
      'Cycle',
    ];

    const rows = [];
    plannedOrders.forEach((o) => {
      o.parts.forEach((p) => {
        rows.push([
          o.index,
          `"${o.db_order_no}"`,
          `"${o.customer}"`,
          `"${o.model}"`,
          `"${o.serial}"`,
          `"${p.part_no}"`,
          `"${p.description}"`,
          p.quantity,
          `"${p.unit}"`,
          p.unit_price,
          p.total_price,
          `"${o.quotation_no || ''}"`,
          `"${o.status}"`,
          `"Cycle ${o.cycle_num}"`,
        ]);
      });
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `komatsu-eo-multi-item-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setToast({ type: 'success', message: 'Report CSV exported with multi-item breakdowns.' });
  }

  // =========================================================
  // TAB 2: SO CONVERTER FUNCTIONS
  // =========================================================
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

  // =========================================================
  // TAB 3: BULK INQUIRY FUNCTIONS
  // =========================================================
  async function executeInquiry() {
    if (parsedInquiryQueue.length === 0) {
      setToast({ type: 'error', message: 'Enter at least one part number.' });
      return;
    }

    try {
      setIsQuerying(true);
      const response = await runKomatsuInquiry(parsedInquiryQueue);
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

  // Overall totals across all planned orders
  const totalPlannedPieces = useMemo(() => {
    return eoItems.reduce((acc, it) => acc + (parseInt(it.quantity, 10) || 0), 0);
  }, [eoItems]);

  const totalEstimatedValue = useMemo(() => {
    const sum = eoItems.reduce((acc, it) => {
      const q = parseInt(it.quantity, 10) || 0;
      const p = parseFloat(it.unit_price) || 0;
      return acc + q * p;
    }, 0);
    return sum.toFixed(3);
  }, [eoItems]);

  const successfulOrdersCount = plannedOrders.filter((o) => o.status === 'SUCCESS').length;
  const failedOrdersCount = plannedOrders.filter((o) => ['FAILED', 'ERROR'].includes(o.status)).length;

  return (
    <SystemShell
      activePath="/management/parts-inquiry"
      title="Spare Parts Hub"
      description="Komatsu PDX emergency orders multi-item automation, quotations to SO converter, and parts inventory inquiry."
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
        description="Automate multi-item Emergency Orders (EO) across multiple fleet serial numbers, bundle parts into unified quotations, and convert quotations to Sales Orders."
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
            label="Target Fleet SNs"
            value={activeMachinePool.length}
            unit="Allocated Assets"
            subtext={`${selectedCustomer || 'Fleet'} pool`}
            status="Active"
            statusTone="active"
          />
          <MetricCard
            label="Planned EO Batches"
            value={plannedOrders.length}
            unit="Sub-Orders"
            subtext={`${eoItems.length} item types (${totalPlannedPieces} units)`}
            status="Calculated"
            statusTone="neutral"
          />
          <MetricCard
            label="Est. Quotations Value"
            value={`$${totalEstimatedValue}`}
            unit="USD Total"
            subtext={`Next Ref: ${eoStartingOrderNo}`}
            status="Next"
            statusTone="info"
          />
        </div>
      </section>

      {/* Cookie Expiration Warning Banner */}
      {!status.connected && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950 shadow-xs">
          <div className="flex items-start gap-2.5">
            <span className="text-base leading-none">⚠️</span>
            <div>
              <p className="font-bold text-amber-900">Komatsu PDX Session Cookie Expired</p>
              <p className="text-amber-800 text-[11px] mt-0.5">
                Live dispatching on the portal requires a fresh session cookie. You can paste your active cookie or toggle Simulation Mode to preview quotations.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="primary"
              size="xs"
              onClick={() => setCookieModalOpen(true)}
            >
              🔑 Update PDX Cookie
            </Button>
            {!eoDryRun && (
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => {
                  setEoDryRun(true);
                  setToast({ type: 'info', message: 'Switched to Simulation Mode (Dry Run).' });
                }}
              >
                ⚡ Enable Simulation Mode
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
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
      {/* TAB 1: EMERGENCY ORDER (EO) DISPATCHER (SPLIT-PANE ~45/55) */}
      {/* ========================================================= */}
      {activeTab === 'eo-dispatcher' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* Left Column: Parameters, Multi-Items & Multi-SNs (~45% / 5.5 cols) */}
          <div className="xl:col-span-5 space-y-4">
            
            {/* 1. Multi-Item Parts Request Section */}
            <Card className="p-4 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">1. Requested Parts & Item Types</h3>
                  <p className="text-[11px] text-slate-500">
                    Add multiple items. Parts will be bundled together in quotations as much as possible.
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => setPastePartsModalOpen(true)}
                  >
                    📋 Paste / Import
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    onClick={handleVerifyAllParts}
                    disabled={isVerifyingParts || eoItems.length === 0}
                  >
                    {isVerifyingParts ? 'Verifying...' : '⚡ Verify All'}
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="xs"
                    onClick={handleAddItem}
                  >
                    + Add Item
                  </Button>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-md overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-2 px-2.5">Part Number</th>
                      <th className="py-2 px-2">Description</th>
                      <th className="py-2 px-2 w-16 text-right">Qty</th>
                      <th className="py-2 px-2 w-20 text-right">Max / Sub-Order</th>
                      <th className="py-2 px-2 w-20 text-right">Price ($)</th>
                      <th className="py-2 px-1 w-8 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {eoItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          No parts added yet. Click &quot;+ Add Item&quot; or &quot;📋 Paste / Import&quot;.
                        </td>
                      </tr>
                    ) : (
                      eoItems.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={item.part_no}
                              onChange={(e) => handleUpdateItem(item.id, 'part_no', e.target.value)}
                              placeholder="e.g. 2A8-62-12230"
                              className="w-full font-mono text-xs uppercase px-2 py-1 border border-slate-200 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                            />
                            {item.verified && (
                              <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">
                                ✓ Verified {item.models?.length > 0 ? `(${item.models.length} models)` : ''}
                              </span>
                            )}
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                              placeholder="e.g. HOSE"
                              className="w-full text-xs px-2 py-1 border border-slate-200 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                            />
                          </td>
                          <td className="p-1.5 text-right">
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value)}
                              className="w-16 font-mono text-xs text-right px-1.5 py-1 border border-slate-200 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                            />
                          </td>
                          <td className="p-1.5 text-right">
                            <input
                              type="number"
                              min={1}
                              value={item.max_per_order}
                              onChange={(e) => handleUpdateItem(item.id, 'max_per_order', e.target.value)}
                              title="Maximum quantity allowed per sub-order quotation"
                              className="w-18 font-mono text-xs text-right px-1.5 py-1 border border-slate-200 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                            />
                          </td>
                          <td className="p-1.5 text-right font-mono text-slate-700">
                            <input
                              type="text"
                              value={item.unit_price}
                              onChange={(e) => handleUpdateItem(item.id, 'unit_price', e.target.value)}
                              placeholder="0.000"
                              className="w-18 font-mono text-xs text-right px-1.5 py-1 border border-slate-200 rounded focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                            />
                          </td>
                          <td className="p-1 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors cursor-pointer"
                              title="Remove item"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {eoItems.length > 0 && (
                    <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-800 text-[11px]">
                      <tr>
                        <td colSpan={2} className="py-2 px-2.5 text-slate-600">
                          Total: {eoItems.length} Item Types
                        </td>
                        <td className="py-2 px-2 text-right font-mono">{totalPlannedPieces} EA</td>
                        <td></td>
                        <td className="py-2 px-2 text-right font-mono text-amber-700">${totalEstimatedValue}</td>
                        <td className="text-center">
                          <button
                            type="button"
                            onClick={handleClearAllItems}
                            className="text-[10px] text-slate-400 hover:text-red-600 underline"
                          >
                            Clear
                          </button>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </Card>

            {/* 2. Customer & Multi-SNs Selection Section */}
            <Card className="p-4 space-y-3.5">
              <SectionHeader
                title="2. Target Fleet & Multi-SNs Allocation"
                description="Select multiple machine serial numbers to distribute inquiry quotations"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
                <Field label="Machine Type Filter">
                  <Select
                    value={selectedMachineType}
                    onChange={(e) => setSelectedMachineType(e.target.value)}
                  >
                    <option value="">All Types ({customerFleet.length})</option>
                    {availableMachineTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Machine Model (Ranked by Compatibility)">
                  <Select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                  >
                    <option value="">All Models ({availableModels.length})</option>
                    {availableModels.map((m) => (
                      <option key={m.model} value={m.model}>
                        {m.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              {/* Multi-SN Selection Container */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">
                    Target Machine Serial Numbers (SNs):{' '}
                    <strong className="text-amber-700">{activeMachinePool.length}</strong> in pool
                  </span>
                  <div className="flex items-center gap-1">
                    {!customSerialsMode ? (
                      <>
                        <button
                          type="button"
                          onClick={handleSelectCompatibleSn}
                          className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 cursor-pointer shadow-xs transition"
                          title="Auto-select all machines compatible with requested parts"
                        >
                          ★ Select Most Compatible SNs
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={handleSelectAllSn}
                          className="text-[11px] text-amber-700 hover:text-amber-800 font-medium px-1.5 py-0.5 rounded hover:bg-amber-50 cursor-pointer"
                        >
                          Select All ({filteredFleetMachines.length})
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={handleClearSn}
                          className="text-[11px] text-slate-500 hover:text-slate-700 font-medium px-1.5 py-0.5 rounded hover:bg-slate-100 cursor-pointer"
                        >
                          Clear
                        </button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setCustomSerialsMode(!customSerialsMode)}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium px-1.5 py-0.5 rounded hover:bg-indigo-50 cursor-pointer ml-1"
                    >
                      {customSerialsMode ? 'Switch to Fleet List' : 'Custom SNs Input'}
                    </button>
                  </div>
                </div>

                {customSerialsMode ? (
                  <div className="space-y-1">
                    <Field label="Custom Serial Numbers (Comma or line separated)">
                      <Textarea
                        rows={2}
                        value={customSerialsInput}
                        onChange={(e) => setCustomSerialsInput(e.target.value)}
                        placeholder="e.g. 100433, 100434, 100435"
                        className="font-mono text-xs"
                      />
                    </Field>
                    <p className="text-[11px] text-slate-500">
                      Sub-orders will cycle sequentially through these custom serial numbers.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-md p-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-slate-50/50">
                    {filteredFleetMachines.length === 0 ? (
                      <p className="col-span-2 text-center text-xs text-slate-400 py-3">
                        No fleet machines found matching filter.
                      </p>
                    ) : (
                      filteredFleetMachines.map((m, idx) => {
                        const isChecked = selectedSerials.has(m.serial);
                        const isFull = m.compatInfo?.isFullMatch;
                        const isPart = m.compatInfo?.isPartialMatch;
                        return (
                          <label
                            key={`${m.serial}-${idx}`}
                            className={`flex items-center gap-2 p-2 rounded-md border text-xs cursor-pointer select-none transition-all ${
                              isChecked
                                ? isFull
                                  ? 'bg-emerald-50/90 border-emerald-300 text-slate-900 shadow-xs'
                                  : 'bg-amber-50/80 border-amber-300 text-slate-900 font-medium'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSerial(m.serial)}
                              className="rounded text-amber-600"
                            />
                            <div className="truncate flex-1">
                              <span className="font-mono font-bold text-slate-900">{m.serial}</span>
                              <span className="text-[11px] text-slate-500 ml-1.5 font-medium">({m.model})</span>
                            </div>
                            {isFull ? (
                              <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded font-bold">
                                ★ Best Match
                              </span>
                            ) : isPart ? (
                              <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded font-medium">
                                ⚡ {m.compatInfo.matchedCount}/{m.compatInfo.totalCount} Fit
                              </span>
                            ) : null}
                          </label>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Pool Status Summary */}
              <div className="p-2.5 bg-amber-50/60 border border-amber-200/80 rounded-md text-xs text-amber-900 flex items-center justify-between">
                <span>
                  Pool: <strong>{activeMachinePool.length} SNs</strong> allocated across{' '}
                  <strong>{plannedOrders.length} sub-orders</strong>.
                </span>
                <span className="text-[11px] font-medium text-amber-800">
                  {plannedOrders.length} unified quotations
                </span>
              </div>

              {/* Collapsible Advanced Configuration */}
              <Disclosure
                title="Advanced Order & Sequence Configuration"
                subtitle="Starting sequence, comments, and simulation mode"
                defaultOpen={false}
              >
                <div className="space-y-3 pt-1 text-xs">
                  <div className="grid grid-cols-2 gap-2.5">
                    <Field label="Starting DB Order No" required>
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

                  <label className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200 cursor-pointer select-none font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={eoDryRun}
                      onChange={(e) => setEoDryRun(e.target.checked)}
                      className="rounded text-amber-600"
                    />
                    <span>Simulate Only (Dry-Run Mode — do not submit to live Komatsu PDX)</span>
                  </label>
                </div>
              </Disclosure>
            </Card>
          </div>

          {/* Right Column: Live Dispatch Queue & Sub-Orders Board (~55% / 7 cols) */}
          <div className="xl:col-span-7 space-y-4">
            <Card className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 mb-3 border-b border-slate-100 gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                    3. Planned Unified Quotations & Live Dispatch Queue
                  </h3>
                  <p className="text-xs text-slate-500">
                    {plannedOrders.length} sub-orders generated ({eoItems.length} items, {totalPlannedPieces} units)
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
                    <TableHead>Target Asset (SN & Model)</TableHead>
                    <TableHead>Bundled Parts Requested</TableHead>
                    <TableHead isNumeric>Qty</TableHead>
                    <TableHead isNumeric>Est. ($)</TableHead>
                    <TableHead>Quotation #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plannedOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-xs text-slate-500">
                        No planned orders generated yet. Add part numbers and configure target SNs to preview unified quotations.
                      </TableCell>
                    </TableRow>
                  ) : (
                    plannedOrders.map((order, idx) => (
                      <TableRow
                        key={order.index || idx}
                        isClickable
                        isSelected={viewingOrder && viewingOrder.db_order_no === order.db_order_no}
                        onClick={() => setViewingOrder(order)}
                        className="group"
                      >
                        <TableCell className="font-mono text-xs text-slate-400">{order.index}</TableCell>
                        <TableCell className="font-mono text-xs font-semibold text-slate-900 group-hover:text-amber-700 transition-colors">
                          {order.db_order_no}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-mono font-semibold text-slate-800">{order.serial}</div>
                          <div className="text-[11px] text-slate-500">{order.model}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {order.parts.map((p, pIdx) => (
                              <span
                                key={pIdx}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200"
                                title={`${p.description} (Qty: ${p.quantity})`}
                              >
                                <strong>{p.part_no}</strong>: {p.quantity}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell isNumeric className="font-mono text-xs font-semibold text-slate-900">
                          {order.total_quantity}
                        </TableCell>
                        <TableCell isNumeric className="font-mono text-xs text-slate-700">
                          ${order.total_amount}
                        </TableCell>
                        <TableCell className="font-mono text-xs font-semibold text-amber-700">
                          {order.quotation_no || '—'}
                        </TableCell>
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
                        <TableCell className="text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingOrder(order);
                            }}
                            className="text-xs font-semibold text-slate-600 hover:text-amber-700 px-2 py-1 rounded hover:bg-amber-50 transition-colors cursor-pointer"
                          >
                            Inspect →
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Technical Audit Log */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <details className="text-xs text-slate-500 group">
                  <summary className="font-medium text-slate-700 hover:text-slate-900 cursor-pointer select-none py-1">
                    ▶ View Technical Dispatch Audit Logs ({eoLogs.length} entries)
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
                  value={pastedInquiryText}
                  onChange={(e) => setPastedInquiryText(e.target.value)}
                  placeholder="Paste part numbers and quantities..."
                  className="font-mono text-xs"
                />
              </Field>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Parsed: <strong>{parsedInquiryQueue.length} parts</strong> in queue
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={executeInquiry}
                  disabled={isQuerying || parsedInquiryQueue.length === 0}
                >
                  {isQuerying ? 'Querying PDX...' : `Run Batch Inquiry (${parsedInquiryQueue.length} parts)`}
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

      {/* Modal: Paste Parts Line Items */}
      <Dialog open={pastePartsModalOpen} onClose={() => setPastePartsModalOpen(false)}>
        <DialogHeader>
          <DialogTitle>Import Multiple Part Line Items</DialogTitle>
        </DialogHeader>
        <DialogContent className="space-y-3">
          <p className="text-xs text-slate-500">
            Paste parts list from Excel or text. Format: <code>PartNo, Quantity, [MaxPerOrder], [UnitPrice]</code>
          </p>
          <Field label="Pasted Parts Text" required>
            <Textarea
              rows={6}
              value={pastePartsInput}
              onChange={(e) => setPastePartsInput(e.target.value)}
              placeholder="2A8-62-12230, 12, 12, 51.200&#10;2A8-62-11751, 10, 10, 54.100&#10;6745-12-3100, 18, 6, 95.000"
              className="font-mono text-xs"
            />
          </Field>
        </DialogContent>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setPastePartsModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleImportPastedParts}>Import Parts</Button>
        </DialogFooter>
      </Dialog>

      {/* Modal: Cookie Session Dialog */}
      <Dialog open={cookieModalOpen} onClose={() => setCookieModalOpen(false)}>
        <DialogHeader>
          <DialogTitle>Update Komatsu PDX Cookie Session</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSaveCookie}>
          <DialogContent className="space-y-3">
            <p className="text-xs text-slate-600">
              Paste your full active Cookie header from the Komatsu PDX portal (<code>https://www.komatsu.ae/kmewebportal</code>).
            </p>
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded text-[11px] text-blue-900 leading-relaxed">
              <strong>💡 How to copy from Edge/Chrome:</strong><br />
              1. In your Komatsu portal tab, press <kbd className="px-1 bg-white border rounded">F12</kbd> ➔ go to <strong>Network</strong> tab.<br />
              2. Refresh or click any link ➔ click a request.<br />
              3. Under <strong>Request Headers</strong>, copy the entire <code>Cookie:</code> string (make sure it includes <code>.AspNet.Cookies=...</code>).
            </div>
            <Field label="Cookie Header String" required>
              <Textarea
                rows={5}
                value={cookieInput}
                onChange={(e) => setCookieInput(e.target.value)}
                placeholder="SelectedLanguage=; .AspNet.Cookies=...; ASP.NET_SessionId=..."
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

      {/* SUB-ORDER DETAIL DRAWER (PROGRESSIVE DISCLOSURE - MATCHING USER SCREENSHOT TABLE) */}
      <DetailDrawer
        open={Boolean(viewingOrder)}
        onClose={() => setViewingOrder(null)}
        title={`Quotation Sub-Order: ${viewingOrder?.db_order_no || `#${viewingOrder?.index}`}`}
        subtitle={`Komatsu PDX • Model: ${viewingOrder?.model || 'Equipment'} • Serial: ${viewingOrder?.serial || 'N/A'}`}
        badge={
          viewingOrder && (
            <Badge
              tone={
                viewingOrder.status === 'SUCCESS'
                  ? 'ready'
                  : viewingOrder.status === 'RUNNING'
                  ? 'pending'
                  : viewingOrder.status === 'FAILED' || viewingOrder.status === 'ERROR'
                  ? 'critical'
                  : 'neutral'
              }
              size="sm"
            >
              {viewingOrder.status === 'SUCCESS'
                ? 'Submitted'
                : viewingOrder.status === 'RUNNING'
                ? 'Submitting...'
                : viewingOrder.status === 'FAILED'
                ? 'Failed'
                : 'Ready in Queue'}
            </Badge>
          )
        }
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="secondary" size="sm" onClick={() => setViewingOrder(null)}>
              Close
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (typeof navigator !== 'undefined' && viewingOrder) {
                    navigator.clipboard.writeText(JSON.stringify(viewingOrder, null, 2));
                    setToast({ type: 'success', message: 'Sub-order payload copied to clipboard.' });
                  }
                }}
              >
                Copy Payload JSON
              </Button>
            </div>
          </div>
        }
      >
        {viewingOrder && (
          <div className="space-y-5">
            {/* Identity & Header Allocation */}
            <div className="p-4 bg-slate-50/80 rounded-lg border border-slate-200/80 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">Target Asset Serial</span>
                  <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">{viewingOrder.serial}</span>
                  <span className="text-[11px] text-slate-500">Model: {viewingOrder.model}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">Customer Account</span>
                  <span className="font-semibold text-slate-800 text-xs mt-0.5 block">{viewingOrder.customer}</span>
                  <span className="text-[11px] text-slate-500">Cycle #{viewingOrder.cycle_num}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">Quotation Reference</span>
                  <span className="font-mono font-bold text-amber-700 text-sm mt-0.5 block">
                    {viewingOrder.quotation_no || 'Pending PDX'}
                  </span>
                  <span className="text-[11px] text-slate-500">Status: {viewingOrder.status}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">Quotation Amount</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm mt-0.5 block">
                    ${viewingOrder.total_amount}
                  </span>
                  <span className="text-[11px] text-slate-500">{viewingOrder.parts.length} line item(s)</span>
                </div>
              </div>
            </div>

            {/* QUOTATION LINE-ITEMS BREAKDOWN TABLE (EXACTLY MATCHING USER SCREENSHOT) */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Bundled Parts Quotation Breakdown
              </h4>

              <div className="border border-slate-900/90 rounded-none overflow-hidden">
                <table className="w-full text-left border-collapse font-sans text-xs">
                  <thead className="bg-white border-b-2 border-slate-900 text-slate-900 font-bold text-[11px]">
                    <tr>
                      <th className="py-2 px-3 border-r border-slate-900">Part Number</th>
                      <th className="py-2 px-3 border-r border-slate-900">Description</th>
                      <th className="py-2 px-3 border-r border-slate-900 text-right">Qty</th>
                      <th className="py-2 px-3 border-r border-slate-900 text-center">Unit</th>
                      <th className="py-2 px-3 border-r border-slate-900 text-right">Unit Price (USD)</th>
                      <th className="py-2 px-3 text-right">Total Price (USD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/80 bg-white">
                    {viewingOrder.parts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 border-r border-slate-900 font-mono font-semibold text-slate-900">
                          {p.part_no}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-900 text-slate-800 uppercase font-medium">
                          {p.description}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-900 text-right font-mono font-medium">
                          {p.quantity.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-900 text-center font-mono font-semibold text-slate-700">
                          {p.unit || 'EA'}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-900 text-right font-mono">
                          {p.unit_price}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                          {p.total_price}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-900 bg-slate-50 font-bold text-xs">
                    <tr>
                      <td colSpan={2} className="py-2 px-3 border-r border-slate-900 text-slate-900">
                        Quotation Total
                      </td>
                      <td className="py-2 px-3 border-r border-slate-900 text-right font-mono">
                        {viewingOrder.total_quantity.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-900 text-center font-mono">EA</td>
                      <td className="py-2 px-3 border-r border-slate-900"></td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-800 font-bold">
                        ${viewingOrder.total_amount}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Collapsible Raw API Payload & Diagnostic Trace */}
            <Disclosure
              title="Raw PDX Dispatch JSON Payload"
              subtitle="JSON parameters transmitted to Komatsu portal"
              defaultOpen={false}
            >
              <pre className="p-3 bg-slate-900 text-slate-100 rounded text-[11px] font-mono overflow-x-auto leading-relaxed max-h-48">
                {JSON.stringify(
                  {
                    order_no: viewingOrder.db_order_no,
                    customer: viewingOrder.customer,
                    machine_model: viewingOrder.model,
                    machine_serial: viewingOrder.serial,
                    comments: eoComments || '',
                    dry_run: eoDryRun,
                    quotation: viewingOrder.quotation_no || null,
                    parts: viewingOrder.parts,
                  },
                  null,
                  2
                )}
              </pre>
            </Disclosure>
          </div>
        )}
      </DetailDrawer>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </SystemShell>
  );
}
