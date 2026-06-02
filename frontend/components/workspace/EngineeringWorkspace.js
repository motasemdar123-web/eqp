'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import SystemShell from '../SystemShell';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import Field from '../ui/Field';
import EmptyState from '../ui/EmptyState';
import Toast from '../ui/Toast';
import {
  dismissWorkspacePlannerTask,
  getWorkspaceEngineers,
  getWorkspacePlannerInbox,
  planWorkspacePlannerTask,
  pushWorkspacePlannerTask,
} from '../../lib/api';

const BOARD_KEY = 'dar-al-hai-engineering-creative-board-v1';
const PRO_WHITEBOARD_KEY = 'dar-al-hai-engineering-pro-whiteboard-v2';
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
      expectedDurationMinutes: 30,
      completed: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: 'demo-task-eqp-upload',
      title: 'Review EQP report upload',
      dueTime: '11:30',
      expectedDurationMinutes: 45,
      completed: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: 'demo-task-tomorrow-plan',
      title: 'Prepare tomorrow maintenance plan',
      dueTime: '15:30',
      expectedDurationMinutes: 60,
      completed: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: 'demo-task-pressure-safety',
      title: 'Check safety notes for pressure testing',
      dueTime: '13:00',
      expectedDurationMinutes: 25,
      completed: false,
      createdAt,
      updatedAt: createdAt,
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

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateFromKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function shiftDateKey(dateKey, days) {
  const date = dateFromKey(dateKey);
  date.setDate(date.getDate() + days);
  return formatDateKey(date);
}

function startOfWeekKey(dateKey) {
  const date = dateFromKey(dateKey);
  const day = date.getDay();
  date.setDate(date.getDate() - day);
  return formatDateKey(date);
}

function daysBetween(startKey, count) {
  return Array.from({ length: count }, (_, index) => shiftDateKey(startKey, index));
}

function monthKeys(dateKey) {
  const date = dateFromKey(dateKey);
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, index) => {
    const next = new Date(firstDay);
    next.setDate(index + 1);
    return formatDateKey(next);
  });
}

function defaultPlannerByDate() {
  return {
    [formatDateKey(new Date())]: defaultPlannerTasks(),
  };
}

function loadPlannerByDate() {
  if (typeof window === 'undefined') return defaultPlannerByDate();
  try {
    const stored = JSON.parse(localStorage.getItem(PLANNER_KEY) || 'null');
    if (Array.isArray(stored)) {
      return { [formatDateKey(new Date())]: stored };
    }
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
      return stored;
    }
  } catch {
    localStorage.removeItem(PLANNER_KEY);
  }
  return defaultPlannerByDate();
}

function plannerStats(plannerByDate, dateKeys) {
  const tasks = dateKeys.flatMap((dateKey) => plannerByDate[dateKey] || []);
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  return { total, completed, percent };
}

function taskDurationMinutes(task) {
  return Math.max(0, Number(task?.expectedDurationMinutes || task?.durationMinutes || 0) || 0);
}

function totalDurationMinutes(tasks) {
  return tasks.reduce((total, task) => total + taskDurationMinutes(task), 0);
}

function formatDuration(minutes) {
  const cleanMinutes = Math.max(0, Number(minutes) || 0);
  const hours = Math.floor(cleanMinutes / 60);
  const remainder = cleanMinutes % 60;

  if (!hours && !remainder) return '0m';
  if (!hours) return `${remainder}m`;
  if (!remainder) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

function workspaceUserName(user) {
  return user?.fullName || user?.full_name || user?.email || 'Engineer';
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
  onOpenProWhiteboard,
}) {
  return (
    <div className="eng-canvas-toolbar">
      <Button type="button" size="sm" onClick={onOpenTemplates}>Templates</Button>
      <Button type="button" variant="secondary" size="sm" onClick={onOpenProWhiteboard}>Pro Whiteboard</Button>
      <span className="eng-toolbar-divider" />
      <Button type="button" size="sm" onClick={onAddSticky}>Add Sticky Note</Button>
      <Button type="button" variant="secondary" size="sm" onClick={onAddWireframe}>Add Wireframe</Button>
      <Button type="button" variant="secondary" size="sm" onClick={onAddFrame}>Add Frame</Button>
      <Button type="button" variant="secondary" size="sm" onClick={onAddText}>Add Text Label</Button>
      <span className="eng-toolbar-divider" />
      <Button type="button" variant="secondary" size="sm" onClick={onSave}>Save Board</Button>
      <Button type="button" variant="ghost" size="sm" onClick={onResetView}>Reset View</Button>
      <Button type="button" variant="danger" size="sm" onClick={onClear}>Clear Canvas</Button>
    </div>
  );
}

function FullscreenIcon({ active }) {
  if (active) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 4v5H4" />
        <path d="M15 4v5h5" />
        <path d="M9 20v-5H4" />
        <path d="M15 20v-5h5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9V4h5" />
      <path d="M20 9V4h-5" />
      <path d="M4 15v5h5" />
      <path d="M20 15v5h-5" />
    </svg>
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

const proWhiteboardTemplates = [
  {
    key: 'maintenance-control',
    title: 'Maintenance control room',
    description: 'Assets, work orders, SLA risk, owners, and escalation lanes.',
  },
  {
    key: 'incident-review',
    title: 'Incident review',
    description: 'Timeline, facts, root cause, corrective actions, and evidence.',
  },
  {
    key: 'inspection-route',
    title: 'Inspection route',
    description: 'Technician route, checkpoints, machine state, and follow-ups.',
  },
  {
    key: 'spares-flow',
    title: 'Spares and readiness',
    description: 'Parts demand, approvals, vendor status, and blockers.',
  },
  {
    key: 'retro',
    title: 'Retrospective board',
    description: 'What worked, what blocked us, and what to improve.',
  },
  {
    key: 'kanban',
    title: 'Work order Kanban',
    description: 'Backlog, assigned, in service, validation, and closed.',
  },
  {
    key: 'journey',
    title: 'User journey map',
    description: 'Steps, pain points, opportunities, and owners.',
  },
  {
    key: 'flowchart',
    title: 'Flowchart starter',
    description: 'Decision nodes, process steps, and arrows.',
  },
  {
    key: 'swot',
    title: 'SWOT analysis',
    description: 'Strengths, weaknesses, opportunities, and threats.',
  },
  {
    key: 'decision',
    title: 'Decision matrix',
    description: 'Options, criteria, confidence, and final call.',
  },
  {
    key: 'agenda',
    title: 'Meeting agenda',
    description: 'Agenda, notes, decisions, and action items.',
  },
];

const proColors = ['#FEF3C7', '#DBEAFE', '#DCFCE7', '#FCE7F3', '#EDE9FE', '#CCFBF1', '#FEE2E2', '#FFFFFF'];

function defaultProWhiteboardState() {
  const createdAt = DEMO_CREATED_AT;
  return {
    viewport: { zoom: 1, pan: { x: 0, y: 0 } },
    settings: { grid: true, snap: false },
    timer: { seconds: 600, running: false },
    objects: [
      {
        id: 'pro-frame-control-room',
        type: 'frame',
        x: 80,
        y: 80,
        width: 760,
        height: 430,
        zIndex: 1,
        color: 'rgba(232, 244, 255, 0.62)',
        borderColor: '#7AA7D9',
        text: 'Maintenance Control Room',
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: 'pro-card-dozer-17',
        type: 'card',
        x: 130,
        y: 165,
        width: 230,
        height: 154,
        zIndex: 4,
        color: '#FFFFFF',
        borderColor: '#EF4444',
        textColor: '#111827',
        text: 'DZR-17 hydraulic temperature spike',
        votes: 3,
        status: 'SLA risk',
        owner: 'Faisal',
        metadata: { asset: 'DZR-17', priority: 'P1', due: 'Today 14:00', zone: 'North yard' },
        comments: [{ id: 'comment-1', text: 'Link this to machine history before dispatch.', createdAt }],
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: 'pro-card-exc-04',
        type: 'card',
        x: 410,
        y: 165,
        width: 230,
        height: 154,
        zIndex: 3,
        color: '#FFFFFF',
        borderColor: '#14B8A6',
        textColor: '#111827',
        strokeWidth: 2,
        text: 'EXC-04 preventive service package',
        status: 'Ready',
        owner: 'Abdelrahman',
        metadata: { asset: 'EXC-04', priority: 'P3', due: 'Tomorrow 09:00', zone: 'Workshop' },
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: 'pro-arrow-escalation',
        type: 'connector',
        x: 362,
        y: 239,
        width: 48,
        height: 2,
        zIndex: 2,
        borderColor: '#64748B',
        strokeWidth: 3,
        text: 'dependency',
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: 'pro-table-shift',
        type: 'table',
        x: 130,
        y: 350,
        width: 650,
        height: 120,
        zIndex: 5,
        color: '#FFFFFF',
        borderColor: '#CBD5E1',
        textColor: '#111827',
        text: 'Shift handoff',
        metadata: {
          columns: ['Asset', 'Status', 'Owner', 'Next step'],
          rows: [
            ['DZR-17', 'SLA risk', 'Faisal', 'Dispatch technician'],
            ['EXC-04', 'Ready', 'Abdelrahman', 'Prepare report'],
            ['GEN-02', 'Waiting parts', 'Motasem', 'Approve filter kit'],
          ],
        },
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: 'pro-frame-route',
        type: 'frame',
        x: 930,
        y: 90,
        width: 520,
        height: 420,
        zIndex: 1,
        color: 'rgba(240, 253, 250, 0.66)',
        borderColor: '#5EEAD4',
        text: 'Technician Route and Evidence',
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: 'pro-timeline-route',
        type: 'timeline',
        x: 985,
        y: 180,
        width: 420,
        height: 210,
        zIndex: 4,
        color: '#FFFFFF',
        borderColor: '#14B8A6',
        text: 'North yard route',
        metadata: {
          events: [
            '08:30 inspection',
            '10:00 oil sample',
            '13:30 hydraulic test',
            '15:00 supervisor signoff',
          ],
        },
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: 'pro-text-note',
        type: 'text',
        x: 85,
        y: 30,
        width: 520,
        height: 96,
        zIndex: 8,
        color: 'transparent',
        textColor: '#0F172A',
        fontSize: 24,
        text: 'Shared operational context with structured assets, work orders, comments, votes, layers, and exportable evidence.',
        createdAt,
        updatedAt: createdAt,
      },
    ],
  };
}

function cloneProState(state) {
  return JSON.parse(JSON.stringify(state));
}

function createProObject(type, patch = {}) {
  const createdAt = nowIso();
  const base = {
    id: createId(`pro-${type}`),
    type,
    x: 240,
    y: 180,
    width: 180,
    height: 120,
    rotation: 0,
    zIndex: Date.now(),
    color: '#FFFFFF',
    borderColor: '#BFDBFE',
    strokeWidth: 2,
    textColor: '#0F172A',
    fontSize: 16,
    text: '',
    locked: false,
    votes: 0,
    comments: [],
    createdAt,
    updatedAt: createdAt,
    metadata: {},
    ...patch,
  };

  if (type === 'sticky') return { ...base, color: patch.color || '#FEF3C7', text: patch.text || 'New idea', width: 190, height: 140 };
  if (type === 'text') return { ...base, color: 'transparent', text: patch.text || 'Text box', width: 260, height: 90 };
  if (type === 'shape') return { ...base, shape: patch.shape || 'rectangle', text: patch.text || 'Shape', width: 190, height: 120 };
  if (type === 'connector') return { ...base, width: 220, height: 2, text: '', borderColor: patch.borderColor || '#2563EB' };
  if (type === 'frame') return { ...base, color: 'rgba(239, 246, 255, 0.55)', text: patch.text || 'New frame', width: 520, height: 320 };
  if (type === 'comment') return { ...base, color: '#FFF7ED', text: patch.text || 'Comment', width: 170, height: 86 };
  if (type === 'card') {
    return {
      ...base,
      width: 240,
      height: 156,
      text: patch.text || 'Asset work order',
      borderColor: patch.borderColor || '#2563EB',
      status: patch.status || 'Planned',
      owner: patch.owner || 'Unassigned',
      metadata: { asset: 'Asset ID', priority: 'P2', due: 'Today', zone: 'Workshop', ...(patch.metadata || {}) },
    };
  }
  if (type === 'table') {
    return {
      ...base,
      width: 620,
      height: 180,
      text: patch.text || 'Operations table',
      metadata: {
        columns: ['Asset', 'Status', 'Owner', 'Next step'],
        rows: [['Asset ID', 'Planned', 'Owner', 'Action']],
        ...(patch.metadata || {}),
      },
    };
  }
  if (type === 'timeline') {
    return {
      ...base,
      width: 420,
      height: 190,
      text: patch.text || 'Operational timeline',
      borderColor: patch.borderColor || '#14B8A6',
      metadata: { events: ['Inspection', 'Diagnosis', 'Repair', 'Signoff'], ...(patch.metadata || {}) },
    };
  }
  if (type === 'image') return { ...base, width: 260, height: 180 };
  if (type === 'file') return { ...base, width: 240, height: 120 };
  if (type === 'drawing') return { ...base, color: 'transparent', width: 1, height: 1, path: patch.path || [], borderColor: patch.borderColor || '#0F172A' };
  return base;
}

function makeProTemplateObjects(templateKey) {
  const createdAt = nowIso();
  const object = (type, patch) => createProObject(type, { ...patch, createdAt, updatedAt: createdAt });
  const frame = (text, x, y, color = 'rgba(239, 246, 255, 0.55)', width = 360, height = 300) => object('frame', { text, x, y, width, height, color });

  if (templateKey === 'maintenance-control') {
    return [
      frame('Backlog', 100, 110, 'rgba(239, 246, 255, 0.66)', 330, 430),
      frame('Assigned', 470, 110, 'rgba(254, 243, 199, 0.58)', 330, 430),
      frame('In service', 840, 110, 'rgba(220, 252, 231, 0.58)', 330, 430),
      frame('Escalation', 1210, 110, 'rgba(254, 226, 226, 0.58)', 330, 430),
      object('card', { text: 'DZR-17 hydraulic leak', x: 135, y: 205, status: 'New', owner: 'Planner', borderColor: '#2563EB', metadata: { asset: 'DZR-17', priority: 'P1', due: 'Today', zone: 'North yard' } }),
      object('card', { text: 'EXC-04 PM service', x: 505, y: 205, status: 'Assigned', owner: 'Abdelrahman', borderColor: '#F59E0B', metadata: { asset: 'EXC-04', priority: 'P3', due: 'Tomorrow', zone: 'Workshop' } }),
      object('card', { text: 'GEN-02 alternator test', x: 875, y: 205, status: 'In service', owner: 'Faisal', borderColor: '#14B8A6', metadata: { asset: 'GEN-02', priority: 'P2', due: '13:30', zone: 'Plant room' } }),
      object('card', { text: 'CRN-08 blocked by spare part', x: 1245, y: 205, status: 'Escalated', owner: 'Motasem', borderColor: '#EF4444', metadata: { asset: 'CRN-08', priority: 'P1', due: 'Overdue', zone: 'Gate 3' } }),
      object('table', { text: 'Shift governance', x: 135, y: 585, width: 860, metadata: { columns: ['Metric', 'Target', 'Actual', 'Action'], rows: [['Open P1', '0', '2', 'Escalate'], ['First visit resolution', '85%', '79%', 'Review parts'], ['Reports pending', '0', '4', 'Close evidence']] } }),
    ];
  }

  if (templateKey === 'incident-review') {
    return [
      frame('Facts and evidence', 120, 110, 'rgba(239, 246, 255, 0.66)', 520, 360),
      frame('Root cause', 700, 110, 'rgba(254, 243, 199, 0.58)', 430, 360),
      frame('Corrective actions', 1180, 110, 'rgba(220, 252, 231, 0.58)', 430, 360),
      object('timeline', { text: 'Incident timeline', x: 160, y: 205, metadata: { events: ['Alarm received', 'Machine isolated', 'Technician arrived', 'Repair verified'] } }),
      object('sticky', { text: 'Attach photos, oil sample, and supervisor note.', x: 720, y: 220, color: '#FEF3C7' }),
      object('card', { text: 'Prevent repeat failure', x: 1215, y: 210, status: 'Corrective action', owner: 'Reliability', borderColor: '#14B8A6', metadata: { asset: 'Fleet', priority: 'P2', due: 'This week', zone: 'All sites' } }),
    ];
  }

  if (templateKey === 'inspection-route') {
    return [
      frame('Route map', 110, 100, 'rgba(240, 253, 250, 0.66)', 520, 420),
      frame('Inspection checklist', 700, 100, 'rgba(239, 246, 255, 0.66)', 520, 420),
      object('timeline', { text: 'Technician route', x: 155, y: 195, metadata: { events: ['Yard A', 'Workshop bay', 'Generator room', 'Supervisor desk'] } }),
      object('table', { text: 'Checklist capture', x: 745, y: 190, width: 420, metadata: { columns: ['Check', 'Result', 'Evidence'], rows: [['Fluid level', 'OK', 'Photo'], ['Leak', 'Found', 'Video'], ['Safety tag', 'OK', 'Signed']] } }),
    ];
  }

  if (templateKey === 'spares-flow') {
    return [
      frame('Need', 100, 120, 'rgba(254, 243, 199, 0.58)'),
      frame('Approval', 500, 120, 'rgba(239, 246, 255, 0.66)'),
      frame('Supplier', 900, 120, 'rgba(237, 233, 254, 0.58)'),
      frame('Ready for work', 1300, 120, 'rgba(220, 252, 231, 0.58)'),
      object('card', { text: 'Hydraulic filter kit', x: 140, y: 215, status: 'Requested', owner: 'Technician', borderColor: '#F59E0B', metadata: { asset: 'DZR-17', priority: 'P1', due: 'Today', zone: 'Stores' } }),
      object('connector', { x: 350, y: 278, width: 160, borderColor: '#64748B', text: 'approve' }),
      object('sticky', { text: 'Vendor ETA must be visible before dispatch.', x: 940, y: 230, color: '#EDE9FE' }),
    ];
  }

  if (templateKey === 'retro') {
    return [
      frame('Worked well', 120, 120, 'rgba(220, 252, 231, 0.55)'),
      frame('Blocked us', 520, 120, 'rgba(254, 226, 226, 0.55)'),
      frame('Improve next', 920, 120, 'rgba(219, 234, 254, 0.55)'),
      object('sticky', { text: 'Fast EQP review', x: 160, y: 200, color: '#DCFCE7' }),
      object('sticky', { text: 'Manual matching still needs validation', x: 560, y: 200, color: '#FCE7F3' }),
      object('sticky', { text: 'Create clear handover checklist', x: 960, y: 200, color: '#DBEAFE' }),
    ];
  }

  if (templateKey === 'kanban') {
    return [
      frame('Todo', 100, 100),
      frame('In Progress', 500, 100),
      frame('Review', 900, 100),
      frame('Done', 1300, 100),
      object('sticky', { text: 'Inspect oil temperature', x: 145, y: 185, color: '#FEF3C7' }),
      object('sticky', { text: 'Update EQP report flow', x: 545, y: 185, color: '#DBEAFE' }),
      object('sticky', { text: 'Review safety prompts', x: 945, y: 185, color: '#FCE7F3' }),
    ];
  }

  if (templateKey === 'flowchart') {
    return [
      object('shape', { shape: 'rounded', text: 'Task created', x: 120, y: 180, color: '#DBEAFE' }),
      object('connector', { x: 320, y: 240, width: 150, borderColor: '#2563EB' }),
      object('shape', { shape: 'diamond', text: 'Manual match?', x: 490, y: 170, color: '#FEF3C7' }),
      object('connector', { x: 700, y: 240, width: 150, borderColor: '#2563EB' }),
      object('shape', { shape: 'rounded', text: 'Generate suggestion', x: 870, y: 180, color: '#DCFCE7' }),
    ];
  }

  if (templateKey === 'swot') {
    return [
      frame('Strengths', 100, 100, 'rgba(220, 252, 231, 0.55)'),
      frame('Weaknesses', 500, 100, 'rgba(254, 226, 226, 0.55)'),
      frame('Opportunities', 100, 450, 'rgba(219, 234, 254, 0.55)'),
      frame('Threats', 500, 450, 'rgba(254, 243, 199, 0.55)'),
    ];
  }

  if (templateKey === 'decision') {
    return [
      frame('Decision Matrix', 120, 120, 'rgba(237, 233, 254, 0.55)'),
      object('shape', { shape: 'rectangle', text: 'Option', x: 170, y: 220, width: 170, height: 80 }),
      object('shape', { shape: 'rectangle', text: 'Impact', x: 360, y: 220, width: 170, height: 80 }),
      object('shape', { shape: 'rectangle', text: 'Effort', x: 550, y: 220, width: 170, height: 80 }),
      object('sticky', { text: 'Chosen path + owner', x: 760, y: 220, color: '#FEF3C7' }),
    ];
  }

  return [
    frame(templateKey === 'journey' ? 'Journey stages' : templateKey === 'agenda' ? 'Meeting agenda' : 'Brainstorming board', 100, 100),
    object('sticky', { text: 'Capture ideas', x: 150, y: 190, color: '#FEF3C7' }),
    object('sticky', { text: 'Cluster themes', x: 390, y: 190, color: '#DBEAFE' }),
    object('sticky', { text: 'Vote on best actions', x: 630, y: 190, color: '#DCFCE7' }),
    object('comment', { text: 'Add discussion notes here', x: 890, y: 160 }),
  ];
}

function EditableBoardText({ object, onChange }) {
  return (
    <textarea
      value={object.text}
      onChange={(event) => onChange(object.id, { text: event.target.value })}
      onPointerDown={(event) => event.stopPropagation()}
      aria-label={`${object.type} text`}
    />
  );
}

function ProWhiteboardObject({ object, selected, tool, onSelect, onPointerDown, onChange, onVote, onDuplicate, onDelete }) {
  const style = {
    left: object.x,
    top: object.y,
    width: object.width,
    height: object.height,
    zIndex: selected ? 99999 : object.zIndex,
    transform: `rotate(${object.rotation || 0}deg)`,
    '--wb-fill': object.color || '#FFFFFF',
    '--wb-border': object.borderColor || '#BFDBFE',
    '--wb-stroke': `${object.strokeWidth || 2}px`,
    '--wb-text': object.textColor || '#0F172A',
    '--wb-font-size': `${object.fontSize || 16}px`,
  };

  function select(event) {
    event.stopPropagation();
    onSelect(object.id, event.shiftKey);
  }

  const actions = (
    <div className="pro-wb-object-actions">
      <button type="button" onClick={(event) => { event.stopPropagation(); onVote(object.id); }}>+{object.votes || 0}</button>
      <button type="button" onClick={(event) => { event.stopPropagation(); onDuplicate(object.id); }}>D</button>
      <button type="button" onClick={(event) => { event.stopPropagation(); onDelete(object.id); }}>x</button>
    </div>
  );

  if (object.type === 'drawing') {
    const points = object.path || [];
    const pathData = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
    const minX = Math.min(...points.map((point) => point.x), 0);
    const minY = Math.min(...points.map((point) => point.y), 0);
    const maxX = Math.max(...points.map((point) => point.x), 1);
    const maxY = Math.max(...points.map((point) => point.y), 1);
    return (
      <svg
        className={selected ? 'pro-wb-object pro-wb-drawing pro-wb-selected' : 'pro-wb-object pro-wb-drawing'}
        style={{ left: minX, top: minY, width: maxX - minX + 24, height: maxY - minY + 24, zIndex: object.zIndex }}
        viewBox={`${minX - 12} ${minY - 12} ${maxX - minX + 24} ${maxY - minY + 24}`}
        onClick={select}
      >
        <path d={pathData} fill="none" stroke={object.borderColor || '#0F172A'} strokeWidth={object.strokeWidth || 3} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <div
      className={`pro-wb-object pro-wb-${object.type} ${object.shape ? `pro-wb-shape-${object.shape}` : ''} ${selected ? 'pro-wb-selected' : ''} ${object.locked ? 'pro-wb-locked' : ''}`}
      style={style}
      onPointerDown={(event) => onPointerDown(event, object)}
      onClick={select}
      role="button"
      tabIndex={0}
    >
      {!object.locked && actions}
      {object.type === 'connector' && <span className="pro-wb-arrow-head" aria-hidden="true" />}
      {object.type === 'image' && object.src && (
        // User uploads are local data URLs here, so Next image optimization does not add value.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={object.src} alt={object.fileName || 'Uploaded board asset'} />
      )}
      {object.type === 'file' && <strong>{object.fileName || 'Uploaded file'}</strong>}
      {object.type === 'card' && (
        <div className="pro-wb-card-body">
          <div className="pro-wb-card-title">
            <EditableBoardText object={object} onChange={onChange} />
          </div>
          <div className="pro-wb-card-meta-grid">
            <span>{object.status || 'Planned'}</span>
            <span>{object.metadata?.priority || 'P2'}</span>
            <span>{object.owner || 'Unassigned'}</span>
            <span>{object.metadata?.due || 'No due date'}</span>
          </div>
          <div className="pro-wb-card-asset">{object.metadata?.asset || 'Asset ID'} / {object.metadata?.zone || 'Zone'}</div>
        </div>
      )}
      {object.type === 'table' && (
        <div className="pro-wb-table-body">
          <strong>{object.text}</strong>
          <div className="pro-wb-table-grid" style={{ '--wb-table-cols': object.metadata?.columns?.length || 4 }}>
            {(object.metadata?.columns || []).map((column) => <span key={column} className="pro-wb-table-head">{column}</span>)}
            {(object.metadata?.rows || []).flatMap((row, rowIndex) => (
              row.map((cell, cellIndex) => <span key={`${rowIndex}-${cellIndex}`}>{cell}</span>)
            ))}
          </div>
        </div>
      )}
      {object.type === 'timeline' && (
        <div className="pro-wb-timeline-body">
          <strong>{object.text}</strong>
          <div>
            {(object.metadata?.events || []).map((entry, index) => (
              <span key={`${entry}-${index}`}>{entry}</span>
            ))}
          </div>
        </div>
      )}
      {!['image', 'file', 'connector', 'card', 'table', 'timeline'].includes(object.type) && (
        <EditableBoardText object={object} onChange={onChange} />
      )}
      {object.type === 'connector' && <span className="pro-wb-line-label">{object.text}</span>}
      {(object.comments?.length || object.votes) ? (
        <div className="pro-wb-meta">
          {object.comments?.length ? <span>{object.comments.length} comments</span> : null}
          {object.votes ? <span>{object.votes} votes</span> : null}
        </div>
      ) : null}
    </div>
  );
}

function ProWhiteboardToolbar({
  tool,
  setTool,
  onAdd,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onTemplate,
  onExport,
  onImportClick,
  onImageClick,
  grid,
  snap,
  onToggleGrid,
  onToggleSnap,
  onFit,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}) {
  const tools = [
    ['select', 'Select'],
    ['pan', 'Pan'],
    ['sticky', 'Sticky'],
    ['card', 'Card'],
    ['table', 'Table'],
    ['timeline', 'Timeline'],
    ['text', 'Text'],
    ['shape', 'Shape'],
    ['connector', 'Arrow'],
    ['pen', 'Pen'],
    ['comment', 'Comment'],
    ['frame', 'Frame'],
  ];

  return (
    <div className="pro-wb-toolbar" aria-label="Advanced whiteboard toolbar">
      <div className="pro-wb-tool-group">
        {tools.map(([key, label]) => (
          <button key={key} type="button" className={tool === key ? 'pro-wb-tool-active' : ''} onClick={() => setTool(key)}>{label}</button>
        ))}
      </div>
      <div className="pro-wb-tool-group">
        <button type="button" onClick={() => onAdd('card')}>Asset card</button>
        <button type="button" onClick={() => onAdd('table')}>Table</button>
        <button type="button" onClick={() => onAdd('timeline')}>Timeline</button>
        <button type="button" onClick={() => onAdd('shape', { shape: 'circle', text: 'Circle' })}>Circle</button>
        <button type="button" onClick={() => onAdd('shape', { shape: 'diamond', text: 'Decision' })}>Diamond</button>
        <button type="button" onClick={onImageClick}>Upload</button>
      </div>
      <div className="pro-wb-tool-group">
        <button type="button" onClick={onUndo} disabled={!canUndo}>Undo</button>
        <button type="button" onClick={onRedo} disabled={!canRedo}>Redo</button>
        <button type="button" onClick={onTemplate}>Templates</button>
        <button type="button" onClick={onExport}>Export JSON</button>
        <button type="button" onClick={onImportClick}>Import</button>
      </div>
      <div className="pro-wb-tool-group">
        <button type="button" className={grid ? 'pro-wb-tool-active' : ''} onClick={onToggleGrid}>Grid</button>
        <button type="button" className={snap ? 'pro-wb-tool-active' : ''} onClick={onToggleSnap}>Snap</button>
        <button type="button" onClick={onFit}>Fit</button>
      </div>
      <div className="pro-wb-tool-group pro-wb-zoom">
        <button type="button" onClick={onZoomOut}>-</button>
        <button type="button" onClick={onResetZoom}>{Math.round(zoom * 100)}%</button>
        <button type="button" onClick={onZoomIn}>+</button>
      </div>
    </div>
  );
}

function boardStats(objects) {
  const cards = objects.filter((object) => object.type === 'card');
  const comments = objects.reduce((total, object) => total + (object.comments?.length || 0), 0);
  const votes = objects.reduce((total, object) => total + (object.votes || 0), 0);
  const riskCards = cards.filter((object) => /risk|overdue|escal/i.test(`${object.status || ''} ${object.metadata?.due || ''}`)).length;
  return { cards: cards.length, comments, votes, riskCards };
}

function colorInputValue(value, fallback = '#ffffff') {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function ProWhiteboardProperties({ object, objects, selectedIds, onChange, onDuplicate, onDelete, onLayer, onAddComment, onSelect }) {
  const [comment, setComment] = useState('');

  if (!object) {
    const stats = boardStats(objects);
    const layers = [...objects].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0)).slice(0, 12);
    const activity = [...objects]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
      .slice(0, 6);

    return (
      <aside className="pro-wb-properties">
        <div className="pro-wb-prop-head">
          <div>
            <h3>Operations board</h3>
            <span>{objects.length} objects / {selectedIds.length} selected</span>
          </div>
          <Badge tone={stats.riskCards ? 'warning' : 'success'}>{stats.riskCards ? `${stats.riskCards} risks` : 'Stable'}</Badge>
        </div>
        <div className="pro-wb-board-stats">
          <span><strong>{stats.cards}</strong> cards</span>
          <span><strong>{stats.comments}</strong> comments</span>
          <span><strong>{stats.votes}</strong> votes</span>
          <span><strong>{objects.filter((entry) => entry.type === 'frame').length}</strong> frames</span>
        </div>
        <div className="pro-wb-panel-section">
          <h4>Layers</h4>
          <div className="pro-wb-layer-list">
            {layers.map((entry) => (
              <button key={entry.id} type="button" onClick={() => onSelect(entry.id)}>
                <span>{entry.type}</span>
                <strong>{entry.text || entry.fileName || entry.id}</strong>
              </button>
            ))}
          </div>
        </div>
        <div className="pro-wb-panel-section">
          <h4>Recent activity</h4>
          <div className="pro-wb-activity-list">
            {activity.map((entry) => (
              <span key={`${entry.id}-${entry.updatedAt}`}>
                {entry.type} updated / {entry.text || entry.fileName || 'Untitled'}
              </span>
            ))}
          </div>
        </div>
        <div className="pro-wb-hint-list">
          <span>Wheel or trackpad: zoom around cursor</span>
          <span>Drag empty space: pan the board</span>
          <span>Shift-click: multi-select layers</span>
          <span>Delete, Ctrl+C/V/D, Ctrl+Z/Y supported</span>
        </div>
      </aside>
    );
  }

  function submitComment(event) {
    event.preventDefault();
    if (!comment.trim()) return;
    onAddComment(object.id, comment.trim());
    setComment('');
  }

  return (
    <aside className="pro-wb-properties">
      <div className="pro-wb-prop-head">
        <div>
          <h3>Properties</h3>
          <span>{object.type}</span>
        </div>
        <Badge tone={object.locked ? 'warning' : 'info'}>{object.locked ? 'Locked' : 'Editable'}</Badge>
      </div>
      <Field label="Fill">
        <input type="color" value={colorInputValue(object.color)} onChange={(event) => onChange(object.id, { color: event.target.value })} />
      </Field>
      <Field label="Border">
        <input type="color" value={colorInputValue(object.borderColor, '#2563EB')} onChange={(event) => onChange(object.id, { borderColor: event.target.value })} />
      </Field>
      <Field label="Text color">
        <input type="color" value={colorInputValue(object.textColor, '#0F172A')} onChange={(event) => onChange(object.id, { textColor: event.target.value })} />
      </Field>
      <div className="pro-wb-prop-grid">
        <Field label="X"><input type="number" value={Math.round(object.x)} onChange={(event) => onChange(object.id, { x: Number(event.target.value) || 0 })} /></Field>
        <Field label="Y"><input type="number" value={Math.round(object.y)} onChange={(event) => onChange(object.id, { y: Number(event.target.value) || 0 })} /></Field>
        <Field label="W"><input type="number" value={Math.round(object.width)} onChange={(event) => onChange(object.id, { width: Math.max(20, Number(event.target.value) || 20) })} /></Field>
        <Field label="H"><input type="number" value={Math.round(object.height)} onChange={(event) => onChange(object.id, { height: Math.max(20, Number(event.target.value) || 20) })} /></Field>
      </div>
      <div className="pro-wb-prop-grid">
        <Field label="Font"><input type="number" value={object.fontSize || 16} onChange={(event) => onChange(object.id, { fontSize: Math.max(10, Number(event.target.value) || 16) })} /></Field>
        <Field label="Stroke"><input type="number" value={object.strokeWidth || 2} onChange={(event) => onChange(object.id, { strokeWidth: Math.max(1, Number(event.target.value) || 2) })} /></Field>
      </div>
      {object.type === 'card' && (
        <>
          <Field label="Status">
            <input value={object.status || ''} onChange={(event) => onChange(object.id, { status: event.target.value })} />
          </Field>
          <Field label="Owner">
            <input value={object.owner || ''} onChange={(event) => onChange(object.id, { owner: event.target.value })} />
          </Field>
          <div className="pro-wb-prop-grid">
            <Field label="Asset"><input value={object.metadata?.asset || ''} onChange={(event) => onChange(object.id, { metadata: { ...(object.metadata || {}), asset: event.target.value } })} /></Field>
            <Field label="Priority"><input value={object.metadata?.priority || ''} onChange={(event) => onChange(object.id, { metadata: { ...(object.metadata || {}), priority: event.target.value } })} /></Field>
            <Field label="Due"><input value={object.metadata?.due || ''} onChange={(event) => onChange(object.id, { metadata: { ...(object.metadata || {}), due: event.target.value } })} /></Field>
            <Field label="Zone"><input value={object.metadata?.zone || ''} onChange={(event) => onChange(object.id, { metadata: { ...(object.metadata || {}), zone: event.target.value } })} /></Field>
          </div>
        </>
      )}
      {object.type === 'sticky' && (
        <div className="pro-wb-swatches">
          {proColors.map((color) => (
            <button key={color} type="button" style={{ background: color }} onClick={() => onChange(object.id, { color })} aria-label={`Set color ${color}`} />
          ))}
        </div>
      )}
      <div className="pro-wb-panel-actions">
        <Button type="button" variant="secondary" size="sm" onClick={() => onDuplicate(object.id)}>Duplicate</Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => onLayer(object.id, 1)}>Forward</Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => onLayer(object.id, -1)}>Backward</Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => onChange(object.id, { locked: !object.locked })}>{object.locked ? 'Unlock' : 'Lock'}</Button>
        <Button type="button" variant="danger" size="sm" onClick={() => onDelete(object.id)}>Delete</Button>
      </div>
      <form className="pro-wb-comment-form" onSubmit={submitComment}>
        <Field label="Comment">
          <input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add a comment" />
        </Field>
        <Button type="submit" size="sm">Add comment</Button>
      </form>
      <div className="pro-wb-comments">
        {(object.comments || []).map((entry) => <span key={entry.id}>{entry.text}</span>)}
      </div>
    </aside>
  );
}

function ProWhiteboardTemplates({ onInsert, onClose }) {
  return (
    <div className="pro-wb-template-popover">
      <div>
        <strong>Insert template</strong>
        <button type="button" onClick={onClose} aria-label="Close templates">x</button>
      </div>
      {proWhiteboardTemplates.map((template) => (
        <button key={template.key} type="button" onClick={() => onInsert(template.key)}>
          <strong>{template.title}</strong>
          <span>{template.description}</span>
        </button>
      ))}
    </div>
  );
}

function ProWhiteboardTimer({ timer, onChange }) {
  const minutes = String(Math.floor(timer.seconds / 60)).padStart(2, '0');
  const seconds = String(timer.seconds % 60).padStart(2, '0');

  return (
    <div className="pro-wb-timer">
      <strong>{minutes}:{seconds}</strong>
      <button type="button" onClick={() => onChange({ ...timer, running: !timer.running })}>{timer.running ? 'Pause' : 'Start'}</button>
      <button type="button" onClick={() => onChange({ seconds: 600, running: false })}>Reset</button>
    </div>
  );
}

function AdvancedWhiteboard({ onClose, onToast }) {
  const canvasRef = useRef(null);
  const fileRef = useRef(null);
  const importRef = useRef(null);
  const dragRef = useRef(null);
  const panRef = useRef(null);
  const drawingRef = useRef(null);
  const [state, setState] = useState(() => defaultProWhiteboardState());
  const [selectedIds, setSelectedIds] = useState([]);
  const [tool, setTool] = useState('select');
  const [templateOpen, setTemplateOpen] = useState(false);
  const [history, setHistory] = useState({ past: [], future: [] });
  const selectedObject = state.objects.find((object) => object.id === selectedIds[0]) || null;

  useEffect(() => {
    const timer = setTimeout(() => setState(loadStoredItems(PRO_WHITEBOARD_KEY, defaultProWhiteboardState)), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => saveStoredItems(PRO_WHITEBOARD_KEY, state), 250);
    return () => clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    if (!state.timer.running) return undefined;
    const timer = setInterval(() => {
      setState((current) => ({
        ...current,
        timer: {
          ...current.timer,
          seconds: Math.max(0, current.timer.seconds - 1),
          running: current.timer.seconds > 1,
        },
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, [state.timer.running]);

  function pushHistory(previousState) {
    setHistory((current) => ({
      past: [...current.past.slice(-29), cloneProState(previousState)],
      future: [],
    }));
  }

  function commit(updater) {
    setState((current) => {
      const nextState = typeof updater === 'function' ? updater(cloneProState(current)) : updater;
      pushHistory(current);
      return nextState;
    });
  }

  function updateObject(id, patch) {
    commit((current) => ({
      ...current,
      objects: current.objects.map((object) => (
        object.id === id ? { ...object, ...patch, updatedAt: nowIso() } : object
      )),
    }));
  }

  function addObject(type, patch = {}) {
    const object = createProObject(type, patch);
    commit((current) => ({
      ...current,
      objects: [...current.objects, object],
    }));
    setSelectedIds([object.id]);
    return object;
  }

  function deleteObject(id) {
    commit((current) => ({
      ...current,
      objects: current.objects.filter((object) => object.id !== id),
    }));
    setSelectedIds((current) => current.filter((selectedId) => selectedId !== id));
  }

  function duplicateObject(id) {
    const object = state.objects.find((entry) => entry.id === id);
    if (!object) return;
    const copy = {
      ...cloneProState(object),
      id: createId(`pro-${object.type}`),
      x: object.x + 32,
      y: object.y + 32,
      zIndex: Date.now(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    commit((current) => ({ ...current, objects: [...current.objects, copy] }));
    setSelectedIds([copy.id]);
  }

  function undo() {
    setHistory((current) => {
      if (!current.past.length) return current;
      const previous = current.past[current.past.length - 1];
      setState(previous);
      return {
        past: current.past.slice(0, -1),
        future: [cloneProState(state), ...current.future],
      };
    });
  }

  function redo() {
    setHistory((current) => {
      if (!current.future.length) return current;
      const next = current.future[0];
      setState(next);
      return {
        past: [...current.past, cloneProState(state)],
        future: current.future.slice(1),
      };
    });
  }

  function screenToWorld(event) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (event.clientX - rect.left - state.viewport.pan.x) / state.viewport.zoom,
      y: (event.clientY - rect.top - state.viewport.pan.y) / state.viewport.zoom,
    };
  }

  function setViewport(patch) {
    setState((current) => ({ ...current, viewport: { ...current.viewport, ...patch } }));
  }

  function handleCanvasPointerDown(event) {
    if (event.target.closest('.pro-wb-object, button, input, textarea, select')) return;
    const world = screenToWorld(event);

    if (tool === 'sticky') {
      addObject('sticky', { x: world.x, y: world.y });
      setTool('select');
      return;
    }
    if (tool === 'card') {
      addObject('card', { x: world.x, y: world.y });
      setTool('select');
      return;
    }
    if (tool === 'table') {
      addObject('table', { x: world.x, y: world.y });
      setTool('select');
      return;
    }
    if (tool === 'timeline') {
      addObject('timeline', { x: world.x, y: world.y });
      setTool('select');
      return;
    }
    if (tool === 'text') {
      addObject('text', { x: world.x, y: world.y });
      setTool('select');
      return;
    }
    if (tool === 'shape') {
      addObject('shape', { x: world.x, y: world.y });
      setTool('select');
      return;
    }
    if (tool === 'connector') {
      addObject('connector', { x: world.x, y: world.y });
      setTool('select');
      return;
    }
    if (tool === 'comment') {
      addObject('comment', { x: world.x, y: world.y });
      setTool('select');
      return;
    }
    if (tool === 'frame') {
      addObject('frame', { x: world.x, y: world.y });
      setTool('select');
      return;
    }
    if (tool === 'pen') {
      const object = createProObject('drawing', { path: [world], borderColor: '#0F172A', strokeWidth: 3 });
      drawingRef.current = object.id;
      commit((current) => ({ ...current, objects: [...current.objects, object] }));
      return;
    }

    setSelectedIds([]);
    event.currentTarget.setPointerCapture(event.pointerId);
    panRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: state.viewport.pan.x,
      originY: state.viewport.pan.y,
    };
  }

  function handleObjectPointerDown(event, object) {
    if (object.locked || tool !== 'select') return;
    if (event.target.closest('textarea, input, select, button')) return;
    const world = screenToWorld(event);
    event.currentTarget.setPointerCapture(event.pointerId);
    const activeIds = selectedIds.includes(object.id) ? selectedIds : [object.id];
    setSelectedIds(activeIds);
    dragRef.current = {
      ids: activeIds,
      start: world,
      origins: state.objects
        .filter((entry) => activeIds.includes(entry.id))
        .map((entry) => ({ id: entry.id, x: entry.x, y: entry.y })),
    };
  }

  function handlePointerMove(event) {
    if (drawingRef.current) {
      const point = screenToWorld(event);
      setState((current) => ({
        ...current,
        objects: current.objects.map((object) => (
          object.id === drawingRef.current
            ? { ...object, path: [...(object.path || []), point], updatedAt: nowIso() }
            : object
        )),
      }));
      return;
    }

    if (dragRef.current) {
      const world = screenToWorld(event);
      const dx = world.x - dragRef.current.start.x;
      const dy = world.y - dragRef.current.start.y;
      const snapSize = state.settings.snap ? 24 : 1;
      setState((current) => ({
        ...current,
        objects: current.objects.map((object) => {
          const origin = dragRef.current.origins.find((entry) => entry.id === object.id);
          if (!origin) return object;
          return {
            ...object,
            x: Math.round((origin.x + dx) / snapSize) * snapSize,
            y: Math.round((origin.y + dy) / snapSize) * snapSize,
            updatedAt: nowIso(),
          };
        }),
      }));
      return;
    }

    if (panRef.current) {
      setViewport({
        pan: {
          x: event.clientX - panRef.current.startX + panRef.current.originX,
          y: event.clientY - panRef.current.startY + panRef.current.originY,
        },
      });
    }
  }

  function handlePointerUp() {
    dragRef.current = null;
    panRef.current = null;
    drawingRef.current = null;
  }

  function zoomAtPoint(nextZoom, event) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) {
      setViewport({ zoom: nextZoom });
      return;
    }
    const pointX = event.clientX - rect.left;
    const pointY = event.clientY - rect.top;
    const worldX = (pointX - state.viewport.pan.x) / state.viewport.zoom;
    const worldY = (pointY - state.viewport.pan.y) / state.viewport.zoom;
    setViewport({
      zoom: nextZoom,
      pan: {
        x: pointX - worldX * nextZoom,
        y: pointY - worldY * nextZoom,
      },
    });
  }

  function handleWheel(event) {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    const nextZoom = Math.max(0.2, Math.min(2.5, Math.round((state.viewport.zoom + direction * 0.08) * 100) / 100));
    zoomAtPoint(nextZoom, event);
  }

  function insertTemplate(templateKey) {
    const nextObjects = makeProTemplateObjects(templateKey);
    commit((current) => ({ ...current, objects: [...current.objects, ...nextObjects] }));
    setSelectedIds(nextObjects[0] ? [nextObjects[0].id] : []);
    setTemplateOpen(false);
    onToast('Whiteboard template inserted.');
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dar-al-hai-whiteboard.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  function importJson(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result));
        if (!Array.isArray(imported.objects)) throw new Error('Invalid whiteboard file');
        if (!window.confirm('Import this backup and append its objects to the current whiteboard?')) return;
        commit((current) => ({
          ...current,
          objects: [...current.objects, ...imported.objects.map((object) => ({ ...object, id: createId(`pro-${object.type || 'object'}`) }))],
        }));
        onToast('Whiteboard backup imported.');
      } catch {
        onToast('Could not import that whiteboard file.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  function uploadImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const isImage = file.type.startsWith('image/');
      addObject(isImage ? 'image' : 'file', {
        src: isImage ? String(reader.result) : '',
        fileName: file.name,
        text: file.name,
      });
      onToast(isImage ? 'Image added to whiteboard.' : 'File card added to whiteboard.');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  function fitToContent() {
    if (!state.objects.length) {
      setViewport({ zoom: 1, pan: { x: 0, y: 0 } });
      return;
    }
    const minX = Math.min(...state.objects.map((object) => object.x));
    const minY = Math.min(...state.objects.map((object) => object.y));
    setViewport({ zoom: 0.9, pan: { x: 80 - minX * 0.9, y: 80 - minY * 0.9 } });
  }

  function addComment(id, text) {
    updateObject(id, {
      comments: [...(state.objects.find((object) => object.id === id)?.comments || []), { id: createId('comment'), text, createdAt: nowIso() }],
    });
  }

  useEffect(() => {
    function handleKey(event) {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (['input', 'textarea', 'select'].includes(activeTag || '')) return;
      const modifier = event.ctrlKey || event.metaKey;
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedIds.length) {
        event.preventDefault();
        commit((current) => ({ ...current, objects: current.objects.filter((object) => !selectedIds.includes(object.id)) }));
        setSelectedIds([]);
      }
      if (modifier && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        undo();
      }
      if (modifier && ['y', 'd'].includes(event.key.toLowerCase())) {
        event.preventDefault();
        if (event.key.toLowerCase() === 'y') redo();
        if (event.key.toLowerCase() === 'd' && selectedIds[0]) duplicateObject(selectedIds[0]);
      }
      if (modifier && event.key.toLowerCase() === 'c' && selectedIds[0]) {
        window.localStorage.setItem('dar-al-hai-pro-whiteboard-clipboard', JSON.stringify(state.objects.filter((object) => selectedIds.includes(object.id))));
      }
      if (modifier && event.key.toLowerCase() === 'v') {
        const copied = JSON.parse(window.localStorage.getItem('dar-al-hai-pro-whiteboard-clipboard') || '[]');
        if (copied.length) {
          const pasted = copied.map((object) => ({ ...object, id: createId(`pro-${object.type}`), x: object.x + 40, y: object.y + 40, zIndex: Date.now() }));
          commit((current) => ({ ...current, objects: [...current.objects, ...pasted] }));
          setSelectedIds(pasted.map((object) => object.id));
        }
      }
      if (event.key === 'Escape') setSelectedIds([]);
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // Keyboard shortcuts intentionally read the latest selected IDs and board state in this component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, state]);

  return (
    <section className="pro-wb-overlay" aria-label="Advanced whiteboard">
      <header className="pro-wb-header">
        <div>
          <p>Engineering Workspace</p>
          <h2>Pro Whiteboard</h2>
          <span>Infinite canvas for workshops, mapping, diagrams, comments, votes, and planning.</span>
        </div>
        <div className="pro-wb-header-actions">
          <ProWhiteboardTimer timer={state.timer} onChange={(timer) => setState((current) => ({ ...current, timer }))} />
          <Button type="button" variant="secondary" onClick={onClose}>Back to idea board</Button>
        </div>
      </header>

      <ProWhiteboardToolbar
        tool={tool}
        setTool={setTool}
        onAdd={addObject}
        onUndo={undo}
        onRedo={redo}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        onTemplate={() => setTemplateOpen((current) => !current)}
        onExport={exportJson}
        onImportClick={() => importRef.current?.click()}
        onImageClick={() => fileRef.current?.click()}
        grid={state.settings.grid}
        snap={state.settings.snap}
        onToggleGrid={() => setState((current) => ({ ...current, settings: { ...current.settings, grid: !current.settings.grid } }))}
        onToggleSnap={() => setState((current) => ({ ...current, settings: { ...current.settings, snap: !current.settings.snap } }))}
        onFit={fitToContent}
        zoom={state.viewport.zoom}
        onZoomIn={() => setViewport({ zoom: Math.min(2.5, state.viewport.zoom + 0.1) })}
        onZoomOut={() => setViewport({ zoom: Math.max(0.2, state.viewport.zoom - 0.1) })}
        onResetZoom={() => setViewport({ zoom: 1, pan: { x: 0, y: 0 } })}
      />
      {templateOpen && <ProWhiteboardTemplates onInsert={insertTemplate} onClose={() => setTemplateOpen(false)} />}
      <input ref={fileRef} type="file" className="pro-wb-hidden-input" accept="image/*,.pdf,.doc,.docx" onChange={uploadImage} />
      <input ref={importRef} type="file" className="pro-wb-hidden-input" accept="application/json,.json" onChange={importJson} />

      <div className="pro-wb-layout">
        <div
          ref={canvasRef}
          className={state.settings.grid ? 'pro-wb-canvas pro-wb-canvas-grid' : 'pro-wb-canvas'}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onWheel={handleWheel}
          onDoubleClick={(event) => {
            const world = screenToWorld(event);
            addObject('sticky', { x: world.x, y: world.y });
          }}
        >
          <div
            className="pro-wb-stage"
            style={{
              transform: `matrix(${state.viewport.zoom}, 0, 0, ${state.viewport.zoom}, ${state.viewport.pan.x}, ${state.viewport.pan.y})`,
            }}
          >
            {state.objects.map((object) => (
              <ProWhiteboardObject
                key={object.id}
                object={object}
                tool={tool}
                selected={selectedIds.includes(object.id)}
                onSelect={(id, additive) => setSelectedIds((current) => (additive ? Array.from(new Set([...current, id])) : [id]))}
                onPointerDown={handleObjectPointerDown}
                onChange={updateObject}
                onVote={(id) => updateObject(id, { votes: (state.objects.find((entry) => entry.id === id)?.votes || 0) + 1 })}
                onDuplicate={duplicateObject}
                onDelete={deleteObject}
              />
            ))}
          </div>
          <div className="pro-wb-minimap" aria-hidden="true">
            {state.objects.slice(0, 60).map((object) => (
              <span
                key={object.id}
                style={{
                  left: `${Math.max(4, Math.min(94, object.x / 22))}%`,
                  top: `${Math.max(4, Math.min(88, object.y / 18))}%`,
                  width: `${Math.max(4, object.width / 60)}%`,
                }}
              />
            ))}
          </div>
        </div>
        <ProWhiteboardProperties
          object={selectedObject}
          objects={state.objects}
          selectedIds={selectedIds}
          onChange={updateObject}
          onDuplicate={duplicateObject}
          onDelete={deleteObject}
          onLayer={(id, direction) => updateObject(id, { zIndex: (state.objects.find((object) => object.id === id)?.zIndex || 1) + direction * 1000 })}
          onAddComment={addComment}
          onSelect={(id) => setSelectedIds([id])}
        />
      </div>
    </section>
  );
}

function CanvasCreativeArea({ onToast }) {
  const canvasRef = useRef(null);
  const boardRef = useRef(null);
  const dragRef = useRef(null);
  const panRef = useRef(null);
  const [items, setItems] = useState(() => defaultBoardItems());
  const [selectedId, setSelectedId] = useState('');
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [proWhiteboardOpen, setProWhiteboardOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const selectedItem = items.find((item) => item.id === selectedId) || null;
  const canvasHeight = useMemo(() => {
    const bottomEdge = items.reduce((max, item) => Math.max(max, (item.y || 0) + (item.height || 0)), 0);
    return Math.max(820, bottomEdge + 220);
  }, [items]);
  const canvasVisualHeight = Math.max(820, Math.ceil(canvasHeight * zoom + Math.max(0, pan.y) + 180));

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
      offsetX: (event.clientX - canvasRect.left - pan.x) / zoom - item.x,
      offsetY: (event.clientY - canvasRect.top - pan.y) / zoom - item.y,
    };
    setSelectedId(item.id);
  }

  function handlePointerMove(event) {
    if (!canvasRef.current) return;
    if (panRef.current) {
      const nextPan = {
        x: event.clientX - panRef.current.startX + panRef.current.originX,
        y: event.clientY - panRef.current.startY + panRef.current.originY,
      };
      setPan(nextPan);
      return;
    }

    if (!dragRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.round((event.clientX - canvasRect.left - pan.x) / zoom - dragRef.current.offsetX));
    const y = Math.max(0, Math.round((event.clientY - canvasRect.top - pan.y) / zoom - dragRef.current.offsetY));
    updateItem(dragRef.current.id, { x, y });
  }

  function handlePointerUp() {
    dragRef.current = null;
    panRef.current = null;
    setIsPanning(false);
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

  function zoomIn() {
    setZoom((current) => Math.min(1.8, Math.round((current + 0.1) * 10) / 10));
  }

  function zoomOut() {
    setZoom((current) => Math.max(0.5, Math.round((current - 0.1) * 10) / 10));
  }

  function resetZoom() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function handleCanvasPointerDown(event) {
    if (event.target.closest('.eng-canvas-item, input, textarea, select, button')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    panRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: pan.x,
      originY: pan.y,
    };
    setIsPanning(true);
    setSelectedId('');
  }

  function zoomAtPoint(nextZoom, event) {
    if (!canvasRef.current) {
      setZoom(nextZoom);
      return;
    }
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const pointX = event.clientX - canvasRect.left;
    const pointY = event.clientY - canvasRect.top;
    const worldX = (pointX - pan.x) / zoom;
    const worldY = (pointY - pan.y) / zoom;
    setZoom(nextZoom);
    setPan({
      x: pointX - worldX * nextZoom,
      y: pointY - worldY * nextZoom,
    });
  }

  function handleCanvasWheel(event) {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    const nextZoom = Math.max(0.5, Math.min(1.8, Math.round((zoom + direction * 0.08) * 100) / 100));
    zoomAtPoint(nextZoom, event);
  }

  return (
    <div ref={boardRef} className={isFullscreen ? 'eng-creative-space eng-board-fullscreen' : 'eng-creative-space'}>
      {proWhiteboardOpen && (
        <AdvancedWhiteboard
          onClose={() => setProWhiteboardOpen(false)}
          onToast={onToast}
        />
      )}
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
            title={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
          >
            <FullscreenIcon active={isFullscreen} />
            <span>{isFullscreen ? 'Exit' : 'Full screen'}</span>
          </button>
          <div className="eng-board-zoom-floating" aria-label="Whiteboard zoom controls">
            <button type="button" onClick={zoomOut} aria-label="Zoom out">-</button>
            <button type="button" onClick={resetZoom} aria-label="Reset zoom">{Math.round(zoom * 100)}%</button>
            <button type="button" onClick={zoomIn} aria-label="Zoom in">+</button>
          </div>
          <CanvasToolbar
            onOpenTemplates={() => setTemplatesOpen(true)}
            onAddSticky={() => addItem('sticky')}
            onAddWireframe={() => addItem('wireframe')}
            onAddFrame={() => addItem('frame')}
            onAddText={() => addItem('text')}
            onClear={clearCanvas}
            onSave={saveBoard}
            onResetView={resetView}
            onOpenProWhiteboard={() => setProWhiteboardOpen(true)}
          />
          <div
            ref={canvasRef}
            className={isPanning ? 'eng-canvas eng-canvas-panning' : 'eng-canvas'}
            style={{ minHeight: canvasVisualHeight }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerDown={handleCanvasPointerDown}
            onWheel={handleCanvasWheel}
            onClick={() => setSelectedId('')}
          >
            <div
              className="eng-canvas-stage"
              style={{
                minHeight: canvasHeight,
                width: `${Math.max(100 / zoom, 100)}%`,
                transform: `matrix(${zoom}, 0, 0, ${zoom}, ${pan.x}, ${pan.y})`,
              }}
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

function CreativeArea({ onToast }) {
  return (
    <div className="eng-doc-workspace eng-idea-only-workspace">
      <div className="eng-doc-board-view">
        <CanvasCreativeArea onToast={onToast} />
      </div>
    </div>
  );
}
function PlannerSummary({ tasks, weekStats, monthStats }) {
  const completed = tasks.filter((task) => task.completed).length;
  const total = tasks.length;
  const dayDuration = totalDurationMinutes(tasks);

  return (
    <div className="eng-simple-summary-grid">
      <Card className="eng-simple-summary">
        <div>
          <span>Selected day</span>
          <strong>{completed}/{total} done</strong>
        </div>
        <Badge tone={completed === total && total > 0 ? 'completed' : 'info'}>{total} tasks</Badge>
      </Card>
      <Card className="eng-simple-summary">
        <div>
          <span>Expected duration</span>
          <strong>{formatDuration(dayDuration)}</strong>
        </div>
        <Badge tone={dayDuration > 0 ? 'ready' : 'neutral'}>{dayDuration} min</Badge>
      </Card>
      <Card className="eng-simple-summary">
        <div>
          <span>Weekly KPI</span>
          <strong>{weekStats.percent}%</strong>
        </div>
        <Badge tone={weekStats.percent >= 80 ? 'completed' : 'warning'}>{weekStats.completed}/{weekStats.total}</Badge>
      </Card>
      <Card className="eng-simple-summary">
        <div>
          <span>Monthly KPI</span>
          <strong>{monthStats.percent}%</strong>
        </div>
        <Badge tone={monthStats.percent >= 80 ? 'completed' : 'info'}>{monthStats.completed}/{monthStats.total}</Badge>
      </Card>
    </div>
  );
}

function SimpleTaskForm({ title, setTitle, dueTime, setDueTime, expectedDuration, setExpectedDuration, onSubmit }) {
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
        <Field label="Expected duration">
          <input
            type="number"
            min="0"
            step="5"
            value={expectedDuration}
            onChange={(event) => setExpectedDuration(event.target.value)}
            placeholder="Minutes"
          />
        </Field>
        <Button type="submit">Add</Button>
      </form>
    </Card>
  );
}

function SimpleTaskRow({ task, onStatusChange, onDelete }) {
  return (
    <article className={task.completed ? 'eng-simple-task eng-simple-task-done' : 'eng-simple-task'}>
      <time>{task.dueTime || '--:--'}</time>
      <span>{task.title}</span>
      <span className="eng-simple-duration">{formatDuration(taskDurationMinutes(task))}</span>
      <div className="eng-simple-status" aria-label={`Completion status for ${task.title}`}>
        <button
          type="button"
          className={task.completed ? 'eng-simple-status-button eng-simple-status-done eng-simple-status-active' : 'eng-simple-status-button'}
          onClick={() => onStatusChange(task.id, true)}
        >
          Done
        </button>
        <button
          type="button"
          className={!task.completed ? 'eng-simple-status-button eng-simple-status-missed eng-simple-status-active' : 'eng-simple-status-button'}
          onClick={() => onStatusChange(task.id, false)}
        >
          Not done
        </button>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(task.id)}>Delete</Button>
    </article>
  );
}

function ManagerPlannerPush({ engineers, busy, onPush }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [suggestedDate, setSuggestedDate] = useState(() => formatDateKey(new Date()));
  const [suggestedTime, setSuggestedTime] = useState('');
  const [expectedDuration, setExpectedDuration] = useState('30');
  const [assigneeIds, setAssigneeIds] = useState([]);

  function toggleAssignee(id) {
    setAssigneeIds((current) => (
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    ));
  }

  async function submit(event) {
    event.preventDefault();
    await onPush({
      title,
      description,
      suggestedDate,
      suggestedTime,
      expectedDurationMinutes: Number(expectedDuration) || 0,
      assigneeIds,
    });
    setTitle('');
    setDescription('');
    setSuggestedTime('');
    setExpectedDuration('30');
    setAssigneeIds([]);
  }

  return (
    <Card className="eng-planner-push-card">
      <div className="eng-simple-list-head">
        <div>
          <h2>Manager task push</h2>
          <p>Assign a planner task to selected engineer accounts.</p>
        </div>
        <Badge tone={engineers.length ? 'ready' : 'neutral'}>{engineers.length} engineers</Badge>
      </div>
      <form className="eng-planner-push-form" onSubmit={submit}>
        <Field label="Task">
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Task for engineer" required />
        </Field>
        <Field label="Suggested day">
          <input type="date" value={suggestedDate} onChange={(event) => setSuggestedDate(event.target.value)} />
        </Field>
        <Field label="Suggested time">
          <input type="time" value={suggestedTime} onChange={(event) => setSuggestedTime(event.target.value)} />
        </Field>
        <Field label="Duration">
          <input type="number" min="0" step="5" value={expectedDuration} onChange={(event) => setExpectedDuration(event.target.value)} />
        </Field>
        <Field label="Details">
          <textarea rows={2} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Optional context" />
        </Field>
        <div className="eng-planner-engineers">
          {engineers.length === 0 && <p>No engineer accounts available. Redeploy the backend if this list is empty after roles are set.</p>}
          {engineers.map((engineer) => {
            const selected = assigneeIds.includes(engineer.id);
            return (
              <button
                key={engineer.id}
                type="button"
                className={selected ? 'eng-planner-engineer eng-planner-engineer-selected' : 'eng-planner-engineer'}
                onClick={() => toggleAssignee(engineer.id)}
              >
                <strong>{workspaceUserName(engineer)}</strong>
                <span>{engineer.email}</span>
              </button>
            );
          })}
        </div>
        <Button type="submit" disabled={busy || !title.trim() || assigneeIds.length === 0}>
          Push task
        </Button>
      </form>
    </Card>
  );
}

function IncomingPlannerTasks({ tasks, selectedDate, busy, onPlan, onDismiss }) {
  const [drafts, setDrafts] = useState({});

  function draftFor(task) {
    return {
      plannedDate: drafts[task.id]?.plannedDate || task.suggestedDate || selectedDate,
      plannedTime: drafts[task.id]?.plannedTime || task.suggestedTime || '',
      expectedDurationMinutes: drafts[task.id]?.expectedDurationMinutes ?? String(task.expectedDurationMinutes || 30),
    };
  }

  function updateDraft(taskId, patch) {
    setDrafts((current) => ({
      ...current,
      [taskId]: {
        ...(current[taskId] || {}),
        ...patch,
      },
    }));
  }

  if (tasks.length === 0) {
    return (
      <Card className="eng-planner-inbox-card">
        <div className="eng-simple-list-head">
          <h2>Incoming planner tasks</h2>
          <Badge tone="neutral">0 pending</Badge>
        </div>
        <EmptyState title="No incoming tasks" description="Tasks pushed by a manager will appear here." />
      </Card>
    );
  }

  return (
    <Card className="eng-planner-inbox-card">
      <div className="eng-simple-list-head">
        <h2>Incoming planner tasks</h2>
        <Badge tone="warning">{tasks.length} pending</Badge>
      </div>
      <div className="eng-planner-inbox-list">
        {tasks.map((task) => {
          const draft = draftFor(task);
          return (
            <article key={task.id} className="eng-planner-inbox-item">
              <div>
                <p>{task.title}</p>
                <span>From {workspaceUserName(task.createdBy)}</span>
                {task.description && <small>{task.description}</small>}
              </div>
              <div className="eng-planner-inbox-controls">
                <input
                  type="date"
                  value={draft.plannedDate}
                  onChange={(event) => updateDraft(task.id, { plannedDate: event.target.value })}
                  aria-label="Planned date"
                />
                <input
                  type="time"
                  value={draft.plannedTime}
                  onChange={(event) => updateDraft(task.id, { plannedTime: event.target.value })}
                  aria-label="Planned time"
                />
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={draft.expectedDurationMinutes}
                  onChange={(event) => updateDraft(task.id, { expectedDurationMinutes: event.target.value })}
                  aria-label="Duration minutes"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onPlan(task, draft)}
                  disabled={busy || !draft.plannedDate || !draft.plannedTime}
                >
                  Add to my day
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => onDismiss(task.id)} disabled={busy}>
                  Dismiss
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </Card>
  );
}

function DayPlanner({ onToast }) {
  const didLoadRef = useRef(false);
  const [selectedDate, setSelectedDate] = useState(() => formatDateKey(new Date()));
  const [plannerByDate, setPlannerByDate] = useState(() => defaultPlannerByDate());
  const [title, setTitle] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [expectedDuration, setExpectedDuration] = useState('');
  const [engineers, setEngineers] = useState([]);
  const [incomingTasks, setIncomingTasks] = useState([]);
  const [workspaceBusy, setWorkspaceBusy] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPlannerByDate(loadPlannerByDate());
      didLoadRef.current = true;
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!didLoadRef.current) return;
    saveStoredItems(PLANNER_KEY, plannerByDate);
  }, [plannerByDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadWorkspacePlannerData();
    }, 0);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedDateLabel = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(dateFromKey(selectedDate));

  const tasks = useMemo(() => plannerByDate[selectedDate] || [], [plannerByDate, selectedDate]);
  const weekStats = useMemo(() => plannerStats(plannerByDate, daysBetween(startOfWeekKey(selectedDate), 7)), [plannerByDate, selectedDate]);
  const monthStats = useMemo(() => plannerStats(plannerByDate, monthKeys(selectedDate)), [plannerByDate, selectedDate]);

  const sortedTasks = useMemo(() => [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return String(a.dueTime || '99:99').localeCompare(String(b.dueTime || '99:99'));
  }), [tasks]);

  function addTask(event) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    const timestamp = nowIso();
    const durationMinutes = Math.max(0, Number(expectedDuration) || 0);
    setPlannerByDate((current) => ({
      ...current,
      [selectedDate]: [
        ...(current[selectedDate] || []),
        {
          id: createId('task'),
          title: cleanTitle,
          dueTime,
          expectedDurationMinutes: durationMinutes,
          completed: false,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
    }));
    setTitle('');
    setDueTime('');
    setExpectedDuration('');
    onToast('Task added.');
  }

  function updateTaskStatus(id, completed) {
    const timestamp = nowIso();
    setPlannerByDate((current) => ({
      ...current,
      [selectedDate]: (current[selectedDate] || []).map((task) => (
        task.id === id ? { ...task, completed, updatedAt: timestamp } : task
      )),
    }));
  }

  function deleteTask(id) {
    setPlannerByDate((current) => ({
      ...current,
      [selectedDate]: (current[selectedDate] || []).filter((task) => task.id !== id),
    }));
    onToast('Task deleted.');
  }

  async function loadWorkspacePlannerData() {
    setWorkspaceBusy(true);
    try {
      let engineerData = { engineers: [] };
      let inboxData = { tasks: [] };

      try {
        engineerData = await getWorkspaceEngineers();
      } catch (error) {
        if (!String(error.message || '').toLowerCase().includes('route not found')) throw error;
      }

      try {
        inboxData = await getWorkspacePlannerInbox();
      } catch (error) {
        if (!String(error.message || '').toLowerCase().includes('route not found')) throw error;
      }

      setEngineers(engineerData.engineers || []);
      setIncomingTasks((inboxData.tasks || []).filter((task) => task.status === 'PENDING'));
    } catch (error) {
      onToast(error.message || 'Unable to load workspace planner tasks.');
    } finally {
      setWorkspaceBusy(false);
    }
  }

  async function pushPlannerTask(payload) {
    setWorkspaceBusy(true);
    try {
      await pushWorkspacePlannerTask(payload);
      onToast('Planner task pushed.');
      await loadWorkspacePlannerData();
    } catch (error) {
      onToast(error.message || 'Unable to push planner task.');
    } finally {
      setWorkspaceBusy(false);
    }
  }

  async function planIncomingTask(task, draft) {
    setWorkspaceBusy(true);
    try {
      const planned = await planWorkspacePlannerTask(task.id, {
        plannedDate: draft.plannedDate,
        plannedTime: draft.plannedTime,
        expectedDurationMinutes: Number(draft.expectedDurationMinutes) || task.expectedDurationMinutes || 0,
      });
      const timestamp = nowIso();
      const plannedTask = planned.task || task;
      setSelectedDate(draft.plannedDate);
      setPlannerByDate((current) => ({
        ...current,
        [draft.plannedDate]: [
          ...(current[draft.plannedDate] || []),
          {
            id: `pushed-${task.id}`,
            title: plannedTask.title,
            dueTime: draft.plannedTime,
            expectedDurationMinutes: Number(draft.expectedDurationMinutes) || plannedTask.expectedDurationMinutes || 0,
            completed: false,
            pushedTaskId: task.id,
            createdBy: workspaceUserName(task.createdBy),
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ],
      }));
      setIncomingTasks((current) => current.filter((item) => item.id !== task.id));
      onToast('Task added to your planner.');
    } catch (error) {
      onToast(error.message || 'Unable to add task to your planner.');
    } finally {
      setWorkspaceBusy(false);
    }
  }

  async function dismissIncomingTask(id) {
    setWorkspaceBusy(true);
    try {
      await dismissWorkspacePlannerTask(id);
      setIncomingTasks((current) => current.filter((task) => task.id !== id));
      onToast('Incoming task dismissed.');
    } catch (error) {
      onToast(error.message || 'Unable to dismiss task.');
    } finally {
      setWorkspaceBusy(false);
    }
  }

  return (
    <div className="eng-simple-planner">
      <div className="eng-simple-planner-head">
        <div>
          <p>Day Planner</p>
          <h2>{selectedDateLabel}</h2>
        </div>
        <div className="eng-simple-date-controls">
          <Button type="button" variant="secondary" size="sm" onClick={() => setSelectedDate(shiftDateKey(selectedDate, -1))}>Previous</Button>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value || formatDateKey(new Date()))}
            aria-label="Planner date"
          />
          <Button type="button" variant="secondary" size="sm" onClick={() => setSelectedDate(shiftDateKey(selectedDate, 1))}>Next</Button>
          <Button type="button" size="sm" onClick={() => setSelectedDate(formatDateKey(new Date()))}>Today</Button>
        </div>
      </div>

      <PlannerSummary tasks={tasks} weekStats={weekStats} monthStats={monthStats} />

      <SimpleTaskForm
        title={title}
        setTitle={setTitle}
        dueTime={dueTime}
        setDueTime={setDueTime}
        expectedDuration={expectedDuration}
        setExpectedDuration={setExpectedDuration}
        onSubmit={addTask}
      />

      <div className="eng-planner-server-grid">
        <ManagerPlannerPush engineers={engineers} busy={workspaceBusy} onPush={pushPlannerTask} />
        <IncomingPlannerTasks
          tasks={incomingTasks}
          selectedDate={selectedDate}
          busy={workspaceBusy}
          onPlan={planIncomingTask}
          onDismiss={dismissIncomingTask}
        />
      </div>

      <Card className="eng-simple-list-card">
        <div className="eng-simple-list-head">
          <h2>Tasks</h2>
          <span>{sortedTasks.length} total</span>
        </div>
        <div className="eng-simple-task-list">
          {sortedTasks.map((task) => (
            <SimpleTaskRow key={task.id} task={task} onStatusChange={updateTaskStatus} onDelete={deleteTask} />
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
