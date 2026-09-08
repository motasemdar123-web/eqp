'use client';

import React, { useMemo } from 'react';
import { FORMAT_TYPES, PIPELINE_STAGES } from '../../lib/mediaMonthlyData';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MediaCalendarGrid({
  selectedMonthId, // e.g. '2026-09'
  concepts,
  onSelectPost,
  onAddPost,
}) {
  // Parse year and month
  const { year, monthIndex } = useMemo(() => {
    const parts = (selectedMonthId || '2026-09').split('-');
    const y = parseInt(parts[0], 10) || 2026;
    const m = (parseInt(parts[1], 10) || 9) - 1; // 0-indexed month
    return { year: y, monthIndex: m };
  }, [selectedMonthId]);

  // Generate calendar days for the month
  const calendarCells = useMemo(() => {
    const firstDay = new Date(year, monthIndex, 1);
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    // Days in previous month for padding
    const daysInPrevMonth = new Date(year, monthIndex, 0).getDate();

    const cells = [];

    // Leading padding cells from prev month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      cells.push({
        dayNumber: d,
        isCurrentMonth: false,
        dateStr: null,
      });
    }

    // Current month cells
    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(monthIndex + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;

      const dayPosts = concepts.filter((c) => c.publishDate === dateStr);

      cells.push({
        dayNumber: d,
        isCurrentMonth: true,
        dateStr,
        posts: dayPosts,
      });
    }

    // Trailing padding cells to complete final week
    const remainder = cells.length % 7;
    if (remainder > 0) {
      const trailingCount = 7 - remainder;
      for (let i = 1; i <= trailingCount; i++) {
        cells.push({
          dayNumber: i,
          isCurrentMonth: false,
          dateStr: null,
        });
      }
    }

    return cells;
  }, [year, monthIndex, concepts]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Calendar Header Row: Weekday Names */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-900 text-white text-center">
        {WEEKDAYS.map((dayName, idx) => (
          <div
            key={dayName}
            className={`py-3 text-xs font-bold uppercase tracking-wider ${
              idx === 0 || idx === 2 || idx === 4 ? 'text-amber-400' : 'text-slate-300'
            }`}
          >
            {dayName}
            {(idx === 0 || idx === 2 || idx === 4) && (
              <span className="block text-[9px] font-normal text-amber-300/80 uppercase">Publish</span>
            )}
          </div>
        ))}
      </div>

      {/* Calendar 7-Column Day Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-200">
        {calendarCells.map((cell, idx) => {
          if (!cell.isCurrentMonth) {
            return (
              <div
                key={`pad-${idx}`}
                className="bg-slate-50/50 p-2 min-h-[115px] sm:min-h-[135px] text-slate-300 select-none"
              >
                <span className="text-xs font-semibold font-mono text-slate-400/50">
                  {cell.dayNumber}
                </span>
              </div>
            );
          }

          const hasPosts = cell.posts && cell.posts.length > 0;
          const isToday =
            cell.dateStr === new Date().toISOString().slice(0, 10);

          return (
            <div
              key={cell.dateStr}
              className={`p-2 min-h-[115px] sm:min-h-[135px] flex flex-col justify-between transition-colors group relative ${
                isToday ? 'bg-amber-50/30' : 'bg-white hover:bg-slate-50/80'
              }`}
            >
              {/* Cell Top Bar: Day Number & Add Button */}
              <div className="flex items-center justify-between gap-1 mb-1">
                <span
                  className={`text-xs font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                    isToday
                      ? 'bg-amber-400 text-slate-950 shadow-2xs font-black'
                      : hasPosts
                      ? 'text-slate-900 bg-slate-100'
                      : 'text-slate-500'
                  }`}
                >
                  {cell.dayNumber}
                </span>

                <button
                  type="button"
                  onClick={() => onAddPost(cell.dateStr)}
                  title={`Add post idea on ${cell.dateStr}`}
                  className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-200 px-1.5 py-0.5 rounded transition-all cursor-pointer"
                >
                  + Add
                </button>
              </div>

              {/* Scheduled Posts in This Day */}
              <div className="space-y-1.5 flex-1">
                {cell.posts.map((post) => {
                  const formatMeta =
                    FORMAT_TYPES.find((f) => f.id === post.format) || FORMAT_TYPES[0];
                  const stageMeta =
                    PIPELINE_STAGES.find((s) => s.id === post.status) || PIPELINE_STAGES[0];

                  return (
                    <div
                      key={post.id}
                      onClick={() => onSelectPost(post)}
                      className="p-1.5 sm:p-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer shadow-2xs group/card border border-slate-800"
                    >
                      {/* Post Format & Status Dot */}
                      <div className="flex items-center justify-between text-[9px] mb-1">
                        <span className="font-semibold text-amber-400 uppercase tracking-tight truncate">
                          {formatMeta.shortLabel || formatMeta.label}
                        </span>

                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            post.status === 'ready' || post.status === 'published'
                              ? 'bg-emerald-400 ring-2 ring-emerald-400/20'
                              : post.status === 'production' || post.status === 'scripted'
                              ? 'bg-amber-400'
                              : 'bg-slate-400'
                          }`}
                          title={stageMeta.label}
                        />
                      </div>

                      {/* Post Title */}
                      <p className="text-[11px] font-bold text-slate-100 line-clamp-2 leading-tight group-hover/card:text-amber-300 transition-colors">
                        {post.title}
                      </p>

                      {/* Optional TOV snippet if available */}
                      {post.tov && (
                        <p className="text-[9px] text-slate-400 truncate mt-1">
                          🎙️ {post.tov}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Quick Trigger if empty */}
              {!hasPosts && (
                <div
                  onClick={() => onAddPost(cell.dateStr)}
                  className="opacity-0 group-hover:opacity-100 border border-dashed border-slate-200 rounded py-1 text-center text-[10px] text-slate-400 hover:text-slate-700 hover:border-slate-400 cursor-pointer transition-all"
                >
                  + Idea
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
