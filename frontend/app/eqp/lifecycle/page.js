'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import SystemShell from '../../../components/SystemShell';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import EmptyState from '../../../components/ui/EmptyState';
import Button from '../../../components/ui/Button';
import { getMachines, getReports, getAllFleetReports, getEqpcLifecycleCache, syncEqpcLifecycle, updateEqpcServiceLog } from '../../../lib/api';
import { getStoredPlatformSession, getStoredUser, getMatchingEngineerName } from '../../../lib/auth';
import {
  buildDynamicLifecycleRecords,
  formatLifecycleDate,
  formatLifecycleMonth,
} from '../../../lib/eqpLifecycleData';
import { LifecycleMilestoneProgressBar } from '../../../components/eqp/EqpCharts';
import EqpNav from '../../../components/eqp/EqpNav';
import BatchEditSmrModal from '../../../components/eqp/BatchEditSmrModal';

const DISMISSED_MONTHLY_GAPS_KEY = 'eqp.dismissedMonthlyGaps';

export default function EqpLifecyclePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [modelFilter, setModelFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [filterEngineer, setFilterEngineer] = useState('ALL');
  const [selectedMachineNumber, setSelectedMachineNumber] = useState('');
  const [dismissedGapKeys, setDismissedGapKeys] = useState([]);
  const [monthlyListOpen, setMonthlyListOpen] = useState(true);
  const [dismissedListOpen, setDismissedListOpen] = useState(false);
  const [generatedReports, setGeneratedReports] = useState([]);
  const [machinesList, setMachinesList] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [liveEqpData, setLiveEqpData] = useState(null);
  const [isSyncingLive, setIsSyncingLive] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');
  const [singleSyncMachine, setSingleSyncMachine] = useState(null);

  // In-Place Service Log & SMR Edit States
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [editSmrValue, setEditSmrValue] = useState('');
  const [editSyncToKomatsu, setEditSyncToKomatsu] = useState(true);
  const [editCookieInput, setEditCookieInput] = useState('');
  const [showCookieInput, setShowCookieInput] = useState(false);
  const [isUpdatingLog, setIsUpdatingLog] = useState(false);
  const [editNotice, setEditNotice] = useState({ type: '', message: '' });
  const [batchEditModalOpen, setBatchEditModalOpen] = useState(false);
  const [batchEditReports, setBatchEditReports] = useState([]);
  const [selectedTimelineMilestones, setSelectedTimelineMilestones] = useState(new Set());

  useEffect(() => {
    setSelectedTimelineMilestones(new Set());
  }, [selectedMachineNumber]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      try {
        const storedKeys = JSON.parse(window.localStorage.getItem(DISMISSED_MONTHLY_GAPS_KEY) || '[]');
        setDismissedGapKeys(Array.isArray(storedKeys) ? storedKeys : []);
      } catch {
        setDismissedGapKeys([]);
      }
    }, 0);

    loadReportsData();

    return () => window.clearTimeout(timerId);
  }, []);

  async function loadReportsData() {
    try {
      setLoadingReports(true);
      const [reportsRes, machinesRes, liveCacheRes] = await Promise.all([
        getAllFleetReports().catch(() => getReports().catch(() => [])),
        getMachines().catch(() => ({ machines: [] })),
        getEqpcLifecycleCache().catch(() => null),
      ]);
      setGeneratedReports(reportsRes || []);
      const mList = machinesRes?.machines || [];
      setMachinesList(mList);
      if (liveCacheRes && (liveCacheRes.machines || liveCacheRes.success)) {
        setLiveEqpData(liveCacheRes);
      }

      const session = getStoredPlatformSession();
      const user = getStoredUser();
      const currentUser = session?.user || user;
      const engList = [...new Set(mList.map((m) => m.responsible_engineer).filter(Boolean))];
      const matched = getMatchingEngineerName(currentUser, engList);
      if (matched !== 'ALL') {
        setFilterEngineer((prev) => (prev === 'ALL' ? matched : prev));
      }
    } catch {
      // Non-fatal, baseline will be used
    } finally {
      setLoadingReports(false);
    }
  }

  async function handleSyncLive(targetSerial = null) {
    if (isSyncingLive) return; // Prevent double clicks
    try {
      setIsSyncingLive(true);
      if (targetSerial) {
        setSingleSyncMachine(targetSerial);
        setSyncStatusMsg(`Pulling real EQP Care records for #${targetSerial}...`);
      } else {
        setSyncStatusMsg(`Pulling real EQP Care records from Komatsu for fleet...`);
      }

      const userCookie = typeof window !== 'undefined' ? localStorage.getItem('eqpc_user_cookie') || '' : '';
      const payload = targetSerial ? { machineNumber: targetSerial } : {};
      if (userCookie) {
        payload.cookie = userCookie;
      }
      const res = await syncEqpcLifecycle(payload);
      if (res && res.success) {
        const updatedCache = await getEqpcLifecycleCache().catch(() => null);
        if (updatedCache) {
          setLiveEqpData(updatedCache);
        }
        if (targetSerial) {
          setSyncStatusMsg(`✓ Machine #${targetSerial} lifecycle successfully updated from Komatsu EQP Care.`);
        } else {
          setSyncStatusMsg(`✓ Synced ${res.synced || 0} fleet machines with real Komatsu EQP Care data.`);
        }
      } else {
        setSyncStatusMsg(`Sync completed with notices: ${res?.message || 'Check connection'}`);
      }
    } catch (err) {
      setSyncStatusMsg(`Failed to sync from EQP Care: ${err.message}`);
    } finally {
      setIsSyncingLive(false);
      setSingleSyncMachine(null);
      setTimeout(() => setSyncStatusMsg(''), 7000);
    }
  }

  function handleOpenEditModal(milestone) {
    setEditingMilestone(milestone);
    setEditSmrValue(milestone.smr != null ? String(milestone.smr) : '');
    setEditSyncToKomatsu(true);
    setEditNotice({ type: '', message: '' });

    const storedCookie = typeof window !== 'undefined' ? localStorage.getItem('eqpc_user_cookie') || '' : '';
    setEditCookieInput(storedCookie);
    setShowCookieInput(!storedCookie || storedCookie.includes('test_session'));
  }

  function handleCloseEditModal() {
    if (isUpdatingLog) return;
    setEditingMilestone(null);
    setEditSmrValue('');
    setEditCookieInput('');
    setShowCookieInput(false);
    setEditNotice({ type: '', message: '' });
  }

  function handleToggleTimelineMilestone(key) {
    setSelectedTimelineMilestones((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  function handleSelectAllTimelineMilestones(milestones) {
    const next = new Set(milestones.map((m) => m.id || `${m.code}-${m.date}`));
    setSelectedTimelineMilestones(next);
  }

  function handleClearTimelineMilestones() {
    setSelectedTimelineMilestones(new Set());
  }

  function handleOpenBatchEditModal(milestonesToEdit) {
    if (!selectedMachine || !milestonesToEdit || milestonesToEdit.length === 0) return;
    const hasTimelineSelection = selectedTimelineMilestones.size > 0;
    const formatted = milestonesToEdit.map((m) => {
      const mKey = m.id || `${m.code}-${m.date}`;
      const matched = (generatedReports || []).find(
        (r) =>
          String(r.machine_number || r.machineNumber).trim() === String(selectedMachine.machineNumber).trim() &&
          (r.service_date === m.date || r.date === m.date)
      );
      const isSelected = hasTimelineSelection ? selectedTimelineMilestones.has(mKey) : true;
      return {
        id: m.id || `${selectedMachine.machineNumber}-${m.code}-${m.date}`,
        selected: isSelected,
        machineNumber: selectedMachine.machineNumber,
        machine_number: selectedMachine.machineNumber,
        model: selectedMachine.model,
        eventCode: m.code,
        report_type: m.code,
        serviceDate: m.date,
        service_date: m.date,
        currentSmr: m.smr,
        smr: m.smr,
        fileName: matched?.file_name || m.fileName || m.file_name || '',
        file_name: matched?.file_name || m.file_name || m.fileName || '',
        comments: matched?.comments || '',
      };
    });
    setBatchEditReports(formatted);
    setBatchEditModalOpen(true);
  }

  function handleBatchUpdated(res) {
    if (!res || !res.results) return;
    loadReportsData();
    setSyncStatusMsg(`🎉 Batch update complete: ${res.successful} reports updated in-place.`);
    setTimeout(() => setSyncStatusMsg(''), 7000);
  }

  async function handleSaveServiceLogUpdate(e) {
    if (e) e.preventDefault();
    if (!editingMilestone || !selectedMachine) return;

    const numSmr = Number(editSmrValue);
    if (isNaN(numSmr) || numSmr < 0) {
      setEditNotice({ type: 'error', message: 'Please enter a valid non-negative SMR number.' });
      return;
    }

    const cleanCookie = editCookieInput.trim();
    if (editSyncToKomatsu && (!cleanCookie || cleanCookie.includes('test_session'))) {
      setEditNotice({
        type: 'error',
        message: 'Active Komatsu session cookie (JSESSIONID) is required to sync with Komatsu Equipment Care. Please paste your cookie below.',
      });
      setShowCookieInput(true);
      return;
    }

    try {
      setIsUpdatingLog(true);
      setEditNotice({ type: '', message: '' });

      const matched = (generatedReports || []).find(
        (r) =>
          String(r.machine_number || r.machineNumber).trim() === String(selectedMachine.machineNumber).trim() &&
          (r.service_date === editingMilestone.date || r.date === editingMilestone.date)
      );
      const existingName = matched?.file_name || editingMilestone.fileName || editingMilestone.file_name || '';

      const payload = new FormData();
      payload.append('machineNumber', selectedMachine.machineNumber);
      payload.append('serialNo', selectedMachine.machineNumber);
      payload.append('model', selectedMachine.model);
      payload.append('eventCode', editingMilestone.code);
      payload.append('serviceDate', editingMilestone.date);
      payload.append('newSmr', String(numSmr));
      payload.append('currentSmr', String(editingMilestone.smr ?? ''));
      payload.append('syncToEqpc', editSyncToKomatsu ? 'true' : 'false');
      if (existingName) {
        payload.append('fileName', existingName);
        payload.append('file_name', existingName);
      }

      if (cleanCookie) {
        payload.append('cookie', cleanCookie);
        if (typeof window !== 'undefined') {
          localStorage.setItem('eqpc_user_cookie', cleanCookie);
        }
      }

      const res = await updateEqpcServiceLog(payload);

      if (res && res.success) {
        // If Komatsu sync was requested but not confirmed
        if (editSyncToKomatsu && !res.komatsuUpdated) {
          setEditNotice({
            type: 'error',
            message: res.message || 'Komatsu portal update did not succeed. Please verify your session cookie.',
          });
          setShowCookieInput(true);
          return;
        }

        const normalizeToIso = (d) => {
          if (!d) return '';
          const s = String(d).trim();
          const slashM = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
          if (slashM) return `${slashM[3]}-${slashM[2].padStart(2, '0')}-${slashM[1].padStart(2, '0')}`;
          return s.slice(0, 10);
        };
        const targetIso = normalizeToIso(editingMilestone.date);
        const targetMonth = targetIso.slice(0, 7);

        // 1. In-place update of liveEqpData cache state
        setLiveEqpData((prevCache) => {
          if (!prevCache) return prevCache;
          const copy = JSON.parse(JSON.stringify(prevCache));
          const mKey = selectedMachine.machineNumber;
          if (copy.machines && copy.machines[mKey]) {
            if (res.isLastReportGenerated) {
              copy.machines[mKey].latestSmr = numSmr;
            }
            const mReports = copy.machines[mKey].reports || [];
            const target = mReports.find(
              (r) => r.eventCode === editingMilestone.code && (
                normalizeToIso(r.date) === targetIso ||
                normalizeToIso(r.rawDate) === targetIso ||
                normalizeToIso(r.date).slice(0, 7) === targetMonth
              )
            );
            if (target) {
              target.smr = numSmr;
            }
          }
          return copy;
        });

        // 2. In-place update of generatedReports state
        setGeneratedReports((prevReports) => {
          return prevReports.map((r) => {
            const mNum = String(r.machine_number || r.machine?.machineNumber || '').trim();
            const rCode = String(r.report_type || r.service_type || '').toUpperCase();
            const rIso = normalizeToIso(r.service_date || r.created_at);
            if (
              mNum === selectedMachine.machineNumber &&
              rCode.includes(editingMilestone.code) &&
              (rIso === targetIso || rIso.slice(0, 7) === targetMonth)
            ) {
              return { ...r, smr: numSmr };
            }
            return r;
          });
        });

        // 3. If this was the last report generated, update machine's SMR in system & frontend
        if (res.isLastReportGenerated) {
          setMachinesList((prev) =>
            prev.map((m) =>
              (m.machine_number === selectedMachine.machineNumber || m.machineNumber === selectedMachine.machineNumber)
                ? { ...m, last_smr: numSmr, latestSmr: numSmr }
                : m
            )
          );
        }

        const successNotice = res.isLastReportGenerated
          ? `✓ Service log for #${selectedMachine.machineNumber} (${editingMilestone.code}) updated to ${numSmr} hrs, and machine SMR updated in system.`
          : `✓ Service log for #${selectedMachine.machineNumber} (${editingMilestone.code}) updated to ${numSmr} hrs (older report: machine SMR preserved).`;

        setSyncStatusMsg(successNotice);
        setTimeout(() => setSyncStatusMsg(''), 7000);
        handleCloseEditModal();
        loadReportsData();
      } else {
        setEditNotice({ type: 'error', message: res?.message || 'Update failed' });
        if (editSyncToKomatsu) {
          setShowCookieInput(true);
        }
      }
    } catch (err) {
      setEditNotice({ type: 'error', message: err.message || 'Failed to update service log' });
      if (editSyncToKomatsu) {
        setShowCookieInput(true);
      }
    } finally {
      setIsUpdatingLog(false);
    }
  }

  const dismissedGapKeySet = useMemo(() => new Set(dismissedGapKeys), [dismissedGapKeys]);

  const dynamicRecords = useMemo(() => {
    return buildDynamicLifecycleRecords(generatedReports, machinesList, liveEqpData);
  }, [generatedReports, machinesList, liveEqpData]);

  const machines = useMemo(() => {
    return dynamicRecords.map((machine) => {
      const activeStrictGaps = (machine.strictGaps || []).filter(
        (gap) => !dismissedGapKeySet.has(getMonthlyGapKey(machine.machineNumber, gap))
      );
      const activeNonCreated = (machine.nonCreatedReports || []).filter(
        (gap) => !dismissedGapKeySet.has(getMonthlyGapKey(machine.machineNumber, gap))
      );
      const dismissedMonthlyGaps = (machine.monthlyGaps || []).filter(
        (gap) => dismissedGapKeySet.has(getMonthlyGapKey(machine.machineNumber, gap))
      );
      const hasStrictGap = activeStrictGaps.length > 0;
      const hasNonCreated = activeNonCreated.length > 0;
      const hasMonthlyGap = hasStrictGap || hasNonCreated;

      return {
        ...machine,
        activeStrictGaps,
        activeNonCreated,
        dismissedMonthlyGaps,
        hasStrictGap,
        hasNonCreated,
        hasMonthlyGap,
        hasLifecycleGap: machine.missingReports.length > 0 || hasStrictGap,
        status: hasStrictGap ? 'Historical Gaps' : (hasNonCreated ? 'Pending Monthly' : 'Lifecycle Current'),
        statusTone: hasStrictGap ? 'warning' : (hasNonCreated ? 'neutral' : 'ready'),
        nextAction: machine.nextAction,
      };
    });
  }, [dynamicRecords, dismissedGapKeySet]);

  const persistDismissedKeys = (keys) => {
    setDismissedGapKeys(keys);
    window.localStorage.setItem(DISMISSED_MONTHLY_GAPS_KEY, JSON.stringify(keys));
  };

  const handleDismissMonthlyGap = (machineNumber, gap) => {
    const key = getMonthlyGapKey(machineNumber, gap);
    if (dismissedGapKeySet.has(key)) return;
    persistDismissedKeys([...dismissedGapKeys, key]);
  };

  const handleRestoreMonthlyGap = (machineNumber, gap) => {
    const key = getMonthlyGapKey(machineNumber, gap);
    persistDismissedKeys(dismissedGapKeys.filter((dismissedKey) => dismissedKey !== key));
  };

  const engineerOptions = useMemo(() => {
    return [...new Set(machines.map((machine) => machine.responsibleEngineer).filter(Boolean))].sort();
  }, [machines]);

  const filteredMachines = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return machines.filter((machine) => {
      const matchesSearch = !query || machine.machineNumber.includes(query) || machine.model.toLowerCase().includes(query);
      const matchesModel = modelFilter === 'ALL' || machine.model === modelFilter;
      const matchesEngineer = filterEngineer === 'ALL' || machine.responsibleEngineer === filterEngineer;
      const matchesStatus = statusFilter === 'ALL' || machine.status === statusFilter;

      return matchesSearch && matchesModel && matchesEngineer && matchesStatus;
    });
  }, [machines, modelFilter, filterEngineer, searchTerm, statusFilter]);

  const selectedMachine = useMemo(
    () => machines.find((machine) => machine.machineNumber === selectedMachineNumber) || filteredMachines[0],
    [filteredMachines, machines, selectedMachineNumber]
  );

  const stats = useMemo(() => {
    const total = machines.length || 1;
    const pdiDone = machines.filter((m) => m.preDeliveryDate).length;
    const delDone = machines.filter((m) => m.deliveryDate).length;
    const s1Done = machines.filter((m) => m.firstServiceDate).length;
    const s2Done = machines.filter((m) => m.secondServiceDate).length;
    const s3Done = machines.filter((m) => m.thirdServiceDate).length;
    const strictGaps = machines.reduce((total, machine) => total + (machine.activeStrictGaps?.length || 0), 0);
    const nonCreated = machines.reduce((total, machine) => total + (machine.activeNonCreated?.length || 0), 0);
    const dismissedMonthlyGaps = machines.reduce((total, machine) => total + machine.dismissedMonthlyGaps.length, 0);

    return {
      total: machines.length,
      pdiDone,
      delDone,
      s1Done,
      s2Done,
      s3Done,
      strictGaps,
      nonCreated,
      dismissedMonthlyGaps,
    };
  }, [machines]);

  const modelOptions = useMemo(() => {
    return [...new Set(machines.map((machine) => machine.model))].sort();
  }, [machines]);

  const selectedTimelineItems = useMemo(() => {
    if (!selectedMachine) return [];
    return buildTimelineItems(selectedMachine);
  }, [selectedMachine]);

  return (
    <SystemShell
      activePath="/eqp/lifecycle"
      eyebrow="Komatsu EQP Platform"
      title="Machine Lifecycle & Service Tracker"
      description="Interactive milestone timeline, service stage progression, and monthly gap verification across the fleet."
      actions={
        <div className="flex items-center gap-2">
          {liveEqpData?.lastSync && (
            <span className="text-[11px] text-emerald-400 font-medium hidden md:inline">
              ● Live Data: {new Date(liveEqpData.lastSync).toLocaleTimeString()}
            </span>
          )}
          <Badge tone={liveEqpData ? 'ready' : 'neutral'} size="sm">
            {liveEqpData ? `Live EQP: ${Object.keys(liveEqpData.machines || {}).length} units` : `${generatedReports.length} Reports Synced`}
          </Badge>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={loadReportsData}
            disabled={loadingReports || isSyncingLive}
          >
            {loadingReports ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => handleSyncLive()}
            disabled={loadingReports || isSyncingLive}
          >
            {isSyncingLive && !singleSyncMachine ? 'Syncing Live EQP...' : '⚡ Sync Live from EQP Care'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <EqpNav />

        {syncStatusMsg && (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50/90 border border-blue-200 text-blue-900 text-xs font-medium shadow-xs">
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${isSyncingLive ? 'bg-blue-600 animate-ping' : 'bg-emerald-600'}`} />
              <span>{syncStatusMsg}</span>
            </div>
            {isSyncingLive && (
              <span className="text-[11px] font-semibold text-blue-700">Connecting strictly read-only to Komatsu...</span>
            )}
          </div>
        )}

        {/* Fleet Milestone Funnel Bar */}
        <Card className="p-4 bg-slate-900 text-white border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
            <div>
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Fleet Factory Milestone Progression</h3>
              <p className="text-[11px] text-slate-400">Completion rate of standard Komatsu lifecycle intervals across {stats.total} units</p>
            </div>
            <Badge tone="live" size="sm">Active Tracking</Badge>
          </div>


          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center">
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
              <p className="text-[10px] font-bold uppercase text-slate-400">Pre-Delivery (PDI)</p>
              <p className="text-xl font-extrabold text-amber-400 mt-1">{stats.pdiDone}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{Math.round((stats.pdiDone / (stats.total || 1)) * 100)}% Verified</p>
            </div>
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
              <p className="text-[10px] font-bold uppercase text-slate-400">Delivery New</p>
              <p className="text-xl font-extrabold text-sky-400 mt-1">{stats.delDone}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{Math.round((stats.delDone / (stats.total || 1)) * 100)}% Delivered</p>
            </div>
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
              <p className="text-[10px] font-bold uppercase text-slate-400">1st Service (250h)</p>
              <p className="text-xl font-extrabold text-emerald-400 mt-1">{stats.s1Done}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{Math.round((stats.s1Done / (stats.total || 1)) * 100)}% Done</p>
            </div>
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700">
              <p className="text-[10px] font-bold uppercase text-slate-400">2nd Service (500h)</p>
              <p className="text-xl font-extrabold text-indigo-400 mt-1">{stats.s2Done}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{Math.round((stats.s2Done / (stats.total || 1)) * 100)}% Done</p>
            </div>
            <div className="bg-slate-800/80 rounded-xl p-3 border border-rose-900/60 bg-rose-950/20">
              <p className="text-[10px] font-bold uppercase text-rose-400">Strict Gaps</p>
              <p className={`text-xl font-extrabold mt-1 ${stats.strictGaps > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {stats.strictGaps}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Between Reports</p>
            </div>
            <div className="bg-slate-800/80 rounded-xl p-3 border border-amber-900/40 bg-amber-950/20">
              <p className="text-[10px] font-bold uppercase text-amber-400">Non-Created</p>
              <p className="text-xl font-extrabold text-amber-300 mt-1">
                {stats.nonCreated}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Pending to Current Mo.</p>
            </div>
          </div>
        </Card>

        {/* Main Grid: Machine List & Interactive Detail Timeline Card */}
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(420px,0.8fr)]">
          {/* Table Card */}
          <Card className="overflow-hidden">
            <div className="border-b border-slate-200 p-5 bg-slate-50/70 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Tracked Fleet Assets</h3>
                  <p className="text-xs text-slate-500">Click any machine to inspect its visual milestone timeline</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={liveEqpData ? 'ready' : 'neutral'}>
                    {liveEqpData ? `Live: ${Object.keys(liveEqpData.machines || {}).length} units` : `${filteredMachines.length} Units`}
                  </Badge>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleSyncLive()}
                    disabled={loadingReports || isSyncingLive}
                    className="shadow-sm font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                  >
                    {isSyncingLive && !singleSyncMachine ? '⏳ Syncing All Fleet...' : '⚡ Sync All Fleet from Komatsu EQP Care'}
                  </Button>
                </div>
              </div>

              {/* Engineer Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/60">
                <span className="text-xs font-bold text-slate-500 mr-1">Engineer:</span>
                <button
                  type="button"
                  onClick={() => setFilterEngineer('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    filterEngineer === 'ALL'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  All ({machines.length})
                </button>

                {engineerOptions.map((eng) => {
                  const count = machines.filter((m) => m.responsibleEngineer === eng).length;
                  const isSelected = filterEngineer === eng;
                  return (
                    <button
                      key={eng}
                      type="button"
                      onClick={() => setFilterEngineer(eng)}
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

              {/* Filter Row */}
              <div className="grid gap-2 sm:grid-cols-[1.5fr_1fr_1fr]">
                <input
                  type="text"
                  placeholder="Search machine ID or model..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="ds-input text-xs"
                />
                <select value={modelFilter} onChange={(event) => setModelFilter(event.target.value)} className="ds-input text-xs">
                  <option value="ALL">All Models</option>
                  {modelOptions.map((model) => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="ds-input text-xs">
                  <option value="ALL">All Statuses</option>
                  <option value="Follow-up Required">Follow-up Required</option>
                  <option value="Lifecycle Current">Lifecycle Current</option>
                </select>
              </div>
            </div>

            {filteredMachines.length === 0 ? (
              <div className="p-8">
                <EmptyState title="No lifecycle records found" description="Adjust your filters to see machine assets." />
              </div>
            ) : (
              <div className="ds-table-wrap">
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th>Machine</th>
                      <th>Model</th>
                      <th>Latest Run</th>
                      <th>Delivery</th>
                      <th>3rd Service</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMachines.map((machine) => {
                      const isSelected = selectedMachine?.machineNumber === machine.machineNumber;
                      return (
                        <tr
                          key={machine.machineNumber}
                          className={`cursor-pointer transition-colors ${isSelected ? '!bg-amber-50/70 font-semibold' : 'hover:bg-slate-50/60'}`}
                          onClick={() => setSelectedMachineNumber(machine.machineNumber)}
                        >
                          <td className="font-bold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <span>{machine.machineNumber}</span>
                              {machine.isLiveEqpc && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800" title="Pulled directly from live Komatsu Equipment Care">
                                  LIVE
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="text-slate-700">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-semibold">
                              {machine.model}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-800">{machine.latestReportType}</span>
                              {machine.latestSmr != null && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200">
                                  {machine.latestSmr} hrs
                                </span>
                              )}
                            </div>
                            <span className="block text-[0.6875rem] font-mono text-slate-400">{formatLifecycleDate(machine.latestReportDate)}</span>
                          </td>
                          <td className="text-xs text-slate-600">
                            <div>{formatLifecycleDate(machine.deliveryDate)}</div>
                            {machine.deliverySmr != null && (
                              <span className="text-[10px] font-mono text-slate-500 font-semibold">{machine.deliverySmr} hrs</span>
                            )}
                          </td>
                          <td className="text-xs text-slate-600">
                            <div>{formatLifecycleDate(machine.thirdServiceDate)}</div>
                            {machine.thirdServiceSmr != null && (
                              <span className="text-[10px] font-mono text-slate-500 font-semibold">{machine.thirdServiceSmr} hrs</span>
                            )}
                          </td>
                          <td>
                            <Badge tone={machine.statusTone}>{machine.status}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Selected Machine Interactive Detail Timeline Card */}
          {selectedMachine ? (
            <Card className="p-6 h-fit space-y-5">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-extrabold text-base border border-amber-500/20">
                    🚜
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedMachine.model} #{selectedMachine.machineNumber}</h2>
                    <p className="text-xs text-slate-500">
                      Lead: <span className="font-semibold text-slate-800">{selectedMachine.responsibleEngineer || 'Service Engineer'}</span>
                      {selectedMachine.machineId && (
                        <span className="ml-2 font-mono text-[10px] text-slate-400">EQP ID: {selectedMachine.machineId}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1.5">
                    {selectedMachine.isLiveEqpc && (
                      <Badge tone="live" size="sm">⚡ Live EQP</Badge>
                    )}
                    <Badge tone={selectedMachine.statusTone}>{selectedMachine.latestReportCode}</Badge>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="xs"
                    onClick={() => handleSyncLive(selectedMachine.machineNumber)}
                    disabled={isSyncingLive || loadingReports}
                    className="text-xs bg-sky-50 text-sky-800 border border-sky-300 hover:bg-sky-100 font-bold px-2.5 py-1 rounded-lg shadow-2xs cursor-pointer"
                  >
                    {isSyncingLive && singleSyncMachine === selectedMachine.machineNumber ? '⏳ Syncing...' : '↻ Sync from Komatsu'}
                  </Button>
                </div>
              </div>

              {/* Visual Lifecycle Milestone Stepper */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Standard Lifecycle Stepper</p>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <LifecycleMilestoneProgressBar milestones={selectedMachine.milestones} />
                </div>
              </div>

              {/* Recommended Next Action */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Recommended Next Step</p>
                  <div className="flex items-center gap-2">
                    {selectedMachine.hasMonthlyGap && (
                      <Link
                        href={`/eqp/gap-reports?machine=${selectedMachine.machineNumber}`}
                        className="text-[11px] font-bold text-amber-800 bg-amber-200/70 hover:bg-amber-200 px-2 py-0.5 rounded transition"
                      >
                        Fill Gaps Studio →
                      </Link>
                    )}
                    <Link
                      href="/eqp/generate-reports"
                      className="text-[11px] font-bold text-amber-700 hover:underline"
                    >
                      Open Builder →
                    </Link>
                  </div>
                </div>
                <p className="text-xs text-slate-800 font-medium leading-relaxed">{selectedMachine.nextAction}</p>
              </div>

              {/* 1. Strict Gaps Drawer (Months missing strictly BETWEEN existing reports) */}
              {selectedMachine.activeStrictGaps?.length > 0 && (
                <div className="rounded-xl border border-rose-300 bg-rose-50/80 p-4 space-y-3">
                  <div className="flex w-full items-center justify-between text-left">
                    <div>
                      <span className="text-xs font-bold uppercase text-rose-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                        Strict Gaps Between Reports ({selectedMachine.activeStrictGaps.length})
                      </span>
                      <p className="text-[11px] text-rose-700 mt-0.5">
                        Missing months situated between uploaded reports. Automatically inherits the preceding SMR.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {selectedMachine.activeStrictGaps.map((gap) => {
                      const precSmr = gap.precedingSmr != null ? gap.precedingSmr : (selectedMachine.latestSmr ?? '');
                      return (
                        <div key={`strict-${gap.code}-${gap.month}`} className="flex items-center justify-between rounded-lg bg-white p-2.5 text-xs border border-rose-200 shadow-2xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{gap.type}</span>
                              <span className="font-mono text-slate-500">{gap.code} ({formatLifecycleMonth(gap.month)})</span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-500 font-medium">
                              <span>Preceding SMR:</span>
                              <span className="font-bold text-amber-800 bg-amber-50 px-1 rounded border border-amber-200">
                                {gap.precedingSmr != null ? `${gap.precedingSmr} hrs` : `${selectedMachine.latestSmr ?? 0} hrs`}
                              </span>
                              {gap.precedingDate && (
                                <span className="text-slate-400 font-mono">(from {formatLifecycleDate(gap.precedingDate)})</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/eqp/gap-reports?machine=${selectedMachine.machineNumber}&month=${gap.month}&serviceType=${encodeURIComponent(gap.type)}&smr=${precSmr}&updateCounters=false`}
                              className="rounded-md bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-700 transition shadow-2xs"
                            >
                              Fill Gap →
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDismissMonthlyGap(selectedMachine.machineNumber, gap)}
                              className="rounded-md bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-900 hover:bg-rose-200 transition"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Non-Created Reports Drawer (Pending months from latest report up to current month) */}
              {selectedMachine.activeNonCreated?.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                  <button
                    type="button"
                    onClick={() => setMonthlyListOpen((isOpen) => !isOpen)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <div>
                      <span className="text-xs font-bold uppercase text-amber-900">
                        Non-Created Reports ({selectedMachine.activeNonCreated.length})
                      </span>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        Pending sequential months through current month. Creates standard reports affecting SMR and counters.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-amber-800 hover:underline">
                      {monthlyListOpen ? 'Hide' : 'Show'}
                    </span>
                  </button>
                  {monthlyListOpen && (
                    <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
                      {selectedMachine.activeNonCreated.map((gap) => (
                        <div key={`noncreated-${gap.code}-${gap.month}`} className="flex items-center justify-between rounded-lg bg-white p-2.5 text-xs border border-amber-200 shadow-2xs">
                          <div>
                            <span className="font-semibold text-slate-900">{gap.type}</span>
                            <span className="ml-2 font-mono text-slate-500">{gap.code} ({formatLifecycleMonth(gap.month)})</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Link
                              href={`/eqp/gap-reports?machine=${selectedMachine.machineNumber}&month=${gap.month}&serviceType=${encodeURIComponent(gap.type)}&updateCounters=true`}
                              className="rounded-md bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-amber-600 transition shadow-2xs"
                            >
                              Create Report →
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleDismissMonthlyGap(selectedMachine.machineNumber, gap)}
                              className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 transition"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Dismissed Monthly Reports */}
              {selectedMachine.dismissedMonthlyGaps.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <button
                    type="button"
                    onClick={() => setDismissedListOpen((isOpen) => !isOpen)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <span className="text-xs font-bold uppercase text-slate-500">
                      Dismissed Monthly Gaps ({selectedMachine.dismissedMonthlyGaps.length})
                    </span>
                    <span className="text-xs font-bold text-slate-600 hover:underline">
                      {dismissedListOpen ? 'Hide' : 'Show'}
                    </span>
                  </button>
                  {dismissedListOpen && (
                    <div className="mt-3 space-y-2">
                      {selectedMachine.dismissedMonthlyGaps.map((gap) => (
                        <div key={`${gap.code}-${gap.month}`} className="flex items-center justify-between rounded bg-white p-2.5 text-xs border border-slate-200">
                          <div>
                            <span className="font-semibold text-slate-800">{gap.type}</span>
                            <span className="ml-2 font-mono text-slate-400">{gap.code} ({formatLifecycleMonth(gap.month)})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRestoreMonthlyGap(selectedMachine.machineNumber, gap)}
                            className="rounded bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 transition"
                          >
                            Restore
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Chronological Timeline Feed */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500">Service Events Timeline</p>
                    {selectedTimelineMilestones.size > 0 && (
                      <span className="text-[11px] text-amber-700 font-bold">
                        {selectedTimelineMilestones.size} selected
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400 font-semibold">{selectedTimelineItems.length} Reports</span>
                    {selectedTimelineItems.filter((m) => m.date).length > 0 && (
                      <div className="flex items-center gap-1.5">
                        {selectedTimelineMilestones.size > 0 ? (
                          <button
                            type="button"
                            onClick={handleClearTimelineMilestones}
                            className="text-[11px] text-slate-500 hover:text-slate-700 font-medium hover:underline cursor-pointer mr-1"
                          >
                            Clear
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSelectAllTimelineMilestones(selectedTimelineItems.filter((m) => m.date))}
                            className="text-[11px] text-amber-700 hover:text-amber-800 font-bold hover:underline cursor-pointer mr-1"
                          >
                            Select All
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenBatchEditModal(selectedTimelineItems.filter((m) => m.date))}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition-colors shadow-2xs cursor-pointer"
                          title="Batch edit SMRs for selected reports"
                        >
                          <span>✏️</span>
                          <span>
                            {selectedTimelineMilestones.size > 0
                              ? `Batch Edit (${selectedTimelineMilestones.size})`
                              : 'Batch Edit SMRs'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="relative pl-5 space-y-2.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 max-h-72 overflow-y-auto pr-1">
                  {selectedTimelineItems.map((milestone) => {
                    const mKey = milestone.id || `${milestone.code}-${milestone.date}`;
                    const isChecked = milestone.date ? selectedTimelineMilestones.has(mKey) : false;
                    return (
                      <div
                        key={milestone.id}
                        className={`relative group flex items-center justify-between rounded-lg border p-2.5 bg-white text-xs shadow-2xs transition-colors ${
                          isChecked
                            ? 'border-amber-400 ring-1 ring-amber-400/50 bg-amber-50/20'
                            : 'border-slate-200 hover:border-amber-300'
                        }`}
                      >
                        <span className={`absolute -left-5 top-3 w-2 h-2 rounded-full ring-4 ring-white ${milestone.date ? 'bg-amber-500' : 'bg-slate-300'}`} />
                        <div className="flex items-center gap-2">
                          {milestone.date && (
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleTimelineMilestone(mKey)}
                              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                              title="Select for batch edit"
                            />
                          )}
                          <div>
                            <p className="font-bold text-slate-900">{milestone.label}</p>
                            <p className="font-mono text-slate-400 text-[10px]">{milestone.code}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {milestone.smr != null ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-200" title="Equipment Operating Hours">
                              {milestone.smr} hrs
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-50 border border-slate-200" title="Operating hours not stamped">
                              - hrs
                            </span>
                          )}
                          <span className="font-semibold text-slate-700 font-mono text-[11px]">
                            {formatLifecycleDate(milestone.date)}
                          </span>
                          {milestone.date && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(milestone);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600 hover:text-amber-900 bg-slate-100 hover:bg-amber-100 border border-slate-200 hover:border-amber-300 transition-colors cursor-pointer ml-1"
                              title="Edit SMR & Report in-place"
                            >
                              <span>✏️</span>
                              <span>Edit SMR</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[11px] font-bold uppercase text-slate-400">Total Add Services</p>
                  <p className="text-xl font-extrabold text-slate-900 mt-0.5">{selectedMachine.addServiceCount}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[11px] font-bold uppercase text-slate-400">Current SMR</p>
                  <p className="text-xl font-extrabold text-slate-900 mt-0.5">{selectedMachine.latestSmr ?? '-'}</p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center">
              <EmptyState title="No machine selected" description="Select a machine from the left table to view timeline details." />
            </Card>
          )}
        </section>

        {/* In-Place Service Log & SMR Editing Modal */}
        {editingMilestone && selectedMachine && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
              <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold text-base border border-amber-500/20">
                    ✏️
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Edit Service Log & SMR</h3>
                    <p className="text-xs text-slate-500">
                      In-place update for {selectedMachine.model} #{selectedMachine.machineNumber}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  disabled={isUpdatingLog}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveServiceLogUpdate} className="p-5 space-y-4">
                {/* Event Details Card */}
                <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Service Event</span>
                    <span className="font-bold text-slate-800">{editingMilestone.label}</span>
                    <span className="ml-1 font-mono text-slate-500">({editingMilestone.code})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Service Date</span>
                    <span className="font-semibold text-slate-700 font-mono">
                      {formatLifecycleDate(editingMilestone.date)}
                    </span>
                  </div>
                </div>

                {/* SMR Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Operating Hours (SMR) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={editSmrValue}
                      onChange={(e) => setEditSmrValue(e.target.value)}
                      placeholder="e.g. 15"
                      className="ds-input pr-12 font-mono font-bold text-sm"
                      disabled={isUpdatingLog}
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold pointer-events-none">
                      hrs
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Current recorded value: <span className="font-semibold text-slate-600">{editingMilestone.smr != null ? `${editingMilestone.smr} hrs` : 'Not recorded'}</span>.
                    The existing service log will be updated in place without creating a duplicate record.
                  </p>
                </div>

                {/* Automated Replacement Report Creation Banner */}
                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <span>📄</span>
                    <span>Automated Replacement Report PDF</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    The replacement inspection report will be created automatically on its own, exactly matching the uploaded report with the new SMR ({editSmrValue || '...'} hrs) and preserving machine specifications, customer, date, inspector, and comments.
                  </p>
                  <p className="text-[10px] text-emerald-800 font-semibold flex items-center gap-1 pt-0.5">
                    <span>🛡️</span>
                    <span>
                      If this is the last report generated, the machine's SMR in our system will be updated to {editSmrValue || '...'} hrs. Older reports will update that log only while preserving the machine SMR.
                    </span>
                  </p>
                </div>

                {/* Direct Komatsu Sync Checkbox & Cookie Manager */}
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="syncToEqpcCheckbox"
                      checked={editSyncToKomatsu}
                      onChange={(e) => setEditSyncToKomatsu(e.target.checked)}
                      className="mt-0.5 rounded border-blue-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      disabled={isUpdatingLog}
                    />
                    <label htmlFor="syncToEqpcCheckbox" className="text-xs text-blue-900 cursor-pointer flex-1">
                      <span className="font-bold block">Sync in-place to Komatsu Equipment Care</span>
                      <span className="text-[11px] text-blue-700 block mt-0.5">
                        Updates the existing service record directly on the Komatsu portal (<code className="font-mono text-[10px] bg-blue-100 px-1 rounded">actionMode=update</code>).
                      </span>
                    </label>
                  </div>

                  {editSyncToKomatsu && (
                    <div className="pt-2 border-t border-blue-200/60 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                          {editCookieInput && !editCookieInput.includes('test_session') ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                              Komatsu Session Cookie Configured
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-amber-700 font-bold text-[11px]">
                              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                              Active Session Cookie Required
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowCookieInput((prev) => !prev)}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                        >
                          {showCookieInput ? 'Hide Cookie' : (editCookieInput && !editCookieInput.includes('test_session') ? 'Edit / View Cookie' : 'Paste Cookie')}
                        </button>
                      </div>

                      {showCookieInput && (
                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-slate-600">
                            Komatsu Session Cookie / JSESSIONID:
                          </label>
                          <textarea
                            rows="2"
                            value={editCookieInput}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditCookieInput(val);
                              if (typeof window !== 'undefined' && val) {
                                localStorage.setItem('eqpc_user_cookie', val.trim());
                              }
                            }}
                            placeholder="Paste JSESSIONID=... or cURL header here"
                            className="w-full text-xs font-mono p-2 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            disabled={isUpdatingLog}
                          />
                          <p className="text-[10px] text-slate-500">
                            Tip: In Edge/Chrome on Komatsu portal, press F12 → Network → copy cookie header with <code className="font-mono">JSESSIONID</code>.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Error / Notice Display */}
                {editNotice.message && (
                  <div className={`p-3 rounded-xl text-xs font-medium ${editNotice.type === 'error' ? 'bg-rose-50 border border-rose-200 text-rose-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'}`}>
                    {editNotice.message}
                  </div>
                )}

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleCloseEditModal}
                    disabled={isUpdatingLog}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isUpdatingLog || !editSmrValue}
                    className="font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                  >
                    {isUpdatingLog ? '⏳ Updating Log...' : 'Save & Update SMR'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Batch Edit SMRs Modal */}
        <BatchEditSmrModal
          isOpen={batchEditModalOpen}
          onClose={() => setBatchEditModalOpen(false)}
          reports={batchEditReports}
          onBatchUpdated={handleBatchUpdated}
        />
      </div>
    </SystemShell>
  );
}

function getMonthlyGapKey(machineNumber, gap) {
  return `${machineNumber}:${gap.code}:${gap.month}`;
}

function buildNextAction(missingReports, monthlyGaps) {
  if (missingReports.length && monthlyGaps.length) {
    return `Create missing lifecycle report(s), then close ${monthlyGaps.length} monthly storage gap(s).`;
  }

  if (monthlyGaps.length) {
    const nextGap = monthlyGaps[0];
    return `Generate ${nextGap.code} for ${formatLifecycleMonth(nextGap.month)} or dismiss if intentionally skipped.`;
  }

  if (missingReports.length) {
    return `Generate certified report(s): ${missingReports.join(', ')}.`;
  }

  return 'Lifecycle tracking is current and all service cycles are validated.';
}

function buildTimelineItems(machine) {
  if (!machine || !Array.isArray(machine.observedReports)) return [];

  // Map all observed reports directly so EVERY single report has its exact code, date, SMR, and label
  const items = machine.observedReports
    .filter(([, date]) => Boolean(date && String(date).trim()))
    .map(([code, date, smr, eventName], idx) => {
      let label = eventName || '';
      if (!label) {
        if (code === 'W41P') label = 'Pre Delivery';
        else if (code === 'W41N') label = 'Delivery';
        else if (code === 'W411') label = '1st Service';
        else if (code === 'W412') label = '2nd Service';
        else if (code === 'W413') label = '3rd Service';
        else if (code === 'W30') label = 'Storage Operation';
        else if (code === 'W41X') label = 'Add. Service';
        else label = code;
      }

      const numericSmr = smr != null && !isNaN(Number(smr)) ? Number(smr) : null;

      return {
        id: `report-${code}-${date}-${idx}`,
        label,
        code,
        date: String(date).trim(),
        smr: numericSmr,
        sortDate: String(date).trim(),
      };
    });

  // Also include pending factory milestones if they have no date
  for (const m of (machine.milestones || [])) {
    if (!m.date) {
      items.push({
        id: `milestone-${m.code}-pending`,
        label: m.label,
        code: m.code,
        date: null,
        smr: null,
        sortDate: '0000-00-00',
      });
    }
  }

  // Sort descending by date (newest service event on top)
  return items.sort((a, b) => (b.sortDate || '').localeCompare(a.sortDate || ''));
}
