'use client';

export default function ToolboxSummaryKPIs({
  stats = {
    totalQuantity: 0,
    uniqueTools: 0,
    goodCount: 0,
    damagedCount: 0,
    missingCount: 0,
    notDeliveredCount: 0,
    operationalRate: 100,
  },
  onFilterStatus,
}) {
  const isAllGood = stats.damagedCount === 0 && stats.missingCount === 0 && stats.notDeliveredCount === 0;

  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {/* Primary KPI: Readiness Gauge */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between col-span-2 sm:col-span-1">
        <div>
          <span className="text-xs text-slate-400 font-medium block">Toolbox Readiness</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-white font-mono tracking-tight">
              {stats.operationalRate}%
            </span>
            <span className="text-[11px] text-emerald-400 font-bold">
              {stats.goodCount}/{stats.totalQuantity}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Asset readiness index</p>
        </div>

        {/* Circular Mini Gauge */}
        <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-800"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={stats.operationalRate >= 95 ? 'text-emerald-400' : 'text-amber-400'}
              strokeDasharray={`${stats.operationalRate}, 100`}
              strokeWidth="3.5"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span className="absolute text-[10px] font-bold text-white font-mono">
            {Math.round(stats.operationalRate)}%
          </span>
        </div>
      </div>

      {/* Total Registered Tools */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Total Tools</span>
          <span className="text-xs font-mono text-slate-500 font-bold">{stats.uniqueTools} SKUs</span>
        </div>
        <div className="mt-1">
          <span className="text-2xl font-black text-white font-mono tracking-tight">{stats.totalQuantity}</span>
          <span className="text-xs text-slate-400 ml-1 font-medium">PCS</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5">Assigned physical assets</p>
      </div>

      {/* Damaged Tools (Conditional Alert) */}
      <div
        onClick={() => onFilterStatus && onFilterStatus('damaged')}
        className={`rounded-2xl p-4 shadow-lg cursor-pointer transition-all flex flex-col justify-between border ${
          stats.damagedCount > 0
            ? 'bg-amber-950/30 border-amber-500/50 hover:border-amber-400'
            : 'bg-slate-900 border-slate-800 hover:border-slate-700 opacity-80'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold ${stats.damagedCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
            Damaged Tools
          </span>
          <span className="text-xs">{stats.damagedCount > 0 ? '⚠️' : '✓'}</span>
        </div>
        <div className="mt-1">
          <span
            className={`text-2xl font-black font-mono tracking-tight ${
              stats.damagedCount > 0 ? 'text-amber-400' : 'text-slate-300'
            }`}
          >
            {stats.damagedCount}
          </span>
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5">
          {stats.damagedCount > 0 ? 'Click to inspect issues' : 'All tools intact'}
        </p>
      </div>

      {/* Missing Tools (Conditional Alert) */}
      <div
        onClick={() => onFilterStatus && onFilterStatus('missing')}
        className={`rounded-2xl p-4 shadow-lg cursor-pointer transition-all flex flex-col justify-between border ${
          stats.missingCount > 0
            ? 'bg-red-950/30 border-red-500/50 hover:border-red-400'
            : 'bg-slate-900 border-slate-800 hover:border-slate-700 opacity-80'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold ${stats.missingCount > 0 ? 'text-red-400' : 'text-slate-400'}`}>
            Missing Tools
          </span>
          <span className="text-xs">{stats.missingCount > 0 ? '❌' : '✓'}</span>
        </div>
        <div className="mt-1">
          <span
            className={`text-2xl font-black font-mono tracking-tight ${
              stats.missingCount > 0 ? 'text-red-400' : 'text-slate-300'
            }`}
          >
            {stats.missingCount}
          </span>
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5">
          {stats.missingCount > 0 ? 'Click to log report' : 'Zero missing items'}
        </p>
      </div>

      {/* Pending Delivery (Conditional Alert) */}
      <div
        onClick={() => onFilterStatus && onFilterStatus('not_delivered')}
        className={`rounded-2xl p-4 shadow-lg cursor-pointer transition-all flex flex-col justify-between border ${
          stats.notDeliveredCount > 0
            ? 'bg-purple-950/30 border-purple-500/50 hover:border-purple-400'
            : 'bg-slate-900 border-slate-800 hover:border-slate-700 opacity-80'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold ${stats.notDeliveredCount > 0 ? 'text-purple-400' : 'text-slate-400'}`}>
            Pending Delivery
          </span>
          <span className="text-xs">{stats.notDeliveredCount > 0 ? '⏳' : '✓'}</span>
        </div>
        <div className="mt-1">
          <span
            className={`text-2xl font-black font-mono tracking-tight ${
              stats.notDeliveredCount > 0 ? 'text-purple-400' : 'text-slate-300'
            }`}
          >
            {stats.notDeliveredCount}
          </span>
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5">
          {stats.notDeliveredCount > 0 ? 'Not yet issued' : 'Complete kit issued'}
        </p>
      </div>
    </section>
  );
}
