'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import SystemShell from '../../../components/SystemShell';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Input, { Select } from '../../../components/ui/Input';
import Field from '../../../components/ui/Field';
import PageHeader from '../../../components/ui/PageHeader';
import SectionHeader from '../../../components/ui/SectionHeader';
import EmptyState from '../../../components/ui/EmptyState';
import Toast from '../../../components/ui/Toast';
import EqpNav from '../../../components/eqp/EqpNav';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';

import { getStoredUser } from '../../../lib/auth';
import { generateReports, getMachines, getReports, getReportProfile } from '../../../lib/api';
import { REPORT_TYPES, SERVICE_TYPES, getRequiredReportType } from '../../../lib/reportOptions';
import { buildDynamicLifecycleRecords, formatLifecycleMonth } from '../../../lib/eqpLifecycleData';

function GapReportsStudio() {
  const searchParams = useSearchParams();
  const initialMachineParam = searchParams.get('machine') || '';
  const initialMonthParam = searchParams.get('month') || '';
  const initialServiceTypeParam = searchParams.get('serviceType') || '';

  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [machines, setMachines] = useState([]);
  const [reports, setReports] = useState([]);
  const [reportProfile, setReportProfile] = useState(null);
  const [toast, setToast] = useState(null);

  // Form State
  const [selectedMachineId, setSelectedMachineId] = useState(null);
  const [manualSmr, setManualSmr] = useState('');
  const [serviceDate, setServiceDate] = useState(() => {
    if (initialMonthParam) {
      return `${initialMonthParam}-15`;
    }
    return new Date().toISOString().slice(0, 10);
  });
  const [serviceType, setServiceType] = useState(initialServiceTypeParam || 'Add. Service');
  const [reportType, setReportType] = useState('W41X');
  const [reportCounter, setReportCounter] = useState('');
  const [autoUploadToEqp, setAutoUploadToEqp] = useState(false);
  const [generationSummary, setGenerationSummary] = useState(null);

  // Fleet Browser Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [onlyGapsFilter, setOnlyGapsFilter] = useState(false);

  const requiredReportType = getRequiredReportType(serviceType);
  const effectiveReportType = requiredReportType || reportType;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [machinesRes, reportsRes, profileRes] = await Promise.all([
        getMachines().catch(() => ({ machines: [] })),
        getReports().catch(() => []),
        getReportProfile().catch(() => null),
      ]);

      const loadedMachines = machinesRes.machines || [];
      setMachines(loadedMachines);
      setReports(reportsRes || []);
      setReportProfile(profileRes);

      // Auto-select machine from query param if available
      if (initialMachineParam && loadedMachines.length > 0) {
        const matched = loadedMachines.find(
          (m) => String(m.machine_number) === String(initialMachineParam)
        );
        if (matched) {
          setSelectedMachineId(matched.id);
        }
      } else if (!selectedMachineId && loadedMachines.length > 0) {
        setSelectedMachineId(loadedMachines[0].id);
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to load fleet data.' });
    } finally {
      setLoading(false);
    }
  }, [initialMachineParam, selectedMachineId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute lifecycle records to detect gaps
  const lifecycleRecords = useMemo(() => {
    return buildDynamicLifecycleRecords(reports, machines);
  }, [reports, machines]);

  // Map machineNumber -> lifecycle record
  const lifecycleMap = useMemo(() => {
    const map = new Map();
    for (const record of lifecycleRecords) {
      map.set(String(record.machineNumber), record);
    }
    return map;
  }, [lifecycleRecords]);

  // Currently selected machine object
  const selectedMachine = useMemo(() => {
    return machines.find((m) => m.id === selectedMachineId) || null;
  }, [machines, selectedMachineId]);

  // Gaps for currently selected machine
  const selectedMachineGaps = useMemo(() => {
    if (!selectedMachine) return [];
    const record = lifecycleMap.get(String(selectedMachine.machine_number));
    return record?.monthlyGaps || [];
  }, [selectedMachine, lifecycleMap]);

  // Filtered fleet list
  const filteredMachines = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return machines.filter((m) => {
      const matchesSearch =
        !query ||
        m.machine_number?.toString().toLowerCase().includes(query) ||
        m.engine_number?.toString().toLowerCase().includes(query) ||
        m.machine_type?.toString().toLowerCase().includes(query) ||
        m.customer_name?.toString().toLowerCase().includes(query);

      const matchesType = filterType === 'ALL' || m.machine_type === filterType;

      const record = lifecycleMap.get(String(m.machine_number));
      const hasGaps = (record?.monthlyGaps?.length || 0) > 0;
      const matchesGaps = !onlyGapsFilter || hasGaps;

      return matchesSearch && matchesType && matchesGaps;
    });
  }, [machines, searchTerm, filterType, onlyGapsFilter, lifecycleMap]);

  const machineTypes = useMemo(
    () => [...new Set(machines.map((m) => m.machine_type).filter(Boolean))],
    [machines]
  );

  // Quick fill from detected gap chip
  function applyGapSelection(gap) {
    setServiceDate(`${gap.month}-15`);
    setServiceType(gap.type || 'Add. Service');
    if (gap.code) {
      setReportType(gap.code);
    }
    setToast({
      type: 'info',
      message: `Pre-filled service date for ${formatLifecycleMonth(gap.month)}. Please enter the manual SMR below.`,
    });
  }

  // Live preview of generated file name
  const previewFileName = useMemo(() => {
    if (!selectedMachine) return 'Select a machine';
    const model = selectedMachine.machine_type;
    const number = selectedMachine.machine_number;
    const normalizedService = serviceType.toLowerCase().replace(/\./g, '').trim();

    let label = serviceType;
    if (normalizedService === 'add service') {
      label = `Ex_${reportCounter || '??'}`;
    } else if (normalizedService === 'storage service') {
      label = `${effectiveReportType}-${reportCounter || '1'}`;
    } else if (normalizedService === '1st service') {
      label = '1st';
    } else if (normalizedService === '2nd service') {
      label = '2nd';
    } else if (normalizedService === '3rd service') {
      label = '3rd';
    }

    return `${model} ${number} ${label}.pdf`;
  }, [selectedMachine, serviceType, effectiveReportType, reportCounter]);

  async function handleGenerateGapReport(e) {
    e.preventDefault();

    if (!reportProfile?.signatureAvailable) {
      const makerName = reportProfile?.reportMaker?.fullName || 'this user';
      setToast({ type: 'error', message: `No digital signature registered for ${makerName}.` });
      return;
    }

    if (!selectedMachine) {
      setToast({ type: 'error', message: 'Please select a machine from the fleet register.' });
      return;
    }

    if (manualSmr === '' || isNaN(Number(manualSmr)) || Number(manualSmr) < 0) {
      setToast({ type: 'error', message: 'Please enter a valid, non-negative manual SMR operating hour value.' });
      return;
    }

    if (!serviceDate) {
      setToast({ type: 'error', message: 'Please select a valid service date.' });
      return;
    }

    try {
      setIsGenerating(true);
      const data = await generateReports({
        machineModel: selectedMachine.machine_type,
        reportType: effectiveReportType,
        serviceType,
        selectedMachines: [selectedMachine.id],
        reportDates: [serviceDate],
        manualSmr: Number(manualSmr),
        reportCounter: reportCounter ? Number(reportCounter) : undefined,
        skipCounterUpdates: true, // Guarantees zero alteration of machine last_smr and report_counter
        autoUploadToEqp,
      });

      setGenerationSummary(data);
      setToast({
        type: 'success',
        message: `Successfully created gap report with SMR ${manualSmr} hrs without altering machine counters!`,
      });

      // Refresh reports to update lifecycle records
      const updatedReports = await getReports().catch(() => []);
      setReports(updatedReports);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Report generation failed.' });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <SystemShell
      activePath="/eqp/gap-reports"
      title="Gap Fill Reports"
      description="Generate retroactive service inspection reports to fill historical gaps with manual SMR override without altering live fleet meters."
    >
      <PageHeader
        title="Gap-Filling Report Studio"
        badge={
          <Badge tone="ready" size="sm" dot>
            Protected Mode • Live Counters Frozen
          </Badge>
        }
        description="Fill missing lifecycle gaps and historical inspection records. Live machine counters and hours are completely protected."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/eqp/lifecycle">
              <Button variant="secondary" size="sm">
                View Lifecycle Matrix →
              </Button>
            </Link>
            <Link href="/eqp/reports">
              <Button variant="secondary" size="sm">
                PDF Archive
              </Button>
            </Link>
          </div>
        }
      />

      <EqpNav />

      {/* Safety Notice Banner */}
      <Card className="p-4 bg-amber-500/10 border-amber-500/30 text-amber-950 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-xl shrink-0 mt-0.5">🛡️</span>
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-amber-900 text-sm">
              Zero Counter Impact Guarantee (Safe Mode Active)
            </h4>
            <p className="text-amber-800 leading-relaxed">
              Reports generated in this studio stamp your exact <strong>Manual SMR</strong> and chosen service date onto the certified inspection sheet and PDF, but <strong>will NOT update</strong> the machine’s live SMR (<code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900">last_smr</code>), step counter (<code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900">smr_step</code>), or consecutive report counter (<code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900">report_counter</code>) in the database.
            </p>
          </div>
        </div>
      </Card>

      {/* Success Notification */}
      {generationSummary && (
        <Card className="p-4 bg-emerald-50 border-emerald-200 text-emerald-950 mb-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-emerald-500 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-emerald-900">
                  Gap Report Generated Successfully!
                </h4>
                <p className="text-xs text-emerald-700">
                  Created {generationSummary.generatedFiles?.[0]?.file || 'inspection report'} with manual SMR <strong>{manualSmr} hrs</strong>.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {generationSummary.generatedFiles?.[0]?.fileUrl && (
                <a
                  href={generationSummary.generatedFiles[0].fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="primary" size="sm">
                    Open / Download PDF ↗
                  </Button>
                </a>
              )}
              <Link href="/eqp/reports">
                <Button variant="secondary" size="sm">
                  View in Archive
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Studio Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Overrides (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <Card className="p-5 space-y-4">
            <SectionHeader
              title="Gap Report Specifications"
              description="Enter the historical parameters for this missing report"
            />

            {/* Target Machine Summary Box */}
            {selectedMachine ? (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">
                    #{selectedMachine.machine_number} ({selectedMachine.machine_type})
                  </span>
                  <Badge tone="neutral" size="sm">
                    Live SMR: {selectedMachine.last_smr ?? 0} hrs
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Customer</span>
                    <span className="font-medium truncate block">{selectedMachine.customer_name || 'DAR AL HAI'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Engineer</span>
                    <span className="font-medium truncate block">{selectedMachine.responsible_engineer || 'Unassigned'}</span>
                  </div>
                </div>

                {/* Detected Gaps for this machine */}
                {selectedMachineGaps.length > 0 && (
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-[11px] font-bold text-rose-800 uppercase tracking-wide mb-1.5 flex items-center justify-between">
                      <span>Detected Missing Gaps ({selectedMachineGaps.length})</span>
                      <span className="text-[10px] font-normal lowercase text-rose-600">click to pre-fill</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMachineGaps.map((gap) => (
                        <button
                          key={`${gap.code}-${gap.month}`}
                          type="button"
                          onClick={() => applyGapSelection(gap)}
                          className="px-2 py-1 bg-white hover:bg-rose-50 border border-rose-200 text-rose-800 font-semibold rounded text-[11px] transition shadow-2xs cursor-pointer text-left"
                        >
                          ⚡ {formatLifecycleMonth(gap.month)} ({gap.code})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center text-xs text-slate-500">
                Select a machine from the fleet table on the right.
              </div>
            )}

            <form onSubmit={handleGenerateGapReport} className="space-y-4">
              {/* MANUAL SMR INPUT */}
              <Field
                label="Manual SMR (Operating Hours)"
                required
                helpText="Actual operating hours at the time of this service. Stamped on report; does NOT touch live fleet meter."
              >
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 45"
                    value={manualSmr}
                    onChange={(e) => setManualSmr(e.target.value)}
                    className="font-mono text-base font-bold text-amber-950 border-amber-300 focus:border-amber-500 bg-amber-50/30"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-amber-700 pointer-events-none">
                    hrs
                  </span>
                </div>
              </Field>

              {/* SERVICE DATE */}
              <Field label="Service Date" required helpText="Date the service took place (fills the historical gap)">
                <Input
                  type="date"
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  required
                />
              </Field>

              {/* SERVICE CLASSIFICATION */}
              <Field label="Service Classification" required>
                <Select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                >
                  {SERVICE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </Field>

              {/* REPORT TEMPLATE TYPE */}
              <Field label="Report Template Type" required>
                <Select
                  value={effectiveReportType}
                  onChange={(e) => setReportType(e.target.value)}
                  disabled={Boolean(requiredReportType)}
                >
                  {REPORT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </Field>

              {/* CUSTOM REPORT COUNTER */}
              <Field
                label="Custom Report Counter (Sequential #)"
                helpText="Optional sequence number (e.g. 14 for Ex_14). Will NOT advance the machine's live counter."
              >
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g. 14"
                  value={reportCounter}
                  onChange={(e) => setReportCounter(e.target.value)}
                  className="font-mono text-xs"
                />
              </Field>

              {/* EQP CARE AUTO UPLOAD */}
              <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={autoUploadToEqp}
                  onChange={(e) => setAutoUploadToEqp(e.target.checked)}
                  className="rounded text-amber-600 mt-0.5"
                />
                <span>
                  Automatically dispatch this gap report to Komatsu Equipment Care Daily Operation
                </span>
              </label>

              {/* LIVE SUMMARY / SAFETY PREVIEW */}
              <div className="p-3 bg-slate-900 text-white rounded-lg space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase font-semibold">
                  <span>Output Preview</span>
                  <span className="text-emerald-400 font-bold">Safe Mode</span>
                </div>
                <div className="font-mono text-xs text-amber-300 truncate">
                  📄 {previewFileName}
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
                  <span className="text-slate-400">Stamped SMR:</span>
                  <span className="font-mono font-bold text-white">{manualSmr || '0'} hrs</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Live Machine SMR:</span>
                  <span className="font-mono text-emerald-400">{selectedMachine?.last_smr ?? 0} hrs (Frozen)</span>
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <Button
                type="submit"
                variant="primary"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5"
                disabled={!selectedMachine || isGenerating || !manualSmr}
              >
                {isGenerating
                  ? 'Generating Gap Report...'
                  : `Generate Certified Gap Report (SMR ${manualSmr || '--'} hrs)`}
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Column: Fleet Selection Register (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 mb-3 border-b border-slate-100 gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                  Fleet Register & Missing Gaps ({filteredMachines.length} Units)
                </h3>
                <p className="text-xs text-slate-500">
                  Select a machine to pre-fill parameters and target gaps
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search machine, engine..."
                  className="w-36 sm:w-40 text-xs"
                />
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-32 text-xs"
                >
                  <option value="ALL">All Models</option>
                  {machineTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer bg-slate-50 px-2 py-1.5 rounded border border-slate-200">
                  <input
                    type="checkbox"
                    checked={onlyGapsFilter}
                    onChange={(e) => setOnlyGapsFilter(e.target.checked)}
                    className="rounded text-amber-600"
                  />
                  <span className="font-semibold text-rose-700">With Gaps Only</span>
                </label>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Machine #</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead isNumeric>Live SMR</TableHead>
                  <TableHead>Missing Gaps</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }, (_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6} className="py-3 text-center text-xs text-slate-400">
                        Loading fleet register...
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredMachines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-xs text-slate-500">
                      No machines match the selected filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMachines.map((m) => {
                    const isSelected = selectedMachineId === m.id;
                    const record = lifecycleMap.get(String(m.machine_number));
                    const gapCount = record?.monthlyGaps?.length || 0;

                    return (
                      <TableRow
                        key={m.id}
                        isClickable
                        onClick={() => setSelectedMachineId(m.id)}
                        className={isSelected ? 'bg-amber-50/60 font-semibold' : ''}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <input
                            type="radio"
                            name="selectedMachineRadio"
                            checked={isSelected}
                            onChange={() => setSelectedMachineId(m.id)}
                            className="text-amber-600"
                          />
                        </TableCell>
                        <TableCell className="font-mono font-bold text-slate-900">
                          #{m.machine_number}
                        </TableCell>
                        <TableCell className="text-xs text-slate-800">
                          {m.machine_type}
                        </TableCell>
                        <TableCell isNumeric className="font-mono text-xs text-slate-600">
                          {m.last_smr ?? 0} hrs
                        </TableCell>
                        <TableCell>
                          {gapCount > 0 ? (
                            <Badge tone="critical" size="sm">
                              {gapCount} Missing Gap{gapCount > 1 ? 's' : ''}
                            </Badge>
                          ) : (
                            <Badge tone="neutral" size="sm">
                              Clean
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant={isSelected ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => setSelectedMachineId(m.id)}
                          >
                            {isSelected ? 'Selected' : 'Select →'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </SystemShell>
  );
}

export default function EqpGapReportsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading Gap Studio...</div>}>
      <GapReportsStudio />
    </Suspense>
  );
}
