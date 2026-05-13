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
import { REPORT_TYPES, SERVICE_TYPES } from '../../lib/reportOptions';

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
      router.push('/reports');
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
        reportType,
        serviceType,
        selectedMachines,
        reportDates,
      });

      setGenerationSummary(data);
      setToast({ type: 'success', message: `Generated ${data.generatedFiles.length} reports successfully.` });
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
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {error && (
          <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        {activePage === 'dashboard' ? (
          <DashboardContent
            loading={loading}
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
      </main>

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
        <LoadingOverlay title="Generating Reports..." description="Creating files and updating machine counters" />
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
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Fleet Machines" value={props.machines.length} tone="dark" />
        <Metric label="Average SMR" value={props.fleetInsights.averageSmr} />
        <Metric label="Machine Types" value={props.fleetInsights.activeTypes} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-yellow-700">Report Builder</p>
            <h2 className="mt-2 text-2xl font-bold text-zinc-950">Generate Reports</h2>
            <p className="mt-2 text-sm text-zinc-500">Choose template type, service, machines, and dates.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-5">
          <Field label="Report Type">
            <select
              value={props.reportType}
              onChange={(event) => props.setReportType(event.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
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
              className="rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
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
              className="rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
            />
          </Field>

          <Button onClick={props.openDatesModal} className="w-full">
            Generate Reports
          </Button>
        </div>

        <div className="mt-5 grid gap-3">
          <p className="rounded-md bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
            Up to 12 report dates can be generated in one run.
          </p>
          <div className="rounded-md border border-zinc-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Latest Activity</p>
            <p className="mt-2 text-sm font-semibold text-zinc-900">{props.fleetInsights.latestOperation}</p>
          </div>
        </div>

        {props.generationSummary && (
          <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-bold text-emerald-800">
              {props.generationSummary.generatedFiles.length} reports generated
            </p>
            <p className="mt-1 text-xs text-emerald-700">
              {props.generationSummary.totalMachines} machines were processed in the latest run.
            </p>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-zinc-200 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-zinc-950">Fleet Machines</h2>
              <p className="mt-2 text-sm text-zinc-500">Live machines loaded from database</p>
            </div>
            <div className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-700">
              {props.selectedMachines.length} selected
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto]">
            <input
              type="text"
              placeholder="Search by machine, type, or engine"
              value={props.searchTerm}
              onChange={(event) => props.setSearchTerm(event.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
            />

            <select
              value={props.filterType}
              onChange={(event) => props.setFilterType(event.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
            >
              <option value="ALL">All Types</option>
              {props.machineTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>

            <select
              value={props.filterEngineer}
              onChange={(event) => props.setFilterEngineer(event.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100"
            >
              <option value="ALL">All Engineers</option>
              {props.engineers.map((engineer) => (
                <option key={engineer}>{engineer}</option>
              ))}
            </select>

            <label className="flex items-center gap-3 rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700">
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

function Metric({ label, value, tone = 'light' }) {
  return (
    <div className={`rounded-lg border p-4 shadow-sm ${tone === 'dark' ? 'border-zinc-900 bg-zinc-950 text-white' : 'border-zinc-200 bg-white text-zinc-900'}`}>
      <div className={`text-xs font-semibold uppercase tracking-[0.14em] ${tone === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>{label}</div>
      <div className={`mt-2 text-3xl font-black ${tone === 'dark' ? 'text-yellow-400' : 'text-zinc-950'}`}>{value}</div>
    </div>
  );
}

function MachinesTable({ machines, selectedMachines, toggleMachine, toggleSelectAll, sortConfig, changeSort }) {
  const visibleIds = machines.map((machine) => machine.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedMachines.includes(id));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px]">
        <thead className="bg-zinc-50 text-xs uppercase tracking-[0.12em] text-zinc-500">
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
            <tr key={machine.id} className="border-t border-zinc-100 transition hover:bg-yellow-50/60">
              <td className="px-5 py-4">
                <input
                  type="checkbox"
                  checked={selectedMachines.includes(machine.id)}
                  onChange={() => toggleMachine(machine.id)}
                />
              </td>
              <td className="px-5 py-4 font-semibold text-zinc-950">{machine.machine_number}</td>
              <td className="px-5 py-4 text-zinc-600">{machine.machine_type}</td>
              <td className="px-5 py-4 font-mono text-sm text-zinc-600">{machine.engine_number}</td>
              <td className="px-5 py-4 text-zinc-700">{machine.last_smr}</td>
              <td className="px-5 py-4 text-zinc-700">{machine.smr_step}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SortableHeader({ label, column, sortConfig, onSort }) {
  const active = sortConfig.key === column;
  const indicator = active ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '';

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

function MachineHistory({ history }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-zinc-200 p-6">
        <h2 className="text-2xl font-bold text-zinc-950">Machine History</h2>
        <p className="mt-2 text-sm text-zinc-500">Fleet operations and service timeline</p>
      </div>

      {history.length === 0 ? (
        <div className="p-6">
          <EmptyState title="No history yet" description="Machine activity will appear after report generation." />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-zinc-50 text-xs uppercase tracking-[0.12em] text-zinc-500">
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
                <tr key={`${item.machine_id}-${item.created_at}-${index}`} className="border-t border-zinc-100 transition hover:bg-zinc-50">
                  <td className="px-5 py-4 font-semibold text-zinc-950">
                    {item.machine_type} {item.machine_number}
                  </td>
                  <td className="px-5 py-4 text-zinc-600">{item.operation_type}</td>
                  <td className="px-5 py-4 text-zinc-600">{item.report_type}</td>
                  <td className="px-5 py-4 text-zinc-600">{item.service_type}</td>
                  <td className="px-5 py-4 text-zinc-700">{item.smr}</td>
                  <td className="px-5 py-4 text-zinc-600">{item.performed_by}</td>
                  <td className="px-5 py-4 text-zinc-600">
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
