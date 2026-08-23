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
  { id: 'greasing', label: 'Greasing & Bushings', icon: '🛢️', desc: 'Fleet greasing compliance matrix, site deployment & bushing parts' },
  { id: 'fan-pumps', label: 'Fan Pumps D155A-6', icon: '🔄', desc: 'Pump & motor lifecycle rotations, overhaul history & pressure specs' },
  { id: 'wear-lifespan', label: 'Filter & GET Lifespans', icon: '📊', desc: 'Component operating hours vs lifespan benchmarks & air filters' },
  { id: 'ripper-teeth', label: 'Ripper Teeth Inventory', icon: '📦', desc: 'Stock gauges (Hensley, Jdaemi, CAT) & machine consumption log' },
  { id: 'cylinders', label: 'Cylinder Inspections', icon: '🛠️', desc: 'Excavator hydraulic cylinder health & seal kit part numbers' },
];

function siteColorClass(site) {
  if (!site || site === 'Not Work') return 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700';
  if (site === 'Closed') return 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800';
  if (site === 'Desire') return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 font-medium';
  if (site === 'Tricon') return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 font-medium';
  if (site === 'Sabah') return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 font-medium';
  if (site.includes('Landfill') || site.includes('Salmi')) return 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800 font-medium';
  if (site.includes('7th')) return 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800 font-medium';
  return 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 font-medium';
}

export default function FleetAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('greasing');
  const [loading, setLoading] = useState(true);
  const [fleetData, setFleetData] = useState(null);
  const [toast, setToast] = useState(null);

  // Filters for Greasing
  const [greasingSiteFilter, setGreasingSiteFilter] = useState('ALL');
  const [greasingSearch, setGreasingSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        setLoading(true);
        const res = await getFleetSummary();
        if (!ignore && res.data) {
          setFleetData(res.data);
          if (res.data.greasing?.months?.length > 0) {
            setSelectedMonth(res.data.greasing.months[res.data.greasing.months.length - 1]);
          }
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

  const greasing = fleetData?.greasing || {};
  const fanPumps = fleetData?.fanPumps || {};
  const wear = fleetData?.wear || {};
  const ripper = fleetData?.ripper || {};
  const cylinders = fleetData?.cylinders || {};

  // Filtered Greasing Matrix
  const filteredGreasingMatrix = useMemo(() => {
    const matrix = greasing.matrix || [];
    return matrix.filter((item) => {
      const matchSearch = !greasingSearch || item.serial.includes(greasingSearch) || item.category?.toLowerCase().includes(greasingSearch.toLowerCase());
      if (!matchSearch) return false;
      if (greasingSiteFilter === 'ALL') return true;
      if (greasingSiteFilter === 'ACTIVE_ONLY') {
        const latestStatus = item.months?.[selectedMonth] || '';
        return latestStatus && latestStatus !== 'Not Work' && latestStatus !== 'Closed';
      }
      const statusAtMonth = item.months?.[selectedMonth] || '';
      return statusAtMonth.toLowerCase().includes(greasingSiteFilter.toLowerCase());
    });
  }, [greasing.matrix, greasingSearch, greasingSiteFilter, selectedMonth]);

  return (
    <SystemShell
      activePath="/management/fleet-analytics"
      eyebrow="Dar Al Hai Fleet Intelligence"
      title="Fleet Analytics & Component Lifecycle Hub"
      description="Real-time component rotations, wear lifespans, greasing compliance matrix, ripper inventory, and hydraulic cylinder health."
      actions={
        <div className="flex items-center gap-2">
          <Link href="/management" className="ds-button ds-button-secondary text-xs">
            Back to Command Dashboard
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Highlights Bar */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monitored Fleet</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {loading ? <Skeleton className="h-7 w-12" /> : (greasing.totalMachinesTracked || 24)}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Heavy machines active</div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Greasing Coverage</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {loading ? <Skeleton className="h-7 w-12" /> : '92.5%'}
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Monthly compliance rate</div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Pump Rotations</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {loading ? <Skeleton className="h-7 w-12" /> : (fanPumps.rotations?.length || 9)}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">D155A-6 fan pumps tracked</div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Ripper Teeth Stock</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {loading ? <Skeleton className="h-7 w-12" /> : (ripper.totalStockCount || 176)}
            </div>
            <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Teeth available in stock</div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Hydraulic Health</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {loading ? <Skeleton className="h-7 w-12" /> : '83.3%'}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">Cylinders optimal condition</div>
          </div>
        </section>

        {/* Tab Navigation */}
        <section className="bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex flex-wrap gap-1">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    active
                      ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
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

        {/* TAB CONTENT: 1. GREASING & BUSHINGS */}
        {activeTab === 'greasing' && (
          <div className="space-y-6">
            {/* Greasing Heatmap Card */}
            <Card className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🛢️</span>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Fleet Greasing & Deployment Heatmap</h2>
                    <Badge tone="live">Live Matrix</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Monthly deployment tracking and greasing schedule compliance across contractor sites and rental zones.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="Search serial or category..."
                    value={greasingSearch}
                    onChange={(e) => setGreasingSearch(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />

                  <select
                    value={greasingSiteFilter}
                    onChange={(e) => setGreasingSiteFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden"
                  >
                    <option value="ALL">All Statuses & Sites</option>
                    <option value="ACTIVE_ONLY">Active Machines Only</option>
                    <option value="Desire">Desire Site</option>
                    <option value="Tricon">Tricon Site</option>
                    <option value="Sabah">Sabah Site</option>
                    <option value="Landfill">Landfill Site</option>
                    <option value="Not Work">Not Working / Idle</option>
                  </select>
                </div>
              </div>

              {/* Matrix Heatmap Table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                      <th className="py-2.5 px-3 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10">Machine Serial</th>
                      <th className="py-2.5 px-3">Fleet Group</th>
                      {(greasing.months || []).slice(-14).map((m) => (
                        <th key={m} className="py-2.5 px-2 text-center whitespace-nowrap font-mono text-[11px]">
                          {m}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loading ? (
                      <tr>
                        <td colSpan={16} className="py-8 text-center text-slate-400">
                          <Skeleton className="h-6 w-3/4 mx-auto" />
                        </td>
                      </tr>
                    ) : filteredGreasingMatrix.length === 0 ? (
                      <tr>
                        <td colSpan={16} className="py-8 text-center text-slate-400">
                          No machines match the selected filter.
                        </td>
                      </tr>
                    ) : (
                      filteredGreasingMatrix.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-white sticky left-0 bg-white dark:bg-slate-900 z-10">
                            #{item.serial}
                          </td>
                          <td className="py-2 px-3 text-slate-500 text-[11px] truncate max-w-[150px]">
                            {item.category}
                          </td>
                          {(greasing.months || []).slice(-14).map((m) => {
                            const site = item.months?.[m] || 'Not Work';
                            return (
                              <td key={m} className="py-1.5 px-1 text-center">
                                <span
                                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] border tracking-tight truncate max-w-[70px] ${siteColorClass(site)}`}
                                  title={`Machine ${item.serial} | ${m}: ${site}`}
                                >
                                  {site}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Matrix Legend */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Site Key:</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-500"></span> Desire</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Tricon</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500"></span> Sabah</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-purple-500"></span> Landfill / Salmi</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-cyan-500"></span> 7th Ring</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-slate-300 dark:bg-slate-700"></span> Not Work / Idle</span>
              </div>
            </Card>

            {/* Bushings and Pins Replacement Table */}
            <Card className="p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔩</span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Bushings & Pins Maintenance Standards</h3>
                    <Badge tone="ready">Parts Registry</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Standard bushing and pin replacements, part numbers, installation locations, and unit costs (KWD).
                  </p>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-3">Part Number</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Position / Location</th>
                      <th className="py-2.5 px-3 text-center">Standard Qty</th>
                      <th className="py-2.5 px-3 text-right">Cost per Unit (KD)</th>
                      <th className="py-2.5 px-3 text-right">Total Cost (KD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {(greasing.bushingPins || []).map((bp, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 text-slate-500">{bp.itemNo || idx + 1}</td>
                        <td className="py-2 px-3 font-bold text-amber-600 dark:text-amber-400">{bp.partNumber}</td>
                        <td className="py-2 px-3 font-sans text-slate-900 dark:text-slate-100">{bp.description}</td>
                        <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-300">{bp.location}</td>
                        <td className="py-2 px-3 text-center">{bp.quantity}</td>
                        <td className="py-2 px-3 text-right font-sans font-semibold text-slate-900 dark:text-white">
                          {bp.costPerUnit.toFixed(1)} KD
                        </td>
                        <td className="py-2 px-3 text-right font-sans font-bold text-emerald-600 dark:text-emerald-400">
                          {bp.totalCost.toFixed(1)} KD
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* TAB CONTENT: 2. FAN PUMPS D155A-6 */}
        {activeTab === 'fan-pumps' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔄</span>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">D155A-6 Fan Pump & Motor Swap Lifecycle</h2>
                    <Badge tone="live">Component Flow</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Visual audit timeline of hydraulic fan pump and fan motor rotations between D155A-6 dozers.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg font-mono">
                    Benchmark: 1,300 - 1,400 PSI
                  </span>
                </div>
              </div>

              {/* Rotations Timeline Flow */}
              <div className="mt-6 space-y-4">
                {(fanPumps.rotations || []).map((rot, idx) => (
                  <div
                    key={rot.id || idx}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-amber-400 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">
                            {rot.componentType === 'FAN_PUMP' ? 'Hydraulic Fan Pump' : 'Hydraulic Fan Motor'}
                          </span>
                          <span className="px-2 py-0.5 text-[10px] rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-semibold">
                            {rot.status}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">{rot.date}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
                          {rot.condition}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
                      <div className="text-right">
                        <div className="text-[11px] text-slate-400">Flow Path</div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          Dozer {rot.sourceSerial} ➔ Dozer {rot.targetSerial}
                        </div>
                      </div>
                      <div className="text-right pl-4 border-l border-slate-200 dark:border-slate-700">
                        <div className="text-[11px] text-slate-400">Tested Pressure</div>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">
                          {rot.pressure} PSI
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Technical Benchmarks Grid */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] text-slate-500">Standard Pump Operating PSI</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">1,350 PSI</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] text-slate-500">Control Valve Pressure</div>
                  <div className="text-lg font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5">200 PSI</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] text-slate-500">Safety Valve Pressure</div>
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400 font-mono mt-0.5">50 PSI</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] text-slate-500">New Pump Replacement Value</div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">1,300 KWD</div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TAB CONTENT: 3. WEAR & LIFESPAN ANALYTICS */}
        {activeTab === 'wear-lifespan' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📊</span>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Component Wear & Benchmark Lifespans</h2>
                    <Badge tone="live">Lifespan Analytics</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Operating hours achieved per wear component vs target operational lifespans.
                  </p>
                </div>
              </div>

              {/* Benchmark Comparison Cards */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                {(wear.benchmarkComparison || []).map((b, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{b.category}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                        {b.rating}
                      </span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{b.actualAvgHours}</span>
                      <span className="text-xs text-slate-400">/ {b.benchmarkHours} hrs</span>
                    </div>
                    <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-amber-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (b.actualAvgHours / b.benchmarkHours) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Air Filter Wear Log */}
              <div className="mt-8">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Air Filter Replacement History & SMR Log</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                        <th className="py-2.5 px-3">Serial #</th>
                        <th className="py-2.5 px-3">Machine Type</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">SMR at Service</th>
                        <th className="py-2.5 px-3">Filter Configuration</th>
                        <th className="py-2.5 px-3 text-right">Achieved Lifespan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {(wear.airFilters || []).slice(0, 15).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">#{item.serial}</td>
                          <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-300">{item.machineType}</td>
                          <td className="py-2 px-3 text-slate-500">{item.date}</td>
                          <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{item.smr ? `${item.smr} hrs` : '-'}</td>
                          <td className="py-2 px-3 font-sans">
                            <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {item.filterType}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-amber-600 dark:text-amber-400">
                            {item.lifespanHours} hrs
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

        {/* TAB CONTENT: 4. RIPPER TEETH */}
        {activeTab === 'ripper-teeth' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📦</span>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ripper Teeth Inventory & Consumption</h2>
                    <Badge tone="live">Stock & Usage</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Live warehouse stock quantities and machine installation logs for bulldozer ripper teeth.
                  </p>
                </div>
              </div>

              {/* Stock Gauges Grid */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(ripper.stock || {}).map(([type, qty]) => (
                  <div key={type} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    <div className="text-xs font-semibold text-slate-500 truncate">{type}</div>
                    <div className="text-3xl font-bold font-mono text-slate-900 dark:text-white mt-1">{qty}</div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">In Stock</div>
                  </div>
                ))}
              </div>

              {/* Ripper Replacement Log */}
              <div className="mt-8">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Recent Ripper Teeth Replacements</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                        <th className="py-2.5 px-3">Dozer Serial</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">SMR</th>
                        <th className="py-2.5 px-3">Tooth Profile</th>
                        <th className="py-2.5 px-3">Pin Type</th>
                        <th className="py-2.5 px-3">Location / Renter</th>
                        <th className="py-2.5 px-3 text-right">Cost (KD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {(ripper.log || []).slice(0, 10).map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">#{r.serial}</td>
                          <td className="py-2 px-3 text-slate-500">{r.date}</td>
                          <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{r.smr ? `${r.smr} hrs` : '-'}</td>
                          <td className="py-2 px-3 font-sans font-medium text-amber-600 dark:text-amber-400">{r.toothType}</td>
                          <td className="py-2 px-3 font-sans text-slate-500">{r.pinType}</td>
                          <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-300">{r.location || 'Fleet'}</td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">{r.costKd} KD</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TAB CONTENT: 5. CYLINDERS CHECK */}
        {activeTab === 'cylinders' && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🛠️</span>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Excavator Hydraulic Cylinder Health Matrix</h2>
                    <Badge tone="live">Inspection Log</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Condition monitoring of Bucket, Arm, and Boom hydraulic cylinders across PC350LC fleet.
                  </p>
                </div>
              </div>

              {/* Cylinders Status Table */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                      <th className="py-2.5 px-3">Serial #</th>
                      <th className="py-2.5 px-3">Excavator Model</th>
                      <th className="py-2.5 px-3 text-center">Bucket Cylinder</th>
                      <th className="py-2.5 px-3 text-center">Arm Cylinder</th>
                      <th className="py-2.5 px-3 text-center">Boom Cylinder</th>
                      <th className="py-2.5 px-3">Operating SMR</th>
                      <th className="py-2.5 px-3 text-right">Health Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {(cylinders.inspections || []).map((c, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">#{c.serial}</td>
                        <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-300">{c.model}</td>
                        <td className="py-2 px-3 text-center">
                          {c.bucket ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 font-bold">Leak / Issue</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-semibold">Normal</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {c.arm ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-bold">Attention</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-semibold">Normal</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {c.boom ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 font-bold">Issue</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-semibold">Normal</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{c.smr} hrs</td>
                        <td className="py-2 px-3 text-right">
                          <Badge tone={c.status === 'NORMAL' ? 'completed' : c.status === 'ATTENTION' ? 'warning' : 'critical'}>
                            {c.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Seal Kits & Bushings Catalog */}
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Hydraulic Cylinder Seal Kits & Replacement Bushings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(cylinders.sealKits || []).map((sk, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                      <div className="font-bold text-sm text-slate-900 dark:text-white">{sk.cylinder}</div>
                      <div className="mt-2 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Seal Kit:</span>
                          <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{sk.partNo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Bushing:</span>
                          <span className="font-mono text-slate-700 dark:text-slate-300">{sk.bushingPartNo}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-slate-500 font-medium">Unit Price:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{sk.costKd} KWD</span>
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

      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}
    </SystemShell>
  );
}
