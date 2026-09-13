'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import SystemShell from '../../components/SystemShell';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { INITIAL_MONTHLY_CAMPAIGNS } from '../../lib/mediaMonthlyData';
import { getMediaCampaigns, saveMediaCampaigns as apiSaveMediaCampaigns, resetMediaCampaigns as apiResetMediaCampaigns } from '../../lib/api';
import { getStoredUser } from '../../lib/auth';
import MediaCalendarGrid from '../../components/media/MediaCalendarGrid';
import MediaListView from '../../components/media/MediaListView';
import SimplePostModal from '../../components/media/SimplePostModal';
import NewMonthModal from '../../components/media/NewMonthModal';

const CAMPAIGNS_STORAGE_KEY = 'daralhay.social_media_campaigns_v5';
const ACTIVE_MONTH_STORAGE_KEY = 'daralhay.social_media_active_month_v5';

export default function MediaCornerPage() {
  const [campaigns, setCampaigns] = useState({});
  const [selectedMonthId, setSelectedMonthId] = useState('2026-09');
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'
  const [loading, setLoading] = useState(true);

  // Cloud sync state
  const [syncStatus, setSyncStatus] = useState('syncing'); // 'synced' | 'syncing' | 'offline'
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncAuthor, setSyncAuthor] = useState(null);

  // Post modal state
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [activePost, setActivePost] = useState(null);
  const [defaultPostDate, setDefaultPostDate] = useState(null);

  // New month modal state
  const [isNewMonthModalOpen, setIsNewMonthModalOpen] = useState(false);

  // Fetch latest campaigns from central cloud database
  const loadRemoteCampaigns = useCallback(async () => {
    setSyncStatus('syncing');
    try {
      const res = await getMediaCampaigns();
      if (res && res.success && res.campaigns && Object.keys(res.campaigns).length > 0) {
        setCampaigns(res.campaigns);
        try {
          localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(res.campaigns));
        } catch {}
        setSyncStatus('synced');
        setLastSyncTime(new Date(res.updatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        if (res.updatedBy) setSyncAuthor(res.updatedBy);
        return;
      }
    } catch (err) {
      console.warn('[Media] Remote sync warning:', err.message);
    }
    setSyncStatus('offline');
  }, []);

  // Load from localStorage first for instant render, then fetch from server
  useEffect(() => {
    try {
      const storedCampaigns = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
      const storedActiveMonth = localStorage.getItem(ACTIVE_MONTH_STORAGE_KEY);

      if (storedCampaigns) {
        const parsed = JSON.parse(storedCampaigns);
        setCampaigns(parsed);
        if (storedActiveMonth && parsed[storedActiveMonth]) {
          setSelectedMonthId(storedActiveMonth);
        } else {
          setSelectedMonthId(parsed['2026-09'] ? '2026-09' : Object.keys(parsed)[0] || '2026-09');
        }
      } else {
        setCampaigns(INITIAL_MONTHLY_CAMPAIGNS);
        localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(INITIAL_MONTHLY_CAMPAIGNS));
        setSelectedMonthId('2026-09');
      }
    } catch {
      setCampaigns(INITIAL_MONTHLY_CAMPAIGNS);
      setSelectedMonthId('2026-09');
    } finally {
      setLoading(false);
    }

    // Immediately pull latest shared team updates from cloud database
    loadRemoteCampaigns();
  }, [loadRemoteCampaigns]);

  const saveCampaigns = async (newCampaigns) => {
    // 1. Instant optimistic update
    setCampaigns(newCampaigns);
    try {
      localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(newCampaigns));
    } catch {}

    // 2. Persist to shared database
    setSyncStatus('syncing');
    const user = getStoredUser();
    const authorName = user?.fullName || user?.full_name || 'Editorial Team';

    try {
      const res = await apiSaveMediaCampaigns(newCampaigns, authorName);
      if (res && res.success) {
        setSyncStatus('synced');
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setSyncAuthor(authorName);
        return;
      }
    } catch (err) {
      console.warn('[Media] Save remote notice:', err.message);
    }

    setSyncStatus('offline');
  };

  const handleSelectMonth = (monthId) => {
    setSelectedMonthId(monthId);
    localStorage.setItem(ACTIVE_MONTH_STORAGE_KEY, monthId);
  };

  // Month navigation: previous / next month
  const handleNavigateMonth = (direction) => {
    const [yStr, mStr] = (selectedMonthId || '2026-09').split('-');
    let year = parseInt(yStr, 10);
    let month = parseInt(mStr, 10);

    if (direction === 'prev') {
      month -= 1;
      if (month < 1) {
        month = 12;
        year -= 1;
      }
    } else {
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
    }

    const nextMonthId = `${year}-${String(month).padStart(2, '0')}`;

    // If campaign exists, select it; otherwise create minimal shell
    if (!campaigns[nextMonthId]) {
      const dateObj = new Date(year, month - 1, 1);
      const monthName = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const newCampaign = {
        monthId: nextMonthId,
        monthName,
        themeTitle: `${monthName} Editorial Plan`,
        concepts: [],
      };
      const updatedCampaigns = { ...campaigns, [nextMonthId]: newCampaign };
      saveCampaigns(updatedCampaigns);
    }
    handleSelectMonth(nextMonthId);
  };

  const activeCampaign = useMemo(() => {
    return campaigns[selectedMonthId] || {
      monthId: selectedMonthId,
      monthName: 'Current Month',
      concepts: [],
    };
  }, [campaigns, selectedMonthId]);

  const currentConcepts = useMemo(() => activeCampaign.concepts || [], [activeCampaign]);

  const availableMonths = useMemo(() => {
    return Object.values(campaigns)
      .map((c) => ({
        monthId: c.monthId,
        monthName: c.monthName,
      }))
      .sort((a, b) => a.monthId.localeCompare(b.monthId));
  }, [campaigns]);

  // Quick stats
  const stats = useMemo(() => {
    const total = currentConcepts.length;
    const drafts = currentConcepts.filter((c) => c.status === 'idea' || !c.status).length;
    const inProgress = currentConcepts.filter(
      (c) => c.status === 'scripted' || c.status === 'production' || c.status === 'review'
    ).length;
    const readyOrPublished = currentConcepts.filter(
      (c) => c.status === 'ready' || c.status === 'published'
    ).length;
    return { total, drafts, inProgress, readyOrPublished };
  }, [currentConcepts]);

  // Open modal to add a new post
  const handleOpenAddPost = (dateStr = null) => {
    setActivePost(null);
    setDefaultPostDate(dateStr || `${selectedMonthId}-01`);
    setIsPostModalOpen(true);
  };

  // Open modal to edit existing post
  const handleOpenEditPost = (post) => {
    setActivePost(post);
    setDefaultPostDate(post.publishDate);
    setIsPostModalOpen(true);
  };

  // Save (create or update) post
  const handleSavePost = (postData) => {
    let updatedConcepts = [];
    if (postData.id) {
      // Update existing
      updatedConcepts = currentConcepts.map((c) => (c.id === postData.id ? { ...c, ...postData } : c));
    } else {
      // Create new
      const newPost = {
        ...postData,
        id: Date.now(),
        conceptNumber: currentConcepts.length + 1,
      };
      updatedConcepts = [...currentConcepts, newPost];
    }

    const updatedCampaign = { ...activeCampaign, concepts: updatedConcepts };
    const updatedCampaigns = { ...campaigns, [selectedMonthId]: updatedCampaign };
    saveCampaigns(updatedCampaigns);
    setIsPostModalOpen(false);
    setActivePost(null);
  };

  // Delete post
  const handleDeletePost = (postId) => {
    const updatedConcepts = currentConcepts.filter((c) => c.id !== postId);
    const updatedCampaign = { ...activeCampaign, concepts: updatedConcepts };
    const updatedCampaigns = { ...campaigns, [selectedMonthId]: updatedCampaign };
    saveCampaigns(updatedCampaigns);
    setIsPostModalOpen(false);
    setActivePost(null);
  };

  // Reset to master template
  const handleResetCampaign = async () => {
    if (!window.confirm('Reset all campaigns back to master template across all team accounts?')) return;
    setSyncStatus('syncing');
    try {
      const res = await apiResetMediaCampaigns();
      if (res && res.campaigns) {
        setCampaigns(res.campaigns);
        localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(res.campaigns));
        setSelectedMonthId('2026-09');
        setSyncStatus('synced');
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        return;
      }
    } catch (err) {
      console.warn('[Media] Cloud reset error:', err.message);
    }
    setCampaigns(INITIAL_MONTHLY_CAMPAIGNS);
    localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(INITIAL_MONTHLY_CAMPAIGNS));
    setSelectedMonthId('2026-09');
    setSyncStatus('synced');
  };

  // Create new month
  const handleCreateNewMonth = (newMonthData) => {
    let newConcepts = [];
    if (
      newMonthData.cloneFromMonthId &&
      newMonthData.cloneFromMonthId !== 'none' &&
      campaigns[newMonthData.cloneFromMonthId]
    ) {
      const sourceConcepts = campaigns[newMonthData.cloneFromMonthId].concepts || [];
      newConcepts = sourceConcepts.map((c, idx) => ({
        ...c,
        id: Date.now() + idx,
        status: 'idea',
      }));
    }

    const newCampaign = {
      monthId: newMonthData.monthId,
      monthName: newMonthData.monthName,
      themeTitle: newMonthData.themeTitle,
      strategicGoal: newMonthData.strategicGoal,
      targetKpi: newMonthData.targetKpi,
      concepts: newConcepts,
    };

    const updatedCampaigns = { ...campaigns, [newMonthData.monthId]: newCampaign };
    saveCampaigns(updatedCampaigns);
    setSelectedMonthId(newMonthData.monthId);
    setIsNewMonthModalOpen(false);
  };

  return (
    <SystemShell
      activePath="/media"
      eyebrow="Creative & Communications"
      title="Media Corner"
      description="Interactive social media calendar: schedule post ideas, refine tone of voice, and manage bilingual captions."
    >
      <div className="space-y-7 max-w-7xl mx-auto pb-16 animate-[ds-toast-in_180ms_ease]">
        {/* Top Command Bar */}
        <div className="bg-white text-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          {/* Month Title & Prev/Next Navigation */}
          <div className="flex items-center gap-3.5">
            <div className="flex items-center bg-slate-50 rounded-lg p-0.5 border border-slate-200">
              <button
                type="button"
                onClick={() => handleNavigateMonth('prev')}
                title="Previous Month"
                className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-all font-bold text-sm cursor-pointer"
              >
                ◀
              </button>
              <button
                type="button"
                onClick={() => handleNavigateMonth('next')}
                title="Next Month"
                className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-all font-bold text-sm cursor-pointer"
              >
                ▶
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {activeCampaign.monthName || selectedMonthId}
                </h2>
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {activeCampaign.themeTitle || 'Monthly Social Media Calendar'}
              </p>
            </div>
          </div>

          {/* Controls: Month Selector Pills, View Mode, and Add Post Action */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Month Jump Pills */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
              {availableMonths.map((m) => {
                const isSelected = selectedMonthId === m.monthId;
                return (
                  <button
                    key={m.monthId}
                    type="button"
                    onClick={() => handleSelectMonth(m.monthId)}
                    className={`px-3 py-1 rounded text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`}
                  >
                    {m.monthName.split(' ')[0]}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setIsNewMonthModalOpen(true)}
                title="Add new month"
                className="px-2.5 py-1 rounded text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-white transition-colors cursor-pointer"
              >
                + Month
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-medium">
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`px-3.5 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'calendar'
                    ? 'bg-white text-slate-950 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📅</span>
                <span>Calendar</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3.5 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'list'
                    ? 'bg-white text-slate-950 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>📋</span>
                <span>List</span>
              </button>
            </div>

            {/* Add Post Button */}
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => handleOpenAddPost()}
            >
              + Add Post Idea
            </Button>

            {/* Cloud Sync Status Indicator & Refresh */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold bg-slate-50 border-slate-200">
              {syncStatus === 'synced' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                  <span className="text-slate-700 hidden sm:inline">Synced</span>
                  {lastSyncTime && (
                    <span className="text-[10px] text-slate-400 font-normal hidden xl:inline">
                      ({lastSyncTime})
                    </span>
                  )}
                </>
              ) : syncStatus === 'syncing' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-amber-700 font-medium">Syncing...</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span className="text-slate-500">Local</span>
                </>
              )}

              <button
                type="button"
                onClick={() => loadRemoteCampaigns()}
                title="Refresh latest team edits from cloud"
                className="ml-0.5 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors cursor-pointer text-xs"
              >
                ⟳
              </button>
            </div>

            {/* Reset Template Button */}
            <button
              type="button"
              onClick={handleResetCampaign}
              title="Reset master template"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-xs font-medium cursor-pointer"
            >
              ↺
            </button>
          </div>
        </div>

        {/* Metric Strip (Clean & Executive) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Scheduled Posts
            </span>
            <span className="text-xl font-bold font-mono text-slate-900 mt-0.5 block">
              {stats.total}
            </span>
            <span className="text-[11px] font-medium text-slate-500">Total in this month</span>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Concept Drafts
            </span>
            <span className="text-xl font-bold font-mono text-slate-700 mt-0.5 block">
              {stats.drafts}
            </span>
            <span className="text-[11px] font-medium text-slate-500">Pending development</span>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">
              In Production
            </span>
            <span className="text-xl font-bold font-mono text-amber-600 mt-0.5 block">
              {stats.inProgress}
            </span>
            <span className="text-[11px] font-medium text-slate-500">Filming / Designing</span>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
              Ready / Published
            </span>
            <span className="text-xl font-bold font-mono text-emerald-600 mt-0.5 block">
              {stats.readyOrPublished}
            </span>
            <span className="text-[11px] font-medium text-slate-500">Approved for release</span>
          </div>
        </div>

        {/* Main Content Area */}
        {viewMode === 'calendar' ? (
          <MediaCalendarGrid
            selectedMonthId={selectedMonthId}
            concepts={currentConcepts}
            onSelectPost={handleOpenEditPost}
            onAddPost={handleOpenAddPost}
          />
        ) : (
          <MediaListView
            concepts={currentConcepts}
            onSelectPost={handleOpenEditPost}
            onAddPost={handleOpenAddPost}
            onDeletePost={handleDeletePost}
          />
        )}
      </div>

      {/* Simplified Post Modal */}
      <SimplePostModal
        isOpen={isPostModalOpen}
        post={activePost}
        defaultDate={defaultPostDate}
        onSave={handleSavePost}
        onDelete={handleDeletePost}
        onClose={() => {
          setIsPostModalOpen(false);
          setActivePost(null);
        }}
      />

      {/* New Month Modal */}
      {isNewMonthModalOpen && (
        <NewMonthModal
          availableMonths={availableMonths}
          onSave={handleCreateNewMonth}
          onClose={() => setIsNewMonthModalOpen(false)}
        />
      )}
    </SystemShell>
  );
}
