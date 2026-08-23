'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import SystemShell from '../../../components/SystemShell';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Toast from '../../../components/ui/Toast';
import {
  getEqpcStatus,
  saveEqpcCookie,
  getEqpcEventCodes,
  lookupEqpcMachine,
  uploadEqpcReport,
  batchUploadEqpcReports,
  getReports,
} from '../../../lib/api';

export default function EqpCareUploadPage() {
  const [activeTab, setActiveTab] = useState('single'); // 'single', 'batch', 'console'
  const [status, setStatus] = useState({ connected: false, loading: true, message: 'Checking connection...' });
  const [showCookieModal, setShowCookieModal] = useState(false);
  const [cookieInput, setCookieInput] = useState('');
  const [savingCookie, setSavingCookie] = useState(false);
  const [toast, setToast] = useState(null);

  // Event codes list
  const [eventCodes, setEventCodes] = useState([]);
  const [generatedReports, setGeneratedReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Single report form state
  const [formData, setFormData] = useState({
    model: 'HM400',
    type: '3',
    subtype: 'R',
    serialNo: '9720',
    eventCode: 'W413',
    serviceDate: new Date().toISOString().slice(0, 10),
    smr: '1000',
    orderNo: '',
    seller: '',
    subsidiary: '9961',
    subsidiaryName: 'KME',
    country: 'KW',
    countryName: 'KUWAIT',
    adRoute: '',
    distributor: '5194',
    distributorName: 'DAR AL HAI GENERAL TRADING KW',
    branch: '##1',
    subDealer: '',
    site: '##1',
    customer: "LA'ALA AL-KUWAIT REAL ESTATE CO.",
    customerCode: 'DAH-1404',
    customerUnitNo: '',
    comments: 'Scheduled periodic maintenance service completed according to Komatsu standards.',
    selectedReportId: '',
    customFile: null,
  });

  const [uploading, setUploading] = useState(false);
  const [logs, setLogs] = useState([
    { time: new Date().toLocaleTimeString(), message: 'EQP Care Dispatch Service initialized.', type: 'info' },
  ]);

  // Batch upload state
  const [selectedBatchReportIds, setSelectedBatchReportIds] = useState([]);
  const [batchProgress, setBatchProgress] = useState({ active: false, current: 0, total: 0, successful: 0, failed: 0 });

  useEffect(() => {
    checkConnection();
    loadEventCodes();
    loadLocalReports();
  }, []);

  function addLog(message, type = 'info') {
    setLogs((prev) => [{ time: new Date().toLocaleTimeString(), message, type }, ...prev.slice(0, 99)]);
  }

  async function checkConnection() {
    try {
      setStatus((s) => ({ ...s, loading: true }));
      const res = await getEqpcStatus();
      setStatus({
        connected: Boolean(res.connected),
        loading: false,
        user: res.user || 'IBRAHIM AHMAD ALDARAWSHEH',
        organization: res.organization || 'DAR AL HAI GENERAL TRADING KW (5194)',
        level: res.level || '40',
        message: res.message || (res.connected ? 'Connected to EQP Care' : 'Not connected'),
      });
      if (res.connected) {
        addLog(`🟢 Connected to EQP Care as ${res.user || 'IBRAHIM AHMAD ALDARAWSHEH'} (Level 40)`, 'success');
      } else {
        addLog(`🟡 EQP Care Session Notice: ${res.message || 'Cookie required'}`, 'warning');
      }
    } catch (err) {
      setStatus({
        connected: false,
        loading: false,
        message: err.message || 'Cannot check connection',
      });
    }
  }

  async function loadEventCodes() {
    try {
      const res = await getEqpcEventCodes();
      if (res.eventCodes && res.eventCodes.length > 0) {
        setEventCodes(res.eventCodes);
      }
    } catch {
      // Fallback standard event codes
      setEventCodes([
        { code: 'W411', name: '1ST PERIODIC SERVICE', description: '1st periodic service (250 Hours)' },
        { code: 'W412', name: '2ND PERIODIC SERVICE', description: '2nd periodic service (500 Hours)' },
        { code: 'W413', name: 'SERVICE REPORT(3RD PERIODIC SERVICE)', description: '3rd periodic service (1000 Hours)' },
        { code: 'W41X', name: 'EXTRA SERVICE', description: 'Extra service / inspection' },
        { code: 'W41P', name: 'PRE-DELIVERY SERVICE', description: 'Pre-delivery inspection (PDI)' },
        { code: 'W41N', name: 'NEW MACHINE DELIVERY SERVICE', description: 'New machine delivery' },
        { code: 'W51D', name: 'MACHINE CONDITION (CUSTOMER)', description: 'Customer site machine condition' },
      ]);
    }
  }

  async function loadLocalReports() {
    try {
      setLoadingReports(true);
      const res = await getReports();
      setGeneratedReports(res || []);
    } catch {
      // Ignore
    } finally {
      setLoadingReports(false);
    }
  }

  async function handleSaveCookie(e) {
    e.preventDefault();
    if (!cookieInput.trim()) {
      setToast({ type: 'error', message: 'Please paste your cookie string.' });
      return;
    }
    setSavingCookie(true);
    try {
      const cleanCookie = cookieInput.trim();
      if (typeof window !== 'undefined') {
        localStorage.setItem('eqpc_user_cookie', cleanCookie);
      }
      const res = await saveEqpcCookie(cleanCookie);
      setStatus({
        connected: Boolean(res.connected),
        loading: false,
        user: res.user || 'IBRAHIM AHMAD ALDARAWSHEH',
        organization: res.organization || 'DAR AL HAI GENERAL TRADING KW (5194)',
        level: res.level || '40',
        message: res.message || 'Session saved',
      });
      setShowCookieModal(false);
      setToast({ type: 'success', message: 'EQP Care session cookies saved successfully!' });
      addLog('Session cookies updated and tested successfully.', 'success');
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to save cookies' });
      addLog(`Failed to save cookies: ${err.message}`, 'error');
    } finally {
      setSavingCookie(false);
    }
  }

  async function handleMachineLookup(serial) {
    if (!serial) return;
    try {
      addLog(`Looking up machine #${serial}...`, 'info');
      const res = await lookupEqpcMachine({ model: formData.model, serialNo: serial });
      if (res) {
        setFormData((prev) => ({
          ...prev,
          model: res.model || prev.model,
          type: res.type || prev.type,
          subtype: res.subtype || prev.subtype,
          customer: res.customer || prev.customer,
          customerCode: res.customerCode || prev.customerCode,
          smr: res.lastSmr ? String(res.lastSmr) : prev.smr,
        }));
        addLog(`Auto-populated details for machine #${serial} (${res.model} - ${res.customer})`, 'success');
      }
    } catch (err) {
      addLog(`Lookup notice: ${err.message}`, 'warning');
    }
  }

  function handleSelectReport(reportId) {
    const report = generatedReports.find((r) => String(r.id) === String(reportId));
    if (!report) return;

    // Map service stage/type to Event Code
    let mappedCode = 'W413';
    const sType = (report.service_type || report.report_type || '').toUpperCase();
    if (sType.includes('1ST') || sType.includes('250')) mappedCode = 'W411';
    else if (sType.includes('2ND') || sType.includes('500')) mappedCode = 'W412';
    else if (sType.includes('3RD') || sType.includes('1000')) mappedCode = 'W413';
    else if (sType.includes('PRE-DELIVERY') || sType.includes('PDI')) mappedCode = 'W41P';
    else if (sType.includes('NEW') || sType.includes('DELIVERY')) mappedCode = 'W41N';
    else mappedCode = 'W41X';

    setFormData((prev) => ({
      ...prev,
      selectedReportId: String(report.id),
      model: report.machine_type || report.machine?.machineType || prev.model,
      serialNo: report.machine_number || report.machine?.machineNumber || prev.serialNo,
      smr: report.smr ? String(report.smr) : prev.smr,
      serviceDate: report.service_date ? new Date(report.service_date).toISOString().slice(0, 10) : prev.serviceDate,
      eventCode: mappedCode,
      comments: report.comments || prev.comments,
      customFile: null,
    }));

    addLog(`Pre-filled form from generated report: ${report.file_name || report.report_no}`, 'info');
  }

  async function handleSingleUpload(e) {
    e.preventDefault();
    if (!formData.model || !formData.serialNo) {
      setToast({ type: 'error', message: 'Machine model and serial number are required.' });
      return;
    }
    if (!formData.serviceDate) {
      setToast({ type: 'error', message: 'Service date is required.' });
      return;
    }

    setUploading(true);
    addLog(`Starting upload for ${formData.model} #${formData.serialNo} (${formData.eventCode})...`, 'info');

    try {
      const selectedReport = generatedReports.find((r) => String(r.id) === String(formData.selectedReportId));
      const storedCookie = typeof window !== 'undefined' ? localStorage.getItem('eqpc_user_cookie') || '' : '';
      const payload = {
        model: formData.model,
        type: formData.type,
        subtype: formData.subtype,
        serialNo: formData.serialNo,
        eventCode: formData.eventCode,
        serviceDate: formData.serviceDate,
        smr: Number(formData.smr) || 0,
        orderNo: formData.orderNo,
        seller: formData.seller,
        subsidiary: formData.subsidiary,
        country: formData.country,
        adRoute: formData.adRoute,
        distributor: formData.distributor,
        branch: formData.branch,
        subDealer: formData.subDealer,
        site: formData.site,
        customer: formData.customer,
        customerUnitNo: formData.customerUnitNo,
        comments: formData.comments,
        reportId: selectedReport?.id || null,
        fileName: selectedReport?.file_name || `Report_${formData.model}_${formData.serialNo}.pdf`,
        fileUrl: selectedReport?.file_url || null,
        cookie: storedCookie,
      };

      const res = await uploadEqpcReport(payload);
      setToast({
        type: 'success',
        message: `Successfully uploaded ${formData.model} #${formData.serialNo} to Komatsu EQP Care!`,
      });
      addLog(`✅ Successfully dispatched ${formData.model} #${formData.serialNo} (${res.eventName || formData.eventCode}) to EQP Care Daily Operation.`, 'success');
      loadLocalReports();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Upload failed' });
      addLog(`❌ Upload error: ${err.message}`, 'error');
    } finally {
      setUploading(false);
    }
  }

  async function handleRunBatchUpload() {
    if (selectedBatchReportIds.length === 0) {
      setToast({ type: 'error', message: 'Please select at least one report to batch upload.' });
      return;
    }

    const confirmed = window.confirm(`Upload ${selectedBatchReportIds.length} machine reports to Komatsu Equipment Care Daily Operation?`);
    if (!confirmed) return;

    setBatchProgress({
      active: true,
      current: 0,
      total: selectedBatchReportIds.length,
      successful: 0,
      failed: 0,
    });

    addLog(`🚀 Starting batch upload of ${selectedBatchReportIds.length} reports to EQP Care...`, 'info');

    const reportsToUpload = generatedReports.filter((r) => selectedBatchReportIds.includes(String(r.id)));
    const batchItems = reportsToUpload.map((r) => {
      let mappedCode = 'W413';
      const sType = (r.service_type || r.report_type || '').toUpperCase();
      if (sType.includes('1ST') || sType.includes('250')) mappedCode = 'W411';
      else if (sType.includes('2ND') || sType.includes('500')) mappedCode = 'W412';
      else if (sType.includes('3RD') || sType.includes('1000')) mappedCode = 'W413';
      else if (sType.includes('PRE-DELIVERY') || sType.includes('PDI')) mappedCode = 'W41P';
      else if (sType.includes('NEW') || sType.includes('DELIVERY')) mappedCode = 'W41N';
      else mappedCode = 'W41X';

      return {
        model: r.machine_type || r.machine?.machineType || 'HM400',
        type: '3',
        subtype: 'R',
        serialNo: r.machine_number || r.machine?.machineNumber || '',
        eventCode: mappedCode,
        serviceDate: r.service_date ? new Date(r.service_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        smr: r.smr || 0,
        customer: r.machine?.customerName || "LA'ALA AL-KUWAIT REAL ESTATE CO.",
        comments: r.comments || 'Periodic maintenance service completed.',
        reportId: r.id,
        fileName: r.file_name,
        fileUrl: r.file_url,
      };
    });

    try {
      const storedCookie = typeof window !== 'undefined' ? localStorage.getItem('eqpc_user_cookie') || '' : '';
      const res = await batchUploadEqpcReports({ items: batchItems, cookie: storedCookie });
      setBatchProgress({
        active: false,
        current: batchItems.length,
        total: batchItems.length,
        successful: res.successful || 0,
        failed: res.failed || 0,
      });

      setToast({
        type: 'success',
        message: `Batch completed! ${res.successful} succeeded, ${res.failed} failed.`,
      });
      addLog(`✨ Batch upload completed: ${res.successful} succeeded, ${res.failed} failed.`, 'success');
      loadLocalReports();
    } catch (err) {
      setBatchProgress((p) => ({ ...p, active: false }));
      setToast({ type: 'error', message: err.message || 'Batch upload failed' });
      addLog(`❌ Batch upload failed: ${err.message}`, 'error');
    }
  }

  function toggleBatchSelection(id) {
    const sId = String(id);
    setSelectedBatchReportIds((prev) =>
      prev.includes(sId) ? prev.filter((x) => x !== sId) : [...prev, sId]
    );
  }

  function selectAllBatchReports() {
    if (selectedBatchReportIds.length === generatedReports.length) {
      setSelectedBatchReportIds([]);
    } else {
      setSelectedBatchReportIds(generatedReports.map((r) => String(r.id)));
    }
  }

  return (
    <SystemShell
      activePath="/eqp/upload"
      eyebrow="KOMATSU EQP CARE DISPATCH"
      title="Equipment Care Daily Operation Portal"
      description="Automate machine service report uploads to the Komatsu Equipment Care Daily Operation (E0295 / E0904) site with smart pre-filling, PM event code mapping, and PDF attachment."
    >
      <div className="space-y-6">
        {/* Connection Status Card */}
        <Card className="p-4 sm:p-5 border-l-4 border-l-sky-500 bg-gradient-to-r from-sky-50/50 to-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{status.connected ? '🟢' : '🟡'}</div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {status.connected ? 'Komatsu Equipment Care Portal Connected' : 'Komatsu EQP Care Session Notice'}
                  </h3>
                  <Badge tone={status.connected ? 'live' : 'warning'}>
                    {status.connected ? 'Level 40 Live' : 'Session Ready'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {status.connected
                    ? `Operator: ${status.user} | Org: ${status.organization} | Role: Level 40 Distributor`
                    : 'Configure your active EQP Care browser session cookie (JSESSIONID) to dispatch live machine reports.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={checkConnection}
                disabled={status.loading}
                className="ds-button ds-button-secondary text-xs py-1.5 px-3"
              >
                {status.loading ? 'Checking...' : 'Refresh Status'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCookieInput('mkmwFlg=""; userId=s021895; langCd=ENG; bandwidth=true; eqpMenuCtg=E; dispMenu=1');
                  setShowCookieModal(true);
                }}
                className="ds-button ds-button-primary text-xs py-1.5 px-3"
              >
                Configure Session
              </button>
            </div>
          </div>
        </Card>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-slate-200">
          <div className="flex space-x-1">
            <button
              type="button"
              onClick={() => setActiveTab('single')}
              className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'single'
                  ? 'border-sky-600 text-sky-700 bg-sky-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              📄 Single Report Dispatch (E0295 / E0904)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('batch')}
              className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'batch'
                  ? 'border-sky-600 text-sky-700 bg-sky-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              📦 Batch Reports Uploader ({selectedBatchReportIds.length} Selected)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('console')}
              className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-colors ${
                activeTab === 'console'
                  ? 'border-sky-600 text-sky-700 bg-sky-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              🖥️ Live Execution Console ({logs.length})
            </button>
          </div>
          <a
            href="https://eqp-care.komatsu.co.jp/eqpc/EMDW0102MoveToEMDW0295.do?eqpMenuCtg=E&menuId=E0904"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-sky-600 hover:underline flex items-center gap-1 font-medium hidden sm:inline-flex"
          >
            Open Official EQP Care Site ↗
          </a>
        </div>

        {/* Tab 1: Single Report Dispatch */}
        {activeTab === 'single' && (
          <form onSubmit={handleSingleUpload} className="space-y-6">
            {/* Report Source Selector */}
            <Card className="p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span>1. Select Source Generated Report (Optional)</span>
                <Badge tone="info">Auto-fill</Badge>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <select
                    value={formData.selectedReportId}
                    onChange={(e) => handleSelectReport(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">-- Choose from Generated Reports Registry (or fill manually) --</option>
                    {generatedReports.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.file_name || r.report_no} ({r.machine_type || 'Machine'} #{r.machine_number} | SMR: {r.smr} hrs | {r.service_type || 'PM'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={loadLocalReports}
                    disabled={loadingReports}
                    className="ds-button ds-button-secondary w-full text-xs py-2"
                  >
                    {loadingReports ? 'Refreshing...' : '🔄 Refresh Reports'}
                  </button>
                </div>
              </div>
            </Card>

            {/* Equipment Search & Specifications */}
            <Card className="p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200 flex items-center justify-between">
                <span>2. Equipment Identification</span>
                <span className="text-xs font-normal text-slate-500">Screen E0904 : Daily Operation (Window)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Model *</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="e.g. HM400, PC400, D155A"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 font-semibold text-slate-900 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Type</label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    placeholder="e.g. 3"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subtype</label>
                  <input
                    type="text"
                    value={formData.subtype}
                    onChange={(e) => setFormData({ ...formData, subtype: e.target.value })}
                    placeholder="e.g. R"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Serial Number *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.serialNo}
                      onChange={(e) => setFormData({ ...formData, serialNo: e.target.value })}
                      placeholder="e.g. 9720"
                      className="w-full text-xs rounded-lg border border-slate-300 p-2.5 font-bold text-sky-800 bg-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => handleMachineLookup(formData.serialNo)}
                      className="ds-button ds-button-secondary text-xs px-3"
                      title="Auto-lookup machine details"
                    >
                      🔍
                    </button>
                  </div>
                </div>
              </div>
            </Card>

            {/* History Record Input */}
            <Card className="p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200 flex items-center justify-between">
                <span>3. History Record Input</span>
                <Badge tone="live">Mode: Create</Badge>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category / Event Code *</label>
                  <select
                    value={formData.eventCode}
                    onChange={(e) => setFormData({ ...formData, eventCode: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-yellow-50/70 font-semibold text-slate-900"
                    required
                  >
                    {eventCodes.map((ev) => (
                      <option key={ev.code} value={ev.code}>
                        {ev.code} : {ev.name} {ev.description ? `(${ev.description})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">1. Date (MM/DD/YYYY) *</label>
                  <input
                    type="date"
                    value={formData.serviceDate}
                    onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-yellow-50/70 font-semibold text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">2. SMR (Hours) *</label>
                  <input
                    type="number"
                    value={formData.smr}
                    onChange={(e) => setFormData({ ...formData, smr: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-yellow-50/70 font-bold text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">3. Order No</label>
                  <input
                    type="text"
                    value={formData.orderNo}
                    onChange={(e) => setFormData({ ...formData, orderNo: e.target.value })}
                    placeholder="Optional order #"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">4. Seller</label>
                  <input
                    type="text"
                    value={formData.seller}
                    onChange={(e) => setFormData({ ...formData, seller: e.target.value })}
                    placeholder="Seller code/name"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">5. Subsidiary</label>
                  <input
                    type="text"
                    value={`${formData.subsidiary} (${formData.subsidiaryName})`}
                    disabled
                    className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-slate-100 text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">6. Country</label>
                  <input
                    type="text"
                    value={`${formData.country} (${formData.countryName})`}
                    disabled
                    className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-slate-100 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">7. AD Route</label>
                  <input
                    type="text"
                    value={formData.adRoute}
                    onChange={(e) => setFormData({ ...formData, adRoute: e.target.value })}
                    placeholder="Route"
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">8. Distributor</label>
                  <input
                    type="text"
                    value={`${formData.distributor} (${formData.distributorName})`}
                    disabled
                    className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-slate-100 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">9. Branch</label>
                  <input
                    type="text"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">11. Site</label>
                  <input
                    type="text"
                    value={formData.site}
                    onChange={(e) => setFormData({ ...formData, site: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-900 bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">12. Customer</label>
                  <input
                    type="text"
                    value={formData.customer}
                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-yellow-50/70 font-semibold text-slate-900"
                  />
                </div>
              </div>

              {/* Comments */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Comments (English)</label>
                  <span className="text-[11px] text-slate-500">Language: English</span>
                </div>
                <textarea
                  rows={3}
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  placeholder="Enter service details, maintenance notes, component checks..."
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-900 bg-white focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Document Attachment */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-800">Attach Report Document (PDF)</label>
                  <span className="text-[11px] text-slate-500">Max: 9 files, Max 15MB per file</span>
                </div>
                {formData.selectedReportId ? (
                  <div className="flex items-center justify-between p-2 bg-sky-50 border border-sky-200 rounded text-xs">
                    <span className="font-semibold text-sky-900">
                      📎 Attached from Archive: {generatedReports.find((r) => String(r.id) === String(formData.selectedReportId))?.file_name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, selectedReportId: '' })}
                      className="text-xs text-red-600 hover:underline font-bold"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setFormData({ ...formData, customFile: e.target.files?.[0] || null })}
                    className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-sky-100 file:text-sky-800 hover:file:bg-sky-200"
                  />
                )}
              </div>
            </Card>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Link href="/eqp/reports" className="ds-button ds-button-secondary text-xs py-2.5 px-4">
                Cancel & Return
              </Link>
              <button
                type="submit"
                disabled={uploading}
                className="ds-button ds-button-primary text-xs py-2.5 px-6 font-bold shadow-md"
              >
                {uploading ? '⏳ Uploading to EQP Care...' : '🚀 Dispatch Report to Komatsu EQP Care'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Batch Reports Uploader */}
        {activeTab === 'batch' && (
          <div className="space-y-4">
            <Card className="p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Batch Dispatch to Equipment Care</h3>
                  <p className="text-xs text-slate-500">
                    Select multiple generated maintenance PDFs from the local archive to batch upload sequentially.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAllBatchReports}
                    className="ds-button ds-button-secondary text-xs py-1.5 px-3"
                  >
                    {selectedBatchReportIds.length === generatedReports.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <button
                    type="button"
                    onClick={handleRunBatchUpload}
                    disabled={batchProgress.active || selectedBatchReportIds.length === 0}
                    className="ds-button ds-button-primary text-xs py-1.5 px-4 font-bold"
                  >
                    {batchProgress.active ? 'Processing Batch...' : `Batch Upload (${selectedBatchReportIds.length})`}
                  </button>
                </div>
              </div>

              {/* Batch Progress Bar */}
              {batchProgress.active && (
                <div className="mb-4 p-4 bg-sky-50 border border-sky-200 rounded-lg">
                  <div className="flex justify-between text-xs font-bold text-sky-900 mb-1">
                    <span>Uploading Batch to EQP Care...</span>
                    <span>{batchProgress.current} / {batchProgress.total}</span>
                  </div>
                  <div className="w-full bg-sky-200 rounded-full h-2">
                    <div
                      className="bg-sky-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(batchProgress.current / (batchProgress.total || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Reports Table */}
              <div className="overflow-x-auto max-h-[500px] border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                    <tr>
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedBatchReportIds.length === generatedReports.length && generatedReports.length > 0}
                          onChange={selectAllBatchReports}
                        />
                      </th>
                      <th className="p-3">Report File Name</th>
                      <th className="p-3">Model</th>
                      <th className="p-3">Serial No</th>
                      <th className="p-3">Service Stage</th>
                      <th className="p-3">SMR</th>
                      <th className="p-3">Target Event Code</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {generatedReports.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500">
                          No generated reports available. Generate PM reports in Report Builder first.
                        </td>
                      </tr>
                    ) : (
                      generatedReports.map((r) => {
                        const isSelected = selectedBatchReportIds.includes(String(r.id));
                        let mappedCode = 'W413';
                        const sType = (r.service_type || r.report_type || '').toUpperCase();
                        if (sType.includes('1ST') || sType.includes('250')) mappedCode = 'W411';
                        else if (sType.includes('2ND') || sType.includes('500')) mappedCode = 'W412';
                        else if (sType.includes('3RD') || sType.includes('1000')) mappedCode = 'W413';
                        else if (sType.includes('PRE-DELIVERY') || sType.includes('PDI')) mappedCode = 'W41P';
                        else mappedCode = 'W41X';

                        return (
                          <tr key={r.id} className={isSelected ? 'bg-sky-50/50' : 'hover:bg-slate-50'}>
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleBatchSelection(r.id)}
                              />
                            </td>
                            <td className="p-3 font-semibold text-slate-900">{r.file_name || r.report_no}</td>
                            <td className="p-3 text-slate-700">{r.machine_type || r.machine?.machineType || 'HM400'}</td>
                            <td className="p-3 font-bold text-sky-800">#{r.machine_number || r.machine?.machineNumber}</td>
                            <td className="p-3 text-slate-600">{r.service_type || 'Scheduled PM'}</td>
                            <td className="p-3 font-semibold text-slate-800">{r.smr} hrs</td>
                            <td className="p-3">
                              <Badge tone="live">{mappedCode}</Badge>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  handleSelectReport(r.id);
                                  setActiveTab('single');
                                }}
                                className="text-sky-600 hover:underline font-semibold"
                              >
                                Edit & Dispatch →
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
          </div>
        )}

        {/* Tab 3: Live Execution Console */}
        {activeTab === 'console' && (
          <Card className="p-5 bg-slate-950 text-slate-100 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="font-mono text-xs font-bold text-emerald-400">EQP CARE EXECUTION CONSOLE</h3>
              </div>
              <button
                type="button"
                onClick={() => setLogs([{ time: new Date().toLocaleTimeString(), message: 'Console cleared.', type: 'info' }])}
                className="text-[11px] text-slate-400 hover:text-white"
              >
                Clear Log
              </button>
            </div>
            <div className="font-mono text-xs space-y-1.5 max-h-96 overflow-y-auto">
              {logs.map((l, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 ${
                    l.type === 'error'
                      ? 'text-rose-400'
                      : l.type === 'success'
                      ? 'text-emerald-400'
                      : l.type === 'warning'
                      ? 'text-amber-300'
                      : 'text-slate-300'
                  }`}
                >
                  <span className="text-slate-500 select-none">[{l.time}]</span>
                  <span>{l.message}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Configure Cookie Modal */}
      {showCookieModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">Configure Komatsu EQP Care Session</h3>
                <p className="text-xs text-slate-500">Connect to https://eqp-care.komatsu.co.jp</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCookieModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p className="font-bold text-slate-800">How to copy cookies from Microsoft Edge / Chrome:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Log in to your <strong>Komatsu Equipment Care</strong> portal in Edge.</li>
                <li>Press <kbd className="bg-white px-1 border rounded">F12</kbd> → <strong>Network</strong> tab.</li>
                <li>Refresh or click any menu link (e.g. Daily Operation).</li>
                <li>Right-click the request → <strong>Copy</strong> → <strong>Copy request headers</strong> or <strong>Copy as cURL</strong>.</li>
                <li>Paste below (our parser automatically extracts JSESSIONID, userId, and tokens).</li>
              </ol>
            </div>

            <form onSubmit={handleSaveCookie} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Session Cookies / cURL String</label>
                <textarea
                  rows={4}
                  value={cookieInput}
                  onChange={(e) => setCookieInput(e.target.value)}
                  placeholder='mkmwFlg=""; userId=s021895; langCd=ENG; bandwidth=true; eqpMenuCtg=E; dispMenu=1; JSESSIONID=...'
                  className="w-full text-xs font-mono rounded-lg border border-slate-300 p-2.5 text-slate-900 bg-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCookieModal(false)}
                  className="ds-button ds-button-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCookie}
                  className="ds-button ds-button-primary text-xs py-2 px-5 font-bold"
                >
                  {savingCookie ? 'Testing...' : 'Save & Connect Session'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </SystemShell>
  );
}
