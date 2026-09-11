'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import SystemShell from '../../../components/SystemShell';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Skeleton from '../../../components/ui/Skeleton';
import Toast from '../../../components/ui/Toast';
import DetailDrawer from '../../../components/ui/DetailDrawer';
import Dialog, { DialogHeader, DialogTitle, DialogContent, DialogFooter } from '../../../components/ui/Dialog';
import {
  getInquiries,
  getInquiryDetails,
  syncOutlookInquiries,
  getOutlookInquiriesStatus,
  updateInquiryStatus,
  addInquiryItem,
  updateInquiryItem,
  deleteInquiryItem,
  priceInquiryWithPdx,
  checkLocalSapBridge,
  executeLocalSapQuotation,
  getLocalSapQuotationStatus,
} from '../../../lib/api';

const STATUS_CONFIG = {
  NEW: { label: 'New / Received', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  IN_REVIEW: { label: 'Under Review', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  PRICED: { label: 'PDX Priced', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' },
  QUOTED: { label: 'Quotation Sent', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  PO_RECEIVED: { label: 'PO Received', color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20' },
  CONVERTED_TO_SO: { label: 'Converted to SO', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  CLOSED_LOST: { label: 'Closed / Lost', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
};

const SPECIALISTS = ['Motasem Ghanem', 'Mohammad Qraein'];

export default function PartsInquiriesPage() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [inquiries, setInquiries] = useState([]);
  const [counts, setCounts] = useState({});
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [assignedFilter, setAssignedFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [outlookStatus, setOutlookStatus] = useState(null);
  const [toast, setToast] = useState(null);

  // Selected Inquiry Drawer
  const [selectedInquiryId, setSelectedInquiryId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Pricing & PDX State
  const [pricingPdx, setPricingPdx] = useState(false);
  const [markupPercent, setMarkupPercent] = useState(15);

  // SAP Sales Quotation Modal
  const [sapModalOpen, setSapModalOpen] = useState(false);
  const [sapCustomerCode, setSapCustomerCode] = useState('');
  const [sapCustomerName, setSapCustomerName] = useState('');
  const [sapSalesEmployee, setSapSalesEmployee] = useState('MOTASEM GHANEM');
  const [sapExecuting, setSapExecuting] = useState(false);
  const [sapBridgeStatus, setSapBridgeStatus] = useState(null);
  const [sapLogs, setSapLogs] = useState([]);
  const [sapResult, setSapResult] = useState(null);

  // New Part Item Form State
  const [newPartNo, setNewPartNo] = useState('');
  const [newPartQty, setNewPartQty] = useState(1);
  const [newPartDesc, setNewPartDesc] = useState('');
  const [addingPart, setAddingPart] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [inqRes, outRes] = await Promise.all([
        getInquiries({
          status: statusFilter,
          assignedTo: assignedFilter,
          search,
        }),
        getOutlookInquiriesStatus().catch(() => ({ online: false })),
      ]);

      if (inqRes.success) {
        setInquiries(inqRes.inquiries || []);
        setCounts(inqRes.counts || {});
      }
      setOutlookStatus(outRes);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to load inquiries.' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, assignedFilter, search]);

  useEffect(() => {
    loadData();

    // Hands-free background sync: check for newly routed emails
    syncOutlookInquiries({ markSynced: true, limit: 50 })
      .then((res) => {
        if (res?.newInquiriesCreated > 0) {
          loadData();
        }
      })
      .catch(() => {});

    // Periodic poll every 60 seconds
    const interval = setInterval(() => {
      syncOutlookInquiries({ markSynced: true, limit: 50 })
        .then((res) => {
          if (res?.newInquiriesCreated > 0) {
            loadData();
          }
        })
        .catch(() => {});
    }, 60000);

    return () => clearInterval(interval);
  }, [loadData]);

  // Load Inquiry Details Drawer
  const openDetail = async (id) => {
    setSelectedInquiryId(id);
    try {
      setDetailLoading(true);
      const res = await getInquiryDetails(id);
      if (res.success) {
        setDetailData(res.inquiry);
        setMarkupPercent(res.inquiry.markupPercentage || 15);
        setSapCustomerCode(res.inquiry.customerCode || '');
        setSapCustomerName(res.inquiry.companyName || res.inquiry.customerName || '');
        setSapSalesEmployee(
          (res.inquiry.assignedToName || '').toUpperCase().includes('MOHAMMAD')
            ? 'MOHAMMAD QRAEIN'
            : 'MOTASEM GHANEM'
        );
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to load details.' });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSyncFromOutlook = async () => {
    try {
      setSyncing(true);
      const res = await syncOutlookInquiries({ markSynced: true, limit: 50 });
      if (res.success) {
        setToast({
          type: 'success',
          message: `Synced! ${res.newInquiriesCreated} new inquiries created, ${res.existingUpdated} updated. (${res.totalInFolder} in folder)`,
        });
        await loadData();
      } else {
        setToast({ type: 'error', message: res.error || 'Outlook sync failed.' });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to communicate with Outlook.' });
    } finally {
      setSyncing(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!detailData) return;
    try {
      const res = await updateInquiryStatus(detailData.id, { status: newStatus });
      if (res.success) {
        setDetailData(res.inquiry);
        setToast({ type: 'success', message: `Status updated to ${STATUS_CONFIG[newStatus]?.label || newStatus}` });
        await loadData();
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to update status.' });
    }
  };

  const handleAssigneeChange = async (newName) => {
    if (!detailData) return;
    try {
      const res = await updateInquiryStatus(detailData.id, { assignedToName: newName });
      if (res.success) {
        setDetailData(res.inquiry);
        setSapSalesEmployee(newName.toUpperCase().includes('MOHAMMAD') ? 'MOHAMMAD QRAEIN' : 'MOTASEM GHANEM');
        setToast({ type: 'success', message: `Assigned to ${newName}` });
        await loadData();
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to reassign.' });
    }
  };

  // 1-Click PDX Pricing
  const handleFetchPdxPrices = async () => {
    if (!detailData) return;
    try {
      setPricingPdx(true);
      const res = await priceInquiryWithPdx(detailData.id, { markupPercentage: markupPercent });
      if (res.success) {
        setDetailData(res.inquiry);
        setToast({
          type: 'success',
          message: `PDX Pricing retrieved! ${res.totalPriced} of ${res.totalItems} items priced from Komatsu portal.`,
        });
        await loadData();
      } else {
        setToast({ type: 'error', message: res.message || 'Failed to fetch PDX prices.' });
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'PDX pricing lookup error.' });
    } finally {
      setPricingPdx(false);
    }
  };

  const handleRecalculateMarkup = async (newMarkup) => {
    setMarkupPercent(newMarkup);
    if (!detailData) return;
    try {
      const res = await updateInquiryStatus(detailData.id, { markupPercentage: newMarkup });
      if (res.success) {
        // Update local item selling prices
        setDetailData((prev) => ({
          ...prev,
          markupPercentage: newMarkup,
          items: prev.items.map((it) => {
            const cost = it.costPrice || 0;
            const selling = cost > 0 ? cost * (1 + newMarkup / 100) : it.sellingPrice;
            return {
              ...it,
              sellingPrice: selling,
              unitPrice: selling,
              totalPrice: selling ? selling * it.quantity : it.totalPrice,
            };
          }),
        }));
      }
    } catch {}
  };

  // Open SAP Quotation Bridge Dialog
  const handleOpenSapModal = async () => {
    setSapResult(null);
    setSapLogs([]);
    const bridge = await checkLocalSapBridge();
    setSapBridgeStatus(bridge);
    setSapModalOpen(true);
  };

  const handleExecuteSapQuotation = async () => {
    if (!sapCustomerCode.trim()) {
      alert('Please enter a valid SAP Customer Code (CardCode).');
      return;
    }
    if (!detailData?.items || detailData.items.length === 0) {
      alert('No items in this inquiry.');
      return;
    }

    try {
      setSapExecuting(true);
      setSapLogs([`Initiating SAP Sales Quotation for ${sapSalesEmployee}...`]);

      const payload = {
        customerCode: sapCustomerCode.trim(),
        customerName: sapCustomerName.trim(),
        salesEmployee: sapSalesEmployee,
        inquiryNo: detailData.inquiryNo,
        remarks: `Quotation for ${detailData.customerName || 'Customer'} - ${detailData.inquiryNo}`,
        items: detailData.items.map((it) => ({
          partNumber: it.partNumber,
          quantity: it.quantity,
          costPrice: it.costPrice,
          sellingPrice: it.sellingPrice || it.unitPrice,
          unitPrice: it.sellingPrice || it.unitPrice,
        })),
        isDraft: true,
        dryRun: false,
      };

      const res = await executeLocalSapQuotation(payload);
      setSapResult(res);

      if (res.quotationNo) {
        // Update inquiry with generated SAP quotation number and change status to QUOTED
        await updateInquiryStatus(detailData.id, {
          quotationNo: res.quotationNo,
          customerCode: sapCustomerCode.trim(),
          status: 'QUOTED',
        });
        setDetailData((prev) => ({
          ...prev,
          quotationNo: res.quotationNo,
          customerCode: sapCustomerCode.trim(),
          status: 'QUOTED',
        }));
        setToast({ type: 'success', message: `SAP Sales Quotation ${res.quotationNo} created!` });
        await loadData();
      }
    } catch (err) {
      setSapLogs((prev) => [...prev, `ERROR: ${err.message}`]);
      setToast({ type: 'error', message: err.message || 'SAP Quotation automation failed.' });
    } finally {
      setSapExecuting(false);
    }
  };

  const handleAddPartItem = async (e) => {
    e.preventDefault();
    if (!newPartNo.trim() || !detailData) return;
    try {
      setAddingPart(true);
      const res = await addInquiryItem(detailData.id, {
        partNumber: newPartNo.trim().toUpperCase(),
        quantity: parseInt(newPartQty, 10) || 1,
        description: newPartDesc.trim(),
      });
      if (res.success) {
        setDetailData((prev) => ({
          ...prev,
          items: [...(prev.items || []), res.item],
        }));
        setNewPartNo('');
        setNewPartQty(1);
        setNewPartDesc('');
        setToast({ type: 'success', message: 'Part item added.' });
        await loadData();
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to add item.' });
    } finally {
      setAddingPart(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Remove this part item?')) return;
    try {
      await deleteInquiryItem(itemId);
      setDetailData((prev) => ({
        ...prev,
        items: prev.items.filter((it) => it.id !== itemId),
      }));
      setToast({ type: 'success', message: 'Item deleted.' });
      await loadData();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to delete item.' });
    }
  };

  // Compose URL to prefill Komatsu Inquiry Page
  const komatsuInquiryUrl = useMemo(() => {
    if (!detailData || !detailData.items || detailData.items.length === 0) return null;
    const partsParam = detailData.items.map((it) => `${it.partNumber}, ${it.quantity}`).join('\n');
    return `/management/parts-inquiry?prefill=${encodeURIComponent(partsParam)}&rfq=${encodeURIComponent(detailData.inquiryNo)}`;
  }, [detailData]);

  // Quotation Financial Totals
  const totalCostKwd = useMemo(() => {
    if (!detailData?.items) return 0;
    return detailData.items.reduce((sum, it) => sum + ((it.costPrice || 0) * (it.quantity || 1)), 0);
  }, [detailData]);

  const totalSellingKwd = useMemo(() => {
    if (!detailData?.items) return 0;
    return detailData.items.reduce((sum, it) => sum + ((it.sellingPrice || it.unitPrice || 0) * (it.quantity || 1)), 0);
  }, [detailData]);

  return (
    <SystemShell activeNav="management">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Spareparts Department</span>
              <span className="text-xs text-muted-foreground">• Inbound RFQs & Quotation Pipeline</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">
              Customer Quotation Inquiries
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Tracking quotation inquiries received on <span className="font-semibold text-foreground">Motasem & Mohammad's</span> emails with 1-click Komatsu PDX pricing and SAP B1 Sales Quotation automation.
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Outlook Connection Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-xs">
              <span className={`h-2 w-2 rounded-full ${outlookStatus?.online ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-muted-foreground">
                {outlookStatus?.online ? `Outlook: ${outlookStatus.account?.split('@')[0]}` : 'Outlook: Standby'}
              </span>
              {outlookStatus?.totalInFolder !== undefined && (
                <span className="font-semibold text-foreground">({outlookStatus.totalInFolder} waiting)</span>
              )}
            </div>

            {/* Sync Now Button */}
            <button
              onClick={handleSyncFromOutlook}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <svg className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {syncing ? 'Syncing...' : 'Sync from Outlook'}
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card
            className={`p-4 cursor-pointer transition-all border ${statusFilter === 'ALL' ? 'border-primary shadow-sm ring-1 ring-primary/20' : 'hover:border-border/80'}`}
            onClick={() => setStatusFilter('ALL')}
          >
            <div className="text-xs font-medium text-muted-foreground uppercase">Total Logged</div>
            <div className="text-2xl font-bold text-foreground mt-1">{inquiries.length}</div>
          </Card>

          <Card
            className={`p-4 cursor-pointer transition-all border ${statusFilter === 'NEW' ? 'border-amber-500 shadow-sm ring-1 ring-amber-500/20' : 'hover:border-border/80'}`}
            onClick={() => setStatusFilter('NEW')}
          >
            <div className="text-xs font-medium text-amber-600 uppercase">New / Unpriced</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">{counts.NEW || 0}</div>
          </Card>

          <Card
            className={`p-4 cursor-pointer transition-all border ${statusFilter === 'IN_REVIEW' ? 'border-blue-500 shadow-sm ring-1 ring-blue-500/20' : 'hover:border-border/80'}`}
            onClick={() => setStatusFilter('IN_REVIEW')}
          >
            <div className="text-xs font-medium text-blue-600 uppercase">In Review</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{counts.IN_REVIEW || 0}</div>
          </Card>

          <Card
            className={`p-4 cursor-pointer transition-all border ${statusFilter === 'PRICED' ? 'border-indigo-500 shadow-sm ring-1 ring-indigo-500/20' : 'hover:border-border/80'}`}
            onClick={() => setStatusFilter('PRICED')}
          >
            <div className="text-xs font-medium text-indigo-600 uppercase">PDX Priced</div>
            <div className="text-2xl font-bold text-indigo-600 mt-1">{counts.PRICED || 0}</div>
          </Card>

          <Card
            className={`p-4 cursor-pointer transition-all border ${statusFilter === 'QUOTED' ? 'border-emerald-500 shadow-sm ring-1 ring-emerald-500/20' : 'hover:border-border/80'}`}
            onClick={() => setStatusFilter('QUOTED')}
          >
            <div className="text-xs font-medium text-emerald-600 uppercase">Quotation Sent</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{counts.QUOTED || 0}</div>
          </Card>

          <Card
            className={`p-4 cursor-pointer transition-all border ${statusFilter === 'CONVERTED_TO_SO' ? 'border-purple-500 shadow-sm ring-1 ring-purple-500/20' : 'hover:border-border/80'}`}
            onClick={() => setStatusFilter('CONVERTED_TO_SO')}
          >
            <div className="text-xs font-medium text-purple-600 uppercase">Converted / Won</div>
            <div className="text-2xl font-bold text-purple-600 mt-1">{(counts.CONVERTED_TO_SO || 0) + (counts.PO_RECEIVED || 0)}</div>
          </Card>
        </div>

        {/* Specialist & Status Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
          {/* Specialist Toggle (Motasem vs Mohammad) */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/60 text-xs w-full sm:w-auto">
            <button
              onClick={() => setAssignedFilter('ALL')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                assignedFilter === 'ALL'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Specialists
            </button>
            <button
              onClick={() => setAssignedFilter('Motasem Ghanem')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                assignedFilter === 'Motasem Ghanem'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Motasem Ghanem
            </button>
            <button
              onClick={() => setAssignedFilter('Mohammad Qraein')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                assignedFilter === 'Mohammad Qraein'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Mohammad Qraein
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search customer, RFQ#, part..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-muted/30 border border-border rounded-lg pl-9 pr-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <svg className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Inquiries Table */}
        <Card className="overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 border-b border-border text-xs uppercase text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3 px-4">Inquiry #</th>
                  <th className="py-3 px-4">Specialist</th>
                  <th className="py-3 px-4">Customer / Company</th>
                  <th className="py-3 px-4">Subject & Email Excerpt</th>
                  <th className="py-3 px-4 text-center">Extracted Parts</th>
                  <th className="py-3 px-4 text-center">Attachments</th>
                  <th className="py-3 px-4">Received</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <tr key={idx}>
                      <td colSpan={9} className="py-4 px-4">
                        <Skeleton className="h-6 w-full" />
                      </td>
                    </tr>
                  ))
                ) : inquiries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-muted-foreground">
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-foreground">No Inquiries Found</h3>
                        <p className="text-xs">
                          Incoming customer emails matching your Outlook rule are automatically synced.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  inquiries.map((inq) => {
                    const stCfg = STATUS_CONFIG[inq.status] || STATUS_CONFIG.NEW;
                    const isMohammad = (inq.assignedToName || '').toLowerCase().includes('mohammad');

                    return (
                      <tr
                        key={inq.id}
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => openDetail(inq.id)}
                      >
                        <td className="py-3.5 px-4 font-mono font-semibold text-primary text-xs">
                          {inq.inquiryNo}
                          {inq.quotationNo && (
                            <div className="text-[10px] text-emerald-600 font-semibold font-mono mt-0.5">
                              SAP: {inq.quotationNo}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            isMohammad
                              ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                              : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                          }`}>
                            {isMohammad ? 'Mohammad' : 'Motasem'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-foreground">{inq.customerName || inq.companyName}</div>
                          <div className="text-xs text-muted-foreground font-mono truncate max-w-[180px]">{inq.customerEmail}</div>
                          {inq.companyName && inq.companyName !== inq.customerName && (
                            <span className="inline-block text-[10px] uppercase font-semibold bg-muted px-1.5 py-0.5 rounded text-muted-foreground mt-0.5">
                              {inq.companyName}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-medium text-foreground truncate">{inq.subject}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-sm mt-0.5">
                            {inq.bodyText ? inq.bodyText.substring(0, 80) : '(No body text)'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            (inq.items?.length || 0) > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                          }`}>
                            {inq.items?.length || 0} items
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {inq.attachments?.length > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-xs font-medium text-foreground">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              {inq.attachments.length}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(inq.receivedAt).toLocaleDateString()}
                          <div className="text-[11px] text-muted-foreground">
                            {new Date(inq.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold border ${stCfg.color}`}>
                            {stCfg.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetail(inq.id);
                            }}
                            className="px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10 rounded-md transition-colors"
                          >
                            Details →
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Inquiry Detail Drawer */}
        <DetailDrawer
          isOpen={Boolean(selectedInquiryId)}
          onClose={() => setSelectedInquiryId(null)}
          title={detailData ? `${detailData.inquiryNo} — Quotation Request` : 'Inquiry Details'}
        >
          {detailLoading ? (
            <div className="space-y-4 p-4">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : detailData ? (
            <div className="space-y-6 pb-8">
              {/* Status & Specialist Attribution Bar */}
              <div className="bg-muted/40 p-4 rounded-xl border border-border space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    {/* Specialist Selection */}
                    <div>
                      <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Specialist</span>
                      <div className="mt-1">
                        <select
                          value={detailData.assignedToName || 'Motasem Ghanem'}
                          onChange={(e) => handleAssigneeChange(e.target.value)}
                          className="bg-card text-foreground font-semibold text-xs border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          {SPECIALISTS.map((sp) => (
                            <option key={sp} value={sp}>{sp}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Pipeline Stage */}
                    <div>
                      <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Pipeline Stage</span>
                      <div className="mt-1">
                        <select
                          value={detailData.status}
                          onChange={(e) => handleStatusChange(e.target.value)}
                          className="bg-card text-foreground font-semibold text-xs border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                            <option key={key} value={key}>{val.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Primary Quotation Actions */}
                  <div className="flex items-center gap-2">
                    {/* PDX Price Query Button */}
                    <button
                      onClick={handleFetchPdxPrices}
                      disabled={pricingPdx || !detailData.items || detailData.items.length === 0}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-colors disabled:opacity-50"
                    >
                      <svg className={`h-3.5 w-3.5 ${pricingPdx ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {pricingPdx ? 'Querying PDX...' : 'Fetch PDX Prices'}
                    </button>

                    {/* Create SAP Sales Quotation Button */}
                    <button
                      onClick={handleOpenSapModal}
                      disabled={!detailData.items || detailData.items.length === 0}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors disabled:opacity-50"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Create SAP Quotation
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border text-xs">
                  <div>
                    <span className="text-muted-foreground">Customer:</span>
                    <p className="font-semibold text-foreground truncate">{detailData.customerName || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-mono text-foreground truncate">{detailData.customerEmail}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Company:</span>
                    <p className="font-semibold text-foreground truncate">{detailData.companyName || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Received:</span>
                    <p className="text-foreground">{new Date(detailData.receivedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Profit Margin & Quotation Calculator Header */}
              <div className="bg-card p-3 rounded-xl border border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="font-semibold text-foreground">Markup Margin:</span>
                  <div className="flex items-center gap-1">
                    {[10, 15, 20, 25].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => handleRecalculateMarkup(pct)}
                        className={`px-2 py-1 rounded text-xs font-semibold border ${
                          markupPercent === pct
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted text-muted-foreground border-border hover:text-foreground'
                        }`}
                      >
                        +{pct}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div>
                    <span className="text-muted-foreground">Total PDX Cost:</span>
                    <span className="font-bold text-foreground ml-1.5">{totalCostKwd.toFixed(3)} KWD</span>
                  </div>
                  <div className="border-l border-border pl-4">
                    <span className="text-muted-foreground">Quotation Selling Value:</span>
                    <span className="font-bold text-emerald-600 ml-1.5">{totalSellingKwd.toFixed(3)} KWD</span>
                  </div>
                </div>
              </div>

              {/* Extracted Line Items Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Quotation Line Items ({detailData.items?.length || 0})
                  </h3>
                  {komatsuInquiryUrl && (
                    <Link
                      href={komatsuInquiryUrl}
                      className="text-xs text-primary hover:underline font-semibold"
                    >
                      Open in Komatsu Tool →
                    </Link>
                  )}
                </div>

                {/* Items Table */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Part Number</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">PDX Cost (KWD)</th>
                        <th className="py-2.5 px-3">Komatsu Stock</th>
                        <th className="py-2.5 px-3 text-right">Selling Price (KWD)</th>
                        <th className="py-2.5 px-3 text-right">Total (KWD)</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {detailData.items?.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-4 px-3 text-center text-muted-foreground">
                            No part numbers extracted. Add items manually below.
                          </td>
                        </tr>
                      ) : (
                        detailData.items.map((it) => (
                          <tr key={it.id} className="hover:bg-muted/20">
                            <td className="py-2.5 px-3 font-mono font-bold text-foreground">{it.partNumber}</td>
                            <td className="py-2.5 px-3 text-muted-foreground">{it.description || '—'}</td>
                            <td className="py-2.5 px-3 text-center font-semibold">{it.quantity}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">
                              {it.costPrice ? it.costPrice.toFixed(3) : '—'}
                            </td>
                            <td className="py-2.5 px-3">
                              {it.komatsuStock ? (
                                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                  {it.komatsuStock}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-[11px]">Unchecked</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-foreground">
                              {it.sellingPrice ? it.sellingPrice.toFixed(3) : (it.unitPrice ? it.unitPrice.toFixed(3) : '—')}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-primary">
                              {it.totalPrice ? it.totalPrice.toFixed(3) : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => handleDeleteItem(it.id)}
                                className="text-red-500 hover:text-red-700 text-xs px-2 py-0.5 rounded transition-colors"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Add Part Form */}
                <form onSubmit={handleAddPartItem} className="flex flex-wrap items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Part # (e.g. 6742-01-4540)"
                    value={newPartNo}
                    onChange={(e) => setNewPartNo(e.target.value)}
                    className="text-xs bg-card border border-border rounded px-3 py-1.5 font-mono focus:outline-none focus:ring-1 focus:ring-primary w-44"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={newPartQty}
                    onChange={(e) => setNewPartQty(e.target.value)}
                    className="text-xs bg-card border border-border rounded px-2 py-1.5 w-16 text-center focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={newPartDesc}
                    onChange={(e) => setNewPartDesc(e.target.value)}
                    className="text-xs bg-card border border-border rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary flex-1 min-w-[140px]"
                  />
                  <button
                    type="submit"
                    disabled={addingPart || !newPartNo.trim()}
                    className="px-3 py-1.5 rounded text-xs font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
                  >
                    + Add Part
                  </button>
                </form>
              </div>

              {/* Attachments Section */}
              {detailData.attachments?.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    Attachments ({detailData.attachments.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {detailData.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border bg-card text-xs hover:border-primary/50 transition-colors"
                      >
                        <div className="truncate pr-2">
                          <p className="font-semibold text-foreground truncate">{att.fileName}</p>
                          <p className="text-[11px] text-muted-foreground">{att.fileSize ? `${Math.round(att.fileSize / 1024)} KB` : 'Attached file'}</p>
                        </div>
                        {att.fileUrl && (
                          <a
                            href={att.fileUrl}
                            download={att.fileName}
                            className="px-2.5 py-1 rounded bg-muted text-primary hover:bg-primary/10 font-semibold text-xs whitespace-nowrap"
                          >
                            Download
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Original Email Body */}
              <div className="space-y-2">
                <h3 className="font-bold text-foreground text-sm">Original Email Content</h3>
                <div className="p-4 rounded-xl border border-border bg-muted/20 text-xs font-mono whitespace-pre-wrap text-foreground max-h-60 overflow-y-auto leading-relaxed">
                  {detailData.bodyText || '(No message text)'}
                </div>
              </div>
            </div>
          ) : null}
        </DetailDrawer>

        {/* SAP Sales Quotation Dialog */}
        <Dialog open={sapModalOpen} onOpenChange={setSapModalOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Create SAP B1 Sales Quotation</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Local Bridge Status */}
              <div className="p-3 rounded-lg border border-border bg-muted/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${sapBridgeStatus?.status === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="font-semibold text-foreground">
                    {sapBridgeStatus?.status === 'ONLINE' ? 'SAP Local Bridge is Online' : 'SAP Local Bridge Offline'}
                  </span>
                </div>
                {sapBridgeStatus?.status !== 'ONLINE' && (
                  <span className="text-amber-600 font-medium">Run start-sap-bridge.bat</span>
                )}
              </div>

              {/* Customer Code & Salesperson */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-foreground block mb-1">SAP Customer Code (CardCode)*</label>
                  <input
                    type="text"
                    placeholder="e.g. C000001"
                    value={sapCustomerCode}
                    onChange={(e) => setSapCustomerCode(e.target.value)}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">Salesperson / Employee</label>
                  <select
                    value={sapSalesEmployee}
                    onChange={(e) => setSapSalesEmployee(e.target.value)}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="MOTASEM GHANEM">MOTASEM GHANEM</option>
                    <option value="MOHAMMAD QRAEIN">MOHAMMAD QRAEIN</option>
                  </select>
                </div>
              </div>

              {/* Quotation Summary */}
              <div className="bg-card p-3 rounded-lg border border-border text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Inquiry Reference:</span>
                  <span className="font-mono font-semibold">{detailData?.inquiryNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Line Items:</span>
                  <span className="font-semibold">{detailData?.items?.length || 0} items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Selling Value:</span>
                  <span className="font-bold text-emerald-600 font-mono">{totalSellingKwd.toFixed(3)} KWD</span>
                </div>
              </div>

              {/* Live Execution Logs */}
              {sapLogs.length > 0 && (
                <div className="bg-black/90 text-green-400 p-3 rounded-lg font-mono text-[11px] max-h-36 overflow-y-auto space-y-1">
                  {sapLogs.map((log, idx) => (
                    <div key={idx}>{log}</div>
                  ))}
                </div>
              )}

              {/* Result Confirmation */}
              {sapResult?.quotationNo && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs">
                  <p className="font-bold">✓ Sales Quotation Created in SAP B1!</p>
                  <p className="mt-1 font-mono">Quotation #: {sapResult.quotationNo} | Salesperson: {sapResult.salesEmployee}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <button
                onClick={() => setSapModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
              <button
                onClick={handleExecuteSapQuotation}
                disabled={sapExecuting || !sapCustomerCode.trim()}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors disabled:opacity-50"
              >
                {sapExecuting ? 'Creating Quotation...' : 'Create in SAP B1'}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Toast feedback */}
        {toast && (
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </SystemShell>
  );
}
