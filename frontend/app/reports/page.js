'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import JSZip from 'jszip';
import {
  deleteReport,
  getReports,
  renameReport,
  batchUploadEqpcReports,
  getEqpcStatus,
  saveEqpcCookie,
} from '../../lib/api';
import { getStoredPlatformSession, getStoredUser } from '../../lib/auth';
import SystemShell from '../../components/SystemShell';
import EqpNav from '../../components/eqp/EqpNav';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import Toast from '../../components/ui/Toast';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModel, setFilterModel] = useState('ALL');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'timeline'
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [toast, setToast] = useState(null);
  const [deleteRequest, setDeleteRequest] = useState(null);
  const [renamingReport, setRenamingReport] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [selectedReportIds, setSelectedReportIds] = useState([]);
  const [downloadBusy, setDownloadBusy] = useState(false);

  // EQP Care Upload States
  const [eqpUploadModal, setEqpUploadModal] = useState(null);
  const [eqpConnection, setEqpConnection] = useState({ checked: false, connected: false, user: '', message: '' });
  const [eqpProgress, setEqpProgress] = useState({ active: false, current: 0, total: 0 });
  const [cookieInput, setCookieInput] = useState('');
  const [savingCookie, setSavingCookie] = useState(false);

  useEffect(() => {
    const platformSession = getStoredPlatformSession();
    const user = getStoredUser();

    if (!platformSession?.token && !user?.sessionToken) {
      localStorage.removeItem('user');
      window.location.href = '/';
      return;
    }

    loadReports();
  }, []);

  async function loadReports() {
    try {
      setError('');
      const data = await getReports();
      setReports(data || []);
      setSelectedReportIds([]);
    } catch (loadError) {
      setError(loadError.message || 'Failed to load reports');
      setToast({ type: 'error', message: loadError.message || 'Failed to load reports.' });
    } finally {
      setLoading(false);
    }
  }

  const modelOptions = useMemo(() => {
    return [...new Set(reports.map((r) => r.machine_type || r.machine?.machineType).filter(Boolean))].sort();
  }, [reports]);

  const filteredReports = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filtered = reports.filter((report) => {
      const matchesSearch =
        !normalizedSearch ||
        report.file_name?.toLowerCase().includes(normalizedSearch) ||
        report.report_no?.toLowerCase().includes(normalizedSearch) ||
        report.machine_number?.toString().toLowerCase().includes(normalizedSearch) ||
        report.machine_type?.toLowerCase().includes(normalizedSearch);

      const mType = report.machine_type || report.machine?.machineType || '';
      const matchesModel = filterModel === 'ALL' || mType === filterModel;

      return matchesSearch && matchesModel;
    });

    return [...filtered].sort((a, b) => {
      const aValue = a[sortConfig.key] ?? '';
      const bValue = b[sortConfig.key] ?? '';

      if (sortConfig.key === 'created_at') {
        const aDate = new Date(aValue).getTime();
        const bDate = new Date(bValue).getTime();
        return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
      }

      return sortConfig.direction === 'asc'
        ? String(aValue).localeCompare(String(bValue), undefined, { numeric: true })
        : String(bValue).localeCompare(String(aValue), undefined, { numeric: true });
    });
  }, [reports, searchTerm, filterModel, sortConfig]);

  const archiveStats = useMemo(() => {
    const lastReport = reports[0]?.created_at ? new Date(reports[0].created_at).toLocaleDateString() : 'No reports';
    const machineCount = new Set(reports.map((report) => report.machine_id || report.machine_number)).size;

    return {
      total: reports.length,
      machines: machineCount,
      lastReport,
    };
  }, [reports]);

  const selectedReports = useMemo(() => (
    reports.filter((report) => selectedReportIds.includes(String(report.id)))
  ), [reports, selectedReportIds]);

  const allVisibleSelected = filteredReports.length > 0 && filteredReports.every((report) => (
    selectedReportIds.includes(String(report.id))
  ));

  function changeSort(key) {
    setSortConfig((previous) => ({
      key,
      direction: previous.key === key && previous.direction === 'asc' ? 'desc' : 'asc',
    }));
  }

  function openRename(report) {
    setRenamingReport(report);
    setRenameValue(report.file_name || '');
  }

  function toggleReportSelection(reportId) {
    const id = String(reportId);
    setSelectedReportIds((current) => (
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    ));
  }

  function toggleVisibleSelection() {
    const visibleIds = filteredReports.map((report) => String(report.id));
    setSelectedReportIds((current) => {
      if (visibleIds.every((id) => current.includes(id))) {
        return current.filter((id) => !visibleIds.includes(id));
      }
      return [...new Set([...current, ...visibleIds])];
    });
  }

  function safeZipFileName(value, fallback) {
    return String(value || fallback)
      .replace(/[/\\?%*:|"<>]+/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 140) || fallback;
  }

  async function downloadSingleReport(report) {
    try {
      const response = await fetch(report.file_url);
      if (!response.ok) throw new Error('Could not download report file.');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = report.file_name || 'report.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setToast({ type: 'error', message: downloadError.message || 'Failed to download report.' });
    }
  }

  async function downloadReports(targetReports) {
    if (!targetReports || targetReports.length === 0) return;
    setDownloadBusy(true);

    try {
      if (targetReports.length === 1) {
        await downloadSingleReport(targetReports[0]);
        return;
      }

      const zip = new JSZip();
      const folder = zip.folder('komatsu-eqp-reports');

      for (let index = 0; index < targetReports.length; index += 1) {
        const report = targetReports[index];
        const response = await fetch(report.file_url);
        if (!response.ok) throw new Error(`Could not download ${report.file_name}`);
        const blob = await response.blob();
        const baseName = safeZipFileName(report.file_name, `report-${index + 1}.pdf`);
        folder.file(baseName, blob);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `komatsu-eqp-reports-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setToast({ type: 'success', message: `Downloaded ${targetReports.length} reports as ZIP archive.` });
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Failed to export reports ZIP.' });
    } finally {
      setDownloadBusy(false);
    }
  }

  function openDeleteRequest(targetReports) {
    setDeleteRequest({ reports: targetReports });
  }

  async function handleDeleteReports({ rollbackCounters }) {
    if (!deleteRequest?.reports?.length) return;

    const reportsToDelete = [...deleteRequest.reports].sort((a, b) => {
      const aDate = new Date(a.created_at).getTime();
      const bDate = new Date(b.created_at).getTime();
      if (aDate !== bDate) return bDate - aDate;
      return Number(b.id) - Number(a.id);
    });

    try {
      let rolledBackCount = 0;
      for (const report of reportsToDelete) {
        const result = await deleteReport(report.id, { rollbackCounters });
        if (result.countersRolledBack) rolledBackCount += 1;
      }

      const deletedCount = reportsToDelete.length;
      const rollbackNote = rollbackCounters ? ` (${rolledBackCount} counters rolled back)` : '';
      setToast({ type: 'success', message: `${deletedCount} reports deleted${rollbackNote}.` });
      setDeleteRequest(null);
      await loadReports();
    } catch (deleteError) {
      setToast({ type: 'error', message: deleteError.message || 'Failed to delete report.' });
    }
  }

  async function handleRenameReport(event) {
    event.preventDefault();
    if (!renamingReport || !renameValue.trim()) return;

    try {
      await renameReport(renamingReport.id, renameValue.trim());
      setToast({ type: 'success', message: 'Report renamed successfully.' });
      setRenamingReport(null);
      setRenameValue('');
      await loadReports();
    } catch (renameError) {
      setToast({ type: 'error', message: renameError.message || 'Failed to rename report.' });
    }
  }

  async function handleAutoUploadToEqp(targetReports) {
    if (!targetReports || targetReports.length === 0) return;
    const count = targetReports.length;
    setEqpProgress({ active: true, current: 0, total: count });

    const batchItems = targetReports.map((r) => {
      let mappedCode = 'W41X';
      const sType = (r.service_type || r.report_type || '').toUpperCase();
      if (sType.includes('1ST') || sType.includes('250')) mappedCode = 'W411';
      else if (sType.includes('2ND') || sType.includes('500')) mappedCode = 'W412';
      else if (sType.includes('3RD') || sType.includes('1000')) mappedCode = 'W413';
      else if (sType.includes('4TH') || sType.includes('2000')) mappedCode = 'W41X';
      else if (sType.includes('PRE-DELIVERY') || sType.includes('PDI')) mappedCode = 'W41P';
      else if (sType.includes('NEW') || sType.includes('DELIVERY')) mappedCode = 'W41N';
      else mappedCode = 'W41X';

      const rawDate = r.service_date || r.created_at || new Date().toISOString();
      const serviceDate = rawDate ? new Date(rawDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

      return {
        model: r.machine_type || r.machine?.machineType || 'HM400',
        type: '3',
        subtype: 'R',
        serialNo: r.machine_number || r.machine?.machineNumber || '',
        eventCode: mappedCode,
        serviceDate,
        smr: Number(r.smr) || (r.machine?.smr ? Number(r.machine.smr) : 0),
        customer: r.machine?.customerName || "LA'ALA AL-KUWAIT REAL ESTATE CO.",
        comments: r.comments || `Scheduled periodic maintenance service (${sType || 'PM'}) completed according to Komatsu specifications.`,
        reportId: r.id,
        fileName: r.file_name,
        fileUrl: r.file_url,
      };
    });

    try {
      setToast({ type: 'info', message: `🚀 Dispatched ${count} reports to Komatsu Equipment Care...` });
      const storedCookie = typeof window !== 'undefined' ? localStorage.getItem('eqpc_user_cookie') || '' : '';
      const res = await batchUploadEqpcReports({ items: batchItems, cookie: storedCookie });
      if (res.failed > 0 && res.successful === 0) {
        const firstErr = res.results?.find((r) => r.status === 'FAILED')?.error || 'Upload failed.';
        setToast({
          type: 'error',
          message: `❌ Komatsu EQP Care Upload Failed: ${firstErr}`,
        });
      } else if (res.failed > 0) {
        setToast({
          type: 'warning',
          message: `⚠️ Partial Upload: ${res.successful} succeeded, ${res.failed} failed on Komatsu EQP Care.`,
        });
      } else {
        setToast({
          type: 'success',
          message: `🎉 All ${res.successful} reports uploaded to Komatsu Equipment Care Daily Operation successfully!`,
        });
      }
    } catch (err) {
      setToast({
        type: 'error',
        message: `Upload error: ${err.message || 'Could not connect to EQP Care service.'}`,
      });
    } finally {
      setEqpProgress({ active: false, current: 0, total: 0 });
    }
  }

  return (
    <SystemShell
      activePath="/eqp/reports"
      eyebrow="Komatsu EQP Platform"
      title="PDF Reports Archive & Vault"
      description="Permanent archive of certified preventive maintenance PDF reports with sequential indexing and batch ZIP export."
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/eqp/upload"
            className="ds-button ds-button-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 font-semibold"
          >
            EQP Care Studio
          </Link>
          <Button type="button" variant="secondary" onClick={loadReports}>
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Archive
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <EqpNav />

        {/* KPI Metrics */}
        <section className="ds-kpi-grid">
          <article className="ds-kpi-card">
            <div className="ds-icon-tile">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ds-kpi-content">
              <div className="ds-kpi-head">
                <p className="ds-kpi-label">Archived Reports</p>
                <Badge tone="preserved">Preserved</Badge>
              </div>
              <p className="ds-kpi-main">{archiveStats.total}</p>
              <p className="ds-kpi-descriptor">PDF Documents</p>
            </div>
          </article>

          <article className="ds-kpi-card">
            <div className="ds-icon-tile ds-icon-tile-accent">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="ds-kpi-content">
              <div className="ds-kpi-head">
                <p className="ds-kpi-label">Covered Machines</p>
                <Badge tone="active">Active</Badge>
              </div>
              <p className="ds-kpi-main">{archiveStats.machines}</p>
              <p className="ds-kpi-descriptor">Fleet Units</p>
            </div>
          </article>

          <article className="ds-kpi-card">
            <div className="ds-icon-tile">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ds-kpi-content">
              <div className="ds-kpi-head">
                <p className="ds-kpi-label">Latest Run</p>
                <Badge tone="live">Live</Badge>
              </div>
              <p className="ds-kpi-main ds-kpi-main-compact">{archiveStats.lastReport}</p>
              <p className="ds-kpi-descriptor">Recent Activity</p>
            </div>
          </article>
        </section>

        {error && (
          <div className="ds-alert ds-alert-error">
            <span>{error}</span>
          </div>
        )}

        {/* Reports Archive Main Card */}
        {loading ? (
          <Card className="p-8">
            <div className="space-y-3">
              <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
              <div className="h-12 w-full animate-pulse rounded bg-slate-100" />
              <div className="h-12 w-full animate-pulse rounded bg-slate-100" />
            </div>
          </Card>
        ) : reports.length === 0 ? (
          <Card className="p-8">
            <EmptyState title="No PDF reports in archive" description="Generate reports from the Report Builder to see them here." />
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="border-b border-slate-200 p-5 bg-slate-50/70 space-y-3">
              {/* Top Controls Row */}
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative flex-1 max-w-md">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search by file name, machine, or report no..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="ds-input pl-9 text-xs"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg border border-slate-300">
                    <button
                      type="button"
                      onClick={() => setViewMode('table')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                        viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      📊 Table
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('timeline')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                        viewMode === 'timeline' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      📅 Timeline
                    </button>
                  </div>

                  <Badge tone="neutral">{filteredReports.length} Visible</Badge>
                  {selectedReportIds.length > 0 && (
                    <Badge tone="yellow">{selectedReportIds.length} Selected</Badge>
                  )}

                  {/* Auto-Upload to EQP */}
                  {selectedReports.length > 0 && (
                    <button
                      type="button"
                      disabled={eqpProgress.active}
                      onClick={() => handleAutoUploadToEqp(selectedReports)}
                      className="ds-button bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-sm rounded-lg transition-all"
                    >
                      {eqpProgress.active ? (
                        <>
                          <span className="animate-spin">⏳</span> Uploading...
                        </>
                      ) : (
                        <>
                          <span>⚡</span> Auto-Upload ({selectedReports.length})
                        </>
                      )}
                    </button>
                  )}

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => downloadReports(selectedReports.length ? selectedReports : filteredReports)}
                    disabled={filteredReports.length === 0 || downloadBusy}
                  >
                    {downloadBusy ? 'Preparing ZIP...' : `Download ZIP (${selectedReports.length || filteredReports.length})`}
                  </Button>

                  {selectedReports.length > 0 && (
                    <Button variant="danger" size="sm" onClick={() => openDeleteRequest(selectedReports)}>
                      Delete Selected
                    </Button>
                  )}
                </div>
              </div>

              {/* Model Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/60">
                <span className="text-xs font-bold text-slate-500 mr-1">Model Family:</span>
                <button
                  type="button"
                  onClick={() => setFilterModel('ALL')}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all ${
                    filterModel === 'ALL'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All Models ({reports.length})
                </button>

                {modelOptions.map((model) => {
                  const count = reports.filter((r) => (r.machine_type || r.machine?.machineType) === model).length;
                  const isSelected = filterModel === model;
                  return (
                    <button
                      key={model}
                      type="button"
                      onClick={() => setFilterModel(model)}
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {model} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* View Mode: Timeline View */}
            {viewMode === 'timeline' ? (
              <div className="p-6 space-y-6">
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {filteredReports.map((report) => {
                    const isSelected = selectedReportIds.includes(String(report.id));
                    return (
                      <div key={report.id} className="relative group">
                        <span className="absolute -left-6 top-3 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-white border border-amber-600" />
                        <div className={`p-4 rounded-xl border transition-all ${
                          isSelected ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20' : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                        }`}>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleReportSelection(report.id)}
                                className="rounded accent-amber-500"
                              />
                              <div>
                                <h4 className="text-sm font-bold text-slate-900">{report.file_name}</h4>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {report.machine_type} #{report.machine_number} • SMR: <span className="font-bold text-slate-700">{report.smr || '—'} hrs</span> • Stage: <span className="font-semibold text-amber-700">{report.service_type || 'PM'}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] font-mono text-slate-400">
                                {new Date(report.created_at).toLocaleString()}
                              </span>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => downloadSingleReport(report)}
                              >
                                View PDF
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => openRename(report)}
                              >
                                Rename
                              </Button>
                              <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                onClick={() => openDeleteRequest([report])}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* View Mode: Table View */
              <div className="ds-table-wrap">
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th className="w-10">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleVisibleSelection}
                          className="rounded accent-amber-500"
                          aria-label="Select all visible reports"
                        />
                      </th>
                      <SortableHeader label="Report Document" column="file_name" sortConfig={sortConfig} onSort={changeSort} />
                      <SortableHeader label="Machine Asset" column="machine_number" sortConfig={sortConfig} onSort={changeSort} />
                      <SortableHeader label="Service Code" column="service_type" sortConfig={sortConfig} onSort={changeSort} />
                      <SortableHeader label="Date Generated" column="created_at" sortConfig={sortConfig} onSort={changeSort} />
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((report) => {
                      const isSelected = selectedReportIds.includes(String(report.id));
                      return (
                        <tr key={report.id} className={isSelected ? '!bg-amber-50/60' : ''}>
                          <td>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleReportSelection(report.id)}
                              className="rounded accent-amber-500"
                              aria-label={`Select ${report.file_name}`}
                            />
                          </td>
                          <td>
                            <p className="font-bold text-slate-900 leading-snug">{report.file_name}</p>
                            {report.report_no && (
                              <span className="font-mono text-xs text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60 inline-block mt-0.5">
                                {report.report_no}
                              </span>
                            )}
                          </td>
                          <td>
                            <span className="font-semibold text-slate-800">{report.machine_type}</span>{' '}
                            <span className="text-slate-600 font-medium">#{report.machine_number}</span>
                          </td>
                          <td>
                            <Badge tone="yellow">{report.service_type || 'EQP'}</Badge>
                          </td>
                          <td className="text-xs text-slate-500">
                            {new Date(report.created_at).toLocaleString()}
                          </td>
                          <td className="text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => downloadSingleReport(report)}
                              >
                                PDF
                              </Button>
                              <button
                                type="button"
                                disabled={eqpProgress.active}
                                onClick={() => handleAutoUploadToEqp([report])}
                                className="ds-button ds-button-secondary text-xs py-1 px-2.5 font-bold text-sky-700 border-sky-200 bg-sky-50 hover:bg-sky-100 flex items-center gap-1"
                                title="1-Click Auto Upload this report to Komatsu Equipment Care Daily Operation"
                              >
                                <span>⚡</span> Auto EQP
                              </button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => openRename(report)}
                              >
                                Rename
                              </Button>
                              <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                onClick={() => openDeleteRequest([report])}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <section className="ds-card w-full max-w-md overflow-hidden bg-white shadow-2xl animate-[ds-toast-in_180ms_ease]">
            <div className="p-6">
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Delete {deleteRequest.reports.length === 1 ? 'Report' : `${deleteRequest.reports.length} Reports`}?
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    This will permanently remove the PDF document from the database and storage records.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
              <Button variant="secondary" onClick={() => setDeleteRequest(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => handleDeleteReports({ rollbackCounters: false })}>
                Delete Report Only
              </Button>
              <Button variant="danger" onClick={() => handleDeleteReports({ rollbackCounters: true })}>
                Delete & Rollback SMR
              </Button>
            </div>
          </section>
        </div>
      )}

      {/* Rename Modal */}
      {renamingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <form onSubmit={handleRenameReport} className="ds-card w-full max-w-md overflow-hidden bg-white shadow-2xl animate-[ds-toast-in_180ms_ease]">
            <div className="p-6">
              <h2 className="text-base font-bold text-slate-900">Rename Report Document</h2>
              <p className="mt-1 text-xs text-slate-500">Provide an updated file name for this maintenance report.</p>
              <input
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                className="ds-input mt-4 text-xs"
                autoFocus
                required
              />
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
              <Button type="button" variant="secondary" onClick={() => setRenamingReport(null)}>Cancel</Button>
              <Button type="submit">Save Name</Button>
            </div>
          </form>
        </div>
      )}
    </SystemShell>
  );
}

function SortableHeader({ label, column, sortConfig, onSort }) {
  const active = sortConfig.key === column;
  const isAsc = sortConfig.direction === 'asc';

  return (
    <th>
      <button
        type="button"
        onClick={() => onSort(column)}
        className="ds-sort-button"
      >
        <span>{label}</span>
        {active ? (
          <span className="text-amber-600 font-bold">{isAsc ? '↑' : '↓'}</span>
        ) : (
          <span className="text-slate-300">↕</span>
        )}
      </button>
    </th>
  );
}
