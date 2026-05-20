'use client';

import { useEffect, useMemo, useState } from 'react';
import { deleteReport, getReports, renameReport } from '../../lib/api';
import { getStoredPlatformSession, getStoredUser } from '../../lib/auth';
import SystemShell from '../../components/SystemShell';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import Toast from '../../components/ui/Toast';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [toast, setToast] = useState(null);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [renamingReport, setRenamingReport] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [selectedReportIds, setSelectedReportIds] = useState([]);

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
      setReports(data);
      setSelectedReportIds([]);
      setToast({ type: 'info', message: 'Reports archive refreshed.' });
    } catch (loadError) {
      setError(loadError.message || 'Failed to load reports');
      setToast({ type: 'error', message: loadError.message || 'Failed to load reports.' });
    } finally {
      setLoading(false);
    }
  }

  const filteredReports = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filtered = reports.filter((report) => {
      if (!normalizedSearch) return true;

      return (
        report.file_name?.toLowerCase().includes(normalizedSearch) ||
        report.report_no?.toLowerCase().includes(normalizedSearch) ||
        report.machine_number?.toString().toLowerCase().includes(normalizedSearch) ||
        report.machine_type?.toLowerCase().includes(normalizedSearch)
      );
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
  }, [reports, searchTerm, sortConfig]);

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

  function downloadReports(targetReports) {
    targetReports.forEach((report, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = report.file_url;
        link.target = '_blank';
        link.rel = 'noreferrer';
        link.download = report.file_name || `report-${report.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 350);
    });
    setToast({ type: 'info', message: `Starting ${targetReports.length} downloads.` });
  }

  async function handleBulkDeleteReports() {
    if (selectedReports.length === 0) return;

    try {
      await Promise.all(selectedReports.map((report) => deleteReport(report.id)));
      setToast({ type: 'success', message: `${selectedReports.length} reports deleted.` });
      setBulkDeleteOpen(false);
      await loadReports();
    } catch (deleteError) {
      setError(deleteError.message || 'Failed to delete selected reports');
      setToast({ type: 'error', message: deleteError.message || 'Failed to delete selected reports.' });
    }
  }

  async function handleDeleteReport() {
    if (!reportToDelete) return;

    try {
      await deleteReport(reportToDelete.id);
      setToast({ type: 'success', message: 'Report deleted successfully.' });
      setReportToDelete(null);
      await loadReports();
    } catch (deleteError) {
      setError(deleteError.message || 'Failed to delete report');
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
      setError(renameError.message || 'Failed to rename report');
      setToast({ type: 'error', message: renameError.message || 'Failed to rename report.' });
    }
  }

  return (
    <SystemShell
      activePath="/eqp/reports"
      eyebrow="EQP Module"
      title="PDF Reports Archive"
      description="Generated maintenance PDFs, report numbers, machine coverage, and archive actions."
      actions={<Button type="button" variant="secondary" onClick={loadReports}>Refresh</Button>}
    >
      <div className="grid gap-6">

        <div className="ds-kpi-grid">
          <ArchiveMetric label="Total Reports" value={archiveStats.total} code="TR" />
          <ArchiveMetric label="Machines Covered" value={archiveStats.machines} code="MC" accent />
          <ArchiveMetric label="Latest Report" value={archiveStats.lastReport} code="LR" />
        </div>

        {error && (
          <p className="rounded-md border-l-4 border-red-500 bg-white px-4 py-3 text-sm font-semibold text-red-700 shadow-sm">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-zinc-500">Loading...</p>
        ) : reports.length === 0 ? (
          <EmptyState title="No reports yet" description="Generated reports will appear here." />
        ) : (
          <Card className="overflow-hidden">
            <div className="border-b border-[var(--color-border)] p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <input
                  type="text"
                  placeholder="Search reports, machines, or report numbers"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="ds-input w-full lg:max-w-md"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="neutral">{filteredReports.length} visible</Badge>
                  {selectedReportIds.length > 0 && <Badge tone="yellow">{selectedReportIds.length} selected</Badge>}
                  <Button variant="ghost" onClick={() => setSearchTerm('')}>Clear Search</Button>
                  <Button variant="secondary" onClick={() => downloadReports(selectedReports.length ? selectedReports : filteredReports)} disabled={filteredReports.length === 0}>
                    Download {selectedReports.length ? 'Selected' : 'All Visible'}
                  </Button>
                  <Button variant="danger" onClick={() => setBulkDeleteOpen(true)} disabled={selectedReports.length === 0}>
                    Delete Selected
                  </Button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px]">
                <thead className="bg-[var(--color-surface-muted)] text-xs uppercase tracking-[0.12em] text-[var(--color-muted)]">
                  <tr>
                    <th className="px-5 py-4 text-left">
                      <input type="checkbox" checked={allVisibleSelected} onChange={toggleVisibleSelection} aria-label="Select all visible reports" />
                    </th>
                    <SortableHeader label="Report" column="file_name" sortConfig={sortConfig} onSort={changeSort} />
                    <SortableHeader label="Machine" column="machine_number" sortConfig={sortConfig} onSort={changeSort} />
                    <SortableHeader label="Service" column="service_type" sortConfig={sortConfig} onSort={changeSort} />
                    <SortableHeader label="Created" column="created_at" sortConfig={sortConfig} onSort={changeSort} />
                    <th className="px-5 py-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="border-t border-[var(--color-border)] transition hover:bg-[var(--color-brand-soft)]">
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={selectedReportIds.includes(String(report.id))}
                          onChange={() => toggleReportSelection(report.id)}
                          aria-label={`Select ${report.file_name}`}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-[var(--color-ink)]">{report.file_name}</div>
                        {report.report_no && <div className="mt-1 font-mono text-xs text-[var(--color-muted)]">{report.report_no}</div>}
                      </td>
                      <td className="px-5 py-4 text-[var(--color-ink-soft)]">
                        {report.machine_type} {report.machine_number}
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone="yellow">{report.service_type || 'Report'}</Badge>
                      </td>
                      <td className="px-5 py-4 text-[var(--color-ink-soft)]">
                        {new Date(report.created_at).toLocaleString()}
                      </td>
                      <td className="flex gap-2 px-5 py-4">
                        <a
                          href={report.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="ds-button ds-button-primary"
                        >
                          Download
                        </a>
                        <Button variant="secondary" onClick={() => openRename(report)}>
                          Rename
                        </Button>
                        <Button variant="danger" onClick={() => setReportToDelete(report)}>
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {reportToDelete && (
        <ConfirmDialog
          title="Delete report?"
          description={`This will remove "${reportToDelete.file_name}" from the archive and storage bucket.`}
          confirmLabel="Delete Report"
          onCancel={() => setReportToDelete(null)}
          onConfirm={handleDeleteReport}
        />
      )}

      {bulkDeleteOpen && (
        <ConfirmDialog
          title="Delete selected reports?"
          description={`This will remove ${selectedReports.length} selected reports from your archive and storage bucket.`}
          confirmLabel="Delete Selected"
          onCancel={() => setBulkDeleteOpen(false)}
          onConfirm={handleBulkDeleteReports}
        />
      )}

      {renamingReport && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(7,27,51,0.62)] p-4 backdrop-blur-sm">
          <form onSubmit={handleRenameReport} className="ds-card w-full max-w-md p-6 shadow-[var(--shadow-overlay)]">
            <h2 className="text-xl font-black text-[var(--color-ink)]">Rename Report</h2>
            <p className="mt-2 text-sm font-semibold text-[var(--color-muted)]">Use a clear operational file name for this report.</p>
            <input
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              className="ds-input mt-5 w-full"
              autoFocus
            />
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setRenamingReport(null)}>Cancel</Button>
              <Button type="submit">Save Name</Button>
            </div>
          </form>
        </div>
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </SystemShell>
  );
}

function ArchiveMetric({ label, value, code, accent = false }) {
  return (
    <article className="ds-kpi-card">
      <div className={`ds-icon-tile ${accent ? 'ds-icon-tile-accent' : ''}`}>{code}</div>
      <div>
        <div className="text-xs font-black uppercase tracking-[0.14em] text-[var(--color-muted)]">{label}</div>
        <div className="mt-2 text-2xl font-black text-[var(--color-ink)]">{value}</div>
      </div>
    </article>
  );
}

function SortableHeader({ label, column, sortConfig, onSort }) {
  const active = sortConfig.key === column;
  const indicator = active ? (sortConfig.direction === 'asc' ? 'ASC' : 'DESC') : '';

  return (
    <th className="px-5 py-4 text-left">
      <button
        type="button"
        onClick={() => onSort(column)}
        className="inline-flex items-center gap-1 font-bold text-[var(--color-muted)] transition hover:text-[var(--color-ink)]"
      >
        {label} {indicator}
      </button>
    </th>
  );
}
