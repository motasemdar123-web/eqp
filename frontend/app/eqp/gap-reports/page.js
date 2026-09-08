'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import JSZip from 'jszip';
import SystemShell from '../../../components/SystemShell';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Input, { Select } from '../../../components/ui/Input';
import Field from '../../../components/ui/Field';
import PageHeader from '../../../components/ui/PageHeader';
import SectionHeader from '../../../components/ui/SectionHeader';
import Toast from '../../../components/ui/Toast';
import EqpNav from '../../../components/ui/../../components/eqp/EqpNav';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import ReportBuildingProgressModal from '../../../components/eqp/ReportBuildingProgressModal';
import ReportGenerationSummaryModal from '../../../components/eqp/ReportGenerationSummaryModal';

import { generateReports, getMachines, getReports, getReportProfile, getAllFleetReports, getEqpcLifecycleCache } from '../../../lib/api';
import { REPORT_TYPES, SERVICE_TYPES, getRequiredReportType } from '../../../lib/reportOptions';
import { buildDynamicLifecycleRecords, formatLifecycleMonth, getMachineReportMonths } from '../../../lib/eqpLifecycleData';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const AVAILABLE_YEARS = ['2026', '2025', '2024', '2023', '2022'];

function GapReportsStudio() {
  const searchParams = useSearchParams();
  const initialMachineParam = searchParams.get('machine') || '';
  const initialMonthParam = searchParams.get('month') || '';
  const initialServiceTypeParam = searchParams.get('serviceType') || '';
  const initialSmrParam = searchParams.get('smr') || '';
  const initialUpdateCounters = searchParams.get('updateCounters') === 'true' || searchParams.get('mode') === 'normal';

  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [machines, setMachines] = useState([]);
  const [reports, setReports] = useState([]);
  const [reportProfile, setReportProfile] = useState(null);
  const [liveEqpData, setLiveEqpData] = useState(null);
  const [updateCounters, setUpdateCounters] = useState(() => initialUpdateCounters);
  const [toast, setToast] = useState(null);

  // Multi-Machine Selection State
  const [selectedMachineIds, setSelectedMachineIds] = useState([]);

  // Multi-Month & Date State
  const [selectedDates, setSelectedDates] = useState(() => {
    if (initialMonthParam) {
      return [`${initialMonthParam}-15`];
    }
    return [];
  });
  const [activeYear, setActiveYear] = useState(() => (initialMonthParam ? initialMonthParam.slice(0, 4) : '2024'));
  const [dayOfMonth, setDayOfMonth] = useState(15);
  const [customDateInput, setCustomDateInput] = useState('');

  // Service Configuration
  const [serviceType, setServiceType] = useState(initialServiceTypeParam || 'Add. Service');
  const [reportType, setReportType] = useState('W41X');
  const [reportCounter, setReportCounter] = useState('');

  // SMR Configuration Mode: 'default' | 'uniform' | 'per_machine'
  const [smrMode, setSmrMode] = useState(() => (initialSmrParam ? 'uniform' : 'default'));
  const [uniformSmr, setUniformSmr] = useState(() => initialSmrParam || '');
  const [machineSmrOverrides, setMachineSmrOverrides] = useState({});

  // Dispatch & Summary State
  const [autoUploadToEqp, setAutoUploadToEqp] = useState(false);
  const [generationSummary, setGenerationSummary] = useState(null);

  // Fleet Browser Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterEngineer, setFilterEngineer] = useState('ALL');
  const [onlyGapsFilter, setOnlyGapsFilter] = useState(false);

  const requiredReportType = getRequiredReportType(serviceType);
  const effectiveReportType = requiredReportType || reportType;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [machinesRes, reportsRes, profileRes, liveCacheRes] = await Promise.all([
        getMachines().catch(() => ({ machines: [] })),
        getAllFleetReports().catch(() => []),
        getReportProfile().catch(() => null),
        getEqpcLifecycleCache().catch(() => null),
      ]);

      const loadedMachines = machinesRes.machines || [];
      setMachines(loadedMachines);
      setReports(reportsRes || []);
      setReportProfile(profileRes);
      if (liveCacheRes && (liveCacheRes.machines || liveCacheRes.success)) {
        setLiveEqpData(liveCacheRes);
      }

      // Pre-select machine from query param if provided
      if (initialMachineParam && loadedMachines.length > 0) {
        const matched = loadedMachines.find(
          (m) => String(m.machine_number) === String(initialMachineParam)
        );
        if (matched) {
          setSelectedMachineIds([matched.id]);
          if (initialSmrParam) {
            setMachineSmrOverrides({ [matched.id]: initialSmrParam });
          }
        }
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to load fleet data.' });
    } finally {
      setLoading(false);
    }
  }, [initialMachineParam]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute lifecycle records to detect gaps
  const lifecycleRecords = useMemo(() => {
    return buildDynamicLifecycleRecords(reports, machines, liveEqpData);
  }, [reports, machines, liveEqpData]);

  // Map machineNumber -> lifecycle record
  const lifecycleMap = useMemo(() => {
    const map = new Map();
    for (const record of lifecycleRecords) {
      map.set(String(record.machineNumber), record);
    }
    return map;
  }, [lifecycleRecords]);

  // Selected Machine Objects
  const selectedMachines = useMemo(() => {
    return machines.filter((m) => selectedMachineIds.includes(m.id));
  }, [machines, selectedMachineIds]);

  // Map monthKey -> list of machine numbers that ALREADY have an existing report in that month
  const existingReportMonthsMap = useMemo(() => {
    const map = new Map();
    for (const m of selectedMachines) {
      const months = getMachineReportMonths(m.machine_number, reports, liveEqpData);
      for (const mo of months) {
        if (!map.has(mo)) map.set(mo, []);
        map.get(mo).push(m.machine_number);
      }
    }
    return map;
  }, [selectedMachines, reports, liveEqpData]);

  // Unique missing months across all currently selected machines
  const detectedGapsAcrossSelected = useMemo(() => {
    const gapMap = new Map(); // monthKey -> { month, count, code, type, machines: [] }
    for (const m of selectedMachines) {
      const record = lifecycleMap.get(String(m.machine_number));
      const gaps = record?.monthlyGaps || [];
      for (const gap of gaps) {
        if (!gapMap.has(gap.month)) {
          gapMap.set(gap.month, {
            month: gap.month,
            code: gap.code,
            type: gap.type,
            machineNumbers: [m.machine_number],
          });
        } else {
          gapMap.get(gap.month).machineNumbers.push(m.machine_number);
        }
      }
    }
    return Array.from(gapMap.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [selectedMachines, lifecycleMap]);

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
      const matchesEngineer = filterEngineer === 'ALL' || m.responsible_engineer === filterEngineer;

      const record = lifecycleMap.get(String(m.machine_number));
      const hasGaps = (record?.monthlyGaps?.length || 0) > 0;
      const matchesGaps = !onlyGapsFilter || hasGaps;

      return matchesSearch && matchesType && matchesEngineer && matchesGaps;
    });
  }, [machines, searchTerm, filterType, filterEngineer, onlyGapsFilter, lifecycleMap]);

  const machineTypes = useMemo(
    () => [...new Set(machines.map((m) => m.machine_type).filter(Boolean))].sort(),
    [machines]
  );

  const engineersList = useMemo(
    () => [...new Set(machines.map((m) => m.responsible_engineer).filter(Boolean))].sort(),
    [machines]
  );

  // Machine selection helpers
  function toggleMachine(id) {
    setSelectedMachineIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function handleSelectAllFiltered() {
    const filteredIds = filteredMachines.map((m) => m.id);
    const allSelected = filteredIds.every((id) => selectedMachineIds.includes(id));
    if (allSelected) {
      setSelectedMachineIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedMachineIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  }

  function handleSelectAllWithGaps() {
    const withGapsIds = machines
      .filter((m) => {
        const record = lifecycleMap.get(String(m.machine_number));
        return (record?.monthlyGaps?.length || 0) > 0;
      })
      .map((m) => m.id);

    setSelectedMachineIds(withGapsIds);
    setToast({
      type: 'info',
      message: `Selected ${withGapsIds.length} machines with detected lifecycle gaps.`,
    });
  }

  function handleClearMachineSelection() {
    setSelectedMachineIds([]);
  }

  // Month & Date selection helpers
  function toggleMonth(year, monthIndex) {
    const monthStr = String(monthIndex + 1).padStart(2, '0');
    const dayStr = String(dayOfMonth).padStart(2, '0');
    const dateStr = `${year}-${monthStr}-${dayStr}`;

    setSelectedDates((prev) => {
      if (prev.includes(dateStr)) {
        return prev.filter((d) => d !== dateStr);
      }
      return [...prev, dateStr].sort();
    });
  }

  function isMonthSelected(year, monthIndex) {
    const monthPrefix = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    return selectedDates.some((d) => d.startsWith(monthPrefix));
  }

  function handleAddDetectedGapMonth(gapMonth) {
    const dayStr = String(dayOfMonth).padStart(2, '0');
    const dateStr = `${gapMonth}-${dayStr}`;
    if (!selectedDates.includes(dateStr)) {
      setSelectedDates((prev) => [...prev, dateStr].sort());
    }
  }

  function handleAddAllDetectedGaps() {
    const dayStr = String(dayOfMonth).padStart(2, '0');
    const newDates = detectedGapsAcrossSelected.map((g) => `${g.month}-${dayStr}`);
    setSelectedDates((prev) => Array.from(new Set([...prev, ...newDates])).sort());
    setToast({
      type: 'info',
      message: `Added ${newDates.length} detected gap month dates to batch.`,
    });
  }

  function handleRemoveDate(dateStr) {
    setSelectedDates((prev) => prev.filter((d) => d !== dateStr));
  }

  function handleClearAllDates() {
    setSelectedDates([]);
  }

  function handleAddCustomDate(e) {
    e.preventDefault();
    if (!customDateInput) return;
    if (!selectedDates.includes(customDateInput)) {
      setSelectedDates((prev) => [...prev, customDateInput].sort());
      setCustomDateInput('');
    }
  }

  // SMR Override Helpers
  function handleMachineSmrChange(machineId, value) {
    setMachineSmrOverrides((prev) => ({
      ...prev,
      [machineId]: value,
    }));
  }

  // Total reports calculation
  const totalReportsCount = selectedMachineIds.length * selectedDates.length;

  // Batch Generation Handler
  async function handleGenerateBatch(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (isGenerating) return; // Strictly prevent duplicate batch generation / double click

    if (!reportProfile?.signatureAvailable) {
      const makerName = reportProfile?.reportMaker?.fullName || 'this user';
      setToast({ type: 'error', message: `No digital signature registered for ${makerName}.` });
      return;
    }

    if (selectedMachineIds.length === 0) {
      setToast({ type: 'error', message: 'Please select at least one machinery asset.' });
      return;
    }

    if (selectedDates.length === 0) {
      setToast({ type: 'error', message: 'Please select at least one service month / date.' });
      return;
    }

    if (smrMode === 'uniform' && (uniformSmr === '' || isNaN(Number(uniformSmr)) || Number(uniformSmr) < 0)) {
      setToast({ type: 'error', message: 'Please enter a valid numeric uniform manual SMR.' });
      return;
    }

    try {
      setIsGenerating(true);

      // Build payload
      const payload = {
        machineModel: selectedMachines[0]?.machine_type || 'PC400',
        reportType: effectiveReportType,
        serviceType,
        selectedMachines: selectedMachineIds,
        reportDates: selectedDates,
        skipCounterUpdates: !updateCounters, // If updateCounters is true (Normal reporting mode), skipCounterUpdates is false. If false (Strict gap fill), skipCounterUpdates is true.
        autoUploadToEqp,
        eqpcCookie: typeof window !== 'undefined' ? localStorage.getItem('eqpc_user_cookie') || '' : '',
      };

      if (smrMode === 'uniform' && uniformSmr) {
        payload.manualSmr = Number(uniformSmr);
      } else if (smrMode === 'per_machine') {
        const smrMap = {};
        for (const m of selectedMachines) {
          const val = machineSmrOverrides[m.id];
          if (val !== undefined && val !== null && val !== '') {
            smrMap[m.id] = Number(val);
          }
        }
        if (Object.keys(smrMap).length > 0) {
          payload.machineSmrMap = smrMap;
        }
      }

      if (reportCounter) {
        payload.reportCounter = Number(reportCounter);
      }

      const data = await generateReports(payload);

      setGenerationSummary(data);
      setShowSummaryModal(true); // Open detailed machine-by-machine breakdown modal

      const genCount = data.totalGenerated ?? data.generatedFiles?.length ?? 0;
      const exclCount = data.totalExcluded ?? data.excludedJobs?.length ?? 0;

      if (data.eqpCare) {
        if (data.eqpCare.successful > 0 && data.eqpCare.failed === 0) {
          setToast({
            type: 'success',
            message: `🎉 Generated ${genCount} reports and uploaded all to Komatsu EQP Care successfully! (${exclCount} excluded)`,
          });
        } else if (data.eqpCare.failed > 0 && data.eqpCare.successful > 0) {
          setToast({
            type: 'warning',
            message: `⚠️ Generated ${genCount} reports. EQP Care: ${data.eqpCare.successful} uploaded, ${data.eqpCare.failed} failed (${exclCount} excluded).`,
          });
        } else if (data.eqpCare.failed > 0) {
          const errMsg = data.eqpCare.errors?.[0]?.error || data.eqpCare.error || 'Session expired or invalid';
          setToast({
            type: 'warning',
            message: `⚠️ Generated ${genCount} reports, but EQP Care upload failed (${errMsg}). Update session in EQP Care Studio.`,
          });
        }
      } else {
        let msg = `Successfully created ${genCount} certified gap reports without altering live fleet meters!`;
        if (exclCount > 0) {
          msg += ` (${exclCount} report date(s) excluded to prevent duplicate reports in the same month).`;
        }
        setToast({
          type: 'success',
          message: msg,
        });
      }

      // Refresh reports to update lifecycle records
      const updatedReports = await getAllFleetReports().catch(() => []);
      setReports(updatedReports);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Batch report generation failed.' });
    } finally {
      setIsGenerating(false);
    }
  }

  // Download all generated PDFs as a ZIP bundle
  async function handleDownloadAllZip() {
    if (!generationSummary?.generatedFiles?.length) return;

    try {
      setDownloadingZip(true);
      const zip = new JSZip();
      const folder = zip.folder('komatsu-gap-reports');

      for (let i = 0; i < generationSummary.generatedFiles.length; i += 1) {
        const item = generationSummary.generatedFiles[i];
        if (item.fileUrl) {
          const res = await fetch(item.fileUrl);
          if (res.ok) {
            const blob = await res.blob();
            folder.file(item.fileName || `gap-report-${i + 1}.pdf`, blob);
          }
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `komatsu-gap-reports-batch-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setToast({
        type: 'success',
        message: `Exported ${generationSummary.generatedFiles.length} reports into ZIP archive.`,
      });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to generate ZIP archive.' });
    } finally {
      setDownloadingZip(false);
    }
  }

  return (
    <SystemShell
      activePath="/eqp/gap-reports"
      title="Gap-Filling Reports Studio"
      description="Multi-machine and multi-month batch generator for sealing historical lifecycle gaps with frozen live meters."
    >
      <PageHeader
        title="Gap-Filling Report Studio"
        badge={
          <Badge tone="ready" size="sm" dot>
            Safe Mode • Live Fleet Meters Protected
          </Badge>
        }
        description="Select multiple machinery assets and multiple missing months to batch generate certified reports with zero impact on live machine counters."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/eqp/lifecycle">
              <Button variant="secondary" size="sm">
                Lifecycle Matrix →
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

      {/* Safety Guarantee Banner */}
      <Card className="p-4 bg-amber-500/10 border-amber-500/30 text-amber-950 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-xl shrink-0 mt-0.5">🛡️</span>
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-amber-900 text-sm">
              Zero Counter Impact Guarantee (Safe Mode Active)
            </h4>
            <p className="text-amber-800 leading-relaxed">
              Every report created in this studio records your designated service date and manual SMR on the certified PDF document, but <strong>will NOT advance or alter</strong> the live machine SMR (<code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900">last_smr</code>), step meter (<code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900">smr_step</code>), or report counter (<code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900">report_counter</code>) in the database.
            </p>
          </div>
        </div>
      </Card>

      {/* Generation Success Card */}
      {generationSummary && (
        <Card className="p-5 bg-emerald-50 border-emerald-200 text-emerald-950 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-emerald-200">
            <div className="flex items-center gap-3">
              <span className="h-4 w-4 rounded-full bg-emerald-500 shrink-0" />
              <div>
                <h4 className="text-base font-bold text-emerald-950">
                  Batch Generation Complete ({generationSummary.totalGenerated ?? generationSummary.generatedFiles?.length ?? 0} Reports Created)
                  {(generationSummary.totalExcluded ?? 0) > 0 && (
                    <span className="ml-2 text-xs font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                      🛡️ {generationSummary.totalExcluded} Month(s) Excluded (Contradiction Protected)
                    </span>
                  )}
                </h4>
                <p className="text-xs text-emerald-800">
                  Documents named sequentially and cataloged without modifying live machinery meters.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSummaryModal(true)}
                className="bg-white hover:bg-slate-50 text-slate-800 font-bold border-emerald-300"
              >
                📊 Machine Breakdown
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDownloadAllZip}
                disabled={downloadingZip}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
              >
                {downloadingZip ? 'Packaging ZIP...' : '📦 Download All as ZIP'}
              </Button>
              <Link href="/eqp/reports">
                <Button variant="secondary" size="sm">
                  View in PDF Archive →
                </Button>
              </Link>
            </div>
          </div>

          {/* Generated Files Preview List */}
          <div className="mt-3 max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {generationSummary.generatedFiles?.map((file, idx) => (
              <div
                key={file.id || idx}
                className="flex items-center justify-between bg-white px-3 py-1.5 rounded border border-emerald-200 text-xs"
              >
                <div className="flex items-center gap-2 font-mono truncate">
                  <span className="text-slate-400 text-[10px]">#{idx + 1}</span>
                  <span className="font-semibold text-slate-800 truncate">{file.fileName || file.file}</span>
                  <span className="text-[11px] text-slate-500">({file.smr} hrs)</span>
                </div>
                {file.fileUrl && (
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline shrink-0 ml-2"
                  >
                    Open PDF ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Fleet Asset Multi-Select Register (7 cols) */}
        <div className="xl:col-span-7 space-y-5">
          <Card className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>1. Fleet Asset Multi-Select</span>
                  <Badge tone="neutral" size="sm">
                    {selectedMachineIds.length} Selected
                  </Badge>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Check the units that require gap-filling reports
                </p>
              </div>

              {/* Quick Multi-Select Actions */}
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleSelectAllWithGaps}
                  className="text-xs text-rose-800 border-rose-200 hover:bg-rose-50"
                >
                  ⚡ Select All With Gaps
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearMachineSelection}
                  className="text-xs text-slate-500"
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search machine #, engine..."
                className="w-36 sm:w-44 text-xs"
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
              <Select
                value={filterEngineer}
                onChange={(e) => setFilterEngineer(e.target.value)}
                className="w-36 text-xs"
              >
                <option value="ALL">All Engineers</option>
                {engineersList.map((eng) => (
                  <option key={eng} value={eng}>{eng}</option>
                ))}
              </Select>
              <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200">
                <input
                  type="checkbox"
                  checked={onlyGapsFilter}
                  onChange={(e) => setOnlyGapsFilter(e.target.checked)}
                  className="rounded text-amber-600"
                />
                <span className="font-semibold text-rose-700">With Gaps Only</span>
              </label>
            </div>

            {/* Fleet Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        checked={
                          filteredMachines.length > 0 &&
                          filteredMachines.every((m) => selectedMachineIds.includes(m.id))
                        }
                        onChange={handleSelectAllFiltered}
                        className="rounded text-amber-600"
                        title="Select/Deselect all filtered units"
                      />
                    </TableHead>
                    <TableHead>Machine #</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead isNumeric>Live SMR</TableHead>
                    <TableHead>Missing Gaps</TableHead>
                    {smrMode === 'per_machine' && <TableHead className="w-24">Manual SMR</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 6 }, (_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={smrMode === 'per_machine' ? 7 : 6} className="py-3 text-center text-xs text-slate-400">
                          Loading fleet register...
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredMachines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={smrMode === 'per_machine' ? 7 : 6} className="py-8 text-center text-xs text-slate-500">
                        No machinery assets match the filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMachines.map((m) => {
                      const isSelected = selectedMachineIds.includes(m.id);
                      const record = lifecycleMap.get(String(m.machine_number));
                      const gaps = record?.monthlyGaps || [];

                      return (
                        <TableRow
                          key={m.id}
                          isClickable
                          onClick={() => toggleMachine(m.id)}
                          className={isSelected ? 'bg-amber-50/70 font-semibold' : ''}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleMachine(m.id)}
                              className="rounded text-amber-600"
                            />
                          </TableCell>
                          <TableCell className="font-mono font-bold text-slate-900">
                            #{m.machine_number}
                          </TableCell>
                          <TableCell className="text-xs text-slate-800">
                            {m.machine_type}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 max-w-[130px] truncate" title={m.customer_name}>
                            {m.customer_name || 'DAR AL HAI'}
                          </TableCell>
                          <TableCell isNumeric className="font-mono text-xs text-slate-600">
                            {m.last_smr ?? 0} hrs
                          </TableCell>
                          <TableCell>
                            {gaps.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {gaps.slice(0, 3).map((g) => (
                                  <button
                                    key={g.month}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddDetectedGapMonth(g.month);
                                    }}
                                    className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 rounded hover:bg-rose-100 transition"
                                    title="Click to add this month to batch dates"
                                  >
                                    + {formatLifecycleMonth(g.month)}
                                  </button>
                                ))}
                                {gaps.length > 3 && (
                                  <span className="text-[10px] text-rose-700 font-bold self-center">
                                    +{gaps.length - 3} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-normal">Clean</span>
                            )}
                          </TableCell>
                          {smrMode === 'per_machine' && (
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Input
                                type="number"
                                min="0"
                                placeholder={String(m.last_smr ?? 0)}
                                value={machineSmrOverrides[m.id] ?? ''}
                                onChange={(e) => handleMachineSmrChange(m.id, e.target.value)}
                                className="w-20 text-xs font-mono font-bold py-1 px-1.5"
                              />
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* Right Column: Multi-Month Selection & Batch Configuration (5 cols) */}
        <div className="xl:col-span-5 space-y-5">
          {/* Step 2: Multi-Month & Date Matrix */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>2. Multi-Month Batch Dates</span>
                  <Badge tone="live" size="sm">
                    {selectedDates.length} Dates
                  </Badge>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select target missing months to generate across all selected machines
                </p>
              </div>

              {selectedDates.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAllDates}
                  className="text-xs text-slate-500"
                >
                  Clear All
                </Button>
              )}
            </div>

            {/* Quick Gaps from Selected Fleet */}
            {detectedGapsAcrossSelected.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                    Detected Gaps Across Selected Fleet ({detectedGapsAcrossSelected.length})
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddAllDetectedGaps}
                    className="text-[11px] font-bold bg-white text-rose-800 border-rose-300 hover:bg-rose-100 py-0.5 px-2"
                  >
                    + Add All Gaps
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {detectedGapsAcrossSelected.map((gap) => {
                    const dayStr = String(dayOfMonth).padStart(2, '0');
                    const dateStr = `${gap.month}-${dayStr}`;
                    const isQueued = selectedDates.includes(dateStr);

                    return (
                      <button
                        key={gap.month}
                        type="button"
                        onClick={() => handleAddDetectedGapMonth(gap.month)}
                        className={`px-2 py-1 text-xs font-semibold rounded border transition cursor-pointer ${
                          isQueued
                            ? 'bg-rose-700 text-white border-rose-700 shadow-2xs'
                            : 'bg-white text-rose-800 border-rose-300 hover:bg-rose-100'
                        }`}
                      >
                        {isQueued ? '✓ ' : '+ '}
                        {formatLifecycleMonth(gap.month)}{' '}
                        <span className="text-[10px] opacity-80">({gap.machineNumbers.length} units)</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Year Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-200 pb-1">
              <span className="text-xs font-bold text-slate-500 mr-2">Year:</span>
              {AVAILABLE_YEARS.map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setActiveYear(yr)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                    activeYear === yr
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {yr}
                </button>
              ))}

              <div className="ml-auto flex items-center gap-1.5 text-xs text-slate-600">
                <span className="text-[11px]">Day:</span>
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(Math.min(28, Math.max(1, Number(e.target.value) || 15)))}
                  className="w-12 text-center font-mono font-bold text-xs py-0.5 border border-slate-300 rounded"
                  title="Day of month for generated service reports"
                />
              </div>
            </div>

            {/* 12 Month Toggle Grid */}
            <div className="grid grid-cols-4 gap-1.5">
              {MONTH_NAMES.map((name, idx) => {
                const isSelected = isMonthSelected(activeYear, idx);
                const monthKey = `${activeYear}-${String(idx + 1).padStart(2, '0')}`;
                const hasGap = detectedGapsAcrossSelected.some((g) => g.month === monthKey);
                const machinesWithExisting = existingReportMonthsMap.get(monthKey) || [];
                const allSelectedHaveExisting = selectedMachines.length > 0 && machinesWithExisting.length === selectedMachines.length;
                const someSelectedHaveExisting = machinesWithExisting.length > 0;

                let tooltip = '';
                if (allSelectedHaveExisting) {
                  tooltip = `Protected: All ${selectedMachines.length} selected machines already have a report in ${monthKey}. If queued, this month will be excluded to prevent contradiction.`;
                } else if (someSelectedHaveExisting) {
                  tooltip = `Notice: ${machinesWithExisting.length} machine(s) already have a report in ${monthKey} (will be excluded for those units).`;
                }

                return (
                  <button
                    key={name}
                    type="button"
                    title={tooltip}
                    onClick={() => toggleMonth(activeYear, idx)}
                    className={`p-2 rounded-lg text-xs font-bold border transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                        : allSelectedHaveExisting
                        ? 'bg-amber-50/70 text-amber-900 border-amber-300 hover:bg-amber-100'
                        : hasGap
                        ? 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{name}</span>
                    <span className="text-[10px] font-normal opacity-90">
                      {isSelected
                        ? '✓ Queued'
                        : allSelectedHaveExisting
                        ? '🛡️ Exists'
                        : hasGap
                        ? '⚡ Gap'
                        : ''}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Specific Date Adder */}
            <form onSubmit={handleAddCustomDate} className="flex items-center gap-2 pt-1 border-t border-slate-100">
              <Input
                type="date"
                value={customDateInput}
                onChange={(e) => setCustomDateInput(e.target.value)}
                className="text-xs flex-1"
                placeholder="Custom date"
              />
              <Button type="submit" variant="secondary" size="sm" disabled={!customDateInput}>
                + Add Date
              </Button>
            </form>

            {/* Queued Dates Pills Summary */}
            {selectedDates.length > 0 && (
              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                  Queued Service Dates ({selectedDates.length}):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {selectedDates.map((date) => (
                    <span
                      key={date}
                      className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-mono font-bold px-2 py-0.5 rounded-md"
                    >
                      {date}
                      <button
                        type="button"
                        onClick={() => handleRemoveDate(date)}
                        className="text-amber-700 hover:text-rose-600 font-bold ml-0.5 cursor-pointer"
                        title="Remove date"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Step 3: Service Parameters & SMR Controls */}
          <Card className="p-5 space-y-4">
            <SectionHeader
              title="3. Service Classification & SMR"
              description="Configure protocol types and manual hour meters"
            />

            <div className="grid grid-cols-2 gap-3">
              <Field label="Service Classification" required>
                <Select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="text-xs"
                >
                  {SERVICE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </Field>

              <Field label="Template Code" required>
                <Select
                  value={effectiveReportType}
                  onChange={(e) => setReportType(e.target.value)}
                  disabled={Boolean(requiredReportType)}
                  className="text-xs"
                >
                  {REPORT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </Field>
            </div>

            {/* SMR Mode Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Operating SMR Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSmrMode('default')}
                  className={`p-2 rounded-lg text-xs font-bold border transition text-center ${
                    smrMode === 'default'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Machine SMR
                  <span className="block text-[10px] font-normal opacity-80">Use live meters</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSmrMode('uniform')}
                  className={`p-2 rounded-lg text-xs font-bold border transition text-center ${
                    smrMode === 'uniform'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Uniform SMR
                  <span className="block text-[10px] font-normal opacity-80">1 SMR for all</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSmrMode('per_machine')}
                  className={`p-2 rounded-lg text-xs font-bold border transition text-center ${
                    smrMode === 'per_machine'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Per Machine
                  <span className="block text-[10px] font-normal opacity-80">Custom in table</span>
                </button>
              </div>

              {smrMode === 'uniform' && (
                <Field
                  label="Uniform Manual SMR (hrs)"
                  required
                  helpText="This exact SMR will be stamped onto every generated report in this batch."
                >
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g. 4500"
                    value={uniformSmr}
                    onChange={(e) => setUniformSmr(e.target.value)}
                    className="font-mono text-sm font-bold text-amber-950 border-amber-300"
                    required
                  />
                </Field>
              )}
            </div>

            {/* Optional Starting Report Counter */}
            <Field
              label="Starting Report Counter (Optional)"
              helpText="Leave empty to use each machine's natural consecutive counter (e.g. Ex_22, Ex_23)."
            >
              <Input
                type="number"
                min="1"
                placeholder="Auto consecutive per machine"
                value={reportCounter}
                onChange={(e) => setReportCounter(e.target.value)}
                className="font-mono text-xs"
              />
            </Field>

            {/* Counter Update Mode Toggle */}
            <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
              <label className="flex items-start gap-2.5 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateCounters}
                  onChange={(e) => setUpdateCounters(e.target.checked)}
                  className="rounded text-blue-600 mt-0.5"
                />
                <div>
                  <span className="font-semibold text-slate-800">
                    Update Machine Meters & Counters
                  </span>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    {updateCounters
                      ? '⚡ Normal Report Mode: Advances machine last_smr and report_counter in the database.'
                      : '🛡️ Strict Gap Mode: Historical gap backfill. Meters and counters are preserved without modification.'}
                  </p>
                </div>
              </label>
            </div>

            {/* EQP CARE Auto Upload */}
            <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={autoUploadToEqp}
                onChange={(e) => setAutoUploadToEqp(e.target.checked)}
                className="rounded text-amber-600 mt-0.5"
              />
              <span>
                Dispatch generated reports directly to Komatsu Equipment Care Daily Operation
              </span>
            </label>

            {/* Dynamic Calculation Summary Box */}
            <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase font-semibold">
                <span>Batch Formula</span>
                <span className={updateCounters ? "text-blue-400 font-bold" : "text-emerald-400 font-bold"}>
                  {updateCounters ? "⚡ Normal Progress Mode" : "🛡️ Gap Safe Mode Active"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center py-2 bg-slate-800/80 rounded-lg border border-slate-700">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Machines</p>
                  <p className="text-lg font-mono font-extrabold text-white">{selectedMachineIds.length}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Months / Dates</p>
                  <p className="text-lg font-mono font-extrabold text-amber-400">× {selectedDates.length}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Total PDFs</p>
                  <p className="text-lg font-mono font-extrabold text-emerald-400">= {totalReportsCount}</p>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                {updateCounters ? (
                  <>
                    ⚡ <strong>Normal Reporting Mode:</strong> Machine meters (<code className="text-slate-200">last_smr</code>, <code className="text-slate-200">report_counter</code>) <strong>will be updated</strong> in the database.
                  </>
                ) : (
                  <>
                    🛡️ <strong>Strict Gap Mode:</strong> Live machine meters (<code className="text-slate-200">last_smr</code>, <code className="text-slate-200">report_counter</code>) will <strong>not</strong> be modified in the database.
                  </>
                )}
              </p>

              {/* GENERATE CTA BUTTON */}
              <Button
                type="button"
                variant="primary"
                onClick={handleGenerateBatch}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 text-sm shadow-md"
                disabled={totalReportsCount === 0 || isGenerating}
              >
                {isGenerating
                  ? `Generating ${totalReportsCount} Certified Reports...`
                  : totalReportsCount > 0
                  ? `Generate ${totalReportsCount} Certified Gap Reports (Batch) →`
                  : 'Select Machines & Dates to Generate'}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Progress & Summary Modals */}
      <ReportBuildingProgressModal
        isOpen={isGenerating}
        totalMachines={selectedMachineIds.length}
        totalDates={selectedDates.length}
      />

      <ReportGenerationSummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        summary={generationSummary}
        onDownloadZip={handleDownloadAllZip}
        downloadingZip={downloadingZip}
      />

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
