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
  { id: 'vehicles', label: 'Service Vehicles Fleet', desc: '5,000 km PM schedules, daily usage rates & maintenance countdowns' },
  { id: 'fuel', label: 'Fuel Logs & Department Ledger', desc: 'Transaction logs, quantities, unit prices & department cost allocations' },
  { id: 'equipment', label: 'Generator & Workshop Tools', desc: 'Diesel generator runtime hour meter & heavy workshop tools master' },
  { id: 'warranty', label: 'Battery & Parts Warranty', desc: 'Heavy equipment battery serials, supplier invoices & warranty terms' },
  { id: 'targets', label: 'Corporate KPI Scorecards', desc: 'FY26 cross-functional targets, 1H progress & PIC milestones' },
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
          <Link href="/management/fleet-analytics" className="ds-button ds-button-secondary text-xs flex items-center gap-1.5 font-bold text-slate-800">
            <span>🚜</span> Fleet Hub
          </Link>
          <Link href="/management" className="ds-button ds-button-secondary text-xs font-bold text-slate-800">
            Dashboard
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Metric Cards Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="rounded-xl p-4 border border-slate-200 bg-white shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Service Vehicles</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {loading ? <Skeleton className="h-7 w-12" /> : `${vehicles.length} Trucks`}
            </div>
            <div className="text-xs text-emerald-800 font-bold mt-0.5">5,000 km PM intervals</div>
          </div>

          <div className="rounded-xl p-4 border border-slate-200 bg-white shadow-xs">
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Total Fuel Cost</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {loading ? <Skeleton className="h-7 w-16" /> : `${totalFuelCost.toLocaleString()} KD`}
            </div>
            <div className="text-xs text-emerald-800 font-bold mt-0.5">{fuelLogs.length} fill transactions</div>
          </div>

          <div className="rounded-xl p-4 border border-slate-200 bg-white shadow-xs">
            <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Workshop Tools</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {loading ? <Skeleton className="h-7 w-12" /> : `${workshopTools.length} Units`}
            </div>
            <div className="text-xs text-blue-800 font-bold mt-0.5">Compressors & welders</div>
          </div>

          <div className="rounded-xl p-4 border border-slate-200 bg-white shadow-xs">
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Active Warranties</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {loading ? <Skeleton className="h-7 w-12" /> : `${warranties.length} Claims`}
            </div>
            <div className="text-xs text-amber-800 font-bold mt-0.5">Batteries & parts insured</div>
          </div>

          <div className="rounded-xl p-4 border border-slate-200 bg-white shadow-xs">
            <div className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">KPI Target Score</div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {loading ? <Skeleton className="h-7 w-12" /> : `${kpiTargets.length} Goals`}
            </div>
            <div className="text-xs text-purple-800 font-bold mt-0.5">Corporate milestone rate</div>
          </div>
        </section>

        {/* Tab Ribbon */}
        <section className="rounded-xl p-1.5 border border-slate-200 bg-white shadow-xs">
          <div className="flex flex-wrap gap-1">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    active
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100 bg-slate-50'
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
            <div className="rounded-xl p-6 border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🚗</span>
                    <h2 className="text-base font-bold text-slate-900">
                      Field Service Trucks Odometer & Periodic Maintenance Schedules
                    </h2>
                    <Badge tone="live">Fleet Registry</Badge>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
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
                      className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-amber-400 transition-all flex flex-col justify-between"
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
                            <span className="text-slate-600">Last Service Date:</span>
                            <span className="font-mono text-slate-800 font-semibold">
                              {v.lastServiceKm?.toLocaleString()} km ({v.lastServiceDate})
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Next Service Target:</span>
                            <span className="font-bold font-mono text-amber-800">
                              {v.nextServiceKm?.toLocaleString()} km ({v.nextServiceDate})
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-500 font-bold">Service Interval</span>
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
          </div>
        )}

        {/* TAB 2: FUEL LOGS */}
        {activeTab === 'fuel' && (
          <div className="space-y-6">
            <div className="rounded-xl p-6 border border-slate-200 bg-white shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⛽</span>
                    <h2 className="text-base font-bold text-slate-900">
                      Fuel Dispensation & Department Expense Ledger
                    </h2>
                    <Badge tone="live">148 Transactions</Badge>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
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
                      className="ds-input pl-8 text-xs py-1.5 min-w-[200px] text-slate-900"
                    />
                    <span className="absolute left-2.5 top-2 text-xs text-slate-500">🔍</span>
                  </div>

                  <select
                    value={fuelDeptFilter}
                    onChange={(e) => setFuelDeptFilter(e.target.value)}
                    className="ds-input text-xs py-1.5 font-semibold text-slate-900"
                  >
                    <option value="ALL">All Departments</option>
                    <option value="Leasing">Leasing</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              {/* Fuel Table */}
              <div className="mt-4 overflow-x-auto max-h-[500px] overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse min-w-[750px]">
                  <thead className="sticky top-0 bg-slate-100 z-10">
                    <tr className="border-b border-slate-200 text-slate-800 font-bold text-[10px] uppercase">
                      <th className="py-2.5 px-3 text-slate-900">Item Code</th>
                      <th className="py-2.5 px-3 text-slate-900">Transaction Details</th>
                      <th className="py-2.5 px-3 text-slate-900">Department</th>
                      <th className="py-2.5 px-3 text-slate-900">Chassis #</th>
                      <th className="py-2.5 px-3 text-center text-slate-900">Quantity</th>
                      <th className="py-2.5 px-3 text-right text-slate-900">Unit Price (KD)</th>
                      <th className="py-2.5 px-3 text-right text-slate-900">Total Cost (KD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {filteredFuel.map((f, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-bold text-slate-900">{f.itemCode}</td>
                        <td className="py-2 px-3 font-sans text-slate-700 font-medium">{f.note}</td>
                        <td className="py-2 px-3 font-sans">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-800 font-bold border border-slate-300">
                            {f.department}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600 font-bold">{f.chassis || 'General'}</td>
                        <td className="py-2 px-3 text-center text-slate-900 font-bold">{f.quantity}</td>
                        <td className="py-2 px-3 text-right text-slate-800">{f.unitPrice?.toFixed(2)} KD</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-800">
                          {f.totalCostKd?.toFixed(2)} KD
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GENERATOR & TOOLS */}
        {activeTab === 'equipment' && (
          <div className="space-y-6">
            <div className="rounded-xl p-6 border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚡</span>
                    <h2 className="text-base font-bold text-slate-900">
                      Workshop Diesel Generator Runtime Logger
                    </h2>
                    <Badge tone="live">Meter Log</Badge>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Meter reading logs, running hour calculations, and daily operation intervals.
                  </p>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200 text-[10px] uppercase">
                      <th className="py-2.5 px-3 text-slate-900">Date</th>
                      <th className="py-2.5 px-3 text-slate-900">Reading Time</th>
                      <th className="py-2.5 px-3 text-slate-900">Hour Meter</th>
                      <th className="py-2.5 px-3 text-slate-900">Minutes</th>
                      <th className="py-2.5 px-3 text-slate-900">Total Runtime</th>
                      <th className="py-2.5 px-3 text-right text-slate-900">Days Since Last</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {generatorReadings.map((g, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{g.date}</td>
                        <td className="py-2.5 px-3 text-slate-600">{g.time}</td>
                        <td className="py-2.5 px-3 text-slate-800 font-semibold">{g.hours} hrs</td>
                        <td className="py-2.5 px-3 text-slate-600">{g.minutes} min</td>
                        <td className="py-2.5 px-3 font-bold text-amber-800">{g.totalHours} hrs</td>
                        <td className="py-2.5 px-3 text-right text-slate-600 font-bold">
                          {g.daysSinceLast ? `${g.daysSinceLast.toFixed(1)} days` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Workshop Tools */}
            <div className="rounded-xl p-6 border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🛠️</span>
                    <h3 className="text-base font-bold text-slate-900">
                      Workshop Heavy Equipment & Tools Master
                    </h3>
                    <Badge tone="ready">Equipment Master</Badge>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Air compressors, water pumps, generators, and heavy welding machines.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {workshopTools.map((tool, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">{tool.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          tool.status === 'OPERATIONAL'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}
                      >
                        {tool.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5 font-medium">{tool.type}</div>

                    <div className="mt-3 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Power Rating:</span>
                        <span className="font-mono font-bold text-slate-900">{tool.power}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Capacity / Volume:</span>
                        <span className="font-mono text-slate-900 font-bold">{tool.capacity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Drive Type:</span>
                        <span className="font-sans font-bold text-amber-800">{tool.drive}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: WARRANTY */}
        {activeTab === 'warranty' && (
          <div className="space-y-6">
            <div className="rounded-xl p-6 border border-slate-200 bg-white shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🛡️</span>
                    <h2 className="text-base font-bold text-slate-900">
                      Battery & Spare Parts Warranty Claims Registry
                    </h2>
                    <Badge tone="live">Active Coverage</Badge>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Guarantee tracking for heavy equipment batteries, supplier invoice numbers, and installation serials.
                  </p>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search serial, receipt, or supplier..."
                    value={warrantySearch}
                    onChange={(e) => setWarrantySearch(e.target.value)}
                    className="ds-input pl-8 text-xs py-1.5 min-w-[240px] text-slate-900"
                  />
                  <span className="absolute left-2.5 top-2 text-xs text-slate-500">🔍</span>
                </div>
              </div>

              {/* Warranty Table */}
              <div className="mt-4 overflow-x-auto max-h-[500px] overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse min-w-[800px]">
                  <thead className="sticky top-0 bg-slate-100 z-10">
                    <tr className="border-b border-slate-200 text-slate-800 font-bold text-[10px] uppercase">
                      <th className="py-2.5 px-3 text-slate-900">Date</th>
                      <th className="py-2.5 px-3 text-slate-900">Item Description</th>
                      <th className="py-2.5 px-3 text-slate-900">Battery Serial #</th>
                      <th className="py-2.5 px-3 text-slate-900">Supplier Company</th>
                      <th className="py-2.5 px-3 text-slate-900">Receipt #</th>
                      <th className="py-2.5 px-3 text-slate-900">Machine Assigned</th>
                      <th className="py-2.5 px-3 text-right text-slate-900">Price (KD)</th>
                      <th className="py-2.5 px-3 text-right text-slate-900">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {filteredWarranties.map((w, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-600 font-semibold">{w.purchaseDate}</td>
                        <td className="py-2 px-3 font-sans font-bold text-slate-900">{w.itemDescription}</td>
                        <td className="py-2 px-3 text-amber-800 font-bold">{w.batteryOrPartSerial}</td>
                        <td className="py-2 px-3 font-sans text-slate-700">{w.supplierCompany}</td>
                        <td className="py-2 px-3 text-slate-600 font-bold">#{w.receiptNo}</td>
                        <td className="py-2 px-3 text-slate-900 font-bold">#{w.machineSerial || 'Workshop'}</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-800">{w.priceKd} KD</td>
                        <td className="py-2 px-3 text-right">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
                            {w.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: KPI TARGETS */}
        {activeTab === 'targets' && (
          <div className="space-y-6">
            <div className="rounded-xl p-6 border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎯</span>
                    <h2 className="text-base font-bold text-slate-900">
                      Corporate Cross-Functional KPI Scorecard & Targets
                    </h2>
                    <Badge tone="live">FY26 Target Registry</Badge>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Operational targets, safety meeting participation, DOD points, and monthly report milestones.
                  </p>
                </div>
              </div>

              {/* KPI Cards Grid */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {kpiTargets.map((kpi, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600">{kpi.department}</span>
                        <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                          {kpi.completionRate}%
                        </span>
                      </div>
                      <div className="text-sm font-bold text-slate-900 mt-1.5">{kpi.kpiName}</div>

                      <div className="mt-4 space-y-2 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-600 font-sans">FY26 Target:</span>
                          <span className="font-bold text-slate-900">{kpi.fy26Target}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 font-sans">1H Target:</span>
                          <span className="text-slate-800 font-semibold">{kpi.h1Target}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600 font-sans">1H Progress:</span>
                          <span className="font-bold text-amber-800">{kpi.h1Progress}</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-4">
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                          <div
                            className="bg-amber-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(100, kpi.completionRate)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-semibold">PIC:</span>
                      <span className="font-bold text-slate-900">{kpi.pic}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </SystemShell>
  );
}
