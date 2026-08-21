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
import { generateReports, getMachineHistory, getMachines, getReportProfile } from '../../lib/api';
import { MACHINE_MODELS, REPORT_TYPES, SERVICE_TYPES, getRequiredReportType } from '../../lib/reportOptions';

export default function DashboardPage() {
  const router = useRouter();
  const [activePage, setActivePage] = useState('dashboard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportCount, setReportCount] = useState('1');
  const [showDatesModal, setShowDatesModal] = useState(false);
  const [reportDates, setReportDates] = useState([]);
  const [machineHistory, setMachineHistory] = useState([]);
  const [machines, setMachines] = useState([]);
  const [selectedMachines, setSelectedMachines] = useState([]);
  const [user] = useState(() => getStoredUser());
  const [reportProfile, setReportProfile] = useState(null);
  const userCode = reportProfile?.reportMaker?.userNumber || user?.userNumber || '';
  const [machineModel, setMachineModel] = useState('AUTO');
  const [reportType, setReportType] = useState('W30');
  const [serviceType, setServiceType] = useState('1st Service');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterEngineer, setFilterEngineer] = useState('ALL');
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'machine_number', direction: 'asc' });
  const [toast, setToast] = useState(null);
  const [generationSummary, setGenerationSummary] = useState(null);
  const requiredReportType = getRequiredReportType(serviceType);
  const effectiveReportType = requiredReportType || reportType;

  const loadDashboardData = useCallback(async () => {
    try {
      setError('');
      setLoading(true);

      const [machinesResponse, historyResponse, profileResponse] = await Promise.all([
        getMachines(),
        getMachineHistory(),
        getReportProfile(),
      ]);

      setMachines(machinesResponse.machines || []);
      setMachineHistory(historyResponse.history || []);
      setReportProfile(profileResponse);
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
        machine.machine_type?.toString().toLowerCase().includes(normalizedSearch) ||
        machine.customer_name?.toString().toLowerCase().includes(normalizedSearch) ||
        machine.location?.toString().toLowerCase().includes(normalizedSearch);
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

  function changeServiceType(nextServiceType) {
    setServiceType(nextServiceType);

    const nextRequiredReportType = getRequiredReportType(nextServiceType);
    if (nextRequiredReportType) {
      setReportType(nextRequiredReportType);
    }
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

    if (!reportProfile?.signatureAvailable) {
      const makerName = reportProfile?.reportMaker?.fullName || 'this user';
      const message = `No certified digital signature is registered for ${makerName}.`;
      setError(message);
      setToast({ type: 'error', message });
      return;
    }

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
        machineModel,
        reportType: effectiveReportType,
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
      <div className="space-y-6">
        {error && (
          <div className="ds-alert ds-alert-error">
            <span>{error}</span>
          </div>
        )}

        {activePage === 'dashboard' ? (
          <DashboardContent
            loading={loading}
            machineModel={machineModel}
            setMachineModel={setMachineModel}
            reportType={effectiveReportType}
            setReportType={setReportType}
            requiredReportType={requiredReportType}
            serviceType={serviceType}
            setServiceType={changeServiceType}
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
            reportProfile={reportProfile}
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
        <LoadingOverlay title="Generating PDF Reports..." description="Processing EQP workbooks, compiling PDFs, and updating machine counters." />
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
  const reportTypes = props.requiredReportType
    ? [props.requiredReportType]
    : REPORT_TYPES.filter((type) => type !== 'W41X');

  return (
    <div className="space-y-6">
      {/* KPI Metrics */}
      <div className="ds-kpi-grid">
        <article className="ds-kpi-card">
          <div className="ds-icon-tile">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div className="ds-kpi-content">
            <div className="ds-kpi-head">
              <p className="ds-kpi-label">Fleet Size</p>
              <Badge tone="active">Active</Badge>
            </div>
            <p className="ds-kpi-main">{props.machines.length}</p>
            <p className="ds-kpi-descriptor">Available Assets</p>
          </div>
        </article>

        <article className="ds-kpi-card">
          <div className="ds-icon-tile ds-icon-tile-accent">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="ds-kpi-content">
            <div className="ds-kpi-head">
              <p className="ds-kpi-label">Average SMR</p>
              <Badge tone="live">Live</Badge>
            </div>
            <p className="ds-kpi-main">{props.fleetInsights.averageSmr}</p>
            <p className="ds-kpi-descriptor">Fleet Hours</p>
          </div>
        </article>

        <article className="ds-kpi-card">
          <div className="ds-icon-tile">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </div>
          <div className="ds-kpi-content">
            <div className="ds-kpi-head">
              <p className="ds-kpi-label">Machine Types</p>
              <Badge tone="ready">Ready</Badge>
            </div>
            <p className="ds-kpi-main">{props.fleetInsights.activeTypes}</p>
            <p className="ds-kpi-descriptor">Supported Models</p>
          </div>
        </article>
      </div>

      {/* Main Grid: Form Left, Table Right */}
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card className="p-6 h-fit space-y-5">
          <div className="pb-3 border-b border-slate-100">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">EQP Configuration</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">Generate PDF Reports</h2>
            <p className="mt-1 text-xs text-slate-500">Create finalized preventive maintenance PDFs from EQP master workbooks.</p>
          </div>

          {/* Signature Alert */}
          <div className={`ds-alert ${props.reportProfile?.signatureAvailable ? 'ds-alert-success' : 'ds-alert-error'}`}>
            <div className="flex items-center justify-between gap-3 w-full">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase text-slate-500">Certified Maker</p>
                <p className="font-bold text-sm text-slate-900 truncate">
                  {props.reportProfile?.reportMaker?.fullName || 'Checking signature...'}
                </p>
              </div>
              <Badge tone={props.reportProfile?.signatureAvailable ? 'active' : 'critical'}>
                {props.reportProfile?.signatureAvailable ? 'Signed' : 'No Signature'}
              </Badge>
            </div>
          </div>

          <Field label="Machine Model Format">
            <select
              value={props.machineModel}
              onChange={(event) => props.setMachineModel(event.target.value)}
              className="ds-input"
            >
              {MACHINE_MODELS.map((model) => (
                <option key={model.value} value={model.value}>{model.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Service Interval Type">
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

          <Field label="Report Code Variant">
            <select
              value={props.reportType}
              onChange={(event) => props.setReportType(event.target.value)}
              disabled={Boolean(props.requiredReportType)}
              className="ds-input"
            >
              {reportTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </Field>

          <Field label="Number of Service Runs (1–12)">
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

          <Button
            onClick={props.openDatesModal}
            disabled={props.loading || !props.reportProfile?.signatureAvailable}
            fullWidth
            className="mt-2"
          >
            Configure Report Dates & Run
          </Button>

          {props.generationSummary && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs">
              <p className="font-bold text-emerald-800">
                ✓ {props.generationSummary.generatedFiles.length} Reports Generated
              </p>
              <p className="mt-0.5 text-emerald-700">
                Processed for {props.generationSummary.totalMachines} machines by {props.generationSummary.reportMaker?.fullName}.
              </p>
            </div>
          )}
        </Card>

        {/* Fleet Machines Table Card */}
        <Card className="overflow-hidden">
          <div className="border-b border-slate-200 p-5 bg-slate-50/60">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Fleet Equipment Selection</h2>
                <p className="text-xs text-slate-500">Select machines to include in this report generation run</p>
              </div>
              <Badge tone={props.selectedMachines.length > 0 ? 'yellow' : 'neutral'}>
                {props.selectedMachines.length} Selected
              </Badge>
            </div>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-[1.4fr_1fr_1fr_auto]">
              <input
                type="text"
                placeholder="Search machine, type, or engine..."
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

              <label className="ds-check-row border border-slate-200 bg-white px-3 py-1.5 rounded-[6px]">
                <input
                  type="checkbox"
                  checked={props.showOnlySelected}
                  onChange={() => props.setShowOnlySelected(!props.showOnlySelected)}
                />
                <span className="text-xs font-semibold text-slate-700">Selected Only</span>
              </label>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/60">
              <span>Showing {props.filteredMachines.length} of {props.machines.length} fleet machines</span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={props.resetFilters}>Reset</Button>
                {props.selectedMachines.length > 0 && (
                  <Button variant="secondary" size="sm" onClick={props.clearSelection}>Clear Selection</Button>
                )}
              </div>
            </div>
          </div>

          {props.loading ? (
            <div className="grid gap-3 p-6">
              <Skeleton className="h-12 rounded-lg" />
              <Skeleton className="h-12 rounded-lg" />
              <Skeleton className="h-12 rounded-lg" />
            </div>
          ) : props.filteredMachines.length === 0 ? (
            <div className="p-8">
              <EmptyState title="No fleet machines match filters" description="Try clearing filters or search query." />
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

function MachinesTable({ machines, selectedMachines, toggleMachine, toggleSelectAll, sortConfig, changeSort }) {
  const visibleIds = machines.map((machine) => machine.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedMachines.includes(id));

  return (
    <div className="ds-table-wrap">
      <table className="ds-table">
        <thead>
          <tr>
            <th className="w-10">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleSelectAll}
                className="rounded accent-amber-500"
              />
            </th>
            <SortableHeader label="Machine" column="machine_number" sortConfig={sortConfig} onSort={changeSort} />
            <SortableHeader label="Type" column="machine_type" sortConfig={sortConfig} onSort={changeSort} />
            <SortableHeader label="Customer" column="customer_name" sortConfig={sortConfig} onSort={changeSort} />
            <SortableHeader label="Location" column="location" sortConfig={sortConfig} onSort={changeSort} />
            <SortableHeader label="Engine No." column="engine_number" sortConfig={sortConfig} onSort={changeSort} />
            <SortableHeader label="SMR Hours" column="last_smr" sortConfig={sortConfig} onSort={changeSort} />
            <SortableHeader label="Step" column="smr_step" sortConfig={sortConfig} onSort={changeSort} />
          </tr>
        </thead>
        <tbody>
          {machines.map((machine) => {
            const isSelected = selectedMachines.includes(machine.id);
            return (
              <tr
                key={machine.id}
                onClick={() => toggleMachine(machine.id)}
                className={`cursor-pointer ${isSelected ? '!bg-amber-50/60' : ''}`}
              >
                <td onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleMachine(machine.id)}
                    className="rounded accent-amber-500"
                  />
                </td>
                <td className="font-bold text-slate-900">{machine.machine_number}</td>
                <td className="text-slate-700 font-medium">{machine.machine_type}</td>
                <td className="text-slate-600 max-w-[200px] truncate">{machine.customer_name || '-'}</td>
                <td className="text-slate-600">{machine.location || '-'}</td>
                <td className="font-mono text-xs text-slate-500">{machine.engine_number}</td>
                <td className="font-semibold text-slate-900">{machine.last_smr}</td>
                <td className="text-slate-600">{machine.smr_step}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
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

function MachineHistory({ history }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-200 p-5 bg-slate-50/60">
        <h2 className="text-lg font-bold text-slate-900">Fleet Operations Timeline</h2>
        <p className="mt-0.5 text-xs text-slate-500">Historical record of all generated preventive maintenance runs</p>
      </div>

      {history.length === 0 ? (
        <div className="p-8">
          <EmptyState title="No machine operations recorded yet" description="History will populate after generating EQP reports." />
        </div>
      ) : (
        <div className="ds-table-wrap">
          <table className="ds-table">
            <thead>
              <tr>
                <th>Machine</th>
                <th>Operation</th>
                <th>Report Code</th>
                <th>Service Interval</th>
                <th>SMR Counter</th>
                <th>Engineer</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, index) => (
                <tr key={`${item.machine_id}-${item.created_at}-${index}`}>
                  <td className="font-bold text-slate-900">
                    {item.machine_type} {item.machine_number}
                  </td>
                  <td className="text-slate-700">{item.operation_type}</td>
                  <td><Badge tone="neutral">{item.report_type}</Badge></td>
                  <td className="text-slate-700">{item.service_type}</td>
                  <td className="font-semibold text-slate-900">{item.smr}</td>
                  <td className="text-slate-600">{item.performed_by}</td>
                  <td className="text-slate-500 text-xs">
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
