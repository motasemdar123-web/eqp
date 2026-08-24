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
import { getStoredUser, clearStoredUser, getMatchingEngineerName } from '../../lib/auth';
import { generateReports, getMachineHistory, getMachines, getReportProfile } from '../../lib/api';
import { MACHINE_MODELS, REPORT_TYPES, SERVICE_TYPES, getRequiredReportType } from '../../lib/reportOptions';
import MachineTimelineModal from '../../components/eqp/MachineTimelineModal';
import { FleetModelBarChart } from '../../components/eqp/EqpCharts';

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
  const [serviceType, setServiceType] = useState('Add Service');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterEngineer, setFilterEngineer] = useState('ALL');
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'machine_number', direction: 'asc' });
  const [toast, setToast] = useState(null);
  const [generationSummary, setGenerationSummary] = useState(null);
  const [timelineMachine, setTimelineMachine] = useState(null);

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

      const loadedMachines = machinesResponse.machines || [];
      setMachines(loadedMachines);
      setMachineHistory(historyResponse.history || []);
      setReportProfile(profileResponse);

      // Auto-filter by logged-in engineer by default on initial load
      const engList = [...new Set(loadedMachines.map((m) => m.responsible_engineer).filter(Boolean))];
      const matchedEng = getMatchingEngineerName(profileResponse?.reportMaker || user, engList);
      if (matchedEng !== 'ALL') {
        setFilterEngineer((prev) => (prev === 'ALL' ? matchedEng : prev));
      }
    } catch (loadError) {
      setError(loadError.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user]);

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
    () => [...new Set(machines.map((machine) => machine.responsible_engineer).filter(Boolean))].sort(),
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
            onInspectMachine={setTimelineMachine}
          />
        ) : (
          <MachineHistory history={machineHistory} />
        )}
      </div>

      {/* Report Dates Modal */}
      {showDatesModal && (
        <DatesModal
          dates={reportDates}
          onChange={updateReportDate}
          onCancel={() => setShowDatesModal(false)}
          onSubmit={submitMultipleReports}
          disabled={isGenerating}
        />
      )}

      {/* Machine Timeline Modal Drilldown */}
      {timelineMachine && (
        <MachineTimelineModal
          machine={timelineMachine}
          onClose={() => setTimelineMachine(null)}
          onSelectForReport={(m) => {
            if (!selectedMachines.includes(m.id)) {
              setSelectedMachines((prev) => [...prev, m.id]);
            }
          }}
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

  const popularServices = [
    { label: 'Add Service', code: 'W41X', tag: 'Extra PM' },
    { label: 'Storage Service', code: 'W30', tag: 'Monthly' },
    { label: '1st Service', code: 'W411', tag: '250h' },
    { label: '2nd Service', code: 'W412', tag: '500h' },
    { label: '3rd Service', code: 'W413', tag: '1000h' },
    { label: 'Pre Delivery', code: 'W41P', tag: 'PDI' },
  ];

  return (
    <div className="space-y-6">
      {/* Visual Service Preset Selector Panel */}
      <Card className="p-5 border-amber-500/20 bg-gradient-to-r from-amber-50/40 via-white to-amber-50/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white font-extrabold text-xs">STEP 1</span>
              <h2 className="text-base font-bold text-slate-900">Service Interval & Report Presets</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">Select the target preventive maintenance cycle to automatically resolve report templates</p>
          </div>

          {/* Maker & Signature Status */}
          <div className="flex items-center gap-3 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div className="text-left">
              <p className="text-[10px] uppercase font-bold text-slate-400">Certified Inspector</p>
              <p className="text-xs font-bold text-slate-800 truncate">
                {props.reportProfile?.reportMaker?.fullName || 'Active Engineer'}
              </p>
            </div>
            <Badge tone={props.reportProfile?.signatureAvailable ? 'ready' : 'critical'}>
              {props.reportProfile?.signatureAvailable ? 'Signed' : 'No Signature'}
            </Badge>
          </div>
        </div>

        {/* Service Type Pills */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Choose Service Stage:</span>
            <span className="text-[11px] text-amber-700 font-mono font-bold">Effective Code: {props.reportType}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {popularServices.map((srv) => {
              const isSelected = props.serviceType.toLowerCase() === srv.label.toLowerCase();
              return (
                <button
                  key={srv.label}
                  type="button"
                  onClick={() => props.setServiceType(srv.label)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-sm ring-2 ring-amber-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${isSelected ? 'bg-black/15 text-slate-950' : 'bg-slate-100 text-slate-600'}`}>
                      {srv.code}
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold">{srv.tag}</span>
                  </div>
                  <p className={`text-xs font-bold mt-1.5 truncate ${isSelected ? 'text-slate-950' : 'text-slate-800'}`}>
                    {srv.label}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Model Format & Run Count Bar */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-100">
            <div>
              <label className="text-[11px] font-bold text-slate-600 mb-1 block">Machine Model Format</label>
              <select
                value={props.machineModel}
                onChange={(event) => props.setMachineModel(event.target.value)}
                className="ds-input text-xs"
              >
                {MACHINE_MODELS.map((model) => (
                  <option key={model.value} value={model.value}>{model.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 mb-1 block">Report Code Variant</label>
              <select
                value={props.reportType}
                onChange={(event) => props.setReportType(event.target.value)}
                disabled={Boolean(props.requiredReportType)}
                className="ds-input text-xs"
              >
                {reportTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 mb-1 block">Number of Service Runs (1–12)</label>
              <input
                type="number"
                min="1"
                max="12"
                value={props.reportCount}
                onChange={(event) => props.setReportCount(event.target.value)}
                className="ds-input text-xs"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Fleet Equipment Selection Card */}
      <Card className="overflow-hidden">
        {/* Step 2 Header */}
        <div className="border-b border-slate-200 p-5 bg-slate-50/70 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-extrabold text-xs">STEP 2</span>
                <h2 className="text-base font-bold text-slate-900">Fleet Equipment Selection</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Select machines to batch process for this inspection run</p>
            </div>

            <div className="flex items-center gap-2">
              <Badge tone={props.selectedMachines.length > 0 ? 'yellow' : 'neutral'}>
                {props.selectedMachines.length} Selected
              </Badge>
              {props.selectedMachines.length > 0 && (
                <Button variant="secondary" size="sm" onClick={props.clearSelection}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Engineer Tabs Strip */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/60">
            <span className="text-xs font-bold text-slate-500 mr-1">Engineer Fleet:</span>
            <button
              type="button"
              onClick={() => props.setFilterEngineer('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                props.filterEngineer === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Engineers ({props.machines.length})
            </button>

            {props.engineers.map((eng) => {
              const count = props.machines.filter((m) => m.responsible_engineer === eng).length;
              const isSelected = props.filterEngineer === eng;
              return (
                <button
                  key={eng}
                  type="button"
                  onClick={() => props.setFilterEngineer(eng)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {eng} ({count})
                </button>
              );
            })}
          </div>

          {/* Search & Model Filters Bar */}
          <div className="grid gap-2.5 sm:grid-cols-[1.5fr_1fr_auto_auto]">
            <input
              type="text"
              placeholder="Search machine serial, customer, or location..."
              value={props.searchTerm}
              onChange={(event) => props.setSearchTerm(event.target.value)}
              className="ds-input text-xs"
            />

            <select
              value={props.filterType}
              onChange={(event) => props.setFilterType(event.target.value)}
              className="ds-input text-xs"
            >
              <option value="ALL">All Machine Models</option>
              {props.machineTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={props.toggleSelectAll}
              className="whitespace-nowrap"
            >
              Select All Filtered ({props.filteredMachines.length})
            </Button>

            <label className="ds-check-row border border-slate-200 bg-white px-3 py-1.5 rounded-[6px] cursor-pointer">
              <input
                type="checkbox"
                checked={props.showOnlySelected}
                onChange={() => props.setShowOnlySelected(!props.showOnlySelected)}
              />
              <span className="text-xs font-semibold text-slate-700">Selected Only</span>
            </label>
          </div>
        </div>

        {/* Machines Table */}
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
          <div className="ds-table-wrap">
            <table className="ds-table">
              <thead>
                <tr>
                  <th className="w-10">
                    <input
                      type="checkbox"
                      checked={
                        props.filteredMachines.length > 0 &&
                        props.filteredMachines.every((m) => props.selectedMachines.includes(m.id))
                      }
                      onChange={props.toggleSelectAll}
                      className="rounded accent-amber-500"
                    />
                  </th>
                  <SortableHeader label="Machine ID" column="machine_number" sortConfig={props.sortConfig} onSort={props.changeSort} />
                  <SortableHeader label="Model" column="machine_type" sortConfig={props.sortConfig} onSort={props.changeSort} />
                  <SortableHeader label="Operating SMR" column="last_smr" sortConfig={props.sortConfig} onSort={props.changeSort} />
                  <th>Next File Suffix</th>
                  <SortableHeader label="Engineer Lead" column="responsible_engineer" sortConfig={props.sortConfig} onSort={props.changeSort} />
                  <SortableHeader label="Site Location" column="location" sortConfig={props.sortConfig} onSort={props.changeSort} />
                  <th className="text-right">Timeline</th>
                </tr>
              </thead>
              <tbody>
                {props.filteredMachines.map((machine) => {
                  const isSelected = props.selectedMachines.includes(machine.id);
                  const counter = Number(machine.report_counter || 0);
                  const nextSuffix = props.serviceType.toLowerCase().includes('add')
                    ? `Ex_${counter + 1}`
                    : `${props.reportType}-${counter + 1}`;

                  return (
                    <tr
                      key={machine.id}
                      onClick={() => props.toggleMachine(machine.id)}
                      className={`cursor-pointer transition-colors ${isSelected ? '!bg-amber-50/70 font-semibold' : 'hover:bg-slate-50/60'}`}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => props.toggleMachine(machine.id)}
                          className="rounded accent-amber-500"
                        />
                      </td>
                      <td className="font-extrabold text-slate-900">{machine.machine_number}</td>
                      <td>
                        <span className="font-bold text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                          {machine.machine_type}
                        </span>
                      </td>
                      <td>
                        <span className="font-bold text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {machine.last_smr} hrs
                        </span>
                      </td>
                      <td>
                        <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {nextSuffix}
                        </span>
                      </td>
                      <td className="text-xs text-slate-600">{machine.responsible_engineer || '—'}</td>
                      <td className="text-xs text-slate-500 truncate max-w-[160px]">{machine.location || '—'}</td>
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => props.onInspectMachine(machine)}
                          className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        >
                          🔍 History
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Sticky Action Footer */}
        <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold text-base">
              ⚡
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                {props.selectedMachines.length} Machine{props.selectedMachines.length === 1 ? '' : 's'} Selected
              </p>
              <p className="text-[11px] text-slate-400">
                Target: <span className="text-amber-400 font-semibold">{props.serviceType} ({props.reportType})</span> • Ready for compilation
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={props.openDatesModal}
            disabled={props.loading || props.selectedMachines.length === 0 || !props.reportProfile?.signatureAvailable}
            className="!bg-amber-500 hover:!bg-amber-400 !text-slate-950 !font-bold"
          >
            Configure Dates & Run Reports ({props.selectedMachines.length}) →
          </Button>
        </div>
      </Card>

      {/* Generation Summary Success Card */}
      {props.generationSummary && (
        <Card className="p-5 border-emerald-300 bg-emerald-50/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
                ✓
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-900">
                  Successfully Generated {props.generationSummary.generatedFiles.length} Reports
                </h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Processed for {props.generationSummary.totalMachines} machines by {props.generationSummary.reportMaker?.fullName}.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/eqp/reports')}
            >
              View in PDF Archive →
            </Button>
          </div>
        </Card>
      )}
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
