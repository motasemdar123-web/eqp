'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '../../components/AppShell';
import DatesModal from '../../components/DatesModal';
import LoadingOverlay from '../../components/LoadingOverlay';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Field from '../../components/ui/Field';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import Toast from '../../components/ui/Toast';
import { getStoredUser, clearStoredUser } from '../../lib/auth';
import { generateReports, getMachineHistory, getMachines } from '../../lib/api';
import { MACHINE_MODELS, REPORT_TYPES, SERVICE_TYPES } from '../../lib/reportOptions';

export default function DashboardPage() {
  const router = useRouter();
  const [activePage, setActivePage] = useState('dashboard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportCount, setReportCount] = useState('');
  const [showDatesModal, setShowDatesModal] = useState(false);
  const [reportDates, setReportDates] = useState([]);
  const [machineHistory, setMachineHistory] = useState([]);
  const [machines, setMachines] = useState([]);
  const [selectedMachines, setSelectedMachines] = useState([]);
  const [user] = useState(() => getStoredUser());
  const userCode = user?.userNumber || '';
  const [machineModel, setMachineModel] = useState('D155A');
  const [reportType, setReportType] = useState('W30');
  const [serviceType, setServiceType] = useState('1st Service');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterEngineer, setFilterEngineer] = useState('ALL');
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'machine_number', direction: 'asc' });
  const [toast, setToast] = useState(null);
  const [generationSummary, setGenerationSummary] = useState(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setError('');
      setLoading(true);

      const [machinesResponse, historyResponse] = await Promise.all([
        getMachines(),
        getMachineHistory(),
      ]);

      setMachines(machinesResponse.machines || []);
      setMachineHistory(historyResponse.history || []);
    } catch (loadError) {
      setError(loadError.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.sessionToken) {
      clearStoredUser();
      router.push('/');
      return;
    }

    const loadTimer = setTimeout(() => {
      loadDashboardData();
    }, 0);

    return () => clearTimeout(loadTimer);
  }, [router, loadDashboardData, user]);

  const machineTypes = useMemo(
    () => [...new Set(machines.map((machine) => machine.machine_type).filter(Boolean))],
    [machines]
  );

  const engineers = useMemo(
    () => [...new Set(machines.map((machine) => machine.responsible_engineer).filter(Boolean))],
    [machines]
  );

  const filteredMachines = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filtered = machines.filter((machine) => {
      const matchesSearch =
        !normalizedSearch ||
        machine.machine_number?.toString().toLowerCase().includes(normalizedSearch) ||
        machine.engine_number?.toString().toLowerCase().includes(normalizedSearch) ||
        machine.machine_type?.toString().toLowerCase().includes(normalizedSearch);
      const matchesType = filterType === 'ALL' || machine.machine_type === filterType;
      const matchesEngineer =
        filterEngineer === 'ALL' || machine.responsible_engineer === filterEngineer;
      const matchesSelected = !showOnlySelected || selectedMachines.includes(machine.id);

      return matchesSearch && matchesType && matchesEngineer && matchesSelected;
    });

    return [...filtered].sort((a, b) => {
      const aValue = a[sortConfig.key] ?? '';
      const bValue = b[sortConfig.key] ?? '';

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return sortConfig.direction === 'asc'
        ? String(aValue).localeCompare(String(bValue), undefined, { numeric: true })
        : String(bValue).localeCompare(String(aValue), undefined, { numeric: true });
    });
  }, [machines, searchTerm, filterType, filterEngineer, showOnlySelected, selectedMachines, sortConfig]);

  const fleetInsights = useMemo(() => {
    const averageSmr =
      machines.length === 0
        ? 0
        : Math.round(
            machines.reduce((total, machine) => total + Number(machine.last_smr || 0), 0) /
              machines.length
          );
    const activeTypes = machineTypes.length;
    const latestOperation = machineHistory[0]?.operation_date
      ? new Date(machineHistory[0].operation_date).toLocaleDateString()
      : 'No activity';

    return { averageSmr, activeTypes, latestOperation };
  }, [machines, machineHistory, machineTypes]);

  function handleNavigate(page) {
    if (page === 'reports') {
      router.push('/eqp/reports');
      return;
    }

    setActivePage(page);
  }

  function logout() {
    clearStoredUser();
    router.push('/');
  }

  function toggleMachine(machineId) {
    setSelectedMachines((previous) => {
      if (previous.includes(machineId)) {
        return previous.filter((id) => id !== machineId);
      }

      return [...previous, machineId];
    });
  }

  function toggleSelectAll() {
    const filteredIds = filteredMachines.map((machine) => machine.id);
    const allFilteredSelected =
      filteredIds.length > 0 && filteredIds.every((id) => selectedMachines.includes(id));

    if (allFilteredSelected) {
      setSelectedMachines((previous) => previous.filter((id) => !filteredIds.includes(id)));
      return;
    }

    setSelectedMachines((previous) => [...new Set([...previous, ...filteredIds])]);
  }

  function clearSelection() {
    setSelectedMachines([]);
  }

  function resetFilters() {
    setSearchTerm('');
    setFilterType('ALL');
    setFilterEngineer('ALL');
    setShowOnlySelected(false);
  }

  function changeSort(key) {
    setSortConfig((previous) => ({
      key,
      direction: previous.key === key && previous.direction === 'asc' ? 'desc' : 'asc',
    }));
  }

  function openDatesModal() {
    setError('');

    if (selectedMachines.length === 0) {
      setError('Please select at least one machine');
      setToast({ type: 'error', message: 'Select at least one machine before generating reports.' });
      return;
    }

    const count = Number(reportCount);

    if (!Number.isInteger(count) || count <= 0 || count > 12) {
      setError('Reports count must be between 1 and 12');
      setToast({ type: 'error', message: 'Reports count must be between 1 and 12.' });
      return;
    }

    setReportDates(Array(count).fill(''));
    setShowDatesModal(true);
  }

  function updateReportDate(index, value) {
    setReportDates((previous) => {
      const updated = [...previous];
      updated[index] = value;
      return updated;
    });
  }

  async function submitMultipleReports() {
    if (reportDates.some((date) => !date)) {
      setError('Please fill all report dates');
      setToast({ type: 'error', message: 'Please fill all report dates.' });
      return;
    }

    try {
      setError('');
      setIsGenerating(true);

      const data = await generateReports({
        userNumber: Number(userCode),
        machineModel,
        reportType,
        serviceType,
        selectedMachines,
        reportDates,
      });

      setGenerationSummary(data);
      setToast({ type: 'success', message: `Generated ${data.generatedFiles.length} PDF reports successfully.` });
      setShowDatesModal(false);
      setSelectedMachines([]);
      await loadDashboardData();
    } catch (generateError) {
      setError(generateError.message || 'Something went wrong');
      setToast({ type: 'error', message: generateError.message || 'Something went wrong.' });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <AppShell activePage={activePage} onNavigate={handleNavigate} onLogout={logout} userCode={userCode}>
      <div className="grid gap-6">
        {error && (
          <p className="ds-alert ds-alert-error mb-5">
            {error}
          </p>
        )}

        {activePage === 'dashboard' ? (
          <DashboardContent
            loading={loading}
            machineModel={machineModel}
            setMachineModel={setMachineModel}
            reportType={reportType}
            setReportType={setReportType}
            serviceType={serviceType}
            setServiceType={setServiceType}
            reportCount={reportCount}
            setReportCount={setReportCount}
            openDatesModal={openDatesModal}
            machines={machines}
            filteredMachines={filteredMachines}
            selectedMachines={selectedMachines}
            toggleMachine={toggleMachine}
            toggleSelectAll={toggleSelectAll}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterType={filterType}
            setFilterType={setFilterType}
            filterEngineer={filterEngineer}
            setFilterEngineer={setFilterEngineer}
            machineTypes={machineTypes}
            engineers={engineers}
            showOnlySelected={showOnlySelected}
            setShowOnlySelected={setShowOnlySelected}
            sortConfig={sortConfig}
            changeSort={changeSort}
            clearSelection={clearSelection}
            resetFilters={resetFilters}
            fleetInsights={fleetInsights}
            generationSummary={generationSummary}
          />
        ) : (
          <MachineHistory history={machineHistory} />
        )}
      </div>

      {showDatesModal && (
        <DatesModal
          dates={reportDates}
          onChange={updateReportDate}
          onCancel={() => setShowDatesModal(false)}
          onSubmit={submitMultipleReports}
          disabled={isGenerating}
        />
      )}

      {isGenerating && (
        <LoadingOverlay title="Generating PDF Reports..." description="Preparing workbooks, exporting PDFs, and updating machine counters" />
      )}

      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </AppShell>
  );
}

function DashboardContent(props) {
  return (
    <div className="grid gap-6">
      <div className="ds-kpi-grid">
        <Metric label="Machines" value={props.machines.length} unit="Fleet records" detail="Available for reports" code="FM" status="Active" tone="active" />
        <Metric label="Average SMR" value={props.fleetInsights.averageSmr} unit="Counter average" detail="Across loaded fleet" code="SM" status="Live" tone="live" accent />
        <Metric label="Types" value={props.fleetInsights.activeTypes} unit="Machine types" detail="Report filters" code="TY" status="Ready" tone="ready" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--color-accent-hover)]">Report Builder</p>
            <h2 className="mt-2 text-2xl font-black text-[var(--color-ink)]">Generate PDF Reports</h2>
            <p className="mt-2 text-sm font-semibold text-[var(--color-muted)]">Create finalized PDF reports from EQP templates.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-5">
          <Field label="Machine Model">
            <select
              value={props.machineModel}
              onChange={(event) => props.setMachineModel(event.target.value)}
              className="ds-input"
            >
              {MACHINE_MODELS.map((model) => (
                <option key={model}>{model}</option>
              ))}
            </select>
          </Field>

          <Field label="Report Type">
            <select
              value={props.reportType}
              onChange={(event) => props.setReportType(event.target.value)}
              className="ds-input"
            >
              {REPORT_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </Field>

          <Field label="Service Type">
            <select
              value={props.serviceType}
              onChange={(event) => props.setServiceType(event.target.value)}
              className="ds-input"
            >
              {SERVICE_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </Field>

          <Field label="Reports Count">
            <input
              type="number"
              min="1"
              max="12"
              placeholder="1"
              value={props.reportCount}
              onChange={(event) => props.setReportCount(event.target.value)}
              className="ds-input"
            />
          </Field>

          <Button onClick={props.openDatesModal} className="w-full">
            Generate PDF Reports
          </Button>
        </div>

        <div className="mt-5 grid gap-3">
          <p className="rounded-xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm font-semibold text-[var(--color-muted)]">
            Up to 12 report dates can be generated in one run.
          </p>
          <div className="rounded-xl border border-[var(--color-border)] p-4">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--color-muted)]">Latest Activity</p>
            <p className="mt-2 text-sm font-semibold text-[var(--color-ink)]">{props.fleetInsights.latestOperation}</p>
          </div>
        </div>

        {props.generationSummary && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-bold text-emerald-800">
              {props.generationSummary.generatedFiles.length} PDF reports generated
            </p>
            <p className="mt-1 text-xs text-emerald-700">
              {props.generationSummary.totalMachines} machines were processed and exported as PDF.
            </p>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-[var(--color-border)] p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-[var(--color-ink)]">Fleet Machines</h2>
              <p className="mt-2 text-sm font-semibold text-[var(--color-muted)]">Live machines loaded from database</p>
            </div>
            <div className="rounded-xl bg-[var(--color-surface-muted)] px-3 py-2 text-sm font-black text-[var(--color-ink-soft)]">
              {props.selectedMachines.length} selected
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto]">
            <input
              type="text"
              placeholder="Search by machine, type, or engine"
              value={props.searchTerm}
              onChange={(event) => props.setSearchTerm(event.target.value)}
              className="ds-input"
            />

            <select
              value={props.filterType}
              onChange={(event) => props.setFilterType(event.target.value)}
              className="ds-input"
            >
              <option value="ALL">All Types</option>
              {props.machineTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>

            <select
              value={props.filterEngineer}
              onChange={(event) => props.setFilterEngineer(event.target.value)}
              className="ds-input"
            >
              <option value="ALL">All Engineers</option>
              {props.engineers.map((engineer) => (
                <option key={engineer}>{engineer}</option>
              ))}
            </select>

            <label className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-bold text-[var(--color-ink-soft)]">
              <input
                type="checkbox"
                checked={props.showOnlySelected}
                onChange={() => props.setShowOnlySelected(!props.showOnlySelected)}
              />
              Show Selected Only
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{props.filteredMachines.length} visible</Badge>
            <Badge tone={props.selectedMachines.length > 0 ? 'yellow' : 'neutral'}>
              {props.selectedMachines.length} selected
            </Badge>
            <Button variant="ghost" onClick={props.resetFilters}>Reset Filters</Button>
            {props.selectedMachines.length > 0 && (
              <Button variant="secondary" onClick={props.clearSelection}>Clear Selection</Button>
            )}
          </div>
        </div>

        {props.loading ? (
          <div className="grid gap-3 p-6">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : props.filteredMachines.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No machines found" description="Try changing the filters or search term." />
          </div>
        ) : (
          <MachinesTable
            machines={props.filteredMachines}
            selectedMachines={props.selectedMachines}
            toggleMachine={props.toggleMachine}
            toggleSelectAll={props.toggleSelectAll}
            sortConfig={props.sortConfig}
            changeSort={props.changeSort}
          />
        )}
      </Card>
      </div>
    </div>
  );
}

function Metric({ label, value, unit, detail, code, status, tone = 'neutral', accent = false }) {
  return (
    <article className="ds-kpi-card">
      <div className={`ds-icon-tile ${accent ? 'ds-icon-tile-accent' : ''}`}>{code}</div>
      <div className="ds-kpi-content">
        <div className="ds-kpi-head">
          <p className="ds-kpi-label">{label}</p>
          <Badge tone={tone}>{status}</Badge>
        </div>
        <div>
          <p className="ds-kpi-main">{value}</p>
          <p className="ds-kpi-descriptor">{unit}</p>
          <p className="ds-kpi-secondary">{detail}</p>
        </div>
      </div>
    </article>
  );
}

function MachinesTable({ machines, selectedMachines, toggleMachine, toggleSelectAll, sortConfig, changeSort }) {
  const visibleIds = machines.map((machine) => machine.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedMachines.includes(id));

  return (
    <div className="overflow-x-auto">
      <table className="ds-table min-w-[820px]">
        <thead>
          <tr>
            <th className="px-5 py-4 text-left">
              <input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectAll} />
            </th>
            <SortableHeader label="Machine" column="machine_number" sortConfig={sortConfig} onSort={changeSort} />
            <SortableHeader label="Type" column="machine_type" sortConfig={sortConfig} onSort={changeSort} />
            <SortableHeader label="Engine" column="engine_number" sortConfig={sortConfig} onSort={changeSort} />
            <SortableHeader label="SMR" column="last_smr" sortConfig={sortConfig} onSort={changeSort} />
            <SortableHeader label="Step" column="smr_step" sortConfig={sortConfig} onSort={changeSort} />
          </tr>
        </thead>
        <tbody>
          {machines.map((machine) => (
            <tr key={machine.id} className="border-t border-[var(--color-border)] transition hover:bg-[var(--color-brand-soft)]">
              <td className="px-5 py-4">
                <input
                  type="checkbox"
                  checked={selectedMachines.includes(machine.id)}
                  onChange={() => toggleMachine(machine.id)}
                />
              </td>
              <td className="px-5 py-4 font-semibold text-[var(--color-ink)]">{machine.machine_number}</td>
              <td className="px-5 py-4 text-[var(--color-ink-soft)]">{machine.machine_type}</td>
              <td className="px-5 py-4 font-mono text-sm text-[var(--color-muted)]">{machine.engine_number}</td>
              <td className="px-5 py-4 text-[var(--color-ink-soft)]">{machine.last_smr}</td>
              <td className="px-5 py-4 text-[var(--color-ink-soft)]">{machine.smr_step}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
        className="ds-sort-button"
      >
        {label} {indicator}
      </button>
    </th>
  );
}

function MachineHistory({ history }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-[var(--color-border)] p-6">
        <h2 className="text-2xl font-black text-[var(--color-ink)]">Machine History</h2>
        <p className="mt-2 text-sm font-semibold text-[var(--color-muted)]">Fleet operations and service timeline</p>
      </div>

      {history.length === 0 ? (
        <div className="p-6">
          <EmptyState title="No history yet" description="Machine activity will appear after report generation." />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="ds-table min-w-[900px]">
            <thead>
              <tr>
                <th className="px-5 py-4 text-left">Machine</th>
                <th className="px-5 py-4 text-left">Operation</th>
                <th className="px-5 py-4 text-left">Report</th>
                <th className="px-5 py-4 text-left">Service</th>
                <th className="px-5 py-4 text-left">SMR</th>
                <th className="px-5 py-4 text-left">Engineer</th>
                <th className="px-5 py-4 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, index) => (
                <tr key={`${item.machine_id}-${item.created_at}-${index}`} className="border-t border-[var(--color-border)] transition hover:bg-[var(--color-brand-soft)]">
                  <td className="px-5 py-4 font-semibold text-[var(--color-ink)]">
                    {item.machine_type} {item.machine_number}
                  </td>
                  <td className="px-5 py-4 text-[var(--color-ink-soft)]">{item.operation_type}</td>
                  <td className="px-5 py-4 text-[var(--color-ink-soft)]">{item.report_type}</td>
                  <td className="px-5 py-4 text-[var(--color-ink-soft)]">{item.service_type}</td>
                  <td className="px-5 py-4 text-[var(--color-ink-soft)]">{item.smr}</td>
                  <td className="px-5 py-4 text-[var(--color-ink-soft)]">{item.performed_by}</td>
                  <td className="px-5 py-4 text-[var(--color-ink-soft)]">
                    {new Date(item.operation_date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
