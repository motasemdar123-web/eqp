'use client';

import Link from 'next/link';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export default function ReportGenerationSummaryModal({
  isOpen,
  onClose,
  summary,
  onDownloadZip,
  downloadingZip = false,
}) {
  if (!isOpen || !summary) return null;

  const totalRequested = summary.totalRequested ?? (summary.generatedFiles?.length || 0);
  const totalGenerated = summary.totalGenerated ?? (summary.generatedFiles?.length || 0);
  const totalExcluded = summary.totalExcluded ?? (summary.excludedJobs?.length || 0);
  const totalFailed = summary.totalFailed ?? (summary.failedJobs?.length || 0);

  const machineSummary = summary.machineSummary || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
      aria-modal="true"
      role="dialog"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-5 text-white flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-400">
                Execution Complete
              </span>
              <Badge
                tone={totalFailed > 0 ? 'critical' : totalExcluded > 0 ? 'warning' : 'ready'}
                size="sm"
              >
                {totalFailed > 0
                  ? 'Completed with Errors'
                  : totalExcluded > 0
                  ? 'Completed with Exclusions'
                  : 'All Successful'}
              </Badge>
            </div>
            <h3 className="text-lg font-bold text-white">
              Report Generation & Dispatch Summary
            </h3>
            <p className="text-xs text-slate-300">
              Machine-by-machine audit of newly generated documents and contradiction exclusions.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-200 bg-slate-50/70 py-3 text-center">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Requested
            </span>
            <span className="font-mono text-base font-bold text-slate-800">
              {totalRequested}
            </span>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
              ✅ Generated
            </span>
            <span className="font-mono text-base font-bold text-emerald-700">
              {totalGenerated}
            </span>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-amber-600 uppercase tracking-wider">
              🛡️ Excluded
            </span>
            <span className="font-mono text-base font-bold text-amber-700">
              {totalExcluded}
            </span>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-rose-600 uppercase tracking-wider">
              ❌ Failed
            </span>
            <span className="font-mono text-base font-bold text-rose-700">
              {totalFailed}
            </span>
          </div>
        </div>

        {/* Contradiction Protection Banner */}
        {totalExcluded > 0 && (
          <div className="bg-amber-50/80 border-b border-amber-200/80 px-6 py-3 flex items-start gap-3">
            <span className="text-base leading-none">🛡️</span>
            <div className="text-xs text-amber-900 leading-relaxed">
              <strong>Contradiction Protection Activated:</strong> {totalExcluded} report date(s) were excluded because the corresponding machine already had an existing report in that month. This guarantees that duplicate or contradictory monthly reports are never created or uploaded to Komatsu Equipment Care.
            </div>
          </div>
        )}

        {/* Machine-by-Machine Breakdown List */}
        <div className="max-h-[50vh] overflow-y-auto px-6 py-4 space-y-4">
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Machine Report Details ({machineSummary.length} Machinery Assets)
          </h4>

          {machineSummary.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-500">
              No machine breakdown available.
            </div>
          )}

          {machineSummary.map((m) => {
            const hasSuccess = m.successfulReports?.length > 0;
            const hasExcluded = m.excludedReports?.length > 0;
            const hasFailed = m.failedReports?.length > 0;

            let tone = 'ready';
            let statusLabel = 'Success';
            if (hasFailed) {
              tone = 'critical';
              statusLabel = 'Failed';
            } else if (hasExcluded && !hasSuccess) {
              tone = 'archived';
              statusLabel = 'All Excluded';
            } else if (hasExcluded && hasSuccess) {
              tone = 'warning';
              statusLabel = 'Partial (Exclusions)';
            }

            return (
              <div
                key={m.machineNumber}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
              >
                {/* Machine Card Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900">
                      Machine #{m.machineNumber}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      ({m.model || 'Unknown Model'})
                    </span>
                    {m.responsibleEngineer && (
                      <span className="text-[11px] text-slate-400">
                        • {m.responsibleEngineer}
                      </span>
                    )}
                  </div>
                  <Badge tone={tone} size="sm">
                    {statusLabel}
                  </Badge>
                </div>

                {/* Successful Reports */}
                {hasSuccess && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-emerald-700">
                      Generated Reports ({m.successfulReports.length}):
                    </span>
                    <div className="space-y-1">
                      {m.successfulReports.map((file, idx) => (
                        <div
                          key={file.report || file.file || idx}
                          className="flex items-center justify-between rounded-lg bg-emerald-50/60 px-3 py-1.5 text-xs text-emerald-950 border border-emerald-100"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span>📄</span>
                            <span className="font-mono font-medium truncate">
                              {file.file || file.report}
                            </span>
                          </div>
                          {file.fileUrl && (
                            <a
                              href={file.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 underline ml-2 shrink-0"
                            >
                              View PDF ↗
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Excluded Reports */}
                {hasExcluded && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-amber-700">
                      Contradiction Exclusions ({m.excludedReports.length}):
                    </span>
                    <div className="space-y-1">
                      {m.excludedReports.map((item, idx) => (
                        <div
                          key={item.month || item.serviceDate || idx}
                          className="flex items-center justify-between rounded-lg bg-amber-50/60 px-3 py-1.5 text-xs text-amber-900 border border-amber-100"
                        >
                          <div className="flex items-center gap-2">
                            <span>🛡️</span>
                            <span className="font-medium">
                              Month: <strong>{item.month || item.serviceDate?.slice(0, 7)}</strong>
                            </span>
                          </div>
                          <span className="text-[11px] text-amber-700">
                            {item.reason || 'Existing report in this month'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Failed Reports */}
                {hasFailed && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-rose-700">
                      Failures ({m.failedReports.length}):
                    </span>
                    <div className="space-y-1">
                      {m.failedReports.map((item, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg bg-rose-50/60 px-3 py-1.5 text-xs text-rose-900 border border-rose-100"
                        >
                          {item.error || 'Generation error'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onDownloadZip && totalGenerated > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onDownloadZip}
                disabled={downloadingZip}
              >
                {downloadingZip ? 'Packing ZIP...' : '📦 Download All (ZIP)'}
              </Button>
            )}
            <Link href="/eqp/reports">
              <Button variant="ghost" size="sm">
                Open PDF Archive →
              </Button>
            </Link>
          </div>
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
