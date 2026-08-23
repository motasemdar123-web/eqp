'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import SystemShell from '../../../components/SystemShell';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Skeleton from '../../../components/ui/Skeleton';
import Toast from '../../../components/ui/Toast';
import { getWorkshopAnalytics, getGovernanceAnalytics } from '../../../lib/api';

const TABS = [
  { id: 'vehicles', label: 'Service Vehicles Fleet', icon: '🚗', desc: '5,000 km PM schedules, daily usage rates & maintenance countdowns' },
  { id: 'fuel', label: 'Fuel Logs & Department Ledger', icon: '⛽', desc: 'Transaction logs, quantities, unit prices & department cost allocations' },
  { id: 'equipment', label: 'Generator & Workshop Tools', icon: '⚡', desc: 'Diesel generator runtime hour meter & heavy workshop tools master' },
  { id: 'warranty', label: 'Battery & Parts Warranty', icon: '🛡️', desc: 'Heavy equipment battery serials, supplier invoices & warranty terms' },
  { id: 'targets', label: 'Corporate KPI Scorecards', icon: '🎯', desc: 'FY26 cross-functional targets, 1H progress & PIC milestones' },
];

export default function WorkshopAndGovernancePage() {
  const [activeTab, setActiveTab] = useState('vehicles');
  const [loading, setLoading] = useState(true);
  const [workshopData, setWorkshopData] = useState(null);
  const [governanceData, setGovernanceData] = useState(null);
  const [toast, setToast] = useState(null);

  // Search & Filters
  const [fuelSearch, setFuelSearch] = useState('');
  const [fuelDeptFilter, setFuelDeptFilter] = useState('ALL');
  const [warrantySearch, setWarrantySearch] = useState('');

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        setLoading(true);
        const [wsRes, govRes] = await Promise.all([
          getWorkshopAnalytics(),
          getGovernanceAnalytics(),
        ]);
        if (!ignore) {
          setWorkshopData(wsRes.data || {});
          setGovernanceData(govRes.data || {});
        }
      } catch (err) {
        if (!ignore) {
          setToast({ type: 'error', message: err.message || 'Failed to load workshop data.' });
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadData();
    return () => { ignore = true; };
  }, []);

  const vehicles = workshopData?.vehicles || [];
  const fuelLogs = workshopData?.fuelLogs || [];
  const totalFuelCost = workshopData?.totalFuelCost || 0;
  const generatorReadings = workshopData?.generatorReadings || [];
  const workshopTools = workshopData?.workshopTools || [];
  const warranties = workshopData?.warranties || [];
  const kpiTargets = governanceData?.kpiTargets || [];

  // Filtered Fuel Logs
  const filteredFuel = useMemo(() => {
    return fuelLogs.filter((f) => {
      const matchSearch =
        !fuelSearch ||
        f.note?.toLowerCase().includes(fuelSearch.toLowerCase()) ||
        f.chassis?.toLowerCase().includes(fuelSearch.toLowerCase()) ||
        f.itemCode?.toLowerCase().includes(fuelSearch.toLowerCase());
      if (!matchSearch) return false;
      if (fuelDeptFilter === 'ALL') return true;
      return f.department?.toLowerCase() === fuelDeptFilter.toLowerCase();
    });
  }, [fuelLogs, fuelSearch, fuelDeptFilter]);

  // Filtered Warranties
  const filteredWarranties = useMemo(() => {
    return warranties.filter((w) => {
      if (!warrantySearch) return true;
      const s = warrantySearch.toLowerCase();
      return (
        w.itemDescription?.toLowerCase().includes(s) ||
        w.batteryOrPartSerial?.toLowerCase().includes(s) ||
        w.supplierCompany?.toLowerCase().includes(s) ||
        w.receiptNo?.toLowerCase().includes(s) ||
        w.machineSerial?.toLowerCase().includes(s)
      );
    });
  }, [warranties, warrantySearch]);

  return (
    <SystemShell
      activePath="/management/workshop"
      eyebrow="Workshop Operations & Assets Hub"
      title="Workshop, Vehicles & Performance Command Hub"
      description="Field service trucks maintenance, fuel consumption ledger, heavy tools master, warranty claims, and corporate KPI scorecards."
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
        {/* Metric Cards Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="ds-card p-4 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Service Vehicles</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {loading ? <Skeleton className="h-7 w-12" /> : `${vehicles.length} Trucks`}
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">5,000 km PM intervals</div>
          </div>

          <div className="ds-card p-4 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Fuel Cost</div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
              {loading ? <Skeleton className="h-7 w-16" /> : `${totalFuelCost.toLocaleString()} KD`}
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">{fuelLogs.length} fill transactions</div>
          </div>

          <div className="ds-card p-4 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Workshop Tools</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {loading ? <Skeleton className="h-7 w-12" /> : `${workshopTools.length} Units`}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">Compressors & welders</div>
          </div>

          <div className="ds-card p-4 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Active Warranties</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {loading ? <Skeleton className="h-7 w-12" /> : `${warranties.length} Claims`}
            </div>
            <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Batteries & parts insured</div>
          </div>

          <div className="ds-card p-4 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">KPI Target Score</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {loading ? <Skeleton className="h-7 w-12" /> : `${kpiTargets.length} Goals`}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">Corporate milestone rate</div>
          </div>
        </section>

        {/* Tab Ribbon */}
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

        {/* TAB 1: SERVICE VEHICLES */}
        {activeTab === 'vehicles' && (
          <div className="space-y-6">
            <Card className="p-6 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🚗</span>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Field Service Trucks Odometer & Periodic Maintenance Schedules
                    </h2>
                    <Badge tone="live">Fleet Registry</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Daily mileage rate monitoring (km/day), 5,000 km oil service intervals, and automated maintenance countdowns.
                  </p>
                </div>
              </div>

              {/* Vehicle Cards Grid */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {vehicles.map((v, idx) => {
                  const kmTraveled = Math.max(0, v.currentKm - v.lastServiceKm);
                  const progressPct = Math.min(100, (kmTraveled / (v.serviceIntervalKm || 5000)) * 100);
                  const kmRemaining = Math.max(0, (v.serviceIntervalKm || 5000) - kmTraveled);
                  const daysRemaining = Math.max(0, Math.round(kmRemaining / (v.rateKmPerDay || 80)));

                  return (
                    <div
                      key={idx}
                      className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-amber-400 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">{v.carName}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              v.status === 'SERVICE_DUE'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                            }`}
                          >
                            {v.status}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">Ref: {v.refNo}</div>

                        <div className="mt-4 space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Daily Mileage Rate:</span>
                            <span className="font-bold text-slate-900 dark:text-white font-mono">{v.rateKmPerDay} km/day</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Current Odometer:</span>
                            <span className="font-bold font-mono text-slate-900 dark:text-white">{v.currentKm?.toLocaleString()} km</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Last Service Date:</span>
                            <span className="font-mono text-slate-600 dark:text-slate-300">
                              {v.lastServiceKm?.toLocaleString()} km ({v.lastServiceDate})
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Next Service Target:</span>
                            <span className="font-bold font-mono text-amber-600 dark:text-amber-400">
                              {v.nextServiceKm?.toLocaleString()} km ({v.nextServiceDate})
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-400">Service Interval</span>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{progressPct.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                progressPct > 85 ? 'bg-rose-500' : progressPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${progressPct}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                        <span className="text-slate-500">Countdown:</span>
                        <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          {kmRemaining.toLocaleString()} km ({daysRemaining} days left)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: FUEL LOGS */}
        {activeTab === 'fuel' && (
          <div className="space-y-6">
            <Card className="p-6 border border-slate-200/80 dark:border-slate-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⛽</span>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Fuel Dispensation & Department Expense Ledger
                    </h2>
                    <Badge tone="live">148 Transactions</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Complete fuel transaction records, department cost centers, and machine chassis tracking.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search chassis or transaction..."
                      value={fuelSearch}
                      onChange={(e) => setFuelSearch(e.target.value)}
                      className="ds-input pl-8 text-xs py-1.5 min-w-[200px]"
                    />
                    <span className="absolute left-2.5 top-2 text-xs text-slate-400">🔍</span>
                  </div>

                  <select
                    value={fuelDeptFilter}
                    onChange={(e) => setFuelDeptFilter(e.target.value)}
                    className="ds-input text-xs py-1.5"
                  >
                    <option value="ALL">All Departments</option>
                    <option value="Leasing">Leasing</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              {/* Fuel Table */}
              <div className="mt-4 overflow-x-auto max-h-[500px] overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs border-collapse min-w-[750px]">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold">
                      <th className="py-2.5 px-3">Item Code</th>
                      <th className="py-2.5 px-3">Transaction Details</th>
                      <th className="py-2.5 px-3">Department</th>
                      <th className="py-2.5 px-3">Chassis #</th>
                      <th className="py-2.5 px-3 text-center">Quantity</th>
                      <th className="py-2.5 px-3 text-right">Unit Price (KD)</th>
                      <th className="py-2.5 px-3 text-right">Total Cost (KD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                    {filteredFuel.map((f, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">{f.itemCode}</td>
                        <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-300">{f.note}</td>
                        <td className="py-2 px-3 font-sans">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                            {f.department}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-500">{f.chassis || 'General'}</td>
                        <td className="py-2 px-3 text-center">{f.quantity}</td>
                        <td className="py-2 px-3 text-right">{f.unitPrice?.toFixed(2)} KD</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          {f.totalCostKd?.toFixed(2)} KD
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 3: GENERATOR & TOOLS */}
        {activeTab === 'equipment' && (
          <div className="space-y-6">
            <Card className="p-6 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚡</span>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Workshop Diesel Generator Runtime Logger
                    </h2>
                    <Badge tone="live">Meter Log</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Meter reading logs, running hour calculations, and daily operation intervals.
                  </p>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Reading Time</th>
                      <th className="py-2.5 px-3">Hour Meter</th>
                      <th className="py-2.5 px-3">Minutes</th>
                      <th className="py-2.5 px-3">Total Runtime</th>
                      <th className="py-2.5 px-3 text-right">Days Since Last</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {generatorReadings.map((g, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{g.date}</td>
                        <td className="py-2.5 px-3 text-slate-500">{g.time}</td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{g.hours} hrs</td>
                        <td className="py-2.5 px-3 text-slate-500">{g.minutes} min</td>
                        <td className="py-2.5 px-3 font-bold text-amber-600 dark:text-amber-400">{g.totalHours} hrs</td>
                        <td className="py-2.5 px-3 text-right text-slate-500">
                          {g.daysSinceLast ? `${g.daysSinceLast.toFixed(1)} days` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Workshop Tools */}
            <Card className="p-6 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🛠️</span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Workshop Heavy Equipment & Tools Master
                    </h3>
                    <Badge tone="ready">Equipment Master</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Air compressors, water pumps, generators, and heavy welding machines.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {workshopTools.map((tool, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{tool.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          tool.status === 'OPERATIONAL'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {tool.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{tool.type}</div>

                    <div className="mt-3 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Power Rating:</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{tool.power}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Capacity / Volume:</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">{tool.capacity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Drive Type:</span>
                        <span className="font-sans font-medium text-amber-600 dark:text-amber-400">{tool.drive}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* TAB 4: WARRANTY */}
        {activeTab === 'warranty' && (
          <div className="space-y-6">
            <Card className="p-6 border border-slate-200/80 dark:border-slate-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🛡️</span>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Battery & Spare Parts Warranty Claims Registry
                    </h2>
                    <Badge tone="live">Active Coverage</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Guarantee tracking for heavy equipment batteries, supplier invoice numbers, and installation serials.
                  </p>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search serial, receipt, or supplier..."
                    value={warrantySearch}
                    onChange={(e) => setWarrantySearch(e.target.value)}
                    className="ds-input pl-8 text-xs py-1.5 min-w-[240px]"
                  />
                  <span className="absolute left-2.5 top-2 text-xs text-slate-400">🔍</span>
                </div>
              </div>

              {/* Warranty Table */}
              <div className="mt-4 overflow-x-auto max-h-[500px] overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs border-collapse min-w-[800px]">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3">Battery Serial #</th>
                      <th className="py-2.5 px-3">Supplier Company</th>
                      <th className="py-2.5 px-3">Receipt #</th>
                      <th className="py-2.5 px-3">Machine Assigned</th>
                      <th className="py-2.5 px-3 text-right">Price (KD)</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                    {filteredWarranties.map((w, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 text-slate-500">{w.purchaseDate}</td>
                        <td className="py-2 px-3 font-sans font-bold text-slate-900 dark:text-white">{w.itemDescription}</td>
                        <td className="py-2 px-3 text-amber-600 dark:text-amber-400 font-bold">{w.batteryOrPartSerial}</td>
                        <td className="py-2 px-3 font-sans text-slate-600 dark:text-slate-300">{w.supplierCompany}</td>
                        <td className="py-2 px-3 text-slate-500">#{w.receiptNo}</td>
                        <td className="py-2 px-3 text-slate-700 dark:text-slate-300">#{w.machineSerial || 'Workshop'}</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">{w.priceKd} KD</td>
                        <td className="py-2 px-3 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-semibold">
                            {w.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 5: KPI TARGETS */}
        {activeTab === 'targets' && (
          <div className="space-y-6">
            <Card className="p-6 border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎯</span>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Corporate Cross-Functional KPI Scorecard & Targets
                    </h2>
                    <Badge tone="live">FY26 Target Registry</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Operational targets, safety meeting participation, DOD points, and monthly report milestones.
                  </p>
                </div>
              </div>

              {/* KPI Cards Grid */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {kpiTargets.map((kpi, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">{kpi.department}</span>
                        <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                          {kpi.completionRate}%
                        </span>
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">{kpi.kpiName}</div>

                      <div className="mt-4 space-y-2 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">FY26 Target:</span>
                          <span className="font-bold text-slate-900 dark:text-white">{kpi.fy26Target}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">1H Target:</span>
                          <span className="text-slate-700 dark:text-slate-300">{kpi.h1Target}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans">1H Progress:</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400">{kpi.h1Progress}</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-4">
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-amber-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(100, kpi.completionRate)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                      <span className="text-slate-400">PIC:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{kpi.pic}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </SystemShell>
  );
}
