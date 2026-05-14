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
  const [renamingReport, setRenamingReport] = useState(null);
  const [renameValue, setRenameValue] = useState('');

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

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <ArchiveMetric label="Total Reports" value={archiveStats.total} tone="dark" />
          <ArchiveMetric label="Machines Covered" value={archiveStats.machines} />
          <ArchiveMetric label="Latest Report" value={archiveStats.lastReport} />
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-zinc-500">Loading...</p>
        ) : reports.length === 0 ? (
          <EmptyState title="No reports yet" description="Generated reports will appear here." />
        ) : (
          <Card className="overflow-hidden">
            <div className="border-b border-zinc-200 p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <input
                  type="text"
                  placeholder="Search reports, machines, or report numbers"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 lg:max-w-md"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="neutral">{filteredReports.length} visible</Badge>
                  <Button variant="ghost" onClick={() => setSearchTerm('')}>Clear Search</Button>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px]">
                <thead className="bg-zinc-50 text-xs uppercase tracking-[0.12em] text-zinc-500">
                  <tr>
                    <SortableHeader label="Report" column="file_name" sortConfig={sortConfig} onSort={changeSort} />
                    <SortableHeader label="Machine" column="machine_number" sortConfig={sortConfig} onSort={changeSort} />
                    <SortableHeader label="Service" column="service_type" sortConfig={sortConfig} onSort={changeSort} />
                    <SortableHeader label="Created" column="created_at" sortConfig={sortConfig} onSort={changeSort} />
                    <th className="px-5 py-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="border-t border-zinc-100 transition hover:bg-yellow-50/60">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-zinc-950">{report.file_name}</div>
                        {report.report_no && <div className="mt-1 font-mono text-xs text-zinc-500">{report.report_no}</div>}
                      </td>
                      <td className="px-5 py-4 text-zinc-600">
                        {report.machine_type} {report.machine_number}
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone="yellow">{report.service_type || 'Report'}</Badge>
                      </td>
                      <td className="px-5 py-4 text-zinc-600">
                        {new Date(report.created_at).toLocaleString()}
                      </td>
                      <td className="flex gap-2 px-5 py-4">
                        <a
                          href={report.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-yellow-300"
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

      {renamingReport && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/60 p-4 backdrop-blur-sm">
          <form onSubmit={handleRenameReport} className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-zinc-950">Rename Report</h2>
            <p className="mt-2 text-sm text-zinc-600">Use a clear operational file name for this report.</p>
            <input
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              className="mt-5 w-full rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
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

function ArchiveMetric({ label, value, tone = 'light' }) {
  return (
    <div className={`rounded-lg border p-4 shadow-sm ${tone === 'dark' ? 'border-zinc-900 bg-zinc-950 text-white' : 'border-zinc-200 bg-white text-zinc-900'}`}>
      <div className={`text-xs font-semibold uppercase tracking-[0.14em] ${tone === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{label}</div>
      <div className={`mt-2 text-2xl font-black ${tone === 'dark' ? 'text-yellow-400' : 'text-zinc-950'}`}>{value}</div>
    </div>
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
        className="inline-flex items-center gap-1 font-bold text-zinc-600 transition hover:text-zinc-950"
      >
        {label} {indicator}
      </button>
    </th>
  );
}
