'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Input, { Textarea, Select } from '../ui/Input';
import Field from '../ui/Field';
import SectionHeader from '../ui/SectionHeader';
import MetricCard from '../ui/MetricCard';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table';
import Dialog, { DialogHeader, DialogTitle, DialogContent, DialogFooter } from '../ui/Dialog';
import {
  lookupKomatsuPart,
  verifyBatchQuotationParts,
  downloadAvailabilityFormExcel,
} from '../../lib/api';

const SAMPLE_QUOTATION_INPUT = `17M-22-43430, 1
17M-22-53160, 1
17M-13-05040, 1
6742-01-4540, 6
600-319-3750, 4
07143-10605, 10
17A-15-22191, 1`;

export default function CustomerQuotationSection({
  fleetData = [],
  allCustomers = [],
  onLog = () => {},
  onToast = () => {},
}) {
  // Line items state
  const [pastedText, setPastedText] = useState(SAMPLE_QUOTATION_INPUT);
  const [items, setItems] = useState([
    {
      id: 'item-1',
      part_no: '17M-22-43430',
      description: 'SPRING',
      quantity: 1,
      dnet_price: 45.0,
      price: 45.0,
      kme_stock: 0,
      kme_eor: 0,
      kltd_total: 12,
      models: ['D155A-6', 'D275A-5'],
      latest_part_no: '17M-22-43430',
      verified: true,
      custom_delivery: '',
      selected_model: '',
      selected_serial: '',
    },
    {
      id: 'item-2',
      part_no: '17M-22-53160',
      description: 'DRUM',
      quantity: 1,
      dnet_price: 320.0,
      price: 320.0,
      kme_stock: 0,
      kme_eor: 0,
      kltd_total: 4,
      models: ['D275A-5', 'D375A-6'],
      latest_part_no: '17M-22-53160',
      verified: true,
      custom_delivery: '',
      selected_model: '',
      selected_serial: '',
    },
    {
      id: 'item-3',
      part_no: '6742-01-4540',
      description: 'GASKET',
      quantity: 6,
      dnet_price: 18.5,
      price: 18.5,
      kme_stock: 4,
      kme_eor: 0,
      kltd_total: 20,
      models: ['PC400-8R', 'PC500LC-10R', 'WA470-6'],
      latest_part_no: '6742-01-4540',
      verified: true,
      custom_delivery: '',
      selected_model: '',
      selected_serial: '',
    },
    {
      id: 'item-4',
      part_no: '600-319-3750',
      description: 'FUEL FILTER CARTRIDGE',
      quantity: 4,
      dnet_price: 28.0,
      price: 28.0,
      kme_stock: 12,
      kme_eor: 0,
      kltd_total: 50,
      models: ['PC400-8R', 'PC200-8', 'D155A-6'],
      latest_part_no: '600-319-3750',
      verified: true,
      custom_delivery: '',
      selected_model: '',
      selected_serial: '',
    },
  ]);

  // Customer selection
  const [selectedCustomer, setSelectedCustomer] = useState('Lalaa');
  const [customerMode, setCustomerMode] = useState('LALAA'); // 'LALAA' | 'OTHER'

  // Margin Factor Slider: R between 0.01 and 1.00 (default 0.65)
  const [sliderR, setSliderR] = useState(0.65);

  // Hidden DNet price state: set of item IDs that are revealed
  const [revealedDNetIds, setRevealedDNetIds] = useState(new Set());
  const [revealAllDNet, setRevealAllDNet] = useState(false);

  // Verification state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyProgress, setVerifyProgress] = useState(null);

  // Excel download state
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [tempPasteText, setTempPasteText] = useState('');

  // Sync customer mode when customer selector changes
  useEffect(() => {
    if (selectedCustomer) {
      const lower = selectedCustomer.toLowerCase();
      if (lower.includes('lalaa')) {
        setCustomerMode('LALAA');
      } else {
        setCustomerMode('OTHER');
      }
    }
  }, [selectedCustomer]);

  // Parse pasted text into line items
  function parseTextLines(text) {
    if (!text) return [];
    const lines = text.split('\n');
    const parsed = [];

    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx].trim();
      if (!line) continue;

      const tokens = line
        .replace(/\t/g, ',')
        .replace(/;/g, ',')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      if (tokens.length === 0) continue;
      const partNo = tokens[0].toUpperCase();

      if (['item', 'sn', 'part number', 'part no', 'part_number', 'number'].includes(partNo.toLowerCase())) {
        continue;
      }

      let qty = 1;
      if (tokens.length > 1) {
        const q = parseInt(tokens[1], 10);
        if (!isNaN(q) && q > 0) qty = q;
      }

      parsed.push({
        id: `item-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
        part_no: partNo,
        description: 'Komatsu Component',
        quantity: qty,
        dnet_price: 0,
        price: 0,
        kme_stock: 0,
        kme_eor: 0,
        kltd_total: 0,
        models: [],
        latest_part_no: partNo,
        verified: false,
        custom_delivery: '',
        selected_model: '',
        selected_serial: '',
      });
    }

    return parsed;
  }

  // Handle Import from Main Textarea or Modal
  function handleImportText(textToImport) {
    const parsed = parseTextLines(textToImport || pastedText);
    if (parsed.length === 0) {
      onToast({ type: 'error', message: 'No valid part numbers found in input.' });
      return;
    }
    setItems(parsed);
    onToast({ type: 'success', message: `Imported ${parsed.length} part items. Click 'Verify Parts' to check PDX.` });
  }

  // Add a blank row
  function handleAddBlankItem() {
    const newItem = {
      id: `item-${Date.now()}`,
      part_no: '',
      description: 'Komatsu Component',
      quantity: 1,
      dnet_price: 0,
      price: 0,
      kme_stock: 0,
      kme_eor: 0,
      kltd_total: 0,
      models: [],
      latest_part_no: '',
      verified: false,
      custom_delivery: '',
      selected_model: '',
      selected_serial: '',
    };
    setItems((prev) => [...prev, newItem]);
  }

  // Update item field
  function handleUpdateItem(id, field, value) {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: value };
        if (field === 'part_no') {
          updated.part_no = String(value).toUpperCase();
          updated.verified = false;
        }
        if (field === 'quantity') {
          updated.quantity = Math.max(1, parseInt(value, 10) || 1);
        }
        return updated;
      })
    );
  }

  // Remove row
  function handleRemoveItem(id) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  // Clear all
  function handleClearAll() {
    setItems([]);
    setPastedText('');
  }

  // Toggle reveal for DNet price
  function handleToggleRevealDNet(id) {
    setRevealedDNetIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleToggleRevealAllDNet() {
    if (revealAllDNet) {
      setRevealedDNetIds(new Set());
      setRevealAllDNet(false);
    } else {
      setRevealedDNetIds(new Set(items.map((i) => i.id)));
      setRevealAllDNet(true);
    }
  }

  // Customer Fleet Filter
  const customerFleet = useMemo(() => {
    if (!selectedCustomer) return fleetData;
    return fleetData.filter(
      (m) => m.customer && m.customer.toLowerCase() === selectedCustomer.toLowerCase()
    );
  }, [fleetData, selectedCustomer]);

  // Model compatibility checker (identical to PDX check logic)
  const isPartCompatibleWithModel = useCallback((partModels, modelStr) => {
    if (!modelStr || !partModels || partModels.length === 0) return false;
    const mUpper = modelStr.toUpperCase().trim();
    return partModels.some((pm) => {
      const pmUpper = pm.toUpperCase().trim();
      return mUpper.includes(pmUpper) || pmUpper.includes(mUpper);
    });
  }, []);

  // Smart Fleet Matcher for an item
  const findBestFleetMatch = useCallback(
    (itemModels) => {
      if (!itemModels || itemModels.length === 0) {
        return { model: '-', serial: '-' };
      }

      // Check if customer fleet has any matching machine
      for (const machine of customerFleet) {
        if (machine.model && isPartCompatibleWithModel(itemModels, machine.model)) {
          return {
            model: machine.model,
            serial: machine.serial || '-',
          };
        }
      }

      // If model does not meet any model of the current customer list:
      // Model to be added without a SN after it, just with a dash in the SN line!
      const firstCompatibleModel = itemModels[0] || '-';
      return {
        model: firstCompatibleModel,
        serial: '-',
      };
    },
    [customerFleet, isPartCompatibleWithModel]
  );

  // Batch Verify Parts via PDX
  async function handleVerifyParts() {
    const validItems = items.filter((it) => it.part_no && it.part_no.trim());
    if (validItems.length === 0) {
      onToast({ type: 'error', message: 'Please add at least one part number to verify.' });
      return;
    }

    try {
      setIsVerifying(true);
      setVerifyProgress({ current: 0, total: validItems.length });
      onLog(`Starting PDX parts verification for ${validItems.length} items...`, 'info');

      // Attempt fast backend batch verification first
      let batchSuccess = false;
      let batchItemsMap = new Map();

      try {
        const batchRes = await verifyBatchQuotationParts(
          validItems.map((it) => ({ part_no: it.part_no, quantity: it.quantity }))
        );
        if (batchRes && batchRes.success && Array.isArray(batchRes.items)) {
          batchRes.items.forEach((bi) => {
            batchItemsMap.set(bi.part_no.toUpperCase(), bi);
          });
          batchSuccess = true;
        }
      } catch (err) {
        // Fallback to sequential/client lookups
        console.warn('Batch verification endpoint not available, falling back to individual lookups:', err.message);
      }

      const updated = [...items];
      let verifiedCount = 0;

      for (let i = 0; i < updated.length; i++) {
        const item = updated[i];
        const pNo = item.part_no?.trim()?.toUpperCase();
        if (!pNo) continue;

        setVerifyProgress({ current: i + 1, total: updated.length, currentPart: pNo });

        if (batchSuccess && batchItemsMap.has(pNo)) {
          const res = batchItemsMap.get(pNo);
          item.description = res.description || item.description || 'Komatsu Component';
          item.dnet_price = res.dnet_price || res.price || 0;
          item.price = item.dnet_price;
          item.kme_stock = res.kme_stock || 0;
          item.kme_eor = res.kme_eor || 0;
          item.kltd_total = res.kltd_total || 0;
          item.models = res.models || [];
          item.latest_part_no = res.latest_part_no || pNo;
          item.verified = res.verified ?? true;

          // Compute smart fleet match
          const match = findBestFleetMatch(item.models);
          item.selected_model = item.selected_model || match.model;
          item.selected_serial = item.selected_serial || match.serial;

          verifiedCount++;
        } else {
          // Individual lookup fallback
          try {
            const res = await lookupKomatsuPart(pNo);
            if (res && !res.error) {
              item.description = res.description || item.description || 'Komatsu Component';
              const rawPrice = parseFloat(res.stock_info?.dnet_price ?? res.price ?? 0) || 0;
              item.dnet_price = rawPrice;
              item.price = rawPrice;
              item.kme_stock = parseInt(res.kme_stock ?? res.stock_info?.kme_stock ?? 0, 10) || 0;
              item.kme_eor = parseInt(res.kme_eor ?? res.stock_info?.kme_eor ?? 0, 10) || 0;
              item.kltd_total = parseInt(res.kltd_total ?? res.stock_info?.kltd_total ?? 0, 10) || 0;
              item.models = Array.isArray(res.models) ? res.models : [];
              item.latest_part_no = res.latest_part_no || res.lpn || pNo;
              item.verified = true;

              const match = findBestFleetMatch(item.models);
              item.selected_model = item.selected_model || match.model;
              item.selected_serial = item.selected_serial || match.serial;

              verifiedCount++;
              onLog(`Verified ${pNo}: Stock KME=${item.kme_stock}, EOR=${item.kme_eor}, KLTD=${item.kltd_total}, DNet=$${item.dnet_price}`, 'success');
            } else {
              item.verified = false;
              onLog(`Lookup failed for ${pNo}: ${res.error || 'Part not found'}`, 'warn');
            }
          } catch (err) {
            item.verified = false;
            onLog(`Error verifying ${pNo}: ${err.message}`, 'error');
          }
        }
      }

      setItems(updated);
      onToast({
        type: 'success',
        message: `Successfully verified ${verifiedCount} of ${validItems.length} parts against Komatsu PDX!`,
      });
    } catch (err) {
      onToast({ type: 'error', message: err.message || 'Verification batch failed' });
    } finally {
      setIsVerifying(false);
      setVerifyProgress(null);
    }
  }

  // =========================================================================
  // PRICING CALCULATION ENGINE
  // =========================================================================
  // Formulas specified by user:
  // For Lalaa:
  //   if DNet < 1000$: KME Price * 1.08 * 0.308 / 0.65 / R   (default R = 0.65)
  //   if DNet >= 1000$: KME Price * 1.08 * 0.308 / 0.65 / R   (default R = 0.75)
  // For Other customers:
  //   KME Price * 1.08 * 0.308 / R                           (default R = 0.65)
  // Slider modifies the 0.65 base factor (R between 0.01 and 1)
  const calculateUnitPriceKwd = useCallback(
    (dnetPrice) => {
      const dnet = parseFloat(dnetPrice || 0);
      if (isNaN(dnet) || dnet <= 0) return 0;

      const isLalaa = customerMode === 'LALAA';
      const R = Math.max(0.01, Math.min(1.0, parseFloat(sliderR) || 0.65));

      if (isLalaa) {
        if (dnet < 1000) {
          // Lalaa < 1000$: KME Price * 1.08 * 0.308 / 0.65 / R
          // Here R defaults to 0.65 (or slider value)
          return (dnet * 1.08 * 0.308) / 0.65 / R;
        } else {
          // Lalaa >= 1000$: KME Price * 1.08 * 0.308 / 0.65 / R, where default R = 0.75
          // When slider deviates from 0.65, scale proportionally: R_effective = 0.75 * (R / 0.65)
          const effectiveR = Math.min(1.0, 0.75 * (R / 0.65));
          return (dnet * 1.08 * 0.308) / 0.65 / effectiveR;
        }
      } else {
        // Other customers: KME Price * 1.08 * 0.308 / R (default R = 0.65)
        return (dnet * 1.08 * 0.308) / R;
      }
    },
    [customerMode, sliderR]
  );

  // =========================================================================
  // DELIVERY TIME CALCULATION ENGINE
  // =========================================================================
  // User Rule:
  // If stock in KME or KME EOR: 7-10 Days
  // If stock in KLTD or NONE: 3-5 Weeks
  // Able to combine: e.g. "4pcs 7-10 Days, 10pcs 3-5 Weeks"
  const calculateAutoDeliveryTime = useCallback((item) => {
    if (item.custom_delivery && item.custom_delivery.trim()) {
      return item.custom_delivery.trim();
    }

    const qty = parseInt(item.quantity, 10) || 1;
    const fastStock = (parseInt(item.kme_stock, 10) || 0) + (parseInt(item.kme_eor, 10) || 0);

    if (fastStock >= qty) {
      return '7-10 Days';
    } else if (fastStock <= 0) {
      return '3-5 Weeks';
    } else {
      // Combined outcome
      const fastPcs = fastStock;
      const slowPcs = qty - fastStock;
      return `${fastPcs}pcs 7-10 Days, ${slowPcs}pcs 3-5 Weeks`;
    }
  }, []);

  // Items table computed outcomes
  const calculatedTableRows = useMemo(() => {
    return items.map((it, idx) => {
      const unitPriceKwd = calculateUnitPriceKwd(it.dnet_price);
      const qty = parseInt(it.quantity, 10) || 1;
      const totalPriceKwd = unitPriceKwd * qty;
      const deliveryTime = calculateAutoDeliveryTime(it);

      const fastStock = (parseInt(it.kme_stock, 10) || 0) + (parseInt(it.kme_eor, 10) || 0);
      const kltdStock = parseInt(it.kltd_total, 10) || 0;

      let stockTag = 'NONE';
      let stockTone = 'critical';

      if (fastStock >= qty) {
        stockTag = `KME In-Stock (${fastStock})`;
        stockTone = 'ready';
      } else if (fastStock > 0) {
        stockTag = `Partial KME (${fastStock}/${qty})`;
        stockTone = 'warn';
      } else if (kltdStock > 0) {
        stockTag = `KLTD Japan (${kltdStock})`;
        stockTone = 'neutral';
      } else {
        stockTag = 'NONE (0)';
        stockTone = 'critical';
      }

      return {
        ...it,
        rowNumber: idx + 1,
        unitPriceKwd,
        totalPriceKwd,
        deliveryTime,
        stockTag,
        stockTone,
        fastStock,
        kltdStock,
      };
    });
  }, [items, calculateUnitPriceKwd, calculateAutoDeliveryTime]);

  // Overall Quotation Summary Metrics
  const summary = useMemo(() => {
    const totalLines = calculatedTableRows.length;
    const totalQty = calculatedTableRows.reduce((acc, it) => acc + (parseInt(it.quantity, 10) || 1), 0);
    const totalValueKwd = calculatedTableRows.reduce((acc, it) => acc + (it.totalPriceKwd || 0), 0);
    const totalDNetUsd = calculatedTableRows.reduce(
      (acc, it) => acc + (parseFloat(it.dnet_price || 0) * (parseInt(it.quantity, 10) || 1)),
      0
    );
    const inStockCount = calculatedTableRows.filter((it) => it.fastStock >= (it.quantity || 1)).length;
    const partialCount = calculatedTableRows.filter((it) => it.fastStock > 0 && it.fastStock < (it.quantity || 1)).length;
    const backorderCount = calculatedTableRows.filter((it) => it.fastStock === 0).length;

    return {
      totalLines,
      totalQty,
      totalValueKwd,
      totalDNetUsd,
      inStockCount,
      partialCount,
      backorderCount,
    };
  }, [calculatedTableRows]);

  // =========================================================================
  // AVAILABILITY FORM ITEMS
  // =========================================================================
  // User Rule:
  // "For items in KLTD and NONE (0s in KME, KME EOR, KLTD), are to be filled in a special form called Availability form
  // Where the items numbers, description, quantity and model and serial numbers to be filled.
  // Compatible models are to be checked exactly in the same way as PDX check.
  // Serial numbers are to be filled to meet the customer and the required model, choosing one serial number per each like, repeating is allowed.
  // If the model does not meet any model of the current customers list, the model to be added without a SN after it, just with a dash in the SN line."
  const availabilityFormItems = useMemo(() => {
    const avItems = [];

    calculatedTableRows.forEach((it) => {
      const qty = parseInt(it.quantity, 10) || 1;
      const fastStock = it.fastStock || 0;

      // Needs availability form if no KME fast stock, or partial stock where remainder comes from Japan/factory
      if (fastStock < qty) {
        const neededQty = qty - fastStock;
        const match = findBestFleetMatch(it.models);

        const currentModel = it.selected_model || match.model;
        const currentSerial = it.selected_serial || match.serial;

        avItems.push({
          id: it.id,
          part_no: it.part_no,
          latest_part_no: it.latest_part_no || it.part_no,
          description: it.description || 'KOMATSU COMPONENT',
          quantity: neededQty,
          original_qty: qty,
          kme_stock: it.kme_stock,
          kltd_stock: it.kltd_total,
          models: it.models || [],
          model: currentModel,
          serial: currentSerial,
          remarks: null,
        });
      }
    });

    return avItems;
  }, [calculatedTableRows, findBestFleetMatch]);

  // Update selected model or serial in availability items
  function handleUpdateAvailabilityRow(id, field, value) {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        return {
          ...it,
          [field === 'model' ? 'selected_model' : 'selected_serial']: value,
        };
      })
    );
  }

  // Download Availability Request Form Excel
  async function handleDownloadExcel() {
    if (availabilityFormItems.length === 0) {
      onToast({ type: 'warn', message: 'No items in KLTD or NONE requiring an Availability Request Form.' });
      return;
    }

    try {
      setIsDownloadingExcel(true);
      onLog(`Generating Parts Availability Request Form for ${selectedCustomer} (${availabilityFormItems.length} lines)...`, 'info');

      await downloadAvailabilityFormExcel({
        customer: selectedCustomer || 'Customer',
        items: availabilityFormItems.map((it, idx) => ({
          itemNo: idx + 1,
          part_no: it.part_no,
          latest_part_no: it.latest_part_no,
          description: it.description,
          quantity: it.quantity,
          model: it.model,
          serial: it.serial,
          remarks: it.remarks,
        })),
      });

      onToast({
        type: 'success',
        message: `Parts Availability Request Form (.xlsx) generated and downloaded!`,
      });
      onLog('Availability Request Form Excel download complete.', 'success');
    } catch (err) {
      onToast({ type: 'error', message: err.message || 'Failed to download Availability Form Excel' });
      onLog(`Excel generation error: ${err.message}`, 'error');
    } finally {
      setIsDownloadingExcel(false);
    }
  }

  // Copy Quotation Table to Clipboard
  function handleCopyQuotationClipboard() {
    if (calculatedTableRows.length === 0) return;
    const header = ['Item', 'Description', 'Qty', 'Unit Price (KWD)', 'Total Price (KWD)', 'Delivery Time'].join('\t');
    const body = calculatedTableRows
      .map((r) =>
        [r.part_no, r.description, r.quantity, r.unitPriceKwd.toFixed(3), r.totalPriceKwd.toFixed(3), r.deliveryTime].join(
          '\t'
        )
      )
      .join('\n');

    const fullText = `${header}\n${body}\n\nTotal Value: ${summary.totalValueKwd.toFixed(3)} KWD`;
    navigator.clipboard.writeText(fullText).then(() => {
      onToast({ type: 'success', message: 'Quotation table copied to clipboard (TSV format).' });
    });
  }

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & CUSTOMER / PRICING CONTROLS CARD                          */}
      {/* ========================================================================= */}
      <Card className="p-5 sm:p-6 space-y-5 border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white font-bold text-xs shadow-2xs">
                ★
              </span>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Customer Quotations & Pricing Engine
              </h2>
              <Badge tone="live" size="sm">
                Interactive PDX Verification
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1 pl-8">
              Live stock verification across <strong>KME Dubai</strong>, <strong>KME EOR</strong>, <strong>KLTD Japan</strong>, and <strong>Factory Backorder</strong> with multi-tier pricing and automated Parts Availability Form generation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setTempPasteText(pastedText);
                setPasteModalOpen(true);
              }}
              className="text-xs"
            >
              📥 Bulk Paste / Import
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAddBlankItem}
              className="text-xs"
            >
              + Add Item Row
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleVerifyParts}
              disabled={isVerifying || items.length === 0}
              className="text-xs font-bold"
            >
              {isVerifying ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Verifying PDX ({verifyProgress?.current || 0}/{verifyProgress?.total || items.length})...
                </span>
              ) : (
                `Verify All Parts (${items.length})`
              )}
            </Button>
          </div>
        </div>

        {/* Customer Account & Pricing Mode Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Customer Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              1. Customer Account
            </label>
            <div className="flex items-center gap-2">
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 shadow-2xs focus:border-amber-500 focus:outline-none"
              >
                <option value="Lalaa">Lalaa (Tier Partner)</option>
                {allCustomers
                  .filter((c) => c && c.toLowerCase() !== 'lalaa')
                  .map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                <option value="Other Customers">Other Customers (General)</option>
              </select>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Registered fleet machines: <strong>{customerFleet.length} units</strong>
            </p>
          </div>

          {/* Pricing Formula Tier */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              2. Pricing Tier & Formula
            </label>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setCustomerMode('LALAA')}
                className={`flex-1 py-1.5 px-2 rounded text-xs font-bold transition-all cursor-pointer ${
                  customerMode === 'LALAA'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                LALAA Dual-Tier
              </button>
              <button
                type="button"
                onClick={() => setCustomerMode('OTHER')}
                className={`flex-1 py-1.5 px-2 rounded text-xs font-bold transition-all cursor-pointer ${
                  customerMode === 'OTHER'
                    ? 'bg-slate-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Other Customers
              </button>
            </div>
            <div className="text-[11px] font-mono text-slate-600 mt-1">
              {customerMode === 'LALAA' ? (
                <span>
                  &lt;$1k: <code>DNet*1.08*0.308/0.65/R</code> (R=0.65) | &ge;$1k: (R=0.75)
                </span>
              ) : (
                <span>
                  All DNet: <code>DNet*1.08*0.308/R</code> (R=0.65)
                </span>
              )}
            </div>
          </div>

          {/* Dynamic Slider R */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                3. Margin Divisor (Slider R: {sliderR.toFixed(2)})
              </label>
              <button
                type="button"
                onClick={() => setSliderR(0.65)}
                className="text-[11px] text-amber-600 font-semibold hover:underline cursor-pointer"
              >
                Reset (0.65)
              </button>
            </div>

            <div className="space-y-1.5">
              <input
                type="range"
                min="0.01"
                max="1.00"
                step="0.01"
                value={sliderR}
                onChange={(e) => setSliderR(parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>0.01 (High Margin)</span>
                <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  R = {sliderR.toFixed(2)}
                </span>
                <span>1.00 (At Cost)</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 2. SUMMARY KPI METRIC TILES                                               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          label="Total Quotation Items"
          value={summary.totalLines}
          change={`${summary.totalQty} total pcs`}
        />
        <MetricCard
          label="Quotation Total (KWD)"
          value={`${summary.totalValueKwd.toFixed(3)} KWD`}
          change={`DNet: $${summary.totalDNetUsd.toFixed(2)} USD`}
        />
        <MetricCard
          label="7-10 Days (KME Fast)"
          value={summary.inStockCount}
          change="Available in Dubai"
        />
        <MetricCard
          label="Partial Stock Combined"
          value={summary.partialCount}
          change="Split Delivery Time"
        />
        <MetricCard
          label="3-5 Weeks (KLTD/Japan)"
          value={summary.backorderCount}
          change="Availability Form req."
        />
        <MetricCard
          label="Pricing Margin Factor"
          value={`R = ${sliderR.toFixed(2)}`}
          change={customerMode === 'LALAA' ? 'LALAA Partner Tier' : 'Standard Formula'}
        />
      </div>

      {/* ========================================================================= */}
      {/* 3. OUTCOME TABLE: 7 COLUMNS + FREE TEXT + HIDDEN DNET PRICE               */}
      {/* ========================================================================= */}
      <Card className="p-0 overflow-hidden border-slate-200 shadow-2xs">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Customer Quotation Outcome Table ({calculatedTableRows.length} Items)
              </h3>
              <Badge tone="live" size="sm">
                7 Official Columns
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              DNet prices are hidden by default to safeguard internal costs. Click any DNet cell or toggle all to view.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleRevealAllDNet}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
            >
              {revealAllDNet ? '🙈 Hide All DNet Prices' : '👁 Reveal All DNet Prices'}
            </button>
            <button
              type="button"
              onClick={handleCopyQuotationClipboard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
            >
              📋 Copy Table
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-100/70 border-b border-slate-200">
                <TableHead className="w-12 text-center text-[11px] font-bold">#</TableHead>
                <TableHead className="min-w-[150px] text-[11px] font-bold">Item (Part No.)</TableHead>
                <TableHead className="min-w-[200px] text-[11px] font-bold">Description</TableHead>
                <TableHead isNumeric className="w-20 text-[11px] font-bold">Qty</TableHead>
                <TableHead isNumeric className="w-36 text-[11px] font-bold bg-amber-50/50">
                  <div className="flex items-center justify-end gap-1">
                    <span>DNet Price ($)</span>
                    <span className="text-[9px] text-amber-700 font-mono">(Hidden)</span>
                  </div>
                </TableHead>
                <TableHead isNumeric className="w-36 text-[11px] font-bold text-slate-900">
                  Price / Unit (KWD)
                </TableHead>
                <TableHead isNumeric className="w-36 text-[11px] font-bold text-emerald-800 bg-emerald-50/40">
                  Total Price (KWD)
                </TableHead>
                <TableHead className="min-w-[220px] text-[11px] font-bold">
                  <div className="flex items-center gap-1.5">
                    <span>Delivery Time</span>
                    <span className="text-[9px] font-normal text-slate-500">(Free Text)</span>
                  </div>
                </TableHead>
                <TableHead className="w-16 text-center text-[11px] font-bold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calculatedTableRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-12 text-center text-slate-500">
                    <div className="max-w-sm mx-auto space-y-2">
                      <p className="text-sm font-semibold text-slate-700">No quotation items yet</p>
                      <p className="text-xs text-slate-500">
                        Paste part numbers above or click <strong>+ Add Item Row</strong> to begin.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                calculatedTableRows.map((row) => {
                  const isDNetRevealed = revealAllDNet || revealedDNetIds.has(row.id);

                  return (
                    <TableRow key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Row Index */}
                      <TableCell className="text-center font-mono text-xs text-slate-500">
                        {row.rowNumber}
                      </TableCell>

                      {/* 1. Item */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <input
                            type="text"
                            value={row.part_no}
                            onChange={(e) => handleUpdateItem(row.id, 'part_no', e.target.value)}
                            className="font-mono text-xs font-bold text-slate-900 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-amber-500 rounded px-1.5 py-0.5 w-full uppercase outline-none"
                            placeholder="PART NO."
                          />
                          <div className="flex items-center gap-1.5 pl-1.5">
                            <span
                              className={`inline-block w-1.5 h-1.5 rounded-full ${
                                row.verified ? 'bg-emerald-500' : 'bg-amber-400'
                              }`}
                            />
                            <span className="text-[10px] text-slate-500 font-mono">
                              {row.verified ? row.stockTag : 'Unverified'}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* 2. Description */}
                      <TableCell>
                        <input
                          type="text"
                          value={row.description}
                          onChange={(e) => handleUpdateItem(row.id, 'description', e.target.value)}
                          className="text-xs text-slate-700 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-amber-500 rounded px-1.5 py-0.5 w-full outline-none"
                        />
                      </TableCell>

                      {/* 3. Qty */}
                      <TableCell isNumeric>
                        <input
                          type="number"
                          min="1"
                          value={row.quantity}
                          onChange={(e) => handleUpdateItem(row.id, 'quantity', e.target.value)}
                          className="font-mono text-xs font-bold text-slate-900 text-right bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-amber-500 rounded px-1.5 py-0.5 w-16 outline-none"
                        />
                      </TableCell>

                      {/* 4. DNet Price (Hidden, Click to view) */}
                      <TableCell isNumeric className="bg-amber-50/20">
                        <button
                          type="button"
                          onClick={() => handleToggleRevealDNet(row.id)}
                          className="inline-flex items-center justify-end gap-1.5 px-2 py-1 rounded text-right transition-all cursor-pointer hover:bg-amber-100/60 w-full"
                          title="Click to toggle DNet price visibility"
                        >
                          {isDNetRevealed ? (
                            <span className="font-mono text-xs font-semibold text-amber-900">
                              ${row.dnet_price.toFixed(2)}
                            </span>
                          ) : (
                            <span className="font-mono text-xs text-slate-400 tracking-wider">
                              ••••••
                            </span>
                          )}
                          <span className="text-[10px] text-amber-700 opacity-60">
                            {isDNetRevealed ? '👁' : '🔒'}
                          </span>
                        </button>
                      </TableCell>

                      {/* 5. Price per Unit (KWD) */}
                      <TableCell isNumeric className="font-mono text-xs font-bold text-slate-900">
                        {row.unitPriceKwd.toFixed(3)} KWD
                      </TableCell>

                      {/* 6. Total Price (KWD) */}
                      <TableCell isNumeric className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50/20">
                        {row.totalPriceKwd.toFixed(3)} KWD
                      </TableCell>

                      {/* 7. Delivery Time (Free Text Editable) */}
                      <TableCell>
                        <div className="relative">
                          <input
                            type="text"
                            value={row.deliveryTime}
                            onChange={(e) => handleUpdateItem(row.id, 'custom_delivery', e.target.value)}
                            className="text-xs font-medium text-slate-800 bg-white border border-slate-200 hover:border-slate-300 focus:border-amber-500 rounded px-2.5 py-1 w-full outline-none shadow-2xs"
                            placeholder="e.g. 7-10 Days, 3-5 Weeks"
                          />
                        </div>
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(row.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded cursor-pointer"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Table Footer Summary Row */}
        {calculatedTableRows.length > 0 && (
          <div className="p-4 bg-slate-100/90 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 text-slate-600 font-medium">
              <span>
                Total Lines: <strong className="text-slate-900">{summary.totalLines}</strong>
              </span>
              <span>
                Total Units: <strong className="text-slate-900">{summary.totalQty} pcs</strong>
              </span>
              <span>
                Fast Stock: <strong className="text-emerald-700">{summary.inStockCount}</strong>
              </span>
              <span>
                Backorder: <strong className="text-amber-700">{summary.backorderCount}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3 font-mono">
              <span className="text-slate-500">Total Quotation Value:</span>
              <span className="text-base font-extrabold text-emerald-700 bg-white px-3 py-1 rounded-lg border border-emerald-300 shadow-2xs">
                {summary.totalValueKwd.toFixed(3)} KWD
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* 4. PARTS AVAILABILITY REQUEST FORM (FOR KLTD AND NONE ITEMS)              */}
      {/* ========================================================================= */}
      {availabilityFormItems.length > 0 && (
        <Card className="p-5 sm:p-6 space-y-4 border-amber-300 bg-gradient-to-b from-amber-50/30 to-white shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-amber-200/80">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs shadow-2xs">
                  📋
                </span>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Parts Availability Request Form (KLTD & NONE Items)
                </h3>
                <Badge tone="warn" size="sm">
                  {availabilityFormItems.length} Items for Japan / Factory
                </Badge>
              </div>
              <p className="text-xs text-slate-600 mt-1 pl-8">
                Generated strictly according to <code>Parts Availability Request Form..xlsx</code>. Machine models are verified against compatible models, and customer serial numbers are paired automatically.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadExcel}
              disabled={isDownloadingExcel}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-2xs text-xs"
            >
              {isDownloadingExcel ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Generating Excel...
                </span>
              ) : (
                '📥 Download Availability Request Form (.xlsx)'
              )}
            </Button>
          </div>

          {/* Availability Form Preview Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100 text-[11px] font-bold text-slate-800">
                  <TableHead className="w-16 text-center">ITEM NO.</TableHead>
                  <TableHead className="min-w-[140px]">PART NO.</TableHead>
                  <TableHead className="min-w-[140px]">LATEST PART NO.</TableHead>
                  <TableHead className="min-w-[180px]">DESCRIPTION</TableHead>
                  <TableHead isNumeric className="w-24">REQ. QTY</TableHead>
                  <TableHead className="min-w-[160px]">MACHINE MODEL</TableHead>
                  <TableHead className="min-w-[130px]">SN (Serial No.)</TableHead>
                  <TableHead className="min-w-[160px]">KME REMARKS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availabilityFormItems.map((avItem, idx) => {
                  return (
                    <TableRow key={avItem.id} className="hover:bg-slate-50 transition-colors">
                      {/* 1. Item No. */}
                      <TableCell className="text-center font-mono text-xs font-semibold text-slate-600">
                        {idx + 1}
                      </TableCell>

                      {/* 2. Part No. */}
                      <TableCell className="font-mono text-xs font-bold text-slate-900">
                        {avItem.part_no}
                      </TableCell>

                      {/* 3. Latest Part No. */}
                      <TableCell className="font-mono text-xs text-slate-700">
                        {avItem.latest_part_no}
                      </TableCell>

                      {/* 4. Description */}
                      <TableCell className="text-xs text-slate-800 uppercase">
                        {avItem.description}
                      </TableCell>

                      {/* 5. Req Qty */}
                      <TableCell isNumeric className="font-mono text-xs font-bold text-slate-900">
                        {avItem.quantity}
                      </TableCell>

                      {/* 6. Machine Model (Editable / Model Picker) */}
                      <TableCell>
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={avItem.model}
                            onChange={(e) => handleUpdateAvailabilityRow(avItem.id, 'model', e.target.value)}
                            className="font-mono text-xs font-bold text-slate-800 bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded px-2 py-0.5 w-full outline-none"
                            placeholder="MODEL"
                          />
                          {avItem.models && avItem.models.length > 1 && (
                            <div className="flex flex-wrap gap-1">
                              {avItem.models.slice(0, 3).map((m) => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => handleUpdateAvailabilityRow(avItem.id, 'model', m)}
                                  className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                                >
                                  {m}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* 7. SN (Customer Machine Serial or Dash) */}
                      <TableCell>
                        <input
                          type="text"
                          value={avItem.serial}
                          onChange={(e) => handleUpdateAvailabilityRow(avItem.id, 'serial', e.target.value)}
                          className="font-mono text-xs font-bold text-slate-800 bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded px-2 py-0.5 w-full outline-none text-center"
                          placeholder="-"
                        />
                      </TableCell>

                      {/* 8. KME Remarks */}
                      <TableCell className="text-xs text-slate-400 italic">
                        {avItem.remarks || '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-lg flex items-center justify-between text-xs text-indigo-900">
            <div className="flex items-center gap-2">
              <span className="font-bold">ℹ Automatic SN Pairing Rule:</span>
              <span>
                Matching customer fleet models populate their real SN (e.g. <code>88601</code>). Models not in the customer's fleet are filled with a dash (<code>-</code>).
              </span>
            </div>
            <span className="font-semibold text-indigo-800 shrink-0">
              Template: <code>C:\Spare Parts\Spare parts form\Parts Availability Request Form..xlsx</code>
            </span>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BULK PASTE IMPORT DIALOG                                           */}
      {/* ========================================================================= */}
      <Dialog open={pasteModalOpen} onClose={() => setPasteModalOpen(false)}>
        <DialogHeader>
          <DialogTitle>Paste / Import Quotation Part Items</DialogTitle>
        </DialogHeader>
        <DialogContent className="space-y-3">
          <p className="text-xs text-slate-600">
            Paste parts list from Excel or text (one per line, format: <code>Part Number, Quantity</code>).
          </p>
          <Field label="Pasted Parts Text" required>
            <Textarea
              rows={8}
              value={tempPasteText}
              onChange={(e) => setTempPasteText(e.target.value)}
              placeholder="17M-22-43430, 1&#10;17M-22-53160, 1&#10;6742-01-4540, 6&#10;600-319-3750, 4"
              className="font-mono text-xs"
            />
          </Field>
        </DialogContent>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setPasteModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              handleImportText(tempPasteText);
              setPasteModalOpen(false);
            }}
          >
            Import Items
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
