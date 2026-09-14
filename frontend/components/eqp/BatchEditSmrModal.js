'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { batchUpdateEqpcServiceLogs } from '../../lib/api';

export default function BatchEditSmrModal({ isOpen, onClose, reports = [], onBatchUpdated }) {
  const [items, setItems] = useState([]);
  const [syncToKomatsu, setSyncToKomatsu] = useState(true);
  const [cookieInput, setCookieInput] = useState('');
  const [showCookieInput, setShowCookieInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [errorNotice, setErrorNotice] = useState('');
  const [resultsSummary, setResultsSummary] = useState(null);

  // Quick fill helper states
  const [offsetValue, setOffsetValue] = useState('');
  const [sequenceBase, setSequenceBase] = useState('');
  const [sequenceStep, setSequenceStep] = useState('250');

  // Initialize editable list whenever reports change
  useEffect(() => {
    if (!isOpen) return;

    const initial = reports.slice(0, 12).map((r, idx) => {
      const sNo = String(r.machine_number || r.machineNumber || r.serialNo || r.machine?.machineNumber || '').trim();
      const model = String(r.machine_type || r.model || r.machineType || r.machine?.machineType || '').trim();
      const eCode = String(r.report_type || r.eventCode || r.service_type || r.code || 'W41X').trim().toUpperCase();
      const sDate = String(r.service_date || r.serviceDate || r.date || r.created_at || '').slice(0, 10);
      const curSmr = r.smr != null ? Number(r.smr) : (r.currentSmr != null ? Number(r.currentSmr) : '');

      return {
        id: r.id || `${sNo}-${eCode}-${sDate}-${idx}`,
        originalReport: r,
        machineNumber: sNo,
        model,
        eventCode: eCode,
        serviceDate: sDate,
        currentSmr: curSmr,
        newSmr: curSmr !== '' ? String(curSmr) : '',
        status: 'idle', // 'idle' | 'updating' | 'success' | 'failed'
        statusMessage: '',
      };
    });

    setItems(initial);
    setErrorNotice('');
    setResultsSummary(null);
    setProgressMsg('');

    const storedCookie = typeof window !== 'undefined' ? localStorage.getItem('eqpc_user_cookie') || '' : '';
    setCookieInput(storedCookie);
    setShowCookieInput(!storedCookie || storedCookie.includes('test_session'));
  }, [isOpen, reports]);

  const hasExceededLimit = reports.length > 12;

  const handleSmrChange = (idx, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], newSmr: value };
      return copy;
    });
  };

  const applyOffsetToAll = () => {
    const numOffset = Number(offsetValue);
    if (isNaN(numOffset) || offsetValue === '') return;

    setItems((prev) =>
      prev.map((item) => {
        const cur = Number(item.currentSmr);
        const calculated = !isNaN(cur) && cur >= 0 ? Math.max(0, cur + numOffset) : '';
        return { ...item, newSmr: calculated !== '' ? String(calculated) : item.newSmr };
      })
    );
  };

  const applyAutoSequence = () => {
    const base = Number(sequenceBase);
    const step = Number(sequenceStep);
    if (isNaN(base) || isNaN(step) || sequenceBase === '') return;

    setItems((prev) =>
      prev.map((item, idx) => ({
        ...item,
        newSmr: String(Math.max(0, base + idx * step)),
      }))
    );
  };

  const handleSubmitBatch = async (e) => {
    if (e) e.preventDefault();
    if (items.length === 0 || isSubmitting) return;

    if (items.length > 12) {
      setErrorNotice('Maximum of 12 reports can be edited in a single batch.');
      return;
    }

    // Validate all items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const nSmr = Number(item.newSmr);
      if (item.newSmr === '' || isNaN(nSmr) || nSmr < 0) {
        setErrorNotice(`Row #${i + 1} (#${item.machineNumber} ${item.eventCode}) has an invalid SMR.`);
        return;
      }
    }

    const cleanCookie = cookieInput.trim();
    if (syncToKomatsu && (!cleanCookie || cleanCookie.includes('test_session'))) {
      setErrorNotice('Active Komatsu session cookie (JSESSIONID) is required to sync with Komatsu Equipment Care.');
      setShowCookieInput(true);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorNotice('');
      setProgressMsg(`Submitting batch update for ${items.length} reports to Komatsu EQP Care & generating replacement PDFs...`);

      if (cleanCookie && typeof window !== 'undefined') {
        localStorage.setItem('eqpc_user_cookie', cleanCookie);
      }

      const payloadItems = items.map((it) => ({
        serialNo: it.machineNumber,
        model: it.model,
        eventCode: it.eventCode,
        serviceDate: it.serviceDate,
        newSmr: Number(it.newSmr),
        currentSmr: it.currentSmr !== '' ? Number(it.currentSmr) : undefined,
        syncToEqpc: syncToKomatsu,
      }));

      const res = await batchUpdateEqpcServiceLogs({
        items: payloadItems,
        options: { syncToEqpc: syncToKomatsu, cookie: cleanCookie },
        cookie: cleanCookie,
      });

      if (res && res.success) {
        setResultsSummary(res);
        setProgressMsg('');

        // Map per-item status
        const updatedItems = items.map((item, idx) => {
          const itemResult = res.results?.[idx];
          if (itemResult && (itemResult.success || itemResult.status !== 'FAILED')) {
            return {
              ...item,
              status: 'success',
              statusMessage: itemResult.message || 'Updated successfully',
            };
          }
          return {
            ...item,
            status: 'failed',
            statusMessage: itemResult?.error || itemResult?.message || 'Update failed',
          };
        });
        setItems(updatedItems);

        if (onBatchUpdated) {
          onBatchUpdated(res);
        }

        if (res.failed === 0) {
          setTimeout(() => {
            onClose();
          }, 1800);
        }
      } else {
        setErrorNotice(res?.message || 'Batch update failed.');
      }
    } catch (err) {
      setErrorNotice(err.message || 'Failed to execute batch SMR update.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold text-lg border border-amber-500/20">
              ✏️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Batch Edit SMRs & Reports</h3>
                <Badge tone={hasExceededLimit ? 'danger' : 'yellow'}>
                  {items.length} / 12 Reports Selected
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                In-place certified update across Komatsu Equipment Care, replacement PDFs, and local databases.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-sm">
          {/* Rule Guidance Box */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-900 leading-relaxed">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <span>🛡️ Certified Multi-Report Integrity Rules:</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-800">
              <li>
                <strong>Automated Replacement PDFs:</strong> Each report's PDF is regenerated on its own with the new SMR, preserving machine specs, customer, date, inspector, and comments without duplicate logs.
              </li>
              <li>
                <strong>Protected Operational Counters:</strong> Machine operational counters (<code className="font-mono bg-amber-100 px-1 py-0.5 rounded">report_counter</code>, <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">smr_step</code>) are <strong>never</strong> incremented or modified.
              </li>
              <li>
                <strong>Conditional Machine SMR:</strong> If a report is the <em>latest report generated</em> for its machine, that machine's SMR is updated. Older reports preserve the machine's overall SMR.
              </li>
              <li>
                <strong>Batch Limit:</strong> Up to <strong>12 reports</strong> per batch.
              </li>
            </ul>
          </div>

          {hasExceededLimit && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg font-medium flex items-center gap-2">
              <span>⚠️</span>
              <span>
                You have selected {reports.length} reports. Only the first 12 reports will be processed. Please narrow your selection to 12 or fewer reports.
              </span>
            </div>
          )}

          {/* Quick-Fill Helpers Toolbar */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-slate-700">⚡ Quick Fill Tools:</span>

            {/* Offset Tool */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Offset (+hrs):</span>
              <input
                type="number"
                value={offsetValue}
                onChange={(e) => setOffsetValue(e.target.value)}
                placeholder="+5"
                className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-center font-mono"
              />
              <button
                type="button"
                onClick={applyOffsetToAll}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded font-semibold text-xs transition-colors"
              >
                Apply Offset
              </button>
            </div>

            {/* Sequence Tool */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Auto-Sequence (Base):</span>
              <input
                type="number"
                value={sequenceBase}
                onChange={(e) => setSequenceBase(e.target.value)}
                placeholder="250"
                className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-center font-mono"
              />
              <span className="text-slate-500">Step:</span>
              <input
                type="number"
                value={sequenceStep}
                onChange={(e) => setSequenceStep(e.target.value)}
                placeholder="250"
                className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-center font-mono"
              />
              <button
                type="button"
                onClick={applyAutoSequence}
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded font-semibold text-xs transition-colors"
              >
                Apply Sequence
              </button>
            </div>
          </div>

          {/* Editable Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3 w-8">#</th>
                    <th className="py-2.5 px-3">Machine</th>
                    <th className="py-2.5 px-3">Event / Service</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-right">Current SMR</th>
                    <th className="py-2.5 px-3 w-36">New SMR (hrs) *</th>
                    <th className="py-2.5 px-3 w-28 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        item.status === 'success' ? 'bg-emerald-50/40' : item.status === 'failed' ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <span className="font-bold text-slate-800">{item.model}</span>
                        <span className="font-mono text-slate-500 ml-1">#{item.machineNumber}</span>
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-700">
                        <Badge tone="neutral">{item.eventCode}</Badge>
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-600">{item.serviceDate}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-500">
                        {item.currentSmr !== '' ? `${item.currentSmr} hrs` : '-'}
                      </td>
                      <td className="py-2 px-3">
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            disabled={isSubmitting}
                            value={item.newSmr}
                            onChange={(e) => handleSmrChange(idx, e.target.value)}
                            className="w-full pl-2.5 pr-8 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs text-right"
                            placeholder="0"
                          />
                          <span className="absolute right-2 top-1 text-[10px] font-medium text-slate-400 pointer-events-none">
                            hrs
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        {item.status === 'idle' && <span className="text-slate-400 text-[11px]">Ready</span>}
                        {item.status === 'updating' && <span className="text-amber-600 animate-pulse text-[11px]">Updating...</span>}
                        {item.status === 'success' && <span className="text-emerald-600 font-bold text-[11px]">✓ Done</span>}
                        {item.status === 'failed' && (
                          <span className="text-rose-600 font-bold text-[11px]" title={item.statusMessage}>
                            ✕ Error
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Komatsu Portal Sync Configuration */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={syncToKomatsu}
                onChange={(e) => setSyncToKomatsu(e.target.checked)}
                disabled={isSubmitting}
                className="mt-0.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="font-bold text-slate-800">Sync in-place to Komatsu Equipment Care</span>
                <p className="text-[11px] text-slate-500">
                  Updates each existing service record directly on the Komatsu portal (<code className="font-mono">actionMode=update</code>).
                </p>
              </div>
            </label>

            {syncToKomatsu && (
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        cookieInput ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                      }`}
                    />
                    <span className="font-semibold text-slate-700">
                      {cookieInput ? 'Komatsu Session Cookie Configured' : 'Session Cookie Needed'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCookieInput(!showCookieInput)}
                    className="text-amber-700 hover:text-amber-800 font-medium hover:underline text-xs"
                  >
                    {showCookieInput ? 'Hide Cookie' : 'Edit Cookie'}
                  </button>
                </div>

                {showCookieInput && (
                  <div className="space-y-1.5">
                    <textarea
                      rows={2}
                      value={cookieInput}
                      onChange={(e) => setCookieInput(e.target.value)}
                      placeholder="Paste your Komatsu JSESSIONID / cookie header here..."
                      className="w-full p-2 text-xs font-mono border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                    <p className="text-[10px] text-slate-400">
                      In Edge/Chrome on Komatsu portal, press F12 → Network → copy cookie header with JSESSIONID.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Progress / Status Notice */}
          {progressMsg && (
            <div className="p-3 bg-sky-50 border border-sky-200 text-sky-900 rounded-xl text-xs flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              <span className="font-medium">{progressMsg}</span>
            </div>
          )}

          {errorNotice && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <span>✕</span>
              <span>{errorNotice}</span>
            </div>
          )}

          {resultsSummary && (
            <div className={`p-3 rounded-xl text-xs border ${
              resultsSummary.failed === 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="font-bold">
                {resultsSummary.failed === 0
                  ? `🎉 Successfully updated all ${resultsSummary.successful} reports!`
                  : `⚠️ Completed with partial status: ${resultsSummary.successful} succeeded, ${resultsSummary.failed} failed.`}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>

          <Button
            variant="primary"
            onClick={handleSubmitBatch}
            disabled={isSubmitting || items.length === 0}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-1.5">⏳</span>
                Updating {items.length} Reports...
              </>
            ) : (
              `Save & Update (${items.length}) Reports`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
