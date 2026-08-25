'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import SystemShell from '../../../components/SystemShell';
import Card, { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Input, { Select } from '../../../components/ui/Input';
import Field from '../../../components/ui/Field';
import PageHeader from '../../../components/ui/PageHeader';
import SectionHeader from '../../../components/ui/SectionHeader';
import MetricCard from '../../../components/ui/MetricCard';
import EmptyState from '../../../components/ui/EmptyState';
import Toast from '../../../components/ui/Toast';
import DatesModal from '../../../components/DatesModal';
import MachineTimelineModal from '../../../components/eqp/MachineTimelineModal';
import EqpNav from '../../../components/eqp/EqpNav';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { getStoredUser, clearStoredUser, getMatchingEngineerName } from '../../../lib/auth';
import { generateReports, getMachines, getReportProfile } from '../../../lib/api';
import { MACHINE_MODELS, REPORT_TYPES, SERVICE_TYPES, getRequiredReportType } from '../../../lib/reportOptions';

export default function EqpReportBuilderPage() {
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [machines, setMachines] = useState([]);
  const [selectedMachines, setSelectedMachines] = useState([]);
  const [reportProfile, setReportProfile] = useState(null);
  const [toast, setToast] = useState(null);
  const [timelineMachine, setTimelineMachine] = useState(null);

  // Wizard Configuration State
  const [machineModel, setMachineModel] = useState('AUTO');
  const [reportType, setReportType] = useState('W30');
  const [serviceType, setServiceType] = useState('Add Service');
  const [reportCount, setReportCount] = useState('1');
  const [showDatesModal, setShowDatesModal] = useState(false);
  const [reportDates, setReportDates] = useState([]);
  const [generationSummary, setGenerationSummary] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterEngineer, setFilterEngineer] = useState('ALL');
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  const requiredReportType = getRequiredReportType(serviceType);
  const effectiveReportType = requiredReportType || reportType;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [machinesRes, profileRes] = await Promise.all([
        getMachines().catch(() => ({ machines: [] })),
        getReportProfile().catch(() => null),
      ]);

      const loaded = machinesRes.machines || [];
      setMachines(loaded);
      setReportProfile(profileRes);

      const user = getStoredUser();
      const engList = [...new Set(loaded.map((m) => m.responsible_engineer).filter(Boolean))];
      const matched = getMatchingEngineerName(profileRes?.reportMaker || user, engList);
      if (matched !== 'ALL') {
        setFilterEngineer((prev) => (prev === 'ALL' ? matched : prev));
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to load report generator data.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const machineTypes = useMemo(
    () => [...new Set(machines.map((m) => m.machine_type).filter(Boolean))],
    [machines]
  );

  const engineers = useMemo(
    () => [...new Set(machines.map((m) => m.responsible_engineer).filter(Boolean))].sort(),
    [machines]
  );

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
      const matchesSelected = !showOnlySelected || selectedMachines.includes(m.id);

      return matchesSearch && matchesType && matchesEngineer && matchesSelected;
    });
  }, [machines, searchTerm, filterType, filterEngineer, showOnlySelected, selectedMachines]);

  function toggleMachine(id) {
    setSelectedMachines((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    if (selectedMachines.length === filteredMachines.length && filteredMachines.length > 0) {
      setSelectedMachines([]);
    } else {
      setSelectedMachines(filteredMachines.map((m) => m.id));
    }
  }

  function openDatesModal() {
    if (!reportProfile?.signatureAvailable) {
      const makerName = reportProfile?.reportMaker?.fullName || 'this user';
      setToast({ type: 'error', message: `No digital signature registered for ${makerName}.` });
      return;
    }

    if (selectedMachines.length === 0) {
      setToast({ type: 'error', message: 'Select at least one machine from the fleet table.' });
      return;
    }

    const count = Math.max(1, parseInt(reportCount, 10) || 1);
    if (!Number.isInteger(count) || count <= 0 || count > 12) {
      setToast({ type: 'error', message: 'Report count must be between 1 and 12.' });
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    setReportDates(Array(count).fill(todayStr));
    setShowDatesModal(true);
  }

  function updateReportDate(index, value) {
    setReportDates((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  }

  async function submitReports() {
    if (reportDates.some((d) => !d)) {
      setToast({ type: 'error', message: 'Please specify all report generation dates.' });
      return;
    }

    try {
      setIsGenerating(true);
      const data = await generateReports({
        machineModel,
        reportType: effectiveReportType,
        serviceType,
        selectedMachines,
        reportDates,
      });

      setGenerationSummary(data);
      setShowDatesModal(false);
      setSelectedMachines([]);
      setToast({
        type: 'success',
        message: `Successfully generated ${data.generatedFiles?.length || 0} certified PDF reports.`,
      });
      await loadData();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Report generation failed.' });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <SystemShell
      activePath="/eqp/generate-reports"
      title="Report Builder"
      description="Generate certified Komatsu Preventive Maintenance inspection PDFs in batches with sequential naming and digital signatures."
    >
      {/* Page Header */}
      <PageHeader
        title="Komatsu PM Report Builder"
        badge={
          <Badge tone={reportProfile?.signatureAvailable ? 'ready' : 'critical'} size="sm" dot>
            {reportProfile?.signatureAvailable ? 'Certified Signer Active' : 'No Signature Registered'}
          </Badge>
        }
        description="Select fleet machinery, configure service interval specifications, and generate certified PDF inspection documents."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/eqp/reports">
              <Button variant="secondary" size="sm">
                View PDF Archive →
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={openDatesModal}
              disabled={selectedMachines.length === 0 || isGenerating}
            >
              {isGenerating ? 'Generating...' : `Generate Reports (${selectedMachines.length} Selected)`}
            </Button>
          </div>
        }
      />

      <EqpNav />


      {/* Generation Success Banner */}
      {generationSummary && (
        <Card className="p-4 bg-emerald-50/70 border-emerald-200 text-emerald-950">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <h4 className="text-sm font-semibold text-emerald-900">
                  {generationSummary.generatedFiles?.length || 0} Certified PDF Reports Created
                </h4>
                <p className="text-xs text-emerald-700">
                  Documents named and cataloged with consecutive counter increments.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/eqp/reports">
                <Button variant="secondary" size="sm">
                  Open PDF Archive
                </Button>
              </Link>
              <Link href="/eqp/upload">
                <Button variant="primary" size="sm">
                  Dispatch to EQP Care →
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Configuration & Fleet Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Report Parameters Configuration (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <Card className="p-5 space-y-4">
            <SectionHeader
              title="Report Specifications"
              description="Configure service type, interval, and template"
            />

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

            <Field label="Machine Model Filter">
              <Select
                value={machineModel}
                onChange={(e) => setMachineModel(e.target.value)}
              >
                {MACHINE_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </Select>
            </Field>


            <Field label="Reports per Machine" required>
              <Input
                type="number"
                min={1}
                max={12}
                value={reportCount}
                onChange={(e) => setReportCount(e.target.value)}
              />
            </Field>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-1.5">
              <p className="font-semibold text-slate-900">Signer Profile:</p>
              <p className="text-slate-600">
                {reportProfile?.reportMaker?.fullName || 'Active Engineer'} ({reportProfile?.reportMaker?.userNumber || 'ENG-01'})
              </p>
              <p className="text-slate-500">
                Signature Status: {reportProfile?.signatureAvailable ? '✓ Verified' : '✕ Missing'}
              </p>
            </div>

            <Button
              variant="primary"
              className="w-full"
              onClick={openDatesModal}
              disabled={selectedMachines.length === 0 || isGenerating}
            >
              Configure Dates & Generate ({selectedMachines.length})
            </Button>
          </Card>
        </div>

        {/* Right Column: Fleet Selection Table (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 mb-3 border-b border-slate-100 gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                  Fleet Machinery Register ({filteredMachines.length} Units)
                </h3>
                <p className="text-xs text-slate-500">
                  Select machines to generate certified inspection PDFs
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search machine #, engine #..."
                  className="w-44 text-xs"
                />
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-36 text-xs"
                >
                  <option value="ALL">All Models</option>
                  {machineTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={selectedMachines.length === filteredMachines.length && filteredMachines.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded text-amber-600"
                    />
                  </TableHead>
                  <TableHead>Machine #</TableHead>
                  <TableHead>Model / Type</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead isNumeric>Last SMR (hrs)</TableHead>
                  <TableHead>Engineer</TableHead>
                  <TableHead className="text-right">History</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }, (_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7} className="py-3 text-center text-xs text-slate-400">
                        Loading fleet records...
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredMachines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-xs text-slate-500">
                      No machines matching the search filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMachines.map((m) => {
                    const isSelected = selectedMachines.includes(m.id);
                    return (
                      <TableRow
                        key={m.id}
                        isClickable
                        onClick={() => toggleMachine(m.id)}
                        className={isSelected ? 'bg-amber-50/50' : ''}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleMachine(m.id)}
                            className="rounded text-amber-600"
                          />
                        </TableCell>
                        <TableCell className="font-mono font-semibold text-slate-900">
                          #{m.machine_number}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-slate-800">
                          {m.machine_type}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {m.customer_name || 'DAR AL HAI'}
                        </TableCell>
                        <TableCell isNumeric className="font-mono text-xs font-semibold">
                          {m.last_smr ?? 0}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {m.responsible_engineer || 'Unassigned'}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setTimelineMachine(m)}
                          >
                            Timeline →
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

      {/* Dates Modal */}
      {showDatesModal && (
        <DatesModal
          dates={reportDates}
          onChange={updateReportDate}
          onCancel={() => setShowDatesModal(false)}
          onSubmit={submitReports}
          disabled={isGenerating}
        />
      )}

      {/* Timeline Drilldown Modal */}
      {timelineMachine && (
        <MachineTimelineModal
          machine={timelineMachine}
          onClose={() => setTimelineMachine(null)}
          onSelectForReport={(m) => {
            if (!selectedMachines.includes(m.id)) {
              setSelectedMachines((prev) => [...prev, m.id]);
            }
            setTimelineMachine(null);
          }}
        />
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </SystemShell>
  );
}
