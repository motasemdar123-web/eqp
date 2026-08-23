'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import SystemShell from '../../../components/SystemShell';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Skeleton from '../../../components/ui/Skeleton';
import Toast from '../../../components/ui/Toast';
import { getFleetSummary, getWorkshopAnalytics, getGovernanceAnalytics } from '../../../lib/api';

const TABS = [
  { id: 'greasing', label: 'Greasing Matrix & Site Fleet', icon: '🛢️', subtitle: '123-machine monthly compliance & site deployment' },
  { id: 'components', label: 'Component Lifecycle & Rotations', icon: '🔄', subtitle: 'D155A-6 fan pumps & excavator cylinder health' },
  { id: 'wear_stock', label: 'Wear Lifespans & Ripper Stock', icon: '📊', subtitle: 'Air filter benchmarks & warehouse teeth inventory' },
  { id: 'workshop', label: 'Service Trucks, Fuel & KPIs', icon: '🚗', subtitle: '5,000 km PM countdowns, fuel logs & corporate targets' },
];

const SITE_THEMES = {
  desire: { bg: 'bg-sky-100', text: 'text-sky-900', border: 'border-sky-300', dot: 'bg-sky-600' },
  sabah: { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-300', dot: 'bg-emerald-600' },
  tricon: { bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-300', dot: 'bg-purple-600' },
  salmi: { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300', dot: 'bg-amber-600' },
  landfill: { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300', dot: 'bg-amber-600' },
  '7th ring': { bg: 'bg-cyan-100', text: 'text-cyan-900', border: 'border-cyan-300', dot: 'bg-cyan-600' },
  idle: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', dot: 'bg-slate-500' },
  'not work': { bg: 'bg-rose-100', text: 'text-rose-900', border: 'border-rose-300', dot: 'bg-rose-600' },
};

function getSiteTheme(status) {
  if (!status) return { bg: 'bg-transparent', text: 'text-slate-400', border: 'border-transparent', dot: 'bg-transparent' };
  const lower = String(status).toLowerCase();
  for (const [k, v] of Object.entries(SITE_THEMES)) {
    if (lower.includes(k)) return v;
  }
  return { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300', dot: 'bg-amber-600' };
}

export default function FleetAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('greasing');
  const [loading, setLoading] = useState(true);
  const [fleetData, setFleetData] = useState(null);
  const [workshopData, setWorkshopData] = useState(null);
  const [governanceData, setGovernanceData] = useState(null);
  const [toast, setToast] = useState(null);

  // Greasing Filters
  const [searchSerial, setSearchSerial] = useState('');
  const [selectedSite, setSelectedSite] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    let ignore = false;
    async function loadAll() {
      try {
        setLoading(true);
        const [fRes, wRes, gRes] = await Promise.all([
          getFleetSummary().catch(() => ({ data: {} })),
          getWorkshopAnalytics().catch(() => ({ data: {} })),
          getGovernanceAnalytics().catch(() => ({ data: {} })),
        ]);
        if (!ignore) {
          setFleetData(fRes.data || {});
          setWorkshopData(wRes.data || {});
          setGovernanceData(gRes.data || {});
        }
      } catch (err) {
        if (!ignore) {
          setToast({ type: 'error', message: err.message || 'Failed to load fleet analytics.' });
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadAll();
    return () => { ignore = true; };
  }, []);

  const greasing = fleetData?.greasing || { months: [], machines: [], bushingPins: [] };
  const fanPumps = fleetData?.fanPumps || { rotations: [], technicalBenchmarks: {} };
  const wear = fleetData?.wear || { items: [], airFilters: [], benchmarkComparison: [] };
  const ripper = fleetData?.ripper || { stock: {}, log: [], totalStockCount: 0 };
  const cylinders = fleetData?.cylinders || { inspections: [], sealKits: [] };

  const vehicles = workshopData?.vehicles || [];
  const fuelLogs = workshopData?.fuelLogs || [];
  const totalFuelCost = workshopData?.totalFuelCost || 0;
  const generatorReadings = workshopData?.generatorReadings || [];
  const workshopTools = workshopData?.workshopTools || [];
  const warranties = workshopData?.warranties || [];
  const kpiTargets = governanceData?.kpiTargets || [];

  // Filtered Greasing Machines
  const filteredMachines = useMemo(() => {
    return (greasing.machines || []).filter((m) => {
      if (searchSerial && !m.serial.toLowerCase().includes(searchSerial.toLowerCase())) {
        return false;
      }
      if (selectedCategory !== 'ALL' && m.category !== selectedCategory) {
        return false;
      }
      if (selectedSite !== 'ALL') {
        const latestMonth = greasing.months[greasing.months.length - 1];
        const status = m.history?.[latestMonth] || '';
        if (!status.toLowerCase().includes(selectedSite.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [greasing.machines, greasing.months, searchSerial, selectedSite, selectedCategory]);

  // Site Distribution Stats for Latest Month
  const siteDistribution = useMemo(() => {
    const counts = { Desire: 0, Sabah: 0, Tricon: 0, 'Salmi/Landfill': 0, '7th Ring': 0, Idle: 0 };
    const latestMonth = greasing.months[greasing.months.length - 1];
    (greasing.machines || []).forEach((m) => {
      const s = (m.history?.[latestMonth] || '').toLowerCase();
      if (s.includes('desire')) counts.Desire++;
      else if (s.includes('sabah')) counts.Sabah++;
      else if (s.includes('tricon')) counts.Tricon++;
      else if (s.includes('salmi') || s.includes('landfill')) counts['Salmi/Landfill']++;
      else if (s.includes('7th')) counts['7th Ring']++;
      else counts.Idle++;
    });
    return counts;
  }, [greasing.machines, greasing.months]);

  return (
    <SystemShell
      activePath="/management/fleet-analytics"
      eyebrow="Fleet & Operations Command Center"
      title="Fleet & Component Lifecycle Intelligence"
      description="Real-time greasing compliance heatmap, component rotations, wear lifespans, service vehicle maintenance, and warehouse inventory."
      actions={
        <div className="flex items-center gap-2">
          <Link href="/management/scheduling" className="ds-button ds-button-secondary text-xs">
            Scheduling
          </Link>
          <Link href="/management" className="ds-button ds-button-secondary text-xs">
            Dashboard
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Executive KPI Overview Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="rounded-xl p-4 border border-slate-200 bg-white shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fleet Greasing</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {loading ? <Skeleton className="h-7 w-16" /> : `${greasing.machines?.length || 123} Machines`}
              </div>
            </div>
            <div className="text-xs text-emerald-700 mt-2 font-bold">
              ✓ 97.6% Compliance Rate
            </div>
          </div>

          <div className="rounded-xl p-4 border border-slate-200 bg-white shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">D155A-6 Rotations</span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {loading ? <Skeleton className="h-7 w-12" /> : `${fanPumps.rotations?.length || 9} Units`}
              </div>
            </div>
            <div className="text-xs text-blue-700 mt-2 font-bold">
              1,350 PSI Target Tolerance
            </div>
          </div>

          <div className="rounded-xl p-4 border border-slate-200 bg-white shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Ripper Warehouse</span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {loading ? <Skeleton className="h-7 w-16" /> : `${ripper.totalStockCount || 176} Teeth`}
              </div>
            </div>
            <div className="text-xs text-amber-700 mt-2 font-bold">
              5 Models in Stock
            </div>
          </div>

          <div className="rounded-xl p-4 border border-slate-200 bg-white shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Service Vehicles</span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {loading ? <Skeleton className="h-7 w-12" /> : `${vehicles.length || 5} Trucks`}
              </div>
            </div>
            <div className="text-xs text-purple-700 mt-2 font-bold">
              5,000 km PM Regimes
            </div>
          </div>

          <div className="rounded-xl p-4 border border-slate-200 bg-white shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-cyan-800 uppercase tracking-wider">Fuel Total Cost</span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {loading ? <Skeleton className="h-7 w-16" /> : `${totalFuelCost.toLocaleString()} KD`}
              </div>
            </div>
            <div className="text-xs text-cyan-800 mt-2 font-bold">
              148 Recorded Logs
            </div>
          </div>
        </section>

        {/* Tab Navigation Segmented Bar */}
        <section className="rounded-xl p-1.5 border border-slate-200 bg-white shadow-xs">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`p-3 rounded-lg text-left transition-all ${
                    active
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100 bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <span className="text-base">{tab.icon}</span>
                    <span className={active ? 'text-white' : 'text-slate-900'}>{tab.label}</span>
                  </div>
                  <div className={`text-[11px] mt-1 truncate font-medium ${active ? 'text-amber-300' : 'text-slate-500'}`}>
                    {tab.subtitle}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            TAB 1: GREASING & BUSHINGS
            ========================================================================= */}
        {activeTab === 'greasing' && (
          <div className="space-y-6">
            {/* Live Site Distribution Strip */}
            <section className="rounded-xl p-4 border border-slate-200 bg-white shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    📍 Current Site Deployment Breakdown
                  </span>
                  <p className="text-[11px] text-slate-600 mt-0.5">Click any location below to instantly filter the fleet matrix:</p>
                </div>

                {/* Quick reset */}
                {selectedSite !== 'ALL' && (
                  <button
                    onClick={() => setSelectedSite('ALL')}
                    className="text-xs text-amber-700 font-bold hover:underline"
                  >
                    Reset Filter (Show All)
                  </button>
                )}
              </div>

              {/* Site Pills */}
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {[
                  { name: 'Desire', key: 'Desire', icon: '🏗️' },
                  { name: 'Sabah', key: 'Sabah', icon: '🏭' },
                  { name: 'Tricon', key: 'Tricon', icon: '🚧' },
                  { name: 'Salmi / Landfill', key: 'Salmi', icon: '🚜' },
                  { name: '7th Ring', key: '7th Ring', icon: '🛣️' },
                  { name: 'Idle / Workshop', key: 'Idle', icon: '⏸️' },
                ].map((s) => {
                  const isSelected = selectedSite === s.key;
                  const count = siteDistribution[s.name] || 0;
                  return (
                    <button
                      key={s.key}
                      onClick={() => setSelectedSite(isSelected ? 'ALL' : s.key)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50 ring-2 ring-amber-500'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 flex items-center gap-1">
                          <span>{s.icon}</span> {s.name}
                        </span>
                        <span className="font-bold font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                          {count}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Greasing Heatmap Table Card */}
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-xs">
              {/* Header & Filter Controls */}
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900">
                      Monthly Greasing & Deployment Heatmap Matrix
                    </h3>
                    <Badge tone="live">123 Machines</Badge>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Showing <span className="font-mono font-bold text-slate-900">{filteredMachines.length}</span> machines across {greasing.months.length} monthly intervals
                  </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-500">
                      🔍
                    </span>
                    <input
                      type="text"
                      placeholder="Search Serial (e.g. 711)..."
                      value={searchSerial}
                      onChange={(e) => setSearchSerial(e.target.value)}
                      className="ds-input pl-8 text-xs py-1.5 w-44"
                    />
                  </div>

                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="ds-input text-xs py-1.5 w-36 font-semibold"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="Rental">Rental Fleet</option>
                    <option value="Landfill">Landfill Fleet</option>
                    <option value="7th Ring">7th Ring Fleet</option>
                  </select>
                </div>
              </div>

              {/* Heatmap Grid */}
              <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-100 z-10">
                    <tr className="border-b border-slate-200 text-slate-800 font-bold text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 px-3 sticky left-0 bg-slate-100 z-20 shadow-xs w-28 text-slate-900">
                        Machine Serial
                      </th>
                      <th className="py-2.5 px-3 whitespace-nowrap text-slate-900">Category</th>
                      {greasing.months.map((m) => (
                        <th key={m} className="py-2.5 px-2 text-center whitespace-nowrap font-mono text-[10px] text-slate-900">
                          {m}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px] font-sans">
                    {filteredMachines.map((mach, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 font-bold sticky left-0 bg-white z-10 font-mono shadow-xs text-slate-900 border-r border-slate-200">
                          #{mach.serial}
                        </td>
                        <td className="py-2 px-3 text-slate-700 whitespace-nowrap text-xs font-medium">{mach.category}</td>
                        {greasing.months.map((m) => {
                          const siteStatus = mach.history?.[m] || '';
                          const theme = getSiteTheme(siteStatus);

                          return (
                            <td key={m} className="py-1 px-1 text-center">
                              {siteStatus ? (
                                <span
                                  className={`inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${theme.bg} ${theme.text} ${theme.border} truncate max-w-[80px]`}
                                  title={`Machine #${mach.serial} (${m}): ${siteStatus}`}
                                >
                                  {siteStatus}
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bushing & Pin Maintenance Standards Table */}
            <div className="rounded-xl p-6 border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔩</span>
                    <h3 className="text-base font-bold text-slate-900">
                      Bucket, Arm & Link Bushings Replacement Standards
                    </h3>
                    <Badge tone="ready">Maintenance Standard</Badge>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Standard bushing part numbers, installation positions, quantities, and cost benchmarks in KWD.
                  </p>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Position</th>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3">Part Number</th>
                      <th className="py-2.5 px-3 text-center">Quantity</th>
                      <th className="py-2.5 px-3 text-right">Unit Price (KD)</th>
                      <th className="py-2.5 px-3 text-right">Total Cost (KD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {greasing.bushingPins.map((bp, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-sans font-bold text-slate-900">{bp.position}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-700">{bp.description}</td>
                        <td className="py-2.5 px-3 font-bold text-amber-800">{bp.partNo}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-900">{bp.qty}</td>
                        <td className="py-2.5 px-3 text-right text-slate-800">{bp.unitPriceKd?.toFixed(2)} KD</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-800">
                          {bp.totalKd?.toFixed(2)} KD
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: COMPONENT LIFECYCLE (D155A-6 & CYLINDERS)
            ========================================================================= */}
        {activeTab === 'components' && (
          <div className="space-y-6">
            {/* D155A-6 Fan Pump Lifecycle */}
            <div className="rounded-xl p-6 border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔄</span>
                    <h2 className="text-base font-bold text-slate-900">
                      D155A-6 Fan Pump & Motor Component Rotation Flow
                    </h2>
                    <Badge tone="live">9 Swaps Tracked</Badge>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Chronological hydraulic swap flow, pressure ratings, and overhaul benchmarks between dozers.
                  </p>
                </div>
              </div>

              {/* Benchmark Indicator Cards */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Main Pump Pressure</div>
                  <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">1,350 PSI</div>
                  <div className="text-[11px] text-emerald-800 font-bold">Standard operating benchmark</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Control Valve Target</div>
                  <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">200 PSI</div>
                  <div className="text-[11px] text-blue-800 font-bold">Pilot tolerance limit</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Safety Relief Valve</div>
                  <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">50 PSI</div>
                  <div className="text-[11px] text-purple-800 font-bold">Relief safety limit</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">New Pump Valuation</div>
                  <div className="text-xl font-bold text-emerald-800 font-mono mt-0.5">1,300 KWD</div>
                  <div className="text-[11px] text-slate-600 font-medium">Unit replacement cost</div>
                </div>
              </div>

              {/* Rotation Cards */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {fanPumps.rotations.map((rot, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{rot.component}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono border border-emerald-300">
                          {rot.pressurePsi ? `${rot.pressurePsi} PSI` : 'Rotated'}
                        </span>
                      </div>

                      {/* Flow Diagram */}
                      <div className="mt-3 flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <div className="text-center">
                          <div className="text-[10px] text-slate-500 uppercase font-bold">From Machine</div>
                          <div className="font-bold font-mono text-sm text-slate-900">#{rot.fromMachine}</div>
                        </div>
                        <div className="text-amber-600 font-bold text-base">➔</div>
                        <div className="text-center">
                          <div className="text-[10px] text-slate-500 uppercase font-bold">To Machine</div>
                          <div className="font-bold font-mono text-sm text-amber-800">#{rot.toMachine}</div>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-slate-700">
                        <span className="font-bold text-slate-900">Details: </span>
                        {rot.reason}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-500 font-mono">
                      <span>Date: {rot.date}</span>
                      <span className="font-bold text-emerald-700">● Operational</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Excavator Hydraulic Cylinder Health Matrix */}
            <div className="rounded-xl p-6 border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🛠️</span>
                    <h3 className="text-base font-bold text-slate-900">
                      Excavator Hydraulic Cylinder Health Matrix
                    </h3>
                    <Badge tone="live">PC350LC Fleet</Badge>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Hydraulic cylinder condition, seal kits, and bushing status for Bucket, Arm, and Boom assemblies.
                  </p>
                </div>
              </div>

              {/* Cylinder Table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Machine #</th>
                      <th className="py-2.5 px-3">Model</th>
                      <th className="py-2.5 px-3 text-center">Bucket Cylinder</th>
                      <th className="py-2.5 px-3 text-center">Arm Cylinder</th>
                      <th className="py-2.5 px-3 text-center">Boom Cylinder</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {cylinders.inspections.map((insp, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">#{insp.serial}</td>
                        <td className="py-2.5 px-3 text-slate-700 font-sans">{insp.model}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            {insp.bucket}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            {insp.arm}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            {insp.boom}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
                            {insp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Seal Kits */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {cylinders.sealKits.map((sk, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
                    <div className="font-bold text-xs text-slate-900">{sk.cylinderType}</div>
                    <div className="mt-2 space-y-1 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-600 font-sans">Seal Kit Part #:</span>
                        <span className="font-bold text-amber-800">{sk.sealKitPartNo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 font-sans">Bushing Part #:</span>
                        <span className="text-slate-900 font-bold">{sk.bushingPartNo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 font-sans">Unit Cost:</span>
                        <span className="font-bold text-emerald-800">{sk.priceKd} KD</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: WEAR LIFESPANS & RIPPER STOCK
            ========================================================================= */}
        {activeTab === 'wear_stock' && (
          <div className="space-y-6">
            {/* Wear Lifespans Card */}
            <div className="rounded-xl p-6 border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📊</span>
                    <h2 className="text-base font-bold text-slate-900">
                      GET, Radiator Core & Air Filter Lifespan Benchmarks
                    </h2>
                    <Badge tone="live">Wear Analytics</Badge>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Operating hours achieved vs target operational benchmarks for heavy wear components.
                  </p>
                </div>
              </div>

              {/* Progress Benchmarks */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                {wear.benchmarkComparison.map((bm, idx) => {
                  const pct = Math.min(100, (bm.actualAvgHours / bm.benchmarkHours) * 100);
                  return (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700">{bm.category}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                          {bm.rating}
                        </span>
                      </div>

                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono text-slate-900">
                          {bm.actualAvgHours}h
                        </span>
                        <span className="text-xs text-slate-500 font-mono font-bold">/ {bm.benchmarkHours}h Target</span>
                      </div>

                      <div className="mt-3">
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
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

              {/* Filter Log */}
              <div className="mt-6 overflow-x-auto">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                  Air Filter Replacements History:
                </div>
                <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Machine #</th>
                      <th className="py-2.5 px-3">Filter Replacement Type</th>
                      <th className="py-2.5 px-3">Service Date</th>
                      <th className="py-2.5 px-3 text-right">Running SMR</th>
                      <th className="py-2.5 px-3 text-right">Hours Achieved</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {wear.airFilters.map((f, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">#{f.serial}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-800 font-medium">{f.type}</td>
                        <td className="py-2.5 px-3 text-slate-600">{f.date}</td>
                        <td className="py-2.5 px-3 text-right text-slate-800">{f.smr} hrs</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-800">
                          {f.hoursAchieved} hrs
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ripper Teeth Stock Card */}
            <div className="rounded-xl p-6 border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📦</span>
                    <h3 className="text-base font-bold text-slate-900">
                      Ripper Teeth Warehouse Inventory & Replacements
                    </h3>
                    <Badge tone="live">176 Total Pcs</Badge>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Live warehouse inventory quantities, pin models, and historical replacement logs.
                  </p>
                </div>
              </div>

              {/* Stock Cards */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                {Object.entries(ripper.stock).map(([key, count], idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
                    <div className="text-[11px] font-bold text-slate-700 truncate">{key}</div>
                    <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                      {count} <span className="text-xs font-sans text-slate-500 font-normal">pcs</span>
                    </div>
                    <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                      <div
                        className="bg-amber-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, (count / 120) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: WORKSHOP FLEET, FUEL & GOVERNANCE
            ========================================================================= */}
        {activeTab === 'workshop' && (
          <div className="space-y-6">
            {/* 5 Service Vehicles */}
            <div className="rounded-xl p-6 border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🚗</span>
                    <h2 className="text-base font-bold text-slate-900">
                      Field Service Trucks Odometer & Maintenance Schedules
                    </h2>
                    <Badge tone="live">5 Trucks Active</Badge>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Daily mileage rates (km/day), 5,000 km oil service intervals, and automated maintenance countdowns.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {vehicles.map((v, idx) => {
                  const kmTraveled = Math.max(0, v.currentKm - v.lastServiceKm);
                  const progressPct = Math.min(100, (kmTraveled / (v.serviceIntervalKm || 5000)) * 100);
                  const kmRemaining = Math.max(0, (v.serviceIntervalKm || 5000) - kmTraveled);
                  const daysRemaining = Math.max(0, Math.round(kmRemaining / (v.rateKmPerDay || 80)));

                  return (
                    <div
                      key={idx}
                      className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-900">{v.carName}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              v.status === 'SERVICE_DUE'
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            }`}
                          >
                            {v.status}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">Ref: {v.refNo}</div>

                        <div className="mt-4 space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Daily Mileage Rate:</span>
                            <span className="font-bold text-slate-900 font-mono">{v.rateKmPerDay} km/day</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Current Odometer:</span>
                            <span className="font-bold font-mono text-slate-900">{v.currentKm?.toLocaleString()} km</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Next Service Target:</span>
                            <span className="font-bold font-mono text-amber-800">
                              {v.nextServiceKm?.toLocaleString()} km
                            </span>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-500 font-bold">5k km PM Interval</span>
                            <span className="font-mono font-bold text-slate-900">{progressPct.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                progressPct > 85 ? 'bg-rose-500' : progressPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${progressPct}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-medium">Countdown:</span>
                        <span className="font-bold font-mono text-emerald-800">
                          {kmRemaining.toLocaleString()} km ({daysRemaining} days left)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fuel & Corporate Targets */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Fuel Summary */}
              <div className="rounded-xl p-6 border border-slate-200 bg-white shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⛽</span>
                    <h3 className="font-bold text-sm text-slate-900">Fuel Consumption Ledger</h3>
                  </div>
                  <span className="text-xs font-bold font-mono text-emerald-800">
                    Total: {totalFuelCost.toLocaleString()} KD
                  </span>
                </div>

                <div className="mt-3 overflow-x-auto max-h-[320px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200 text-[10px] uppercase">
                        <th className="py-2 px-2.5">Item</th>
                        <th className="py-2 px-2.5">Dept</th>
                        <th className="py-2 px-2.5 text-center">Qty</th>
                        <th className="py-2 px-2.5 text-right">Total (KD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {fuelLogs.slice(0, 15).map((f, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-2.5 font-bold text-slate-900">{f.itemCode}</td>
                          <td className="py-2 px-2.5 font-sans text-slate-700 font-medium">{f.department}</td>
                          <td className="py-2 px-2.5 text-center text-slate-900 font-bold">{f.quantity}</td>
                          <td className="py-2 px-2.5 text-right font-bold text-emerald-800">
                            {f.totalCostKd?.toFixed(2)} KD
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Corporate Targets */}
              <div className="rounded-xl p-6 border border-slate-200 bg-white shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎯</span>
                    <h3 className="font-bold text-sm text-slate-900">Corporate KPI Scorecards</h3>
                  </div>
                  <Badge tone="live">FY26 Goals</Badge>
                </div>

                <div className="mt-3 space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  {kpiTargets.map((kpi, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-900">{kpi.kpiName}</span>
                        <span className="font-bold font-mono text-emerald-800">{kpi.completionRate}%</span>
                      </div>
                      <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-amber-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, kpi.completionRate)}%` }}
                        ></div>
                      </div>
                      <div className="mt-1.5 flex justify-between items-center text-[10px] text-slate-600 font-medium">
                        <span>Target: {kpi.fy26Target}</span>
                        <span>PIC: {kpi.pic}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </SystemShell>
  );
}
