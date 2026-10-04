'use client';

import React, { useState, useRef, useMemo } from 'react';
import { FORMAT_TYPES, PIPELINE_STAGES } from '../../lib/mediaMonthlyData';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MediaCalendarGrid({
  selectedMonthId, // e.g. '2026-10'
  concepts,
  onSelectPost,
  onAddPost,
  onMovePost, // (postId, targetDateStr) => void
}) {
  const [draggedPostId, setDraggedPostId] = useState(null);
  const [dragOverDate, setDragOverDate] = useState(null);
  const isDraggingRef = useRef(false);

  // Parse year and month
  const { year, monthIndex } = useMemo(() => {
    const parts = (selectedMonthId || '2026-10').split('-');
    const y = parseInt(parts[0], 10) || 2026;
    const m = (parseInt(parts[1], 10) || 10) - 1; // 0-indexed month
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

  // Drag and drop handlers
  const handleDragStart = (e, post) => {
    isDraggingRef.current = true;
    e.stopPropagation();
    try {
      e.dataTransfer.setData('text/plain', String(post.id));
      e.dataTransfer.setData('application/json', JSON.stringify({ id: post.id }));
      e.dataTransfer.effectAllowed = 'move';
    } catch {}
    setDraggedPostId(post.id);
  };

  const handleDragEnd = () => {
    setDraggedPostId(null);
    setDragOverDate(null);
    // Keep flag true for 200ms so native mouseup click event doesn't trigger modal popup!
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 200);
  };

  const handleDragOver = (e, dateStr) => {
    if (!dateStr) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      e.dataTransfer.dropEffect = 'move';
    } catch {}
    if (dragOverDate !== dateStr) {
      setDragOverDate(dateStr);
    }
  };

  const handleDragLeave = (e, dateStr) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    if (dragOverDate === dateStr) {
      setDragOverDate(null);
    }
  };

  const handleDrop = (e, targetDateStr) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverDate(null);

    let postIdStr = null;
    try {
      postIdStr = e.dataTransfer.getData('text/plain');
    } catch {}
    if (!postIdStr && draggedPostId) {
      postIdStr = String(draggedPostId);
    }

    setDraggedPostId(null);

    // Keep draggingRef true for 200ms to swallow any subsequent click event
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 200);

    if (!postIdStr || !targetDateStr) return;

    const postId = isNaN(postIdStr) ? postIdStr : Number(postIdStr);
    const post = concepts.find((c) => String(c.id) === String(postId));
    if (post && post.publishDate === targetDateStr) return;

    if (onMovePost) {
      onMovePost(postId, targetDateStr);
    }
  };

  const handleCardClick = (e, post) => {
    if (isDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onSelectPost(post);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden select-none">
      {/* Drag & Drop Instruction Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-amber-600 font-bold text-sm select-none">⠿</span>
          <span className="text-slate-600 font-medium text-[11px]">
            <strong className="text-slate-800">Drag & Drop Rescheduling:</strong> Drag any deliverable card into another day cell, or click the <span className="inline-block px-1 py-0.2 bg-white rounded border border-slate-200 font-bold">📅</span> icon on the card to pick a new date.
          </span>
        </div>
        {draggedPostId && (
          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md animate-pulse">
            Rescheduling deliverable... Drop on target date
          </span>
        )}
      </div>

      {/* Calendar Header Row: Weekday Names */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-slate-700 text-center">
        {WEEKDAYS.map((dayName, idx) => (
          <div
            key={dayName}
            className={`py-3 text-xs uppercase tracking-wider ${
              idx === 0 || idx === 2 || idx === 4 ? 'text-amber-800 font-bold' : 'text-slate-600 font-semibold'
            }`}
          >
            {dayName}
            {(idx === 0 || idx === 2 || idx === 4) && (
              <span className="block text-[9px] font-bold text-amber-700 uppercase tracking-tight">Publish</span>
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
                className="bg-slate-50/40 p-2.5 min-h-[135px] sm:min-h-[155px] text-slate-300 select-none"
              >
                <span className="text-xs font-semibold font-mono text-slate-400/50">
                  {cell.dayNumber}
                </span>
              </div>
            );
          }

          const hasPosts = cell.posts && cell.posts.length > 0;
          const isToday = cell.dateStr === new Date().toISOString().slice(0, 10);
          const isDragTarget = dragOverDate === cell.dateStr;
          const isDraggingAny = Boolean(draggedPostId);

          return (
            <div
              key={cell.dateStr}
              onDragOver={(e) => handleDragOver(e, cell.dateStr)}
              onDragEnter={(e) => handleDragOver(e, cell.dateStr)}
              onDragLeave={(e) => handleDragLeave(e, cell.dateStr)}
              onDrop={(e) => handleDrop(e, cell.dateStr)}
              className={`p-2.5 min-h-[135px] sm:min-h-[155px] flex flex-col justify-between transition-all group relative ${
                isDragTarget
                  ? 'bg-amber-100/80 ring-2 ring-amber-500 ring-inset shadow-inner'
                  : isDraggingAny
                  ? 'bg-amber-50/20 hover:bg-amber-50/50'
                  : isToday
                  ? 'bg-amber-50/40'
                  : 'bg-white hover:bg-slate-50/70'
              }`}
            >
              {/* Cell Top Bar: Day Number & Add Button */}
              <div className="flex items-center justify-between gap-1 mb-1.5 select-none">
                <span
                  className={`text-xs font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                    isToday
                      ? 'bg-amber-400 text-slate-950 shadow-2xs font-black'
                      : hasPosts
                      ? 'text-slate-900 bg-slate-100 font-bold'
                      : 'text-slate-500'
                  }`}
                >
                  {cell.dayNumber}
                </span>

                <button
                  type="button"
                  onClick={() => onAddPost(cell.dateStr)}
                  title={`Add post idea on ${cell.dateStr}`}
                  className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 px-2 py-0.5 rounded transition-all cursor-pointer"
                >
                  + Add
                </button>
              </div>

              {/* Drop Target Indicator when dragging over */}
              {isDragTarget && (
                <div className="my-1.5 p-2 rounded-xl border-2 border-dashed border-amber-500 bg-amber-200/60 text-amber-950 text-[10px] font-bold text-center animate-pulse flex items-center justify-center gap-1.5 shadow-sm pointer-events-none">
                  <span>📥</span>
                  <span>Reschedule to {cell.dateStr}</span>
                </div>
              )}

              {/* Scheduled Posts in This Day */}
              <div className={`space-y-2 flex-1 ${isDraggingAny ? 'pointer-events-none' : ''}`}>
                {cell.posts.map((post) => {
                  const formatMeta =
                    FORMAT_TYPES.find((f) => f.id === post.format) || FORMAT_TYPES[0];
                  const stageMeta =
                    PIPELINE_STAGES.find((s) => s.id === post.status) || PIPELINE_STAGES[0];
                  const isBeingDragged = String(draggedPostId) === String(post.id);

                  return (
                    <div
                      key={post.id}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, post)}
                      onDragEnd={handleDragEnd}
                      onClick={(e) => handleCardClick(e, post)}
                      className={`p-2 sm:p-2.5 rounded-xl bg-white text-slate-900 hover:border-amber-400 hover:shadow-xs transition-all cursor-grab active:cursor-grabbing shadow-2xs group/card border border-slate-200/90 space-y-1 select-none pointer-events-auto ${
                        isBeingDragged
                          ? 'opacity-30 border-dashed border-amber-400 scale-95 shadow-none ring-2 ring-amber-400'
                          : 'hover:scale-[1.01]'
                      }`}
                    >
                      {/* Post Format, Grip Handle, Quick Date Picker & Status Dot */}
                      <div className="flex items-center justify-between text-[9px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="text-slate-400 group-hover/card:text-amber-600 transition-colors cursor-grab select-none text-[12px] font-bold shrink-0"
                            title="Drag card to reschedule"
                          >
                            ⠿
                          </span>
                          <span className={`font-semibold text-[9px] uppercase tracking-tight truncate px-1.5 py-0.2 rounded border ${formatMeta.color}`}>
                            {formatMeta.shortLabel || formatMeta.label}
                          </span>

                          {/* Quick 1-Click Date Selector Icon for Touch / Direct Picker */}
                          <label
                            onClick={(e) => e.stopPropagation()}
                            title="Click to reschedule date"
                            className="opacity-0 group-hover/card:opacity-100 text-slate-400 hover:text-amber-700 cursor-pointer transition-all relative flex items-center shrink-0 ml-0.5"
                          >
                            <span className="text-[10px]">📅</span>
                            <input
                              type="date"
                              value={post.publishDate || ''}
                              onChange={(e) => {
                                e.stopPropagation();
                                if (e.target.value && e.target.value !== post.publishDate && onMovePost) {
                                  onMovePost(post.id, e.target.value);
                                }
                              }}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                          </label>
                        </div>

                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            post.status === 'ready' || post.status === 'published'
                              ? 'bg-emerald-500 ring-2 ring-emerald-500/20'
                              : post.status === 'production' || post.status === 'scripted'
                              ? 'bg-amber-500'
                              : 'bg-slate-300'
                          }`}
                          title={stageMeta.label}
                        />
                      </div>

                      {post.deliverableCode && (
                        <div className="text-[9px] font-mono font-bold text-amber-700 truncate">
                          {post.deliverableCode}
                        </div>
                      )}

                      {/* Post Title */}
                      <p className="text-[11px] font-bold text-slate-900 line-clamp-2 leading-snug group-hover/card:text-amber-700 transition-colors">
                        {post.title}
                      </p>

                      {/* Optional TOV snippet if available */}
                      {post.tov && (
                        <p className="text-[9px] text-slate-500 truncate mt-0.5">
                          🎙️ {post.tov}
                        </p>
                      )}

                      {/* Attachments / Deliverables badge */}
                      {post.attachments && post.attachments.length > 0 && (
                        <div className="flex items-center gap-1 text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded mt-1">
                          <span>📎</span>
                          <span>{post.attachments.length} {post.attachments.length === 1 ? 'file' : 'files'}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Quick Trigger if empty */}
              {!hasPosts && !isDragTarget && (
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
