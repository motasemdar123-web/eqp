'use client';

import React, { useState, useMemo } from 'react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import StatusIndicator from '../ui/StatusIndicator';
import { FORMAT_TYPES, PIPELINE_STAGES } from '../../lib/mediaMonthlyData';

export default function MediaListView({
  concepts,
  onSelectPost,
  onAddPost,
  onDeletePost,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const filteredPosts = useMemo(() => {
    return concepts
      .filter((post) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchTitle = (post.title || '').toLowerCase().includes(q);
          const matchDesc = (post.summary || post.description || '').toLowerCase().includes(q);
          const matchTov = (post.tov || '').toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchTov) return false;
        }
        if (selectedFormat !== 'all' && post.format !== selectedFormat) {
          return false;
        }
        if (selectedStatus !== 'all' && post.status !== selectedStatus) {
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.publishDate || 0) - new Date(b.publishDate || 0));
  }, [concepts, searchQuery, selectedFormat, selectedStatus]);

  return (
    <div className="space-y-4">
      {/* Filter & Search Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search post ideas, description, TOV..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ds-input text-xs max-w-xs"
          />

          {/* Format Filter */}
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="ds-input text-xs max-w-[150px] cursor-pointer"
          >
            <option value="all">All Formats</option>
            {FORMAT_TYPES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.shortLabel || f.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="ds-input text-xs max-w-[150px] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            {PIPELINE_STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>

          {(searchQuery || selectedFormat !== 'all' || selectedStatus !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedFormat('all');
                setSelectedStatus('all');
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline px-1 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        <span className="text-xs text-slate-500 font-mono self-end sm:self-auto">
          Showing {filteredPosts.length} of {concepts.length} ideas
        </span>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredPosts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <p className="text-sm font-medium">No post ideas match your filter.</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onAddPost()}
              className="text-xs"
            >
              + Create New Post Idea
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-4 px-4 w-10 text-center">#</th>
                  <th className="py-4 px-4 whitespace-nowrap">Schedule Date</th>
                  <th className="py-4 px-4">Post Title & Concept</th>
                  <th className="py-4 px-4">Tone of Voice (TOV)</th>
                  <th className="py-4 px-4 whitespace-nowrap">Format</th>
                  <th className="py-4 px-4 whitespace-nowrap">Status</th>
                  <th className="py-4 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPosts.map((post, index) => {
                  const formatMeta =
                    FORMAT_TYPES.find((f) => f.id === post.format) || FORMAT_TYPES[0];
                  const stageMeta =
                    PIPELINE_STAGES.find((s) => s.id === post.status) || PIPELINE_STAGES[0];

                  return (
                    <tr
                      key={post.id}
                      onClick={() => onSelectPost(post)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      <td className="py-4 px-4 text-center font-mono font-bold text-slate-400">
                        {post.conceptNumber || index + 1}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900 block font-mono">
                          {post.publishDate || 'Not set'}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {post.day || ''}
                        </span>
                      </td>

                      <td className="py-4 px-4 max-w-sm">
                        <p className="font-bold text-slate-900 group-hover:text-amber-700 transition-colors leading-snug">
                          {post.title}
                        </p>
                        {(post.summary || post.description) && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 leading-relaxed">
                            {post.summary || post.description}
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-4 max-w-[200px]">
                        <span className="text-slate-700 font-medium line-clamp-2 text-[11px]">
                          {post.tov || '—'}
                        </span>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded font-semibold text-[11px] border ${formatMeta.color}`}>
                          {formatMeta.shortLabel || formatMeta.label}
                        </span>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <StatusIndicator
                          tone={
                            post.status === 'ready' || post.status === 'published'
                              ? 'ready'
                              : post.status === 'production' || post.status === 'scripted'
                              ? 'pending'
                              : 'neutral'
                          }
                          label={stageMeta.label}
                          size="sm"
                        />
                      </td>

                      <td
                        className="py-4 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => onSelectPost(post)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              if (window.confirm(`Delete "${post.title}"?`)) {
                                onDeletePost(post.id);
                              }
                            }}
                            className="text-xs"
                          >
                            ✕
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
