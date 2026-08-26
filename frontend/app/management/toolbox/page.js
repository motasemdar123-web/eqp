'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import SystemShell from '../../../components/SystemShell';
import ToolboxHeader from '../../../components/toolbox/ToolboxHeader';
import ToolboxSummaryKPIs from '../../../components/toolbox/ToolboxSummaryKPIs';
import ToolLibraryRail from '../../../components/toolbox/ToolLibraryRail';
import Toolbox3DCanvas from '../../../components/toolbox/Toolbox3DCanvas';
import ContextualInspectorRail from '../../../components/toolbox/ContextualInspectorRail';
import ToolDetailDrawer from '../../../components/toolbox/ToolDetailDrawer';
import DamageReportModal from '../../../components/toolbox/DamageReportModal';
import MissingToolModal from '../../../components/toolbox/MissingToolModal';
import CommandPalette from '../../../components/toolbox/CommandPalette';
import ToolboxInventoryTable from '../../../components/toolbox/ToolboxInventoryTable';
import rawTechniciansData from '../../../data/techniciansToolboxes.json';

const STORAGE_KEY = 'eqp_technician_toolboxes_state';

export default function ManagementToolboxPage() {
  // 1. Data & State Initialization
  const [technicians, setTechnicians] = useState(() => {
    if (typeof window === 'undefined') return rawTechniciansData;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : rawTechniciansData;
    } catch {
      return rawTechniciansData;
    }
  });

  const [selectedSlug, setSelectedSlug] = useState(rawTechniciansData[0]?.slug || 'ahmad-jawawdeh');
  const [viewMode, setViewMode] = useState('3D'); // '3D' | 'INVENTORY' | 'FLEET'
  const [selectedTool, setSelectedTool] = useState(null);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [activeDrawer, setActiveDrawer] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Rails Collapse State
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  // Modals & Drawers Workflow State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isDamageModalOpen, setIsDamageModalOpen] = useState(false);
  const [isMissingModalOpen, setIsMissingModalOpen] = useState(false);
  const [workflowTool, setWorkflowTool] = useState(null);
  const [toastFeedback, setToastFeedback] = useState(null);

  // References for keyboard & camera controls
  const resetCameraRef = useRef(null);
  const toggleExplodeRef = useRef(null);

  // Active Technician Record
  const currentTech = useMemo(() => {
    return technicians.find((t) => t.slug === selectedSlug) || technicians[0];
  }, [technicians, selectedSlug]);

  // Global Command Palette Shortcut Listener (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Show Temporary Toast
  const showToast = (message) => {
    setToastFeedback(message);
    setTimeout(() => setToastFeedback(null), 3000);
  };

  // State Mutator: Update Tool Status & Recalculate KPIs
  const handleUpdateToolStatus = (toolId, newStatus, note = '') => {
    setTechnicians((prevTechs) => {
      const updated = prevTechs.map((tech) => {
        const hasTool = tech.tools.some((t) => t.id === toolId);
        if (!hasTool) return tech;

        const updatedTools = tech.tools.map((t) => {
          if (t.id === toolId) {
            const updatedItem = {
              ...t,
              status: newStatus,
              statusLabelAr:
                newStatus === 'good'
                  ? 'سليم / متوفر'
                  : newStatus === 'damaged'
                  ? 'تالف / صيانة'
                  : newStatus === 'missing'
                  ? 'مفقود'
                  : 'لم يتم التسليم',
              statusLabelEn:
                newStatus === 'good'
                  ? 'Operational'
                  : newStatus === 'damaged'
                  ? 'Damaged'
                  : newStatus === 'missing'
                  ? 'Missing'
                  : 'Pending Delivery',
              inspectionNote: note || t.inspectionNote,
            };
            if (selectedTool?.id === toolId) {
              setSelectedTool(updatedItem);
            }
            return updatedItem;
          }
          return t;
        });

        const totalItems = updatedTools.reduce((acc, t) => acc + t.quantity, 0);
        const goodCount = updatedTools.filter((t) => t.status === 'good').reduce((acc, t) => acc + t.quantity, 0);
        const damagedCount = updatedTools.filter((t) => t.status === 'damaged').reduce((acc, t) => acc + t.quantity, 0);
        const missingCount = updatedTools.filter((t) => t.status === 'missing').reduce((acc, t) => acc + t.quantity, 0);
        const notDeliveredCount = updatedTools.filter((t) => t.status === 'not_delivered').reduce((acc, t) => acc + t.quantity, 0);

        return {
          ...tech,
          tools: updatedTools,
          stats: {
            ...tech.stats,
            goodCount,
            damagedCount,
            missingCount,
            notDeliveredCount,
            operationalRate: Math.round((goodCount / totalItems) * 1000) / 10,
          },
        };
      });

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
      }
      return updated;
    });
  };

  // Submit Damage Report
  const handleSubmitDamage = ({ toolId, damageType, severity, description }) => {
    handleUpdateToolStatus(toolId, 'damaged', `Damage: ${damageType} (${severity}) - ${description}`);
    showToast(`⚠️ Damage report recorded for tool #${toolId}`);
  };

  // Submit Missing Tool Report
  const handleSubmitMissing = ({ toolId, reason, location, notes }) => {
    handleUpdateToolStatus(toolId, 'missing', `Missing: ${reason} at ${location}. ${notes}`);
    showToast(`❌ Asset loss recorded for tool #${toolId}`);
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['ID', 'Tool Name (Arabic)', 'Tool Name (English)', 'Category', 'Specification (mm)', 'Quantity', 'Status', 'Technician'];
    const rows = currentTech.tools.map((t) => [
      t.id,
      `"${t.name.replace(/"/g, '""')}"`,
      `"${(t.nameEn || '').replace(/"/g, '""')}"`,
      `"${t.categoryEn || t.categoryAr}"`,
      `"${t.specification || ''}"`,
      t.quantity,
      `"${t.statusLabelEn || t.status}"`,
      `"${currentTech?.name || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Toolbox_${currentTech?.nameEn || 'Technician'}_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📥 Toolbox inventory audit exported to CSV');
  };

  return (
    <SystemShell title="Technician Toolboxes" activeModule="toolbox">
      <div className="space-y-4 pb-12 font-sans selection:bg-cyan-500 selection:text-slate-950">
        {/* 1. Header with Breadcrumbs, Compact Searchable Selector, View Toggles & Actions */}
        <ToolboxHeader
          technicians={technicians}
          selectedSlug={selectedSlug}
          onSelectTechnician={(slug) => {
            setSelectedSlug(slug);
            setSelectedTool(null);
          }}
          viewMode={viewMode}
          onSetViewMode={setViewMode}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onExportCsv={handleExportCsv}
          readinessRate={currentTech?.stats?.operationalRate || 100}
          damagedCount={currentTech?.stats?.damagedCount || 0}
          missingCount={currentTech?.stats?.missingCount || 0}
        />

        {/* 2. Hierarchical Summary KPIs (Readiness Primary, Total Tools, Conditional Alert Chips) */}
        <ToolboxSummaryKPIs
          stats={currentTech?.stats}
          onFilterStatus={(st) => {
            setStatusFilter(st);
            if (viewMode === '3D') {
              showToast(`Filtering 3D view by ${st} tools`);
            }
          }}
        />

        {/* 3. Main Workspace */}
        {viewMode === '3D' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch h-[640px]">
            {/* Left Rail: Tool Library & Drawers */}
            <div
              className={`transition-all duration-200 h-full ${
                isLeftCollapsed ? 'lg:col-span-1' : 'lg:col-span-3'
              }`}
            >
              <ToolLibraryRail
                tools={currentTech?.tools || []}
                selectedToolId={selectedTool?.id}
                onSelectTool={(tool) => setSelectedTool(tool)}
                activeCategory={activeCategory}
                onSelectCategory={setActiveCategory}
                activeDrawer={activeDrawer}
                onSelectDrawer={setActiveDrawer}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                isCollapsed={isLeftCollapsed}
                onToggleCollapse={() => setIsLeftCollapsed(!isLeftCollapsed)}
              />
            </div>

            {/* Center: 3D Digital Twin Studio */}
            <div
              className={`transition-all duration-200 h-full ${
                isLeftCollapsed && isRightCollapsed
                  ? 'lg:col-span-10'
                  : isLeftCollapsed || isRightCollapsed
                  ? 'lg:col-span-8'
                  : 'lg:col-span-6'
              }`}
            >
              <Toolbox3DCanvas
                technician={currentTech}
                tools={currentTech?.tools || []}
                selectedTool={selectedTool}
                onSelectTool={(tool) => setSelectedTool(tool)}
                activeCategory={activeCategory}
                activeDrawer={activeDrawer}
                statusFilter={statusFilter}
                searchQuery={searchQuery}
                themeKey="cobalt"
                onResetCameraRef={resetCameraRef}
                onToggleExplodeRef={toggleExplodeRef}
              />
            </div>

            {/* Right Rail: Contextual Inspector */}
            <div
              className={`transition-all duration-200 h-full ${
                isRightCollapsed ? 'lg:col-span-1' : 'lg:col-span-3'
              }`}
            >
              <ContextualInspectorRail
                tool={selectedTool}
                technician={currentTech}
                onOpenDetails={(t) => {
                  setWorkflowTool(t);
                  setIsDetailDrawerOpen(true);
                }}
                onOpenDamageModal={(t) => {
                  setWorkflowTool(t);
                  setIsDamageModalOpen(true);
                }}
                onOpenMissingModal={(t) => {
                  setWorkflowTool(t);
                  setIsMissingModalOpen(true);
                }}
                onQuickMarkOperational={(toolId) => {
                  handleUpdateToolStatus(toolId, 'good');
                  showToast('✅ Tool marked operational');
                }}
                isCollapsed={isRightCollapsed}
                onToggleCollapse={() => setIsRightCollapsed(!isRightCollapsed)}
              />
            </div>
          </div>
        )}

        {/* View Mode 2: Complete Inventory Audit Table */}
        {viewMode === 'INVENTORY' && (
          <ToolboxInventoryTable
            tools={currentTech?.tools || []}
            technician={currentTech}
            onSelectTool={(tool) => {
              setWorkflowTool(tool);
              setIsDetailDrawerOpen(true);
            }}
            onUpdateStatus={handleUpdateToolStatus}
          />
        )}

        {/* View Mode 3: Fleet Matrix View */}
        {viewMode === 'FLEET' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-black text-lg flex items-center gap-2">
                  <span>📊</span> Fleet Toolbox Readiness & Status Matrix
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Comparative readiness index across all 8 certified field technicians
                </p>
              </div>
              <button
                onClick={() => setViewMode('3D')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold transition-colors"
              >
                Back to 3D Studio
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {technicians.map((t) => (
                <div
                  key={t.slug}
                  onClick={() => {
                    setSelectedSlug(t.slug);
                    setViewMode('3D');
                  }}
                  className="bg-slate-950 border border-slate-800 hover:border-cyan-500 rounded-2xl p-5 shadow-xl cursor-pointer transition-all hover:-translate-y-1 group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-white font-black text-sm group-hover:text-cyan-400 transition-colors">
                        {t.name}
                      </h4>
                      <p className="text-xs text-slate-400">{t.nameEn}</p>
                    </div>
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                        t.stats.operationalRate >= 95
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {t.stats.operationalRate}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden mb-3">
                    <div
                      className={`h-full transition-all duration-500 ${
                        t.stats.operationalRate >= 95 ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                      }`}
                      style={{ width: `${t.stats.operationalRate}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 bg-slate-900 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Total</span>
                      <span className="font-bold text-white font-mono">{t.stats.totalQuantity}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-400 block">Damaged</span>
                      <span className="font-bold text-amber-400 font-mono">{t.stats.damagedCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-purple-400 block">Pending</span>
                      <span className="font-bold text-purple-400 font-mono">{t.stats.notDeliveredCount}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                    <span>Issued: {t.deliveryDate}</span>
                    <span className="text-cyan-400 font-bold group-hover:underline">Open 3D Studio →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Secondary Workflow Modals & Drawers */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          technicians={technicians}
          tools={currentTech?.tools || []}
          selectedTechnician={currentTech}
          onSelectTechnician={(slug) => {
            setSelectedSlug(slug);
            setSelectedTool(null);
          }}
          onSelectTool={(tool) => setSelectedTool(tool)}
          onSetViewMode={setViewMode}
          onResetCamera={() => resetCameraRef.current && resetCameraRef.current()}
          onToggleExplode={() => toggleExplodeRef.current && toggleExplodeRef.current()}
        />

        <ToolDetailDrawer
          isOpen={isDetailDrawerOpen}
          tool={workflowTool || selectedTool}
          technician={currentTech}
          onClose={() => setIsDetailDrawerOpen(false)}
          onOpenDamage={(t) => {
            setWorkflowTool(t);
            setIsDamageModalOpen(true);
          }}
          onOpenMissing={(t) => {
            setWorkflowTool(t);
            setIsMissingModalOpen(true);
          }}
          onMarkOperational={(toolId) => {
            handleUpdateToolStatus(toolId, 'good');
            showToast('✅ Tool marked operational');
          }}
        />

        <DamageReportModal
          isOpen={isDamageModalOpen}
          tool={workflowTool || selectedTool}
          technician={currentTech}
          onClose={() => setIsDamageModalOpen(false)}
          onSubmitDamage={handleSubmitDamage}
        />

        <MissingToolModal
          isOpen={isMissingModalOpen}
          tool={workflowTool || selectedTool}
          technician={currentTech}
          onClose={() => setIsMissingModalOpen(false)}
          onSubmitMissing={handleSubmitMissing}
        />

        {/* Toast Notification Alert */}
        {toastFeedback && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-cyan-500 text-white px-4 py-3 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200 text-xs font-bold flex items-center gap-2">
            <span>ℹ️</span>
            <span>{toastFeedback}</span>
          </div>
        )}
      </div>
    </SystemShell>
  );
}
