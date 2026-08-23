'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import SystemShell from '../../../components/SystemShell';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Skeleton from '../../../components/ui/Skeleton';
import Toast from '../../../components/ui/Toast';
import { getFleetSummary } from '../../../lib/api';

const TABS = [
  { id: 'greasing', label: 'Greasing & Bushings Matrix', icon: '🛢️', desc: '123-machine monthly compliance heatmap & standard bushing costs' },
  { id: 'fan_pumps', label: 'D155A-6 Fan Pump Lifecycle', icon: '🔄', desc: 'Fan pump & motor rotations between dozers, pressures & benchmark costs' },
  { id: 'wear', label: 'Filter & GET Wear Lifespans', icon: '📊', desc: 'Internal/external air filters, radiator lifespans & operating hour benchmarks' },
  { id: 'ripper', label: 'Ripper Teeth Warehouse Stock', icon: '📦', desc: 'Live inventory stock counts, replacement history & pin tracking' },
  { id: 'cylinders', label: 'Excavator Hydraulic Cylinders', icon: '🛠️', desc: 'Bucket, arm, and boom cylinder health matrix & seal kit part numbers' },
];

const SITE_COLORS = {
  desire: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
  sabah: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
  tricon: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/50',
  salmi: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
  landfill: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
  '7th ring': 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/50',
  idle: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800',
  'not work': 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50',
};

function getSiteStyle(status) {
  if (!status) return 'bg-slate-50 dark:bg-slate-900 text-slate-400 border-transparent';
  const lower = String(status).toLowerCase();
  for (const [k, v] of Object.entries(SITE_COLORS)) {
    if (lower.includes(k)) return v;
  }
  return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50';
}

export default function FleetAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('greasing');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [toast, setToast] = useState(null);

  // Greasing Tab Filters
  const [searchSerial, setSearchSerial] = useState('');
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        setLoading(true);
        const res = await getFleetSummary();
        if (!ignore) {
          setData(res.data || {});
        }
      } catch (err) {
        if (!ignore) {
          setToast({ type: 'error', message: err.message || 'Failed to load fleet analytics.' });
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadData();
    return () => { ignore = true; };
  }, []);

  const greasing = data?.greasing || { months: [], machines: [], bushingPins: [] };
  const fanPumps = data?.fanPumps || { rotations: [], technicalBenchmarks: {} };
  const wear = data?.wear || { items: [], airFilters: [], benchmarkComparison: [] };
  const ripper = data?.ripper || { stock: {}, log: [], totalStockCount: 0 };
  const cylinders = data?.cylinders || { inspections: [], sealKits: [] };

  // Filtered Greasing Machines
  const filteredGreasingMachines = useMemo(() => {
    return (greasing.machines || []).filter((m) => {
      if (searchSerial && !m.serial.toLowerCase().includes(searchSerial.toLowerCase())) {
        return false;
      }
      if (selectedCategoryFilter !== 'ALL' && m.category !== selectedCategoryFilter) {
        return false;
      }
      if (selectedSiteFilter !== 'ALL') {
        const latestMonth = greasing.months[greasing.months.length - 1];
        const status = m.history?.[latestMonth] || '';
        if (!status.toLowerCase().includes(selectedSiteFilter.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [greasing.machines, greasing.months, searchSerial, selectedSiteFilter, selectedCategoryFilter]);

  return (
    <SystemShell
      activePath="/management/fleet-analytics"
      eyebrow="Fleet & Component Lifecycle Intelligence"
      title="Fleet Analytics & Component Lifecycle Hub"
      description="Preserved and enhanced Greasing Compliance Heatmap, D155A-6 Fan Pump Rotations, GET/Filter Wear Lifespans, Ripper Inventory & Cylinder Matrix."
      actions={
        <div className="flex items-center gap-2">
          <Link href="/management/sheets-hub" className="ds-button ds-button-secondary text-xs flex items-center gap-1.5">
            <span>📂</span> Master Sheets Hub
          </Link>
          <Link href="/management" className="ds-button ds-button-secondary text-xs">
            Management Hub
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Executive Summary Grid */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div className="ds-card p-4 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Fleet Greasing Matrix</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {loading ? <Skeleton className="h-7 w-12" /> : `${greasing.machines?.length || 123}`}
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Heavy machines tracked</div>
          </div>

          <div className="ds-card p-4 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Historical Timeline</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {loading ? <Skeleton className="h-7 w-12" /> : `${greasing.months?.length || 26} Mo`}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">2024-07 to 2026-08</div>
          </div>

          <div className="ds-card p-4 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Fan Pump Rotations</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {loading ? <Skeleton className="h-7 w-12" /> : `${fanPumps.rotations?.length || 9}`}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">D155A-6 swap audits</div>
          </div>

          <div className="ds-card p-4 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Ripper Warehouse Stock</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {loading ? <Skeleton className="h-7 w-12" /> : `${ripper.totalStockCount || 176}`}
            </div>
            <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Hensley, Jdaemi & CAT</div>
          </div>

          <div className="ds-card p-4 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">PC350LC Cylinders</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {loading ? <Skeleton className="h-7 w-12" /> : `${cylinders.inspections?.length || 6}`}
            </div>
            <div className="text-xs text-cyan-600 dark:text-cyan-400 mt-0.5">Hydraulic health matrix</div>
          </div>
        </section>

        {/* Tab Navigation Ribbon */}
        <section className="ds-card p-1.5 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex flex-wrap gap-1">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    active
                      ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* TAB 1: GREASING & BUSHINGS */}
        {activeTab === 'greasing' && (
          <div className="space-y-6">
            <Card className="p-6 border border-slate-200/80 dark:border-slate-800">
              {/* Header & Controls */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🛢️</span>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Fleet Greasing Compliance Heatmap Matrix
                    </h2>
                    <Badge tone="live">123 Machines</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Monthly deployment tracking, active project sites, idle status, and scheduled lubrication audits.
                  </p>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search Machine # (e.g. 711)..."
                      value={searchSerial}
                      onChange={(e) => setSearchSerial(e.target.value)}
                      className="ds-input pl-8 text-xs py-1.5 min-w-[190px]"
                    />
                    <span className="absolute left-2.5 top-2 text-xs text-slate-400">🔍</span>
                  </div>

                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="ds-input text-xs py-1.5"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="Rental">Rental Fleet</option>
                    <option value="Landfill">Landfill Fleet</option>
                    <option value="7th Ring">7th Ring Fleet</option>
                  </select>

                  <select
                    value={selectedSiteFilter}
                    onChange={(e) => setSelectedSiteFilter(e.target.value)}
                    className="ds-input text-xs py-1.5"
                  >
                    <option value="ALL">All Project Sites</option>
                    <option value="Desire">Desire Site</option>
                    <option value="Sabah">Sabah Site</option>
                    <option value="Tricon">Tricon Site</option>
                    <option value="Salmi">Salmi / Landfill</option>
                    <option value="7th Ring">7th Ring Site</option>
                    <option value="Idle">Idle / Not Work</option>
                  </select>
                </div>
              </div>

              {/* Site Legend Bar */}
              <div className="mt-3.5 flex flex-wrap items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-[11px]">
                <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider mr-1">Sites Legend:</span>
                <span className="px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 font-semibold">● Desire</span>
                <span className="px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-semibold">● Sabah</span>
                <span className="px-2 py-0.5 rounded border border-purple-200 dark:border-purple-900/60 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-400 font-semibold">● Tricon</span>
                <span className="px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-semibold">● Landfill / Salmi</span>
                <span className="px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-900/60 bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 font-semibold">● 7th Ring</span>
                <span className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">● Idle</span>
              </div>

              {/* Heatmap Matrix Table */}
              <div className="mt-4 overflow-x-auto max-h-[520px] overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold">
                      <th className="py-2.5 px-3 sticky left-0 bg-slate-100 dark:bg-slate-800 z-20 shadow-xs">
                        Machine Serial
                      </th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Fleet Category</th>
                      {greasing.months.map((m) => (
                        <th key={m} className="py-2.5 px-2 text-center whitespace-nowrap font-mono text-[11px]">
                          {m}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                    {filteredGreasingMachines.map((mach, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-3 font-bold sticky left-0 bg-white dark:bg-slate-900 z-10 font-mono shadow-xs text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800">
                          #{mach.serial}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap text-slate-500">{mach.category}</td>
                        {greasing.months.map((m) => {
                          const siteStatus = mach.history?.[m] || '';
                          const style = getSiteStyle(siteStatus);

                          return (
                            <td key={m} className="py-1.5 px-1 text-center">
                              {siteStatus ? (
                                <span
                                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border truncate max-w-[85px] ${style}`}
                                  title={`Machine ${mach.serial} (${m}): ${siteStatus}`}
                                >
                                  {siteStatus}
                                </span>
                              ) : (
                                <span className="text-slate-300 dark:text-slate-700">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Bushing & Pin Maintenance Standards Table */}
            <Card className="p-6 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔩</span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Bucket, Arm & Link Bushings Maintenance Standards
                    </h3>
                    <Badge tone="ready">Parts Standard</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Standard bushing part numbers, replacement position, quantities, and unit/total cost in KWD.
                  </p>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                      <th className="py-2.5 px-3">Position</th>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3">Part Number</th>
                      <th className="py-2.5 px-3 text-center">Quantity</th>
                      <th className="py-2.5 px-3 text-right">Unit Cost (KD)</th>
                      <th className="py-2.5 px-3 text-right">Total Cost (KD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {greasing.bushingPins.map((bp, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-sans font-medium text-slate-900 dark:text-white">{bp.position}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-600 dark:text-slate-300">{bp.description}</td>
                        <td className="py-2.5 px-3 font-bold text-amber-600 dark:text-amber-400">{bp.partNo}</td>
                        <td className="py-2.5 px-3 text-center">{bp.qty}</td>
                        <td className="py-2.5 px-3 text-right">{bp.unitPriceKd?.toFixed(2)} KD</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {bp.totalKd?.toFixed(2)} KD
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: FAN PUMPS D155A-6 */}
        {activeTab === 'fan_pumps' && (
          <div className="space-y-6">
            <Card className="p-6 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔄</span>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      D155A-6 Fan Pump & Motor Component Rotation Flow
                    </h2>
                    <Badge tone="live">Lifecycle Flow</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track hydraulic component swap sequences, pressure tolerances, and overhaul benchmarks between dozers.
                  </p>
                </div>
              </div>

              {/* Technical Benchmarks Bar */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pump Pressure Target</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">1,350 PSI</div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400">Standard operating benchmark</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Control Valve Pressure</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">200 PSI</div>
                  <div className="text-[11px] text-blue-600 dark:text-blue-400">Pilot line tolerance</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Safety Valve Rating</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">50 PSI</div>
                  <div className="text-[11px] text-purple-600 dark:text-purple-400">Relief threshold</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Unit Value</div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">1,300 KWD</div>
                  <div className="text-[11px] text-slate-500">Replacement cost estimate</div>
                </div>
              </div>

              {/* Chronological Flow Grid */}
              <div className="mt-6 space-y-3">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Documented Component Rotations & Swaps:
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {fanPumps.rotations.map((rot, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">{rot.component}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-mono">
                            {rot.pressurePsi ? `${rot.pressurePsi} PSI` : 'Rotated'}
                          </span>
                        </div>

                        {/* Flow Diagram */}
                        <div className="mt-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                          <div className="text-center">
                            <div className="text-[10px] text-slate-400">Source</div>
                            <div className="font-bold font-mono text-sm text-slate-900 dark:text-white">#{rot.fromMachine}</div>
                          </div>
                          <div className="text-amber-500 font-bold text-base">➔</div>
                          <div className="text-center">
                            <div className="text-[10px] text-slate-400">Destination</div>
                            <div className="font-bold font-mono text-sm text-amber-600 dark:text-amber-400">#{rot.toMachine}</div>
                          </div>
                        </div>

                        <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">
                          <span className="font-semibold text-slate-400">Reason / Details: </span>
                          {rot.reason}
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px] text-slate-400 font-mono">
                        <span>Date: {rot.date}</span>
                        <span className="font-semibold text-slate-600 dark:text-slate-300">Status: Operational</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 3: WEAR LIFESPANS */}
        {activeTab === 'wear' && (
          <div className="space-y-6">
            <Card className="p-6 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📊</span>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      GET, Radiator & Air Filter Wear Lifespan Analytics
                    </h2>
                    <Badge tone="live">Benchmark Analysis</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Operating hours achieved vs target operational benchmarks for heavy wear components.
                  </p>
                </div>
              </div>

              {/* Benchmark Comparison Cards */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                {wear.benchmarkComparison.map((bm, idx) => {
                  const pct = Math.min(100, (bm.actualAvgHours / bm.benchmarkHours) * 100);
                  return (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-500">{bm.category}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                          {bm.rating}
                        </span>
                      </div>

                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                          {bm.actualAvgHours}h
                        </span>
                        <span className="text-xs text-slate-400 font-mono">/ {bm.benchmarkHours}h Target</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-amber-500 h-2 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Air Filter Replacement Timeline */}
              <div className="mt-6">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                  Documented Filter Replacement & SMR Readings:
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                        <th className="py-2.5 px-3">Machine Serial</th>
                        <th className="py-2.5 px-3">Filter Replacement Type</th>
                        <th className="py-2.5 px-3">Service Date</th>
                        <th className="py-2.5 px-3 text-right">Running SMR</th>
                        <th className="py-2.5 px-3 text-right">Hours Achieved</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {wear.airFilters.map((f, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">#{f.serial}</td>
                          <td className="py-2.5 px-3 font-sans text-slate-700 dark:text-slate-300">{f.type}</td>
                          <td className="py-2.5 px-3 text-slate-500">{f.date}</td>
                          <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">{f.smr} hrs</td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            {f.hoursAchieved} hrs
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 4: RIPPER TEETH */}
        {activeTab === 'ripper' && (
          <div className="space-y-6">
            <Card className="p-6 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📦</span>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Ripper Teeth Warehouse Stock & Consumption
                    </h2>
                    <Badge tone="live">176 Pcs Total</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live warehouse inventory quantities, pin models, and historical replacement logs.
                  </p>
                </div>
              </div>

              {/* Stock Cards */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3.5">
                {Object.entries(ripper.stock).map(([key, count], idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    <div className="text-[11px] font-semibold text-slate-500">{key}</div>
                    <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                      {count} <span className="text-xs font-sans text-slate-400 font-normal">pcs</span>
                    </div>
                    <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, (count / 120) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Replacement History Table */}
              <div className="mt-6">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                  Machine Ripper Replacement Log:
                </div>

                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Machine #</th>
                        <th className="py-2.5 px-3">Tooth Type</th>
                        <th className="py-2.5 px-3">Pin Type</th>
                        <th className="py-2.5 px-3 text-right">Cost (KD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {ripper.log.map((entry, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 text-slate-500">{entry.date}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">#{entry.machine}</td>
                          <td className="py-2.5 px-3 font-sans text-slate-700 dark:text-slate-300">{entry.toothType}</td>
                          <td className="py-2.5 px-3 text-slate-500">{entry.pinType}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            {entry.costKd ? `${entry.costKd} KD` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 5: CYLINDERS */}
        {activeTab === 'cylinders' && (
          <div className="space-y-6">
            <Card className="p-6 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🛠️</span>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Excavator Hydraulic Cylinder Health Matrix
                    </h2>
                    <Badge tone="live">PC350LC Fleet</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hydraulic cylinder condition, seal kits, and bushing status for Bucket, Arm, and Boom assemblies.
                  </p>
                </div>
              </div>

              {/* Cylinder Health Table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                      <th className="py-2.5 px-3">Machine #</th>
                      <th className="py-2.5 px-3">Model</th>
                      <th className="py-2.5 px-3 text-center">Bucket Cylinder</th>
                      <th className="py-2.5 px-3 text-center">Arm Cylinder</th>
                      <th className="py-2.5 px-3 text-center">Boom Cylinder</th>
                      <th className="py-2.5 px-3 text-right">Inspection Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {cylinders.inspections.map((insp, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">#{insp.serial}</td>
                        <td className="py-2.5 px-3 text-slate-500 font-sans">{insp.model}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            insp.bucket === 'Good' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {insp.bucket}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            insp.arm === 'Good' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {insp.arm}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            insp.boom === 'Good' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {insp.boom}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {insp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Seal Kits Catalog */}
              <div className="mt-6">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                  Komatsu Hydraulic Seal Kits & Bushings Catalog:
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {cylinders.sealKits.map((sk, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                      <div className="font-bold text-xs text-slate-900 dark:text-white">{sk.cylinderType}</div>
                      <div className="mt-2 space-y-1 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-sans">Seal Kit Part #:</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">{sk.sealKitPartNo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-sans">Bushing Part #:</span>
                          <span className="text-slate-700 dark:text-slate-300">{sk.bushingPartNo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-sans">Unit Price:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{sk.priceKd} KD</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </SystemShell>
  );
}
