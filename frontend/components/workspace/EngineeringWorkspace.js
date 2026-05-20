'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import SystemShell from '../SystemShell';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import Field from '../ui/Field';
import EmptyState from '../ui/EmptyState';
import Toast from '../ui/Toast';

const BOARD_KEY = 'dar-al-hai-engineering-creative-board-v1';
const CREATIVE_DOCS_KEY = 'dar-al-hai-engineering-creative-docs-v1';
const PLANNER_KEY = 'dar-al-hai-engineering-day-planner-v1';

const stickyColors = {
  yellow: 'eng-sticky-yellow',
  blue: 'eng-sticky-blue',
  green: 'eng-sticky-green',
  pink: 'eng-sticky-pink',
  purple: 'eng-sticky-purple',
};

const wireframeTypes = [
  'Page Container',
  'Header',
  'Sidebar',
  'Card',
  'Button',
  'Input',
  'Table',
  'Chart',
  'Checklist',
];

const DEMO_CREATED_AT = '2026-05-20T00:00:00.000Z';

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function defaultBoardItems() {
  const createdAt = DEMO_CREATED_AT;
  return [
    {
      id: 'demo-frame-technician-daily-flow',
      type: 'frame',
      label: 'Technician Daily Flow',
      x: 54,
      y: 56,
      width: 560,
      height: 380,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: 'demo-sticky-morning-inspection',
      type: 'sticky',
      label: 'Morning inspection checklist',
      color: 'yellow',
      x: 92,
      y: 132,
      width: 190,
      height: 132,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: 'demo-sticky-region-assignment',
      type: 'sticky',
      label: 'Assign technician by region',
      color: 'blue',
      x: 310,
      y: 134,
      width: 190,
      height: 132,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: 'demo-sticky-machine-record',
      type: 'sticky',
      label: 'Link task to machine record',
      color: 'green',
      x: 198,
      y: 286,
      width: 190,
      height: 132,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: 'demo-wire-header',
      type: 'wireframe',
      wireType: 'Header',
      label: 'Header',
      x: 690,
      y: 72,
      width: 340,
      height: 76,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: 'demo-wire-task-card',
      type: 'wireframe',
      wireType: 'Card',
      label: 'Task Card',
      x: 690,
      y: 176,
      width: 220,
      height: 142,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: 'demo-wire-report-button',
      type: 'wireframe',
      wireType: 'Button',
      label: 'Report Button',
      x: 938,
      y: 188,
      width: 170,
      height: 58,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: 'demo-wire-machine-table',
      type: 'wireframe',
      wireType: 'Table',
      label: 'Machine Status Table',
      x: 690,
      y: 344,
      width: 420,
      height: 190,
      createdAt,
      updatedAt: createdAt,
    },
  ];
}

function defaultPlannerTasks() {
  const createdAt = DEMO_CREATED_AT;
  return [
    {
      id: 'demo-task-hydraulic-temperature',
      title: 'Inspect hydraulic oil temperature',
      dueTime: '09:00',
      completed: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: 'demo-task-eqp-upload',
      title: 'Review EQP report upload',
      dueTime: '11:30',
      completed: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: 'demo-task-tomorrow-plan',
      title: 'Prepare tomorrow maintenance plan',
      dueTime: '15:30',
      completed: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: 'demo-task-pressure-safety',
      title: 'Check safety notes for pressure testing',
      dueTime: '13:00',
      completed: false,
      createdAt,
      updatedAt: createdAt,
    },
  ];
}

function defaultCreativeDocs() {
  const createdAt = DEMO_CREATED_AT;
  return [
    {
      id: 'creative-doc-company-mission',
      title: 'Company mission and strategy',
      category: 'Strategy doc',
      createdBy: 'Motasem Ghanem',
      lastEditedBy: 'Motasem Ghanem',
      createdAt,
      updatedAt: createdAt,
      favorite: true,
    },
    {
      id: 'creative-doc-new-year',
      title: 'Proposal for new year campaign',
      category: 'Proposal',
      createdBy: 'Motasem Ghanem',
      lastEditedBy: 'Motasem Ghanem',
      createdAt,
      updatedAt: createdAt,
      favorite: false,
    },
    {
      id: 'creative-doc-customer-feedback',
      title: 'Customer feedback report',
      category: 'Customer research',
      createdBy: 'Motasem Ghanem',
      lastEditedBy: 'Motasem Ghanem',
      createdAt,
      updatedAt: createdAt,
      favorite: false,
    },
  ];
}

function loadStoredItems(key, fallback) {
  if (typeof window === 'undefined') return fallback();
  try {
    const stored = JSON.parse(localStorage.getItem(key) || 'null');
    if (Array.isArray(stored) && stored.length) return stored;
  } catch {
    localStorage.removeItem(key);
  }
  return fallback();
}

function saveStoredItems(key, items) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(items));
}

function WorkspaceTabs({ activeTab, onTabChange }) {
  return (
    <div className="eng-tabs" role="tablist" aria-label="Engineering workspace tabs">
      <button
        type="button"
        className={activeTab === 'creative' ? 'eng-tab eng-tab-active' : 'eng-tab'}
        onClick={() => onTabChange('creative')}
      >
        Creative Area
      </button>
      <button
        type="button"
        className={activeTab === 'planner' ? 'eng-tab eng-tab-active' : 'eng-tab'}
        onClick={() => onTabChange('planner')}
      >
        Day Planner
      </button>
    </div>
  );
}
function CanvasToolbar({
  onAddSticky,
  onAddWireframe,
  onAddFrame,
  onAddText,
  onClear,
  onSave,
  onResetView,
  onOpenTemplates,
  onToggleFullscreen,
  isFullscreen,
}) {
  return (
    <div className="eng-canvas-toolbar">
      <Button type="button" size="sm" onClick={onOpenTemplates}>Templates</Button>
      <span className="eng-toolbar-divider" />
      <Button type="button" size="sm" onClick={onAddSticky}>Add Sticky Note</Button>
      <Button type="button" variant="secondary" size="sm" onClick={onAddWireframe}>Add Wireframe</Button>
      <Button type="button" variant="secondary" size="sm" onClick={onAddFrame}>Add Frame</Button>
      <Button type="button" variant="secondary" size="sm" onClick={onAddText}>Add Text Label</Button>
      <span className="eng-toolbar-divider" />
      <Button type="button" variant="secondary" size="sm" onClick={onSave}>Save Board</Button>
      <Button type="button" variant="ghost" size="sm" onClick={onResetView}>Reset View</Button>
      <Button type="button" variant="secondary" size="sm" onClick={onToggleFullscreen}>
        {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
      </Button>
      <Button type="button" variant="danger" size="sm" onClick={onClear}>Clear Canvas</Button>
    </div>
  );
}

function CanvasItem({ item, selected, onSelect, onPointerDown, onChange, onDelete, onDuplicate }) {
  const style = {
    left: item.x,
    top: item.y,
    width: item.width,
    height: item.height,
    zIndex: selected ? 20 : item.type === 'frame' ? 1 : 5,
  };

  if (item.type === 'frame') {
    return (
      <div
        className={selected ? 'eng-canvas-item eng-frame eng-item-selected' : 'eng-canvas-item eng-frame'}
        style={style}
        onPointerDown={(event) => onPointerDown(event, item)}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(item.id);
        }}
      >
        <input
          value={item.label}
          onChange={(event) => onChange(item.id, { label: event.target.value })}
          aria-label="Frame title"
        />
      </div>
    );
  }

  if (item.type === 'text') {
    return (
      <div
        className={selected ? 'eng-canvas-item eng-text-label eng-item-selected' : 'eng-canvas-item eng-text-label'}
        style={style}
        onPointerDown={(event) => onPointerDown(event, item)}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(item.id);
        }}
      >
        <textarea
          value={item.label}
          onChange={(event) => onChange(item.id, { label: event.target.value })}
          aria-label="Text label"
        />
      </div>
    );
  }

  if (item.type === 'wireframe') {
    return (
      <div
        className={selected ? 'eng-canvas-item eng-wireframe eng-item-selected' : 'eng-canvas-item eng-wireframe'}
        style={style}
        onPointerDown={(event) => onPointerDown(event, item)}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(item.id);
        }}
      >
        <div className="eng-item-actions">
          <button type="button" onClick={() => onDuplicate(item)} aria-label="Duplicate item">D</button>
          <button type="button" onClick={() => onDelete(item.id)} aria-label="Delete item">x</button>
        </div>
        <select
          value={item.wireType || 'Card'}
          onChange={(event) => onChange(item.id, { wireType: event.target.value })}
          aria-label="Wireframe type"
        >
          {wireframeTypes.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        <input
          value={item.label}
          onChange={(event) => onChange(item.id, { label: event.target.value })}
          aria-label="Wireframe label"
        />
        <div className="eng-wire-lines" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`eng-canvas-item eng-sticky ${stickyColors[item.color] || stickyColors.yellow} ${selected ? 'eng-item-selected' : ''}`}
      style={style}
      onPointerDown={(event) => onPointerDown(event, item)}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(item.id);
      }}
    >
      <div className="eng-item-actions">
        <button type="button" onClick={() => onDuplicate(item)} aria-label="Duplicate item">D</button>
        <button type="button" onClick={() => onDelete(item.id)} aria-label="Delete item">x</button>
      </div>
      <textarea
        value={item.label}
        onChange={(event) => onChange(item.id, { label: event.target.value })}
        aria-label="Sticky note text"
      />
    </div>
  );
}

function PropertiesPanel({ selectedItem, onChange, onDelete, onDuplicate }) {
  if (!selectedItem) {
    return (
      <Card className="eng-side-panel">
        <h2>Properties</h2>
        <p>Select a canvas item to edit details, color, position, and size.</p>
        <EmptyState title="Nothing selected" description="Click any sticky note, frame, wireframe, or label." />
      </Card>
    );
  }

  return (
    <Card className="eng-side-panel">
      <div className="eng-panel-head">
        <div>
          <h2>Properties</h2>
          <p>{selectedItem.type}</p>
        </div>
        <Badge tone={selectedItem.type === 'sticky' ? 'warning' : 'info'}>{selectedItem.type}</Badge>
      </div>
      <div className="eng-property-grid">
        <Field label="Label">
          <textarea
            rows={3}
            value={selectedItem.label}
            onChange={(event) => onChange(selectedItem.id, { label: event.target.value })}
          />
        </Field>
        {selectedItem.type === 'sticky' && (
          <Field label="Color">
            <select value={selectedItem.color || 'yellow'} onChange={(event) => onChange(selectedItem.id, { color: event.target.value })}>
              {Object.keys(stickyColors).map((color) => <option key={color} value={color}>{color}</option>)}
            </select>
          </Field>
        )}
        {selectedItem.type === 'wireframe' && (
          <Field label="Wireframe type">
            <select value={selectedItem.wireType || 'Card'} onChange={(event) => onChange(selectedItem.id, { wireType: event.target.value })}>
              {wireframeTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </Field>
        )}
        <div className="eng-size-grid">
          <Field label="X">
            <input type="number" value={selectedItem.x} onChange={(event) => onChange(selectedItem.id, { x: Number(event.target.value) || 0 })} />
          </Field>
          <Field label="Y">
            <input type="number" value={selectedItem.y} onChange={(event) => onChange(selectedItem.id, { y: Number(event.target.value) || 0 })} />
          </Field>
          <Field label="Width">
            <input type="number" value={selectedItem.width} onChange={(event) => onChange(selectedItem.id, { width: Math.max(100, Number(event.target.value) || 100) })} />
          </Field>
          <Field label="Height">
            <input type="number" value={selectedItem.height} onChange={(event) => onChange(selectedItem.id, { height: Math.max(48, Number(event.target.value) || 48) })} />
          </Field>
        </div>
      </div>
      <div className="eng-panel-actions">
        <Button type="button" variant="secondary" size="sm" onClick={() => onDuplicate(selectedItem)}>Duplicate</Button>
        <Button type="button" variant="danger" size="sm" onClick={() => onDelete(selectedItem.id)}>Delete</Button>
      </div>
    </Card>
  );
}

const creativeTemplateCards = {
  quick: [
    {
      key: 'empty-page',
      title: 'Empty page',
      subtitle: 'Start from a clean canvas.',
      icon: 'document',
      tone: 'neutral',
    },
    {
      key: 'empty-database',
      title: 'Empty database',
      subtitle: 'Sketch a structured table.',
      icon: 'database',
      tone: 'neutral',
    },
    {
      key: 'ai-build',
      title: 'Build with AI',
      subtitle: 'Start with a guided idea board.',
      icon: 'spark',
      tone: 'neutral',
    },
  ],
  suggested: [
    {
      key: 'tasks-tracker',
      title: 'Tasks Tracker',
      subtitle: 'Stay organized with tasks, your way.',
      icon: 'check',
      tone: 'green',
      columns: ['Task name', 'Status', 'Assignee'],
      rows: [
        ['Inspect pump line', 'Not started', 'MG'],
        ['Check oil temp', 'In progress', 'SA'],
        ['Close EQP report', 'Done', 'AK'],
      ],
    },
    {
      key: 'projects',
      title: 'Projects',
      subtitle: 'Manage projects start to finish.',
      icon: 'loop',
      tone: 'blue',
      columns: ['Backlog', 'In progress', 'Done'],
      rows: [
        ['Inspection app', 'EQP review', 'Shift flow'],
        ['PDF viewer', 'Machine tags', 'Safety log'],
      ],
    },
    {
      key: 'document-hub',
      title: 'Document Hub',
      subtitle: 'Collaborate on docs in one hub.',
      icon: 'file',
      tone: 'red',
      columns: ['Doc name', 'Created by', 'Created time'],
      rows: [
        ['Pressure test SOP', 'MG', 'Today'],
        ['Cooling notes', 'SA', '09:30'],
        ['Report checklist', 'AK', '11:00'],
      ],
    },
    {
      key: 'brainstorm',
      title: 'Brainstorm Session',
      subtitle: 'Spark new ideas together.',
      icon: 'bulb',
      tone: 'orange',
      columns: ['Idea', 'Owner', 'Priority'],
      rows: [
        ['Technician routing', 'MG', 'High'],
        ['Manual matching', 'SA', 'Medium'],
        ['Safety prompts', 'AK', 'Low'],
      ],
    },
    {
      key: 'meeting-notes',
      title: 'Meeting Notes',
      subtitle: 'Turn meetings into action.',
      icon: 'calendar',
      tone: 'yellow',
      columns: ['Meeting name', 'Date', 'Category'],
      rows: [
        ['Morning brief', 'Today', 'Standup'],
        ['EQP review', 'Thu', 'Planning'],
        ['Safety sync', 'Sun', 'Action'],
      ],
    },
    {
      key: 'goals-tracker',
      title: 'Goals Tracker',
      subtitle: 'Set team goals, achieve together.',
      icon: 'flag',
      tone: 'blue',
      columns: ['Goal name', 'Owner', 'Status'],
      rows: [
        ['Reduce repeat faults', 'MG', 'Done'],
        ['Improve upload flow', 'SA', 'Not started'],
        ['Raise SLA readiness', 'AK', 'In progress'],
      ],
    },
  ],
};

const allCreativeTemplates = [
  ...creativeTemplateCards.quick,
  ...creativeTemplateCards.suggested,
];

const templateDetails = {
  'empty-page': {
    label: 'Blank canvas',
    description: 'A clean working area for custom sticky notes, frames, labels, and process sketches.',
    includes: ['No predefined items', 'Best for free thinking', 'Saved to your workspace board'],
  },
  'empty-database': {
    label: 'Structured tracker',
    description: 'A simple database-style layout for collecting maintenance ideas, owners, status, and due dates.',
    includes: ['Frame', 'Table wireframe', 'Starter sticky note'],
  },
  'ai-build': {
    label: 'Guided concept board',
    description: 'A guided board for turning a maintenance challenge into root causes, actions, and validation checks.',
    includes: ['Challenge prompts', 'Root cause area', 'Action planning cards', 'Validation checklist'],
  },
  'tasks-tracker': {
    label: 'Execution tracker',
    description: 'Track daily engineering work with status, ownership, and quick visual reminders.',
    includes: ['Task table', 'Status stickies', 'Daily visibility note'],
  },
  projects: {
    label: 'Project flow',
    description: 'Map improvement work from backlog to in-progress to completed, using movable project cards.',
    includes: ['Backlog column', 'In-progress column', 'Done column', 'Project idea cards'],
  },
  'document-hub': {
    label: 'Document workspace',
    description: 'Organize SOPs, maintenance observations, checklists, and shared engineering documents.',
    includes: ['Document table', 'SOP note', 'Observation note'],
  },
  brainstorm: {
    label: 'Idea session',
    description: 'Capture maintenance, reporting, safety, and workflow ideas as a visual brainstorm map.',
    includes: ['Idea frame', 'Five idea notes', 'Mixed sticky colors'],
  },
  'meeting-notes': {
    label: 'Action meeting',
    description: 'Capture decisions, risks, and action items from maintenance planning meetings.',
    includes: ['Meeting header', 'Action checklist', 'Decision note', 'Risk note'],
  },
  'goals-tracker': {
    label: 'Readiness goals',
    description: 'Visualize operational targets, owners, and readiness progress in one board.',
    includes: ['Progress chart placeholder', 'Goals table', 'Target notes'],
  },
};

function makeTemplateItems(templateKey, customization = {}) {
  const createdAt = nowIso();
  const template = allCreativeTemplates.find((entry) => entry.key === templateKey);
  const customTitle = customization.title?.trim() || template?.title || 'Creative Board';
  const customRows = Array.isArray(customization.rows) ? customization.rows : template?.rows || [];
  const makeItem = (type, patch) => ({
    id: createId(type),
    type,
    createdAt,
    updatedAt: createdAt,
    ...patch,
  });
  const makeRowLabels = (x, y, width = 410) => customRows.slice(0, 5).map((row, index) => makeItem('text', {
    label: row.filter(Boolean).join(' | '),
    x,
    y: y + index * 48,
    width,
    height: 38,
  }));

  if (templateKey === 'empty-page') return [];

  if (templateKey === 'empty-database') {
    return [
      makeItem('frame', {
        label: 'Engineering Database',
        x: 58,
        y: 54,
        width: 650,
        height: 360,
      }),
      makeItem('wireframe', {
        wireType: 'Table',
        label: 'Maintenance Items Table',
        x: 96,
        y: 130,
        width: 560,
        height: 210,
      }),
      makeItem('sticky', {
        label: 'Add columns for machine, owner, status, and due date',
        color: 'blue',
        x: 742,
        y: 84,
        width: 220,
        height: 136,
      }),
    ];
  }

  if (templateKey === 'ai-build') {
    return [
      makeItem('frame', {
        label: 'AI-Assisted Engineering Flow',
        x: 56,
        y: 54,
        width: 720,
        height: 420,
      }),
      makeItem('sticky', {
        label: 'Describe the maintenance challenge',
        color: 'purple',
        x: 96,
        y: 132,
        width: 210,
        height: 126,
      }),
      makeItem('sticky', {
        label: 'Generate possible root causes',
        color: 'yellow',
        x: 340,
        y: 132,
        width: 210,
        height: 126,
      }),
      makeItem('sticky', {
        label: 'Turn best idea into action plan',
        color: 'green',
        x: 584,
        y: 132,
        width: 210,
        height: 126,
      }),
      makeItem('wireframe', {
        wireType: 'Checklist',
        label: 'Validation checklist',
        x: 104,
        y: 306,
        width: 300,
        height: 140,
      }),
      makeItem('wireframe', {
        wireType: 'Card',
        label: 'Recommended next step',
        x: 440,
        y: 306,
        width: 300,
        height: 140,
      }),
    ];
  }

  if (templateKey === 'tasks-tracker') {
    return [
      makeItem('frame', { label: customTitle, x: 50, y: 48, width: 920, height: 460 }),
      makeItem('wireframe', { wireType: 'Table', label: 'Task name | Status | Assignee', x: 88, y: 126, width: 560, height: 230 }),
      makeItem('sticky', { label: 'Todo: inspect hydraulic temperature', color: 'yellow', x: 690, y: 126, width: 210, height: 112 }),
      makeItem('sticky', { label: 'In progress: review EQP upload', color: 'blue', x: 690, y: 260, width: 210, height: 112 }),
      makeItem('text', { label: 'Use this board for quick daily visibility before dispatch.', x: 90, y: 382, width: 470, height: 64 }),
      ...makeRowLabels(116, 166),
    ];
  }

  if (templateKey === 'projects') {
    return [
      makeItem('frame', { label: customTitle, x: 52, y: 50, width: 940, height: 470 }),
      makeItem('wireframe', { wireType: 'Card', label: 'Backlog', x: 96, y: 132, width: 220, height: 230 }),
      makeItem('wireframe', { wireType: 'Card', label: 'In Progress', x: 352, y: 132, width: 220, height: 230 }),
      makeItem('wireframe', { wireType: 'Card', label: 'Done', x: 608, y: 132, width: 220, height: 230 }),
      makeItem('sticky', { label: 'Machine inspection workflow redesign', color: 'green', x: 116, y: 184, width: 170, height: 92 }),
      makeItem('sticky', { label: 'Manual page viewer refinement', color: 'blue', x: 372, y: 184, width: 170, height: 92 }),
      makeItem('sticky', { label: 'Technician assignment cleanup', color: 'purple', x: 628, y: 184, width: 170, height: 92 }),
      ...makeRowLabels(118, 386, 640),
    ];
  }

  if (templateKey === 'document-hub') {
    return [
      makeItem('frame', { label: customTitle, x: 50, y: 48, width: 980, height: 470 }),
      makeItem('wireframe', { wireType: 'Table', label: 'Doc name | Created by | Created time', x: 92, y: 126, width: 610, height: 220 }),
      makeItem('sticky', { label: 'Pressure testing SOP', color: 'pink', x: 748, y: 106, width: 210, height: 118 }),
      makeItem('sticky', { label: 'Cooling system observations', color: 'blue', x: 748, y: 246, width: 210, height: 118 }),
      ...makeRowLabels(118, 168),
    ];
  }

  if (templateKey === 'brainstorm') {
    return [
      makeItem('frame', { label: customTitle, x: 48, y: 48, width: 900, height: 460 }),
      makeItem('sticky', { label: 'Improve daily technician assignment', color: 'yellow', x: 94, y: 132, width: 190, height: 128 }),
      makeItem('sticky', { label: 'Better EQP report workflow', color: 'pink', x: 318, y: 132, width: 190, height: 128 }),
      makeItem('sticky', { label: 'Link manual pages directly to tasks', color: 'blue', x: 542, y: 132, width: 190, height: 128 }),
      makeItem('sticky', { label: 'Surface safety warnings before dispatch', color: 'green', x: 206, y: 296, width: 190, height: 128 }),
      makeItem('sticky', { label: 'Add approvals for critical maintenance', color: 'purple', x: 430, y: 296, width: 190, height: 128 }),
      ...makeRowLabels(670, 132, 230),
    ];
  }

  if (templateKey === 'meeting-notes') {
    return [
      makeItem('frame', { label: customTitle, x: 50, y: 48, width: 920, height: 450 }),
      makeItem('wireframe', { wireType: 'Header', label: 'Morning Maintenance Brief', x: 92, y: 118, width: 520, height: 76 }),
      makeItem('wireframe', { wireType: 'Checklist', label: 'Action Items', x: 92, y: 230, width: 340, height: 160 }),
      makeItem('sticky', { label: 'Decision: assign region groups earlier', color: 'yellow', x: 664, y: 118, width: 210, height: 120 }),
      makeItem('sticky', { label: 'Risk: missing machine references in reports', color: 'pink', x: 664, y: 268, width: 210, height: 120 }),
      ...makeRowLabels(110, 404, 620),
    ];
  }

  if (templateKey === 'goals-tracker') {
    return [
      makeItem('frame', { label: customTitle, x: 50, y: 48, width: 920, height: 460 }),
      makeItem('wireframe', { wireType: 'Chart', label: 'Readiness Progress', x: 94, y: 126, width: 360, height: 220 }),
      makeItem('wireframe', { wireType: 'Table', label: 'Goal name | Owner | Status', x: 494, y: 126, width: 330, height: 220 }),
      makeItem('sticky', { label: 'Target: 92% schedule coverage', color: 'green', x: 96, y: 382, width: 210, height: 92 }),
      makeItem('sticky', { label: 'Target: reduce repeat faults', color: 'blue', x: 336, y: 382, width: 210, height: 92 }),
      makeItem('sticky', { label: 'Target: faster report closure', color: 'purple', x: 576, y: 382, width: 210, height: 92 }),
      ...makeRowLabels(520, 166, 260),
    ];
  }

  return defaultBoardItems();
}

function TemplateIcon({ type }) {
  if (type === 'database') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <path d="M4 10h16M9 5v14M15 5v14" />
      </svg>
    );
  }

  if (type === 'spark') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3zM18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14z" />
      </svg>
    );
  }

  if (type === 'check') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
        <path d="M8.5 12.2l2.2 2.2 4.8-5" />
      </svg>
    );
  }

  if (type === 'loop') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M17 7a6 6 0 0 0-10 3M7 7v3h3M7 17a6 6 0 0 0 10-3m0 3v-3h-3" />
      </svg>
    );
  }

  if (type === 'file') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3h7l4 4v14H7zM14 3v5h5" />
      </svg>
    );
  }

  if (type === 'bulb') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 18h6M10 21h4M8 11a4 4 0 1 1 8 0c0 2-1.4 3.1-2.2 4H10.2C9.4 14.1 8 13 8 11z" />
      </svg>
    );
  }

  if (type === 'calendar') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="6" width="16" height="14" rx="2" />
        <path d="M8 4v4M16 4v4M4 10h16" />
      </svg>
    );
  }

  if (type === 'flag') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 21V4h10l-1 3 1 3H6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3h8l3 3v15H7zM15 3v5h5" />
    </svg>
  );
}

function TemplatePreview({ template }) {
  if (!template.columns) return null;

  return (
    <div className="eng-template-preview" aria-hidden="true">
      <div className="eng-template-preview-title">
        <TemplateIcon type={template.icon} />
        <strong>{template.title}</strong>
      </div>
      <div className="eng-template-columns">
        {template.columns.map((column) => <span key={column}>{column}</span>)}
      </div>
      <div className="eng-template-preview-rows">
        {template.rows.map((row) => (
          <div className="eng-template-preview-row" key={row.join('-')}>
            {row.map((cell, index) => (
              <span
                key={`${cell}-${index}`}
                className={index === row.length - 1 ? 'eng-template-pill' : ''}
              >
                {cell}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function EditableTemplatePreview({ template, title, rows, onTitleChange, onRowChange, onAddRow }) {
  const columns = template.columns || ['Name', 'Owner', 'Status'];

  return (
    <div className="eng-template-live-preview">
      <div className="eng-template-live-tools">
        <span>Add cover</span>
        <span>Hide description</span>
      </div>
      <div className="eng-template-live-title">
        <TemplateIcon type={template.icon} />
        <input
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          aria-label="Template title"
        />
      </div>
      <p>{template.subtitle}</p>
      <div className="eng-template-live-tabs" aria-hidden="true">
        <span>All items</span>
        <span>My items</span>
      </div>
      <div className="eng-template-live-table">
        <div className="eng-template-live-row eng-template-live-header">
          {columns.map((column) => <span key={column}>{column}</span>)}
        </div>
        {rows.map((row, rowIndex) => (
          <div className="eng-template-live-row" key={`${rowIndex}-${row.join('-')}`}>
            {columns.map((column, columnIndex) => (
              <input
                key={`${column}-${columnIndex}`}
                value={row[columnIndex] || ''}
                onChange={(event) => onRowChange(rowIndex, columnIndex, event.target.value)}
                aria-label={`${column} row ${rowIndex + 1}`}
              />
            ))}
          </div>
        ))}
        <button type="button" className="eng-template-add-row" onClick={onAddRow}>+ New row</button>
      </div>
    </div>
  );
}

function CreativeTemplateGallery({ open, onClose, onUseTemplate }) {
  const initialTemplate = creativeTemplateCards.suggested[0];
  const [templateDraft, setTemplateDraft] = useState({
    selectedKey: initialTemplate.key,
    title: initialTemplate.title,
    rows: initialTemplate.rows || [],
  });
  const selectedKey = templateDraft.selectedKey;
  const selectedTemplate = allCreativeTemplates.find((template) => template.key === selectedKey) || initialTemplate;
  const selectedDetails = templateDetails[selectedTemplate.key] || templateDetails['empty-page'];
  const customTitle = templateDraft.title;
  const customRows = templateDraft.rows;

  if (!open) return null;

  function selectTemplate(template) {
    setTemplateDraft({
      selectedKey: template.key,
      title: template.title,
      rows: template.rows || [],
    });
  }

  function updateCustomRow(rowIndex, columnIndex, value) {
    setTemplateDraft((current) => ({
      ...current,
      rows: current.rows.map((row, index) => {
        if (index !== rowIndex) return row;
        const nextRow = [...row];
        nextRow[columnIndex] = value;
        return nextRow;
      }),
    }));
  }

  function addCustomRow() {
    const columnCount = selectedTemplate.columns?.length || 3;
    setTemplateDraft((current) => ({
      ...current,
      rows: [...current.rows, Array.from({ length: columnCount }, () => '')],
    }));
  }

  function useSelectedTemplate() {
    onUseTemplate(selectedTemplate.key, customTitle || selectedTemplate.title, {
      title: customTitle,
      rows: customRows,
    });
  }

  return (
    <div className="eng-template-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="eng-template-board"
        role="dialog"
        aria-modal="true"
        aria-labelledby="creative-template-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="eng-template-intro">
          <div>
            <p>Creative templates</p>
            <h2 id="creative-template-title">Start with a board structure</h2>
          </div>
          <div className="eng-template-header-actions">
            <span>Choose a template, review the setup, then apply it to the canvas.</span>
            <button type="button" className="eng-template-close" onClick={onClose} aria-label="Close templates">x</button>
          </div>
        </div>

        <div className="eng-template-modal-grid">
          <div className="eng-template-picker">
            <div className="eng-template-quick-grid">
              {creativeTemplateCards.quick.map((template) => (
                <button
                  key={template.key}
                  type="button"
                  className={selectedKey === template.key ? 'eng-template-quick-card eng-template-selected' : 'eng-template-quick-card'}
                  onClick={() => selectTemplate(template)}
                >
                  <TemplateIcon type={template.icon} />
                  <strong>{template.title}</strong>
                  <span>{template.subtitle}</span>
                </button>
              ))}
            </div>

            <h3>Suggested</h3>
            <div className="eng-template-grid">
              {creativeTemplateCards.suggested.map((template) => (
                <button
                  key={template.key}
                  type="button"
                  className={`eng-template-card eng-template-${template.tone} ${selectedKey === template.key ? 'eng-template-selected' : ''}`}
                  onClick={() => selectTemplate(template)}
                  onDoubleClick={() => {
                    onUseTemplate(template.key, template.title, {
                      title: template.title,
                      rows: template.rows || [],
                    });
                  }}
                >
                  <strong>{template.title}</strong>
                  <span>{template.subtitle}</span>
                  <TemplatePreview template={template} />
                </button>
              ))}
            </div>
          </div>

          <aside className={`eng-template-detail eng-template-${selectedTemplate.tone || 'blue'}`}>
            <div className="eng-template-detail-head">
              <TemplateIcon type={selectedTemplate.icon} />
              <div>
                <span>{selectedDetails.label}</span>
                <h3>{customTitle || selectedTemplate.title}</h3>
              </div>
            </div>
            <p>{selectedDetails.description}</p>
            <EditableTemplatePreview
              template={selectedTemplate}
              title={customTitle}
              rows={customRows}
              onTitleChange={(title) => setTemplateDraft((current) => ({ ...current, title }))}
              onRowChange={updateCustomRow}
              onAddRow={addCustomRow}
            />
            <div className="eng-template-include-list">
              <strong>Template includes</strong>
              {selectedDetails.includes.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <div className="eng-template-actions">
              <Button
                type="button"
                onClick={useSelectedTemplate}
              >
                Use template
              </Button>
              <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

function CanvasCreativeArea({ onToast }) {
  const canvasRef = useRef(null);
  const boardRef = useRef(null);
  const dragRef = useRef(null);
  const [items, setItems] = useState(() => defaultBoardItems());
  const [selectedId, setSelectedId] = useState('');
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const selectedItem = items.find((item) => item.id === selectedId) || null;
  const canvasHeight = useMemo(() => {
    const bottomEdge = items.reduce((max, item) => Math.max(max, (item.y || 0) + (item.height || 0)), 0);
    return Math.max(820, bottomEdge + 220);
  }, [items]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setItems(loadStoredItems(BOARD_KEY, defaultBoardItems));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === boardRef.current);
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) {
        const activeTag = document.activeElement?.tagName?.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;
        setItems((current) => current.filter((item) => item.id !== selectedId));
        setSelectedId('');
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  function updateItem(id, patch) {
    setItems((current) => current.map((item) => (
      item.id === id ? { ...item, ...patch, updatedAt: nowIso() } : item
    )));
  }

  function addItem(type) {
    const createdAt = nowIso();
    const base = {
      id: createId(type),
      type,
      x: 160 + items.length * 18,
      y: 110 + items.length * 14,
      width: 190,
      height: 132,
      createdAt,
      updatedAt: createdAt,
    };

    const nextItem = {
      ...base,
      ...(type === 'sticky' ? { label: 'New engineering idea', color: 'yellow' } : {}),
      ...(type === 'wireframe' ? { label: 'Wireframe Block', wireType: 'Card', width: 230, height: 140 } : {}),
      ...(type === 'frame' ? { label: 'New Section', width: 430, height: 280 } : {}),
      ...(type === 'text' ? { label: 'Text label', width: 220, height: 90 } : {}),
    };

    setItems((current) => [...current, nextItem]);
    setSelectedId(nextItem.id);
  }

  function deleteItem(id) {
    setItems((current) => current.filter((item) => item.id !== id));
    if (selectedId === id) setSelectedId('');
  }

  function duplicateItem(item) {
    const createdAt = nowIso();
    const copy = {
      ...item,
      id: createId(item.type),
      x: item.x + 28,
      y: item.y + 28,
      createdAt,
      updatedAt: createdAt,
    };
    setItems((current) => [...current, copy]);
    setSelectedId(copy.id);
  }

  function clearCanvas() {
    if (!window.confirm('Clear the entire creative canvas?')) return;
    setItems([]);
    setSelectedId('');
    saveStoredItems(BOARD_KEY, []);
    onToast('Canvas cleared.');
  }

  function saveBoard() {
    saveStoredItems(BOARD_KEY, items);
    onToast('Creative board saved.');
  }

  function resetView() {
    setItems(defaultBoardItems());
    setSelectedId('');
    onToast('View reset with demo content.');
  }

  function applyCreativeTemplate(templateKey, templateTitle, customization = {}) {
    const nextItems = makeTemplateItems(templateKey, customization);
    setItems(nextItems);
    setSelectedId(nextItems[0]?.id || '');
    saveStoredItems(BOARD_KEY, nextItems);
    setTemplatesOpen(false);
    onToast(`${templateTitle} template loaded.`);
  }

  function handlePointerDown(event, item) {
    const interactive = event.target.closest('input, textarea, select, button');
    if (interactive) return;
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      id: item.id,
      offsetX: event.clientX - canvasRect.left - item.x,
      offsetY: event.clientY - canvasRect.top - item.y,
    };
    setSelectedId(item.id);
  }

  function handlePointerMove(event) {
    if (!dragRef.current || !canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.round(event.clientX - canvasRect.left - dragRef.current.offsetX));
    const y = Math.max(0, Math.round(event.clientY - canvasRect.top - dragRef.current.offsetY));
    updateItem(dragRef.current.id, { x, y });
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
        return;
      }

      await boardRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } catch {
      setIsFullscreen((current) => !current);
    }
  }

  return (
    <div ref={boardRef} className={isFullscreen ? 'eng-creative-space eng-board-fullscreen' : 'eng-creative-space'}>
      <CreativeTemplateGallery
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onUseTemplate={applyCreativeTemplate}
      />
      <div className={selectedItem ? 'eng-creative-grid eng-creative-grid-selected' : 'eng-creative-grid'}>
        <section className="eng-board-shell">
          <button
            type="button"
            className="eng-board-fullscreen-button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit whiteboard fullscreen' : 'Enter whiteboard fullscreen'}
          >
            {isFullscreen ? 'Exit full screen' : 'Full screen'}
          </button>
          <CanvasToolbar
            onOpenTemplates={() => setTemplatesOpen(true)}
            onAddSticky={() => addItem('sticky')}
            onAddWireframe={() => addItem('wireframe')}
            onAddFrame={() => addItem('frame')}
            onAddText={() => addItem('text')}
            onClear={clearCanvas}
            onSave={saveBoard}
            onResetView={resetView}
            onToggleFullscreen={toggleFullscreen}
            isFullscreen={isFullscreen}
          />
          <div
            ref={canvasRef}
            className="eng-canvas"
            style={{ minHeight: canvasHeight }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onClick={() => setSelectedId('')}
          >
            {items.length === 0 && (
              <div className="eng-canvas-empty">
                <EmptyState title="Canvas is empty" description="Add sticky notes, wireframes, frames, or labels to start mapping ideas." />
              </div>
            )}
            {items.map((item) => (
              <CanvasItem
                key={item.id}
                item={item}
                selected={item.id === selectedId}
                onSelect={setSelectedId}
                onPointerDown={handlePointerDown}
                onChange={updateItem}
                onDelete={deleteItem}
                onDuplicate={duplicateItem}
              />
            ))}
          </div>
        </section>
        {selectedItem && (
          <PropertiesPanel
            selectedItem={selectedItem}
            onChange={updateItem}
            onDelete={deleteItem}
            onDuplicate={duplicateItem}
          />
        )}
      </div>
    </div>
  );
}

function formatCreativeDate(value) {
  const date = new Date(value);
  const month = date.toLocaleString('en', { month: 'short' });
  return `${month} ${date.getDate()}, ${date.getFullYear()} ${date.toLocaleTimeString('en', {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

function CreativeSidebar({ docs, activeView, selectedId, onSelectView, onSelectDoc, onCreateDoc }) {
  const favoriteDoc = docs.find((doc) => doc.favorite) || docs[0];
  const privateDocs = docs.slice(0, 3);

  return (
    <aside className="eng-doc-sidebar">
      <div className="eng-doc-space-head">
        <span className="eng-doc-avatar">M</span>
        <strong>Motasem Ghanem&apos;s Space</strong>
        <button type="button" aria-label="Collapse workspace sidebar">Â«</button>
      </div>

      <div className="eng-doc-sidebar-actions" aria-label="Workspace shortcuts">
        <button type="button" className={activeView === 'docs' ? 'eng-doc-pill-active' : ''} onClick={() => onSelectView('docs')}>Home</button>
        <button type="button">Inbox</button>
        <button type="button">Tasks</button>
        <button type="button">Search</button>
      </div>

      <nav className="eng-doc-nav" aria-label="Creative documents">
        <p>Recents</p>
        {favoriteDoc && (
          <button type="button" onClick={() => onSelectDoc(favoriteDoc.id)}>
            <span className="eng-doc-favorite">â˜…</span>
            <strong>{favoriteDoc.title}</strong>
          </button>
        )}
        <button
          type="button"
          className={activeView === 'docs' ? 'eng-doc-nav-active' : ''}
          onClick={() => onSelectView('docs')}
        >
          <span className="eng-doc-file-icon">â– </span>
          <strong>Document Hub</strong>
        </button>
        <button type="button" onClick={() => onSelectView('getting-started')}>
          <span>â—‹</span>
          <strong>Getting Started</strong>
        </button>

        <p>Creative tools</p>
        <button
          type="button"
          className={activeView === 'board' ? 'eng-doc-nav-active' : ''}
          onClick={() => onSelectView('board')}
        >
          <span>â–¦</span>
          <strong>Idea Board</strong>
        </button>
        <button type="button" onClick={onCreateDoc}>
          <span>+</span>
          <strong>New doc</strong>
        </button>

        <p>Private</p>
        {privateDocs.map((doc) => (
          <button
            key={doc.id}
            type="button"
            className={selectedId === doc.id && activeView === 'docs' ? 'eng-doc-nav-active' : ''}
            onClick={() => onSelectDoc(doc.id)}
          >
            <span className="eng-doc-file-icon">â– </span>
            <strong>{doc.title}</strong>
          </button>
        ))}

        <p>Teamspaces</p>
        <button type="button">
          <span>âŒ‚</span>
          <strong>Maintenance Space HQ</strong>
        </button>
        <button type="button" onClick={onCreateDoc}>
          <span>+</span>
          <strong>Add new</strong>
        </button>
      </nav>

      <div className="eng-doc-sidebar-bottom">
        <div>
          <strong>Invite members</strong>
          <span>Collaborate with your team.</span>
        </div>
        <button type="button">New chat</button>
      </div>
    </aside>
  );
}

function CreativeDocsTable({ docs, selectedId, onSelectDoc, onUpdateDoc, onCreateDoc, onDeleteDoc }) {
  const [query, setQuery] = useState('');
  const [view, setView] = useState('all');
  const [openMenuId, setOpenMenuId] = useState('');
  const filteredDocs = docs.filter((doc) => {
    const matchesQuery = `${doc.title} ${doc.category} ${doc.createdBy}`.toLowerCase().includes(query.toLowerCase());
    if (view === 'mine') return matchesQuery && doc.createdBy === 'Motasem Ghanem';
    if (view === 'pinned') return matchesQuery && doc.favorite;
    return matchesQuery;
  });

  return (
    <div className="eng-doc-table-wrap">
      <div className="eng-doc-table-toolbar">
        <div className="eng-doc-view-tabs">
          <button type="button" className={view === 'all' ? 'eng-doc-view-active' : ''} onClick={() => setView('all')}>All Docs</button>
          <button type="button" className={view === 'mine' ? 'eng-doc-view-active' : ''} onClick={() => setView('mine')}>My Docs</button>
          <button type="button" className={view === 'pinned' ? 'eng-doc-view-active' : ''} onClick={() => setView('pinned')}>Pinned</button>
        </div>
        <div className="eng-doc-table-actions">
          <label className="eng-doc-search">
            <span>Search</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search documents..." />
          </label>
          <button type="button" aria-label="Sort documents">Sort</button>
          <button type="button" aria-label="Table settings">Settings</button>
          <button type="button" className="eng-doc-new-btn" onClick={onCreateDoc}>New document</button>
        </div>
      </div>

      <div className="eng-doc-table" role="table" aria-label="Document Hub">
        <div className="eng-doc-row eng-doc-header-row" role="row">
          <span role="columnheader">Doc name</span>
          <span role="columnheader">Category</span>
          <span role="columnheader">Created by</span>
          <span role="columnheader">Created time</span>
          <span role="columnheader">Last edited</span>
          <span role="columnheader">Actions</span>
        </div>
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className={selectedId === doc.id ? 'eng-doc-row eng-doc-row-selected' : 'eng-doc-row'}
            role="row"
            onClick={() => onSelectDoc(doc.id)}
          >
            <input
              value={doc.title}
              onChange={(event) => onUpdateDoc(doc.id, { title: event.target.value })}
              aria-label="Document title"
            />
            <input
              value={doc.category}
              onChange={(event) => onUpdateDoc(doc.id, { category: event.target.value })}
              className="eng-doc-category-input"
              aria-label="Document category"
            />
            <span><i>M</i>{doc.createdBy}</span>
            <span>{formatCreativeDate(doc.createdAt)}</span>
            <span><i>M</i>{doc.lastEditedBy}</span>
            <div className="eng-doc-row-actions">
              <button
                type="button"
                aria-label={`Open actions for ${doc.title}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setOpenMenuId(openMenuId === doc.id ? '' : doc.id);
                }}
              >
                ...
              </button>
              {openMenuId === doc.id && (
                <div className="eng-doc-action-menu">
                  <button type="button" onClick={() => setOpenMenuId('')}>Open</button>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateDoc(doc.id, { favorite: !doc.favorite });
                      setOpenMenuId('');
                    }}
                  >
                    {doc.favorite ? 'Unpin' : 'Pin'}
                  </button>
                  <button
                    type="button"
                    className="eng-doc-menu-danger"
                    onClick={() => {
                      onDeleteDoc(doc.id);
                      setOpenMenuId('');
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {filteredDocs.length === 0
        ? <EmptyState title="No documents found" description="Try a different search or create a new document." />
        : <button type="button" className="eng-doc-new-row" onClick={onCreateDoc}>+ New document</button>}
    </div>
  );
}

function CreativeDocumentHub({ docs, selectedId, activeView, onSelectView, onSelectDoc, onUpdateDoc, onCreateDoc, onDeleteDoc }) {
  const selectedDoc = docs.find((doc) => doc.id === selectedId) || docs[0];
  const pinnedCount = docs.filter((doc) => doc.favorite).length;

  return (
    <main className="eng-doc-main eng-doc-main-native">
      <header className="eng-doc-native-header">
        <div>
          <p>Engineering Workspace</p>
          <h2>Document Hub</h2>
          <span>Create and collaborate on engineering documents in one place.</span>
        </div>
        <div>
          <button type="button" className={activeView === 'docs' ? 'eng-doc-filter-active' : ''} onClick={() => onSelectView('docs')}>Documents</button>
          <button type="button" className={activeView === 'board' ? 'eng-doc-filter-active' : ''} onClick={() => onSelectView('board')}>Idea Board</button>
          <Button type="button" onClick={onCreateDoc}>New document</Button>
        </div>
      </header>

      <section className="eng-doc-summary-grid" aria-label="Document summary">
        <Card>
          <span>Total documents</span>
          <strong>{docs.length}</strong>
        </Card>
        <Card>
          <span>Pinned</span>
          <strong>{pinnedCount}</strong>
        </Card>
        <Card>
          <span>Last selected</span>
          <strong>{selectedDoc?.category || 'Engineering note'}</strong>
        </Card>
      </section>

      <section className="eng-doc-page eng-doc-page-native">
        <div className="eng-doc-title-block eng-doc-title-native">
          <div>
            <h3>Documents</h3>
            <p>Manage engineering notes, proposals, research, and maintenance references.</p>
          </div>
          <Badge tone="info">{docs.length} docs</Badge>
        </div>
        <CreativeDocsTable
          docs={docs}
          selectedId={selectedId}
          onSelectDoc={onSelectDoc}
          onUpdateDoc={onUpdateDoc}
          onCreateDoc={onCreateDoc}
          onDeleteDoc={onDeleteDoc}
        />
      </section>
      <button type="button" className="eng-doc-floating-action" onClick={onCreateDoc}>+ New document</button>
    </main>
  );
}
function CreativeArea({ onToast }) {
  const didLoadRef = useRef(false);
  const [docs, setDocs] = useState(() => defaultCreativeDocs());
  const [selectedId, setSelectedId] = useState('creative-doc-company-mission');
  const [activeView, setActiveView] = useState('docs');

  useEffect(() => {
    const timer = setTimeout(() => {
      const storedDocs = loadStoredItems(CREATIVE_DOCS_KEY, defaultCreativeDocs);
      setDocs(storedDocs);
      setSelectedId(storedDocs[0]?.id || '');
      didLoadRef.current = true;
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!didLoadRef.current) return;
    saveStoredItems(CREATIVE_DOCS_KEY, docs);
  }, [docs]);

  function createDoc() {
    const timestamp = nowIso();
    const nextDoc = {
      id: createId('creative-doc'),
      title: 'Untitled document',
      category: 'Engineering note',
      createdBy: 'Motasem Ghanem',
      lastEditedBy: 'Motasem Ghanem',
      createdAt: timestamp,
      updatedAt: timestamp,
      favorite: false,
    };
    setDocs((current) => [nextDoc, ...current]);
    setSelectedId(nextDoc.id);
    setActiveView('docs');
    onToast('Creative document added.');
  }

  function updateDoc(id, patch) {
    setDocs((current) => current.map((doc) => (
      doc.id === id ? { ...doc, ...patch, updatedAt: nowIso(), lastEditedBy: 'Motasem Ghanem' } : doc
    )));
  }

  function deleteDoc(id) {
    const nextDocs = docs.filter((doc) => doc.id !== id);
    setDocs(nextDocs);
    if (selectedId === id) setSelectedId(nextDocs[0]?.id || '');
    onToast('Creative document deleted.');
  }

  function selectDoc(id) {
    setSelectedId(id);
    setActiveView('docs');
  }

  return (
    <div className="eng-doc-workspace">
      {activeView === 'board'
        ? (
          <div className="eng-doc-board-view">
            <button type="button" className="eng-board-back-floating" onClick={() => setActiveView('docs')}>Back to documents</button>
            <CanvasCreativeArea onToast={onToast} />
          </div>
        )
        : (
          <CreativeDocumentHub
            docs={docs}
            selectedId={selectedId}
            activeView={activeView}
            onSelectView={setActiveView}
            onSelectDoc={selectDoc}
            onUpdateDoc={updateDoc}
            onCreateDoc={createDoc}
            onDeleteDoc={deleteDoc}
          />
        )}
    </div>
  );
}

function PlannerSummary({ tasks }) {
  const completed = tasks.filter((task) => task.completed).length;
  const total = tasks.length;

  return (
    <Card className="eng-simple-summary">
      <div>
        <span>Today</span>
        <strong>{completed}/{total} done</strong>
      </div>
      <Badge tone={completed === total && total > 0 ? 'completed' : 'info'}>{total} tasks</Badge>
    </Card>
  );
}

function SimpleTaskForm({ title, setTitle, dueTime, setDueTime, onSubmit }) {
  return (
    <Card className="eng-simple-form-card">
      <form className="eng-simple-form" onSubmit={onSubmit}>
        <Field label="Task">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Add a task"
            required
          />
        </Field>
        <Field label="Time">
          <input type="time" value={dueTime} onChange={(event) => setDueTime(event.target.value)} />
        </Field>
        <Button type="submit">Add</Button>
      </form>
    </Card>
  );
}

function SimpleTaskRow({ task, onToggle, onDelete }) {
  return (
    <article className={task.completed ? 'eng-simple-task eng-simple-task-done' : 'eng-simple-task'}>
      <button
        type="button"
        className={task.completed ? 'eng-simple-check eng-simple-check-done' : 'eng-simple-check'}
        onClick={() => onToggle(task.id)}
        aria-label={`Mark ${task.title} ${task.completed ? 'not done' : 'done'}`}
      >
        {task.completed ? 'Done' : ''}
      </button>
      <time>{task.dueTime || '--:--'}</time>
      <span>{task.title}</span>
      <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(task.id)}>Delete</Button>
    </article>
  );
}

function DayPlanner({ onToast }) {
  const didLoadRef = useRef(false);
  const [tasks, setTasks] = useState(() => defaultPlannerTasks());
  const [title, setTitle] = useState('');
  const [dueTime, setDueTime] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setTasks(loadStoredItems(PLANNER_KEY, defaultPlannerTasks));
      didLoadRef.current = true;
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!didLoadRef.current) return;
    saveStoredItems(PLANNER_KEY, tasks);
  }, [tasks]);

  const todayLabel = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  const sortedTasks = useMemo(() => [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return String(a.dueTime || '99:99').localeCompare(String(b.dueTime || '99:99'));
  }), [tasks]);

  function addTask(event) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    const timestamp = nowIso();
    setTasks((current) => [
      ...current,
      {
        id: createId('task'),
        title: cleanTitle,
        dueTime,
        completed: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ]);
    setTitle('');
    setDueTime('');
    onToast('Task added.');
  }

  function toggleTask(id) {
    const timestamp = nowIso();
    setTasks((current) => current.map((task) => (
      task.id === id ? { ...task, completed: !task.completed, updatedAt: timestamp } : task
    )));
  }

  function deleteTask(id) {
    setTasks((current) => current.filter((task) => task.id !== id));
    onToast('Task deleted.');
  }

  return (
    <div className="eng-simple-planner">
      <div className="eng-simple-planner-head">
        <div>
          <p>Day Planner</p>
          <h2>{todayLabel}</h2>
        </div>
        <PlannerSummary tasks={tasks} />
      </div>

      <SimpleTaskForm
        title={title}
        setTitle={setTitle}
        dueTime={dueTime}
        setDueTime={setDueTime}
        onSubmit={addTask}
      />

      <Card className="eng-simple-list-card">
        <div className="eng-simple-list-head">
          <h2>Tasks</h2>
          <span>{sortedTasks.length} total</span>
        </div>
        <div className="eng-simple-task-list">
          {sortedTasks.map((task) => (
            <SimpleTaskRow key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
          ))}
          {sortedTasks.length === 0 && <EmptyState title="No tasks" description="Add a task with a time to plan your day." />}
        </div>
      </Card>
    </div>
  );
}
export default function EngineeringWorkspace() {
  const [activeTab, setActiveTab] = useState('creative');
  const [toast, setToast] = useState('');

  const title = activeTab === 'creative' ? 'Creative Area' : 'Day Planner';
  const description = activeTab === 'creative'
    ? 'Visualize maintenance ideas, workflows, and wireframes on an interactive engineering canvas.'
    : 'Build a simple timed task list for the day.';

  return (
    <SystemShell
      activePath="/workspace"
      eyebrow="ENGINEERING WORKSPACE"
      title={title}
      description={description}
      actions={<WorkspaceTabs activeTab={activeTab} onTabChange={setActiveTab} />}
      contentClassName="eng-workspace-content"
    >
      <Toast message={toast} type="info" onClose={() => setToast('')} />
      <section className="eng-workspace-shell">
        {activeTab === 'creative'
          ? <CreativeArea onToast={setToast} />
          : <DayPlanner onToast={setToast} />}
      </section>
    </SystemShell>
  );
}
