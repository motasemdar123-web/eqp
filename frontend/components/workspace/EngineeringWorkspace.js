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

const statuses = ['todo', 'in_progress', 'done', 'blocked'];
const priorities = ['low', 'medium', 'high', 'critical'];
const categories = ['Inspection', 'Report', 'Machine', 'Technician', 'Safety', 'Admin', 'Other'];
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
      description: 'Confirm actual temperature, fan condition, and recent alarm history.',
      priority: 'high',
      status: 'todo',
      dueTime: '09:00',
      category: 'Inspection',
      completed: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: 'demo-task-eqp-upload',
      title: 'Review EQP report upload',
      description: 'Check latest report attachment and missing machine references.',
      priority: 'medium',
      status: 'in_progress',
      dueTime: '11:30',
      category: 'Report',
      completed: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: 'demo-task-tomorrow-plan',
      title: 'Prepare tomorrow maintenance plan',
      description: 'Set technician coverage and machine priorities for the morning review.',
      priority: 'low',
      status: 'todo',
      dueTime: '15:30',
      category: 'Admin',
      completed: false,
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: 'demo-task-pressure-safety',
      title: 'Check safety notes for pressure testing',
      description: 'Blocked until pressure test permit is confirmed.',
      priority: 'critical',
      status: 'blocked',
      dueTime: '13:00',
      category: 'Safety',
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

function statusLabel(status) {
  const labels = {
    todo: 'Todo',
    in_progress: 'In Progress',
    done: 'Done',
    blocked: 'Blocked',
  };
  return labels[status] || status;
}

function priorityTone(priority) {
  if (priority === 'critical') return 'critical';
  if (priority === 'high') return 'warning';
  if (priority === 'low') return 'neutral';
  return 'info';
}

function statusTone(status) {
  if (status === 'done') return 'completed';
  if (status === 'in_progress') return 'live';
  if (status === 'blocked') return 'critical';
  return 'pending';
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

function CanvasToolbar({ onAddSticky, onAddWireframe, onAddFrame, onAddText, onClear, onSave, onResetView }) {
  return (
    <div className="eng-canvas-toolbar">
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

function CreativeArea({ onToast }) {
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const [items, setItems] = useState(() => defaultBoardItems());
  const [selectedId, setSelectedId] = useState('');
  const selectedItem = items.find((item) => item.id === selectedId) || null;

  useEffect(() => {
    const timer = setTimeout(() => {
      setItems(loadStoredItems(BOARD_KEY, defaultBoardItems));
    }, 0);
    return () => clearTimeout(timer);
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

  return (
    <div className="eng-creative-grid">
      <section className="eng-board-shell">
        <CanvasToolbar
          onAddSticky={() => addItem('sticky')}
          onAddWireframe={() => addItem('wireframe')}
          onAddFrame={() => addItem('frame')}
          onAddText={() => addItem('text')}
          onClear={clearCanvas}
          onSave={saveBoard}
          onResetView={resetView}
        />
        <div
          ref={canvasRef}
          className="eng-canvas"
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
      <PropertiesPanel
        selectedItem={selectedItem}
        onChange={updateItem}
        onDelete={deleteItem}
        onDuplicate={duplicateItem}
      />
    </div>
  );
}

function PlannerStats({ tasks }) {
  const completed = tasks.filter((task) => task.status === 'done').length;
  const inProgress = tasks.filter((task) => task.status === 'in_progress').length;
  const blocked = tasks.filter((task) => task.status === 'blocked').length;
  const completion = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const stats = [
    { label: 'Total Tasks', value: tasks.length, tone: 'info' },
    { label: 'Completed', value: completed, tone: 'completed' },
    { label: 'In Progress', value: inProgress, tone: 'live' },
    { label: 'Blocked', value: blocked, tone: 'critical' },
    { label: 'Completion', value: `${completion}%`, tone: 'ready' },
  ];

  return (
    <div className="eng-planner-stats">
      {stats.map((item) => (
        <Card key={item.label} className="eng-planner-stat">
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          <Badge tone={item.tone}>Today</Badge>
        </Card>
      ))}
    </div>
  );
}

function PlannerTaskForm({ form, setForm, onSubmit, editingTask, onCancel }) {
  return (
    <Card className="eng-task-form-card">
      <div className="eng-panel-head">
        <div>
          <h2>{editingTask ? 'Edit Task' : 'Add Daily Task'}</h2>
          <p>Plan work, priority, due time, and category.</p>
        </div>
      </div>
      <form className="eng-task-form" onSubmit={onSubmit}>
        <Field label="Task title">
          <input
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="Inspect hydraulic oil temperature"
            required
          />
        </Field>
        <Field label="Description">
          <textarea
            rows={3}
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Optional details, context, or blockers"
          />
        </Field>
        <div className="eng-form-grid">
          <Field label="Priority">
            <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}>
              {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
              {statuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
            </select>
          </Field>
          <Field label="Due time">
            <input type="time" value={form.dueTime} onChange={(event) => setForm((current) => ({ ...current, dueTime: event.target.value }))} />
          </Field>
          <Field label="Category">
            <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </Field>
        </div>
        <div className="eng-panel-actions">
          <Button type="submit">{editingTask ? 'Update Task' : 'Add Task'}</Button>
          {editingTask && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
        </div>
      </form>
    </Card>
  );
}

function PlannerTaskCard({ task, onToggleDone, onEdit, onDelete, onStatusChange }) {
  return (
    <article className={task.status === 'done' ? 'eng-task-card eng-task-card-done' : 'eng-task-card'}>
      <button
        type="button"
        className={task.status === 'done' ? 'eng-task-check eng-task-check-done' : 'eng-task-check'}
        onClick={() => onToggleDone(task)}
        aria-label={`Mark ${task.title} ${task.status === 'done' ? 'not done' : 'done'}`}
      >
        {task.status === 'done' ? '✓' : ''}
      </button>
      <div className="eng-task-body">
        <div className="eng-task-title-row">
          <h3>{task.title}</h3>
          <div className="eng-task-badges">
            <Badge tone={priorityTone(task.priority)}>{task.priority}</Badge>
            <Badge tone={statusTone(task.status)}>{statusLabel(task.status)}</Badge>
          </div>
        </div>
        {task.description && <p>{task.description}</p>}
        <div className="eng-task-meta">
          <span>{task.dueTime || 'No time'}</span>
          <span>{task.category || 'Other'}</span>
        </div>
      </div>
      <div className="eng-task-actions">
        <select value={task.status} onChange={(event) => onStatusChange(task, event.target.value)} aria-label="Task status">
          {statuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
        </select>
        <Button type="button" variant="secondary" size="sm" onClick={() => onEdit(task)}>Edit</Button>
        <Button type="button" variant="danger" size="sm" onClick={() => onDelete(task.id)}>Delete</Button>
      </div>
    </article>
  );
}

function DayPlanner({ onToast }) {
  const didLoadRef = useRef(false);
  const [tasks, setTasks] = useState(() => defaultPlannerTasks());
  const [filter, setFilter] = useState('all');
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    dueTime: '',
    category: 'Inspection',
  });

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
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const filteredTasks = useMemo(() => {
    if (filter === 'all') return tasks;
    if (filter === 'critical') return tasks.filter((task) => task.priority === 'critical');
    return tasks.filter((task) => task.status === filter);
  }, [filter, tasks]);

  const groupedTasks = useMemo(() => ({
    todo: filteredTasks.filter((task) => task.status === 'todo'),
    in_progress: filteredTasks.filter((task) => task.status === 'in_progress'),
    done: filteredTasks.filter((task) => task.status === 'done'),
    blocked: filteredTasks.filter((task) => task.status === 'blocked'),
  }), [filteredTasks]);

  function resetForm() {
    setEditingTask(null);
    setForm({
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      dueTime: '',
      category: 'Inspection',
    });
  }

  function saveTask(event) {
    event.preventDefault();
    const timestamp = nowIso();
    if (editingTask) {
      setTasks((current) => current.map((task) => (
        task.id === editingTask.id
          ? { ...task, ...form, completed: form.status === 'done', updatedAt: timestamp }
          : task
      )));
      onToast('Task updated.');
    } else {
      setTasks((current) => [
        ...current,
        {
          ...form,
          id: createId('task'),
          completed: form.status === 'done',
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ]);
      onToast('Task added.');
    }
    resetForm();
  }

  function editTask(task) {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'medium',
      status: task.status || 'todo',
      dueTime: task.dueTime || '',
      category: task.category || 'Other',
    });
  }

  function deleteTask(id) {
    setTasks((current) => current.filter((task) => task.id !== id));
    if (editingTask?.id === id) resetForm();
    onToast('Task deleted.');
  }

  function updateTaskStatus(task, status) {
    const timestamp = nowIso();
    setTasks((current) => current.map((item) => (
      item.id === task.id
        ? { ...item, status, completed: status === 'done', updatedAt: timestamp }
        : item
    )));
  }

  function toggleDone(task) {
    updateTaskStatus(task, task.status === 'done' ? 'todo' : 'done');
  }

  return (
    <div className="eng-planner">
      <div className="eng-planner-heading">
        <div>
          <p>Today&apos;s plan</p>
          <h2>{todayLabel}</h2>
        </div>
        <div className="eng-filter-row">
          {['all', ...statuses, 'critical'].map((item) => (
            <button
              key={item}
              type="button"
              className={filter === item ? 'eng-filter eng-filter-active' : 'eng-filter'}
              onClick={() => setFilter(item)}
            >
              {item === 'all' ? 'All' : item === 'critical' ? 'Critical' : statusLabel(item)}
            </button>
          ))}
        </div>
      </div>

      <PlannerStats tasks={tasks} />

      <div className="eng-planner-grid">
        <div className="eng-task-sections">
          {statuses.map((status) => (
            <Card key={status} className="eng-task-section">
              <div className="eng-section-head">
                <h2>{statusLabel(status)}</h2>
                <Badge tone={statusTone(status)}>{groupedTasks[status].length}</Badge>
              </div>
              <div className="eng-task-list">
                {groupedTasks[status].map((task) => (
                  <PlannerTaskCard
                    key={task.id}
                    task={task}
                    onToggleDone={toggleDone}
                    onEdit={editTask}
                    onDelete={deleteTask}
                    onStatusChange={updateTaskStatus}
                  />
                ))}
                {groupedTasks[status].length === 0 && (
                  <div className="eng-section-empty">No {statusLabel(status).toLowerCase()} tasks.</div>
                )}
              </div>
            </Card>
          ))}
        </div>

        <PlannerTaskForm
          form={form}
          setForm={setForm}
          onSubmit={saveTask}
          editingTask={editingTask}
          onCancel={resetForm}
        />
      </div>
    </div>
  );
}

export default function EngineeringWorkspace() {
  const [activeTab, setActiveTab] = useState('creative');
  const [toast, setToast] = useState('');

  const title = activeTab === 'creative' ? 'Creative Area' : 'Day Planner';
  const description = activeTab === 'creative'
    ? 'Visualize maintenance ideas, workflows, and wireframes on an interactive engineering canvas.'
    : 'Plan daily engineering work, track priorities, and keep execution visible.';

  return (
    <SystemShell
      activePath="/workspace"
      eyebrow="ENGINEERING WORKSPACE"
      title={title}
      description={description}
      actions={<WorkspaceTabs activeTab={activeTab} onTabChange={setActiveTab} />}
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
