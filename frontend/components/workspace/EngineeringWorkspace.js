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
