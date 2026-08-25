'use client';

import React from 'react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export default function MachineTimelineModal({ machine, onClose, onSelectForReport }) {
  if (!machine) return null;

  const serial = machine.machine_number || machine.machineNumber || machine.serial || '—';
  const model = machine.machine_type || machine.model || '—';
  const engineer = machine.responsible_engineer || machine.responsibleEngineer || '—';
  const smr = machine.last_smr ?? machine.lastSmr ?? '—';
  const counter = machine.report_counter ?? machine.reportCounter ?? machine.addServiceCount ?? 0;
  const location = machine.location || 'Sabah Al-Ahmad Sea City';
  const customer = machine.customer_name || machine.customer || 'Laala Al-Kuwait Real Estate Co.';
  const engineNo = machine.engine_number || machine.engineNumber || '—';

  // Extract history/observed reports
  const observedReports = machine.observedReports || machine.reports || [];
  const milestones = machine.milestones || [
    { label: 'Pre Delivery', code: 'W41P', date: machine.preDeliveryDate },
    { label: 'Delivery', code: 'W41N', date: machine.deliveryDate },
    { label: '1st Service', code: 'W411', date: machine.firstServiceDate },
    { label: '2nd Service', code: 'W412', date: machine.secondServiceDate },
    { label: '3rd Service', code: 'W413', date: machine.thirdServiceDate },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs font-mono">
              EQP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white tracking-tight">{model} #{serial}</h3>

                <Badge tone="live">Active Unit</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Assigned to <span className="text-amber-400 font-semibold">{engineer}</span> • {location}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white rounded-lg p-1.5 hover:bg-slate-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Quick Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Operating SMR</p>
              <p className="text-base font-extrabold text-slate-900 mt-0.5">{smr} <span className="text-xs font-normal text-slate-500">hours</span></p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Report Counter</p>
              <p className="text-base font-extrabold text-amber-600 mt-0.5">Ex_{counter + 1} <span className="text-xs font-normal text-slate-500">(next)</span></p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Engine Serial</p>
              <p className="text-xs font-mono font-bold text-slate-800 mt-1 truncate" title={engineNo}>{engineNo}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Customer</p>
              <p className="text-xs font-medium text-slate-800 mt-1 truncate" title={customer}>{customer}</p>
            </div>
          </div>

          {/* Lifecycle Milestone Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Lifecycle Milestones</h4>
              <span className="text-[11px] text-slate-400">Komatsu Factory Service Protocol</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
              <div className="grid grid-cols-5 gap-2 text-center">
                {milestones.map((m, idx) => {
                  const isDone = Boolean(m.date);
                  return (
                    <div key={m.label} className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 transition-all ${
                          isDone
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-400 border border-slate-300'
                        }`}
                      >
                        {isDone ? '✓' : idx + 1}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-800">{m.label}</span>
                      <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {m.date ? String(m.date).slice(0, 10) : 'Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Chronological Service Timeline */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Service Event History</h4>
              <Badge tone="neutral">{observedReports.length} Events</Badge>
            </div>

            {observedReports.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <p className="text-sm text-slate-500">No recorded service history found for this machine.</p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {observedReports.map((evt, idx) => {
                  const code = Array.isArray(evt) ? evt[0] : (evt.code || evt.report_type || 'W41X');
                  const date = Array.isArray(evt) ? evt[1] : (evt.date || evt.service_date || evt.created_at || '—');
                  const fileName = evt.fileName || evt.file_name || '';
                  const evtSmr = evt.smr || '';

                  return (
                    <div key={idx} className="relative group">
                      {/* Timeline Node */}
                      <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-white border border-amber-600" />
                      
                      <div className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-lg p-3 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono">
                              {code}
                            </span>
                            <span className="text-xs font-semibold text-slate-800">
                              {fileName || `Service Report (${code})`}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-500 font-medium">
                            {String(date).slice(0, 10)}
                          </span>
                        </div>

                        {evtSmr && (
                          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="font-semibold text-slate-700">SMR:</span>
                            <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800">
                              {evtSmr} hrs
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>

          {onSelectForReport && (
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                onSelectForReport(machine);
                onClose();
              }}
            >
              ⚡ Select in Report Builder
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
