'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import SystemShell from '../SystemShell';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import Field from '../ui/Field';
import EmptyState from '../ui/EmptyState';
import Toast from '../ui/Toast';

const BOARD_STORAGE_KEY = 'dar-al-hai-engineering-workspace-v3';
const PLANNER_STORAGE_KEY = 'dar-al-hai-engineering-day-planner-v3';


const SWATCH_PALETTE = [
  { label: 'Yellow', color: '#FEF3C7', border: '#F59E0B', text: '#78350F' },
  { label: 'Blue', color: '#DBEAFE', border: '#3B82F6', text: '#1E3A8A' },
  { label: 'Green', color: '#DCFCE7', border: '#10B981', text: '#064E3B' },
  { label: 'Pink', color: '#FCE7F3', border: '#EC4899', text: '#831843' },
  { label: 'Purple', color: '#F3E8FF', border: '#A855F7', text: '#581C87' },
  { label: 'Orange', color: '#FFEDD5', border: '#F97316', text: '#7C2D12' },
  { label: 'Teal', color: '#CCFBF1', border: '#14B8A6', text: '#134E4A' },
  { label: 'White', color: '#FFFFFF', border: '#CBD5E1', text: '#0F172A' },
  { label: 'Dark', color: '#0F172A', border: '#334155', text: '#F8FAFC' },
];

const TEMPLATES = [
  {
    key: '5-whys',
    title: '5-Whys Root Cause Analysis',
    category: 'Root Cause',
    description: 'Systematic diagnosis for machine failure or SLA breach leading to corrective action.',
    badge: 'Diagnostic',
  },
  {
    key: 'shift-handover',
    title: 'Field Technician Shift Handover',
    category: 'Operations',
    description: 'Track open P1 risks, scheduled machine tasks, and technician dispatch windows.',
    badge: 'Shift Daily',
  },
  {
    key: 'pm-pipeline',
    title: 'Preventive Maintenance Pipeline',
    category: 'Maintenance',
    description: 'Inspection, fluid testing, parts replacement, and certified PDF report workflow.',
    badge: 'EQP Workflow',
  },
  {
    key: 'sla-matrix',
    title: 'SLA Risk & Escalation Matrix',
    category: 'Governance',
    description: 'Severity classification, containment steps, emergency dispatch, and client alerts.',
    badge: 'SLA Matrix',
  },
  {
    key: 'kanban-maintenance',
    title: 'Maintenance Kanban Board',
    category: 'Agile Ops',
    description: 'Backlog, Scheduled, In Progress, Inspection & QC, Completed & Archived columns.',
    badge: 'Kanban',
  },
];

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix = 'obj') {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function loadStorage(key, fallback) {
  if (typeof window === 'undefined') {
    return typeof fallback === 'function' ? fallback() : fallback;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return typeof fallback === 'function' ? fallback() : fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : (typeof fallback === 'function' ? fallback() : fallback);
  } catch {
    return typeof fallback === 'function' ? fallback() : fallback;
  }
}

function saveStorage(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

function defaultBoardState() {
  const createdAt = nowIso();
  return {
    viewport: { zoom: 1, pan: { x: 40, y: 30 } },
    settings: { grid: true, snap: true },
    objects: [
      {
        id: 'frame-inspection-zone',
        type: 'frame',
        x: 60,
        y: 60,
        width: 820,
        height: 480,
        zIndex: 1,
        color: 'rgba(241, 245, 249, 0.55)',
        borderColor: '#94A3B8',
        text: 'Morning Operations & Fleet Handover',
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: 'card-dzr-17',
        type: 'card',
        x: 100,
        y: 130,
        width: 250,
        height: 165,
        zIndex: 4,
        color: '#FFFFFF',
        borderColor: '#EF4444',
        text: 'DZR-17 hydraulic temperature spike',
        status: 'SLA Risk',
        owner: 'Faisal',
        metadata: { asset: 'DZR-17', priority: 'P1', due: '14:00', zone: 'North Yard' },
        votes: 3,
        comments: [{ id: 'c1', text: 'Hydraulic pressure test scheduled for afternoon shift.', createdAt }],
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: 'card-exc-04',
        type: 'card',
        x: 400,
        y: 130,
        width: 250,
        height: 165,
        zIndex: 3,
        color: '#FFFFFF',
        borderColor: '#10B981',
        text: 'EXC-04 250h preventive maintenance package',
        status: 'Ready',
        owner: 'Abdelrahman',
        metadata: { asset: 'EXC-04', priority: 'P3', due: 'Tomorrow', zone: 'Workshop' },
        votes: 1,
        comments: [],
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: 'connector-1',
        type: 'connector',
        x: 350,
        y: 210,
        width: 50,
        height: 2,
        zIndex: 2,
        borderColor: '#64748B',
        text: 'Relies on',
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: 'sticky-supervisor-note',
        type: 'sticky',
        x: 680,
        y: 130,
        width: 170,
        height: 165,
        zIndex: 5,
        color: '#FEF3C7',
        textColor: '#78350F',
        text: 'Ensure all generated EQP reports have engineer digital signatures before dispatching.',
        author: 'Lead Engineer',
        votes: 4,
        comments: [],
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: 'table-shift-roster',
        type: 'table',
        x: 100,
        y: 330,
        width: 740,
        height: 160,
        zIndex: 6,
        color: '#FFFFFF',
        borderColor: '#CBD5E1',
        text: 'Shift Handoff Matrix',
        metadata: {
          columns: ['Asset ID', 'Issue / Milestone', 'Technician', 'Action Plan'],
          rows: [
            ['DZR-17', 'Hydraulic Temp Spike', 'Faisal', 'Check oil cooler valve & filter'],
            ['EXC-04', '250h Scheduled PM', 'Abdelrahman', 'Generate certified PDF report'],
            ['GEN-02', 'Low Fuel Sensor', 'Motasem', 'Replace float assembly'],
          ],
        },
        createdAt,
        updatedAt: createdAt,
      },
    ],
  };
}

function makeTemplateObjects(templateKey) {
  const createdAt = nowIso();
  if (templateKey === '5-whys') {
    return [
      { id: createId('frame'), type: 'frame', x: 60, y: 60, width: 980, height: 420, zIndex: 1, color: 'rgba(254, 243, 199, 0.35)', borderColor: '#F59E0B', text: '5-Whys Root Cause Analysis', createdAt, updatedAt: createdAt },
      { id: createId('card'), type: 'card', x: 100, y: 120, width: 220, height: 140, zIndex: 3, color: '#FFFFFF', borderColor: '#EF4444', text: 'Problem: Machine stalled on site', status: 'Problem', metadata: { asset: 'EXC-09', priority: 'P1', due: 'Immediate', zone: 'Site B' }, createdAt, updatedAt: createdAt },
      { id: createId('sticky'), type: 'sticky', x: 360, y: 120, width: 160, height: 120, zIndex: 4, color: '#DBEAFE', text: 'Why 1: Engine overheated', author: 'Diagnosis', createdAt, updatedAt: createdAt },
      { id: createId('sticky'), type: 'sticky', x: 550, y: 120, width: 160, height: 120, zIndex: 4, color: '#DBEAFE', text: 'Why 2: Coolant level dropped', author: 'Diagnosis', createdAt, updatedAt: createdAt },
      { id: createId('sticky'), type: 'sticky', x: 740, y: 120, width: 160, height: 120, zIndex: 4, color: '#DBEAFE', text: 'Why 3: Radiator hose ruptured', author: 'Diagnosis', createdAt, updatedAt: createdAt },
      { id: createId('sticky'), type: 'sticky', x: 360, y: 270, width: 240, height: 150, zIndex: 4, color: '#DCFCE7', text: 'Root Cause: Hose exceeded operational lifespan without PM replacement interval.', author: 'Conclusion', createdAt, updatedAt: createdAt },
      { id: createId('card'), type: 'card', x: 640, y: 270, width: 260, height: 150, zIndex: 4, color: '#FFFFFF', borderColor: '#10B981', text: 'Action Item: Update EQP 500h checklist to include mandatory hose replacement.', status: 'Action Item', metadata: { asset: 'Fleet Wide', priority: 'P2', due: 'This Week', zone: 'Maintenance' }, createdAt, updatedAt: createdAt },
    ];
  }

  if (templateKey === 'kanban-maintenance') {
    return [
      { id: createId('frame'), type: 'frame', x: 60, y: 60, width: 1040, height: 500, zIndex: 1, color: 'rgba(241, 245, 249, 0.4)', borderColor: '#64748B', text: 'Preventive & Corrective Maintenance Kanban', createdAt, updatedAt: createdAt },
      { id: createId('shape'), type: 'shape', shape: 'rounded', x: 90, y: 110, width: 200, height: 40, zIndex: 2, color: '#F1F5F9', borderColor: '#94A3B8', text: 'BACKLOG', textColor: '#0F172A', createdAt, updatedAt: createdAt },
      { id: createId('shape'), type: 'shape', shape: 'rounded', x: 320, y: 110, width: 200, height: 40, zIndex: 2, color: '#FEF3C7', borderColor: '#F59E0B', text: 'SCHEDULED', textColor: '#78350F', createdAt, updatedAt: createdAt },
      { id: createId('shape'), type: 'shape', shape: 'rounded', x: 550, y: 110, width: 200, height: 40, zIndex: 2, color: '#DBEAFE', borderColor: '#3B82F6', text: 'IN PROGRESS', textColor: '#1E3A8A', createdAt, updatedAt: createdAt },
      { id: createId('shape'), type: 'shape', shape: 'rounded', x: 780, y: 110, width: 200, height: 40, zIndex: 2, color: '#DCFCE7', borderColor: '#10B981', text: 'COMPLETED & SIGNED', textColor: '#064E3B', createdAt, updatedAt: createdAt },
      { id: createId('card'), type: 'card', x: 90, y: 170, width: 200, height: 130, zIndex: 3, color: '#FFFFFF', borderColor: '#F97316', text: 'Wheel Loader transmission check', status: 'Backlog', metadata: { asset: 'WL-03', priority: 'P2', due: 'Next Week', zone: 'East Yard' }, createdAt, updatedAt: createdAt },
      { id: createId('card'), type: 'card', x: 320, y: 170, width: 200, height: 130, zIndex: 3, color: '#FFFFFF', borderColor: '#F59E0B', text: '500h Service & Filter Kit', status: 'Scheduled', metadata: { asset: 'DZR-12', priority: 'P2', due: 'Today', zone: 'Workshop' }, createdAt, updatedAt: createdAt },
      { id: createId('card'), type: 'card', x: 550, y: 170, width: 200, height: 130, zIndex: 3, color: '#FFFFFF', borderColor: '#3B82F6', text: 'Hydraulic cylinder reseal', status: 'In Progress', metadata: { asset: 'EXC-07', priority: 'P1', due: 'Today 16:00', zone: 'Bay 2' }, createdAt, updatedAt: createdAt },
      { id: createId('card'), type: 'card', x: 780, y: 170, width: 200, height: 130, zIndex: 3, color: '#FFFFFF', borderColor: '#10B981', text: 'Generator periodic inspection', status: 'Completed', metadata: { asset: 'GEN-01', priority: 'P4', due: 'Done', zone: 'HQ Yard' }, createdAt, updatedAt: createdAt },
    ];
  }

  if (templateKey === 'pm-pipeline') {
    return [
      { id: createId('frame'), type: 'frame', x: 60, y: 60, width: 920, height: 380, zIndex: 1, color: 'rgba(240, 253, 250, 0.45)', borderColor: '#14B8A6', text: 'EQP PM Standard Service Cycle', createdAt, updatedAt: createdAt },
      { id: createId('timeline'), type: 'timeline', x: 100, y: 120, width: 840, height: 160, zIndex: 3, color: '#FFFFFF', borderColor: '#14B8A6', text: '250h Service Protocol Milestones', metadata: { events: ['Pre-Service Walkaround', 'Oil & Filter Drain', 'Fluid Analysis Sampling', 'Counters Verification', 'Certified PDF Signoff'] }, createdAt, updatedAt: createdAt },
      { id: createId('sticky'), type: 'sticky', x: 100, y: 290, width: 220, height: 110, zIndex: 4, color: '#FEF3C7', text: 'Step 1: Check SMR hours progression against previous interval log.', author: 'Protocol', createdAt, updatedAt: createdAt },
      { id: createId('sticky'), type: 'sticky', x: 360, y: 290, width: 220, height: 110, zIndex: 4, color: '#DBEAFE', text: 'Step 2: Collect oil sample and label container with serial & engine counter.', author: 'Protocol', createdAt, updatedAt: createdAt },
      { id: createId('sticky'), type: 'sticky', x: 620, y: 290, width: 220, height: 110, zIndex: 4, color: '#DCFCE7', text: 'Step 3: Render and lock PDF report with digital signature.', author: 'Protocol', createdAt, updatedAt: createdAt },
    ];
  }

  return defaultBoardState().objects;
}

export default function EngineeringWorkspace() {
  const [toast, setToast] = useState('');

  return (
    <SystemShell
      activePath="/workspace"
      eyebrow="ENGINEERING WORKSPACE"
      title="Engineering Whiteboard"
      description="Interactive collaborative whiteboard for machine troubleshooting, root cause analysis, and maintenance workflows."
      actions={
        <div className="flex items-center gap-2">
          <Link href="/management/daily-planner" className="ds-button ds-button-secondary ds-button-small">
            📅 Open Daily Planner
          </Link>
        </div>
      }
    >
      <Toast message={toast} type="info" onClose={() => setToast('')} />
      <section className="eng-workspace-shell">
        <CreativeCanvas
          onToast={setToast}
          onConvertToTask={(task) => {
            const planner = loadStorage(PLANNER_STORAGE_KEY, { tasks: [] });
            const newTask = {
              id: createId('task'),
              title: task.title,
              dueTime: task.dueTime || '09:00',
              expectedDuration: task.expectedDuration || '30',
              completed: false,
              createdAt: nowIso(),
            };
            planner.tasks = [newTask, ...(planner.tasks || [])];
            saveStorage(PLANNER_STORAGE_KEY, planner);
            setToast(`Converted "${task.title}" to Daily Planner task.`);
          }}
        />
      </section>
    </SystemShell>
  );
}


function CreativeCanvas({ onToast, onConvertToTask }) {
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const importInputRef = useRef(null);

  const [state, setState] = useState(() => defaultBoardState());
  const [selectedIds, setSelectedIds] = useState([]);
  const [tool, setTool] = useState('select');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [inspectorTab, setInspectorTab] = useState('properties');
  const [history, setHistory] = useState({ past: [], future: [] });

  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, originX: 0, originY: 0 });
  const dragRef = useRef(null);
  const resizeRef = useRef(null);
  const marqueeRef = useRef(null);
  const penRef = useRef(null);

  useEffect(() => {
    const stored = loadStorage(BOARD_STORAGE_KEY, defaultBoardState);
    if (stored && Array.isArray(stored.objects)) {
      setState(stored);
    }
  }, []);

  const selectedObject = useMemo(() => {
    return (state?.objects || []).find((obj) => obj.id === selectedIds[0]) || null;
  }, [state?.objects, selectedIds]);

  useEffect(() => {
    saveStorage(BOARD_STORAGE_KEY, state);
  }, [state]);

  const pushHistory = useCallback((prevState) => {
    setHistory((curr) => ({
      past: [...curr.past.slice(-24), JSON.parse(JSON.stringify(prevState))],
      future: [],
    }));
  }, []);

  const commit = useCallback((updater) => {
    setState((curr) => {
      const next = typeof updater === 'function' ? updater(JSON.parse(JSON.stringify(curr))) : updater;
      pushHistory(curr);
      return next;
    });
  }, [pushHistory]);

  const undo = useCallback(() => {
    setHistory((curr) => {
      if (!curr.past.length) return curr;
      const prev = curr.past[curr.past.length - 1];
      setState(prev);
      return {
        past: curr.past.slice(0, -1),
        future: [JSON.parse(JSON.stringify(state)), ...curr.future],
      };
    });
  }, [state]);

  const redo = useCallback(() => {
    setHistory((curr) => {
      if (!curr.future.length) return curr;
      const next = curr.future[0];
      setState(next);
      return {
        past: [...curr.past, JSON.parse(JSON.stringify(state))],
        future: curr.future.slice(1),
      };
    });
  }, [state]);

  const screenToWorld = useCallback((clientX, clientY) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - (state.viewport?.pan?.x || 0)) / (state.viewport?.zoom || 1),
      y: (clientY - rect.top - (state.viewport?.pan?.y || 0)) / (state.viewport?.zoom || 1),
    };
  }, [state.viewport]);

  const updateObject = useCallback((id, patch) => {
    commit((curr) => ({
      ...curr,
      objects: (curr.objects || []).map((obj) => (obj.id === id ? { ...obj, ...patch, updatedAt: nowIso() } : obj)),
    }));
  }, [commit]);

  const addObject = useCallback((type, customProps = {}) => {
    const createdAt = nowIso();
    const centerWorld = screenToWorld(
      containerRef.current ? containerRef.current.clientWidth / 2 : 400,
      containerRef.current ? containerRef.current.clientHeight / 2 : 300
    );

    const base = {
      id: createId(type),
      type,
      x: Math.round(centerWorld.x - 100),
      y: Math.round(centerWorld.y - 60),
      width: 200,
      height: 140,
      zIndex: Date.now(),
      color: '#FFFFFF',
      borderColor: '#CBD5E1',
      strokeWidth: 2,
      textColor: '#0F172A',
      fontSize: 14,
      text: '',
      locked: false,
      votes: 0,
      comments: [],
      createdAt,
      updatedAt: createdAt,
      ...customProps,
    };

    if (type === 'sticky') {
      base.color = customProps.color || '#FEF3C7';
      base.textColor = '#78350F';
      base.text = customProps.text || 'New insight or inspection note';
      base.width = 180;
      base.height = 140;
    } else if (type === 'card') {
      base.width = 250;
      base.height = 160;
      base.borderColor = '#3B82F6';
      base.text = customProps.text || 'Preventive maintenance check';
      base.status = 'Planned';
      base.owner = 'Unassigned';
      base.metadata = { asset: 'Machine ID', priority: 'P2', due: 'Today', zone: 'Workshop', ...(customProps.metadata || {}) };
    } else if (type === 'shape') {
      base.shape = customProps.shape || 'rectangle';
      base.width = 180;
      base.height = 110;
      base.text = customProps.text || 'Process Block';
      base.color = customProps.color || '#F1F5F9';
      base.borderColor = '#64748B';
    } else if (type === 'connector') {
      base.width = 160;
      base.height = 2;
      base.borderColor = '#2563EB';
      base.text = customProps.text || '';
    } else if (type === 'frame') {
      base.width = 640;
      base.height = 420;
      base.color = 'rgba(241, 245, 249, 0.45)';
      base.borderColor = '#94A3B8';
      base.text = customProps.text || 'Operational Zone';
    } else if (type === 'table') {
      base.width = 680;
      base.height = 160;
      base.text = customProps.text || 'Data Matrix';
      base.metadata = {
        columns: ['Asset ID', 'Component', 'Status', 'Next Action'],
        rows: [['M-01', 'Hydraulics', 'Normal', 'Monitor in next cycle']],
      };
    } else if (type === 'timeline') {
      base.width = 600;
      base.height = 150;
      base.text = customProps.text || 'Execution Timeline';
      base.borderColor = '#14B8A6';
      base.metadata = { events: ['Preparation', 'Dispatch', 'Inspection', 'Signoff'] };
    } else if (type === 'text') {
      base.width = 240;
      base.height = 60;
      base.color = 'transparent';
      base.borderColor = 'transparent';
      base.fontSize = 20;
      base.text = customProps.text || 'Engineering Heading';
    }

    commit((curr) => ({
      ...curr,
      objects: [...(curr.objects || []), base],
    }));
    setSelectedIds([base.id]);
    setTool('select');
    onToast(`Added ${type} to canvas.`);
  }, [commit, onToast, screenToWorld]);

  const deleteObject = useCallback((id) => {
    commit((curr) => ({
      ...curr,
      objects: (curr.objects || []).filter((obj) => obj.id !== id),
    }));
    setSelectedIds((curr) => curr.filter((selId) => selId !== id));
  }, [commit]);

  const duplicateObject = useCallback((id) => {
    const obj = (state?.objects || []).find((entry) => entry.id === id);
    if (!obj) return;
    const copy = {
      ...JSON.parse(JSON.stringify(obj)),
      id: createId(obj.type),
      x: obj.x + 28,
      y: obj.y + 28,
      zIndex: Date.now(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    commit((curr) => ({ ...curr, objects: [...(curr.objects || []), copy] }));
    setSelectedIds([copy.id]);
    onToast(`Duplicated ${obj.type}.`);
  }, [commit, onToast, state?.objects]);

  const zoomAtPoint = useCallback((nextZoom, clientX, clientY) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const boundedZoom = Math.max(0.25, Math.min(2.5, Math.round(nextZoom * 100) / 100));
    const pointX = clientX - rect.left;
    const pointY = clientY - rect.top;
    const currentPanX = state.viewport?.pan?.x || 0;
    const currentPanY = state.viewport?.pan?.y || 0;
    const currentZoom = state.viewport?.zoom || 1;
    const worldX = (pointX - currentPanX) / currentZoom;
    const worldY = (pointY - currentPanY) / currentZoom;

    setState((curr) => ({
      ...curr,
      viewport: {
        zoom: boundedZoom,
        pan: {
          x: Math.round(pointX - worldX * boundedZoom),
          y: Math.round(pointY - worldY * boundedZoom),
        },
      },
    }));
  }, [state.viewport]);

  const handleWheel = useCallback((event) => {
    event.preventDefault();
    if (event.ctrlKey || event.metaKey) {
      const direction = event.deltaY > 0 ? -1 : 1;
      zoomAtPoint((state.viewport?.zoom || 1) + direction * 0.1, event.clientX, event.clientY);
    } else {
      setState((curr) => ({
        ...curr,
        viewport: {
          ...curr.viewport,
          pan: {
            x: (curr.viewport?.pan?.x || 0) - event.deltaX,
            y: (curr.viewport?.pan?.y || 0) - event.deltaY,
          },
        },
      }));
    }
  }, [state.viewport?.zoom, zoomAtPoint]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Keyboard Shortcuts
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.target.closest('input, textarea, select')) return;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        if (event.shiftKey) redo();
        else undo();
        event.preventDefault();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        redo();
        event.preventDefault();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
        if (selectedIds[0]) duplicateObject(selectedIds[0]);
        event.preventDefault();
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedIds.length > 0) {
          selectedIds.forEach((id) => deleteObject(id));
          event.preventDefault();
        }
        return;
      }

      if (event.key === 'Escape') {
        setSelectedIds([]);
        setTool('select');
        return;
      }

      const key = event.key.toLowerCase();
      if (key === 'v') setTool('select');
      else if (key === 'h') setTool('pan');
      else if (key === 's') addObject('sticky');
      else if (key === 'w') addObject('card');
      else if (key === 'r') addObject('shape');
      else if (key === 'c') addObject('connector');
      else if (key === 't') addObject('text');
      else if (key === 'p') setTool('pen');
      else if (key === 'f') addObject('frame');
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addObject, deleteObject, duplicateObject, redo, selectedIds, undo]);

  // Canvas pointer down
  function handleCanvasPointerDown(event) {
    if (event.target.closest('.eng-object, .eng-dock-toolbar, .eng-zoom-controls, .eng-inspector, .eng-context-bar, button, input, textarea')) {
      return;
    }

    const world = screenToWorld(event.clientX, event.clientY);

    if (tool === 'pen') {
      const drawing = {
        id: createId('draw'),
        type: 'drawing',
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        zIndex: Date.now(),
        path: [world],
        borderColor: '#0F172A',
        strokeWidth: 3,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      penRef.current = drawing.id;
      commit((curr) => ({ ...curr, objects: [...(curr.objects || []), drawing] }));
      return;
    }

    if (tool === 'sticky' || tool === 'card' || tool === 'shape' || tool === 'connector' || tool === 'text' || tool === 'frame' || tool === 'table' || tool === 'timeline') {
      addObject(tool, { x: Math.round(world.x), y: Math.round(world.y) });
      return;
    }

    if (tool === 'pan' || event.button === 1 || event.spaceKey) {
      isPanningRef.current = true;
      panStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        originX: state.viewport?.pan?.x || 0,
        originY: state.viewport?.pan?.y || 0,
      };
      return;
    }

    // Marquee Selection Box
    setSelectedIds([]);
    marqueeRef.current = {
      startX: world.x,
      startY: world.y,
      currX: world.x,
      currY: world.y,
    };
  }

  // Object pointer down
  function handleObjectPointerDown(event, object) {
    if (object.locked || tool === 'pan') return;
    if (event.target.closest('textarea, input, select, button, .eng-handle')) return;
    event.stopPropagation();

    const world = screenToWorld(event.clientX, event.clientY);
    const activeIds = selectedIds.includes(object.id) ? selectedIds : [object.id];
    setSelectedIds(activeIds);

    dragRef.current = {
      startWorld: world,
      origins: (state?.objects || [])
        .filter((o) => activeIds.includes(o.id))
        .map((o) => ({ id: o.id, x: o.x, y: o.y })),
    };
  }

  // Resize handle pointer down
  function handleResizePointerDown(event, direction, object) {
    event.stopPropagation();
    const world = screenToWorld(event.clientX, event.clientY);
    resizeRef.current = {
      direction,
      objectId: object.id,
      startWorld: world,
      origin: { x: object.x, y: object.y, width: object.width, height: object.height },
    };
  }

  // Pointer move
  function handlePointerMove(event) {
    if (penRef.current) {
      const world = screenToWorld(event.clientX, event.clientY);
      setState((curr) => ({
        ...curr,
        objects: (curr.objects || []).map((o) => (o.id === penRef.current ? { ...o, path: [...(o.path || []), world] } : o)),
      }));
      return;
    }

    if (isPanningRef.current) {
      const dx = event.clientX - panStartRef.current.x;
      const dy = event.clientY - panStartRef.current.y;
      setState((curr) => ({
        ...curr,
        viewport: {
          ...curr.viewport,
          pan: {
            x: Math.round(panStartRef.current.originX + dx),
            y: Math.round(panStartRef.current.originY + dy),
          },
        },
      }));
      return;
    }

    if (dragRef.current) {
      const world = screenToWorld(event.clientX, event.clientY);
      const dx = world.x - dragRef.current.startWorld.x;
      const dy = world.y - dragRef.current.startWorld.y;
      const snap = state.settings?.snap ? 10 : 1;

      setState((curr) => ({
        ...curr,
        objects: (curr.objects || []).map((o) => {
          const origin = dragRef.current.origins.find((item) => item.id === o.id);
          if (!origin) return o;
          return {
            ...o,
            x: Math.round((origin.x + dx) / snap) * snap,
            y: Math.round((origin.y + dy) / snap) * snap,
            updatedAt: nowIso(),
          };
        }),
      }));
      return;
    }

    if (resizeRef.current) {
      const world = screenToWorld(event.clientX, event.clientY);
      const { direction, objectId, startWorld, origin } = resizeRef.current;
      const dx = world.x - startWorld.x;
      const dy = world.y - startWorld.y;

      let nextX = origin.x;
      let nextY = origin.y;
      let nextW = origin.width;
      let nextH = origin.height;

      if (direction.includes('e')) nextW = Math.max(50, origin.width + dx);
      if (direction.includes('s')) nextH = Math.max(40, origin.height + dy);
      if (direction.includes('w')) {
        const potentialW = origin.width - dx;
        if (potentialW >= 50) {
          nextW = potentialW;
          nextX = origin.x + dx;
        }
      }
      if (direction.includes('n')) {
        const potentialH = origin.height - dy;
        if (potentialH >= 40) {
          nextH = potentialH;
          nextY = origin.y + dy;
        }
      }

      setState((curr) => ({
        ...curr,
        objects: (curr.objects || []).map((o) => (o.id === objectId ? { ...o, x: Math.round(nextX), y: Math.round(nextY), width: Math.round(nextW), height: Math.round(nextH) } : o)),
      }));
      return;
    }

    if (marqueeRef.current) {
      const world = screenToWorld(event.clientX, event.clientY);
      marqueeRef.current = { ...marqueeRef.current, currX: world.x, currY: world.y };
      const minX = Math.min(marqueeRef.current.startX, world.x);
      const maxX = Math.max(marqueeRef.current.startX, world.x);
      const minY = Math.min(marqueeRef.current.startY, world.y);
      const maxY = Math.max(marqueeRef.current.startY, world.y);

      const inside = (state?.objects || [])
        .filter((o) => o.x + o.width >= minX && o.x <= maxX && o.y + o.height >= minY && o.y <= maxY)
        .map((o) => o.id);
      setSelectedIds(inside);
    }
  }

  // Pointer up
  function handlePointerUp() {
    isPanningRef.current = false;
    dragRef.current = null;
    resizeRef.current = null;
    marqueeRef.current = null;
    penRef.current = null;
  }

  // Export JSON
  function exportJson() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dar-al-hai-board-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    onToast('Exported board backup JSON.');
  }

  // Import JSON
  function importJson(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(String(reader.result));
        if (!Array.isArray(imported.objects)) throw new Error('Invalid board structure');
        commit((curr) => ({
          ...curr,
          objects: [...(curr.objects || []), ...imported.objects.map((o) => ({ ...o, id: createId(o.type || 'obj') }))],
        }));
        onToast('Board objects imported successfully.');
      } catch {
        onToast('Failed to parse board file.');
      }
    };
    reader.readAsText(file);
  }

  const zoomLevel = state.viewport?.zoom || 1;
  const panX = state.viewport?.pan?.x || 0;
  const panY = state.viewport?.pan?.y || 0;

  return (
    <div
      className={`eng-canvas-wrapper ${isFullscreen ? 'eng-fullscreen' : ''}`}
      ref={containerRef}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <input ref={fileInputRef} type="file" className="hidden" accept="image/*" />
      <input ref={importInputRef} type="file" className="hidden" accept="application/json" onChange={importJson} />

      {/* Floating Main Dock */}
      <div className="eng-dock-toolbar">
        <div className="eng-dock-group">
          <button
            type="button"
            className={`eng-dock-btn ${tool === 'select' ? 'eng-dock-btn-active' : ''}`}
            onClick={() => setTool('select')}
            title="Select & Move (V)"
          >
            Select <kbd>V</kbd>
          </button>
          <button
            type="button"
            className={`eng-dock-btn ${tool === 'pan' ? 'eng-dock-btn-active' : ''}`}
            onClick={() => setTool('pan')}
            title="Hand Pan (H / Space)"
          >
            Pan <kbd>H</kbd>
          </button>
        </div>
        <span className="eng-dock-divider" />
        <div className="eng-dock-group">
          <button type="button" className="eng-dock-btn" onClick={() => addObject('sticky')} title="Sticky Note (S)">
            Sticky <kbd>S</kbd>
          </button>
          <button type="button" className="eng-dock-btn" onClick={() => addObject('card')} title="Asset Work Order Card (W)">
            Card <kbd>W</kbd>
          </button>
          <button type="button" className="eng-dock-btn" onClick={() => addObject('shape')} title="Shape (R)">
            Shape <kbd>R</kbd>
          </button>
          <button type="button" className="eng-dock-btn" onClick={() => addObject('connector')} title="Connector Arrow (C)">
            Arrow <kbd>C</kbd>
          </button>
          <button type="button" className="eng-dock-btn" onClick={() => addObject('text')} title="Text Box (T)">
            Text <kbd>T</kbd>
          </button>
          <button
            type="button"
            className={`eng-dock-btn ${tool === 'pen' ? 'eng-dock-btn-active' : ''}`}
            onClick={() => setTool('pen')}
            title="Pen (P)"
          >
            Pen <kbd>P</kbd>
          </button>
          <button type="button" className="eng-dock-btn" onClick={() => addObject('frame')} title="Frame Zone (F)">
            Frame <kbd>F</kbd>
          </button>
          <button type="button" className="eng-dock-btn" onClick={() => addObject('table')} title="Data Table">
            Table
          </button>
          <button type="button" className="eng-dock-btn" onClick={() => addObject('timeline')} title="Timeline">
            Timeline
          </button>
        </div>
        <span className="eng-dock-divider" />
        <div className="eng-dock-group">
          <button type="button" className="eng-dock-btn" onClick={() => setTemplateModalOpen(true)}>
            Templates
          </button>
          <button type="button" className="eng-dock-btn" onClick={undo} title="Undo (Ctrl+Z)">
            ↺
          </button>
          <button type="button" className="eng-dock-btn" onClick={redo} title="Redo (Ctrl+Y)">
            ↻
          </button>
        </div>
      </div>

      {/* Floating Zoom & Fullscreen Controls */}
      <div className="eng-zoom-controls">
        <button
          type="button"
          className="eng-zoom-btn"
          onClick={() => zoomAtPoint(zoomLevel - 0.15, containerRef.current.clientWidth / 2, containerRef.current.clientHeight / 2)}
        >
          -
        </button>
        <span
          className="eng-zoom-percent"
          onClick={() => setState((curr) => ({ ...curr, viewport: { ...curr.viewport, zoom: 1 } }))}
        >
          {Math.round(zoomLevel * 100)}%
        </span>
        <button
          type="button"
          className="eng-zoom-btn"
          onClick={() => zoomAtPoint(zoomLevel + 0.15, containerRef.current.clientWidth / 2, containerRef.current.clientHeight / 2)}
        >
          +
        </button>
        <button
          type="button"
          className="eng-zoom-btn"
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Canvas'}
        >
          {isFullscreen ? '⤢' : '⤡'}
        </button>
        <button
          type="button"
          className="eng-zoom-btn"
          onClick={() => setInspectorOpen(!inspectorOpen)}
          title="Toggle Inspector Sidebar"
        >
          ⚙
        </button>
      </div>

      {/* Interactive Stage */}
      <div
        className="eng-canvas-stage"
        style={{
          transform: `matrix(${zoomLevel}, 0, 0, ${zoomLevel}, ${panX}, ${panY})`,
        }}
      >
        {(state?.objects || []).map((object) => {
          const isSelected = selectedIds.includes(object.id);
          return (
            <div
              key={object.id}
              className={`eng-object ${isSelected ? 'eng-selected' : ''} ${object.locked ? 'eng-locked' : ''}`}
              style={{
                left: object.x,
                top: object.y,
                width: object.width,
                height: object.height,
                zIndex: isSelected ? 9999 : object.zIndex,
                transform: `rotate(${object.rotation || 0}deg)`,
              }}
              onPointerDown={(event) => handleObjectPointerDown(event, object)}
            >
              {/* 8-Point Resize Handles */}
              {isSelected && !object.locked && selectedIds.length === 1 && (
                <>
                  <div className="eng-handle eng-handle-nw" onPointerDown={(e) => handleResizePointerDown(e, 'nw', object)} />
                  <div className="eng-handle eng-handle-n"  onPointerDown={(e) => handleResizePointerDown(e, 'n', object)} />
                  <div className="eng-handle eng-handle-ne" onPointerDown={(e) => handleResizePointerDown(e, 'ne', object)} />
                  <div className="eng-handle eng-handle-e"  onPointerDown={(e) => handleResizePointerDown(e, 'e', object)} />
                  <div className="eng-handle eng-handle-se" onPointerDown={(e) => handleResizePointerDown(e, 'se', object)} />
                  <div className="eng-handle eng-handle-s"  onPointerDown={(e) => handleResizePointerDown(e, 's', object)} />
                  <div className="eng-handle eng-handle-sw" onPointerDown={(e) => handleResizePointerDown(e, 'sw', object)} />
                  <div className="eng-handle eng-handle-w"  onPointerDown={(e) => handleResizePointerDown(e, 'w', object)} />
                </>
              )}

              {/* Sticky Note */}
              {object.type === 'sticky' && (
                <div className="eng-sticky" style={{ background: object.color, color: object.textColor, width: '100%', height: '100%' }}>
                  <div className="eng-sticky-header">
                    <span className="eng-sticky-author">{object.author || 'Insight'}</span>
                    <button
                      type="button"
                      className="eng-vote-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateObject(object.id, { votes: (object.votes || 0) + 1 });
                      }}
                    >
                      👍 {object.votes || 0}
                    </button>
                  </div>
                  <textarea
                    className="eng-sticky-textarea"
                    value={object.text}
                    onChange={(e) => updateObject(object.id, { text: e.target.value })}
                    placeholder="Type note..."
                    onPointerDown={(e) => e.stopPropagation()}
                  />
                </div>
              )}

              {/* Asset Card */}
              {object.type === 'card' && (
                <div className="eng-asset-card" style={{ width: '100%', height: '100%', borderColor: object.borderColor }}>
                  <div className="eng-asset-card-header">
                    <span className={`eng-asset-priority eng-priority-${(object.metadata?.priority || 'p2').toLowerCase()}`}>
                      {object.metadata?.priority || 'P2'}
                    </span>
                    <span className="eng-asset-status">{object.status || 'Planned'}</span>
                  </div>
                  <div className="eng-asset-card-body">
                    <textarea
                      className="eng-asset-title-input"
                      value={object.text}
                      onChange={(e) => updateObject(object.id, { text: e.target.value })}
                      placeholder="Work order title..."
                      onPointerDown={(e) => e.stopPropagation()}
                    />
                    <div className="eng-asset-meta-grid">
                      <span className="eng-asset-meta-item">Asset: <strong>{object.metadata?.asset || 'M-01'}</strong></span>
                      <span className="eng-asset-meta-item">Zone: <strong>{object.metadata?.zone || 'Yard'}</strong></span>
                      <span className="eng-asset-meta-item">Due: <strong>{object.metadata?.due || 'Today'}</strong></span>
                      <span className="eng-asset-meta-item">Tech: <strong>{object.owner || 'Unassigned'}</strong></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Shape */}
              {object.type === 'shape' && (
                <div
                  className={`eng-shape eng-shape-${object.shape || 'rect'}`}
                  style={{
                    background: object.color,
                    border: `${object.strokeWidth || 2}px solid ${object.borderColor}`,
                    color: object.textColor,
                    width: '100%',
                    height: '100%',
                  }}
                >
                  <textarea
                    className="w-full text-center bg-transparent border-none outline-none font-bold resize-none"
                    value={object.text}
                    onChange={(e) => updateObject(object.id, { text: e.target.value })}
                    onPointerDown={(e) => e.stopPropagation()}
                  />
                </div>
              )}

              {/* Connector Arrow */}
              {object.type === 'connector' && (
                <div className="relative flex items-center justify-center w-full h-full" style={{ borderTop: `3px solid ${object.borderColor}` }}>
                  <span className="absolute -top-3 px-1 text-[10px] font-bold bg-white text-slate-700 rounded border border-slate-200">
                    {object.text || 'relies on'}
                  </span>
                  <span className="absolute right-0 -top-1.5 w-0 h-0 border-y-4 border-y-transparent border-l-8 border-l-blue-600" />
                </div>
              )}

              {/* Frame */}
              {object.type === 'frame' && (
                <div className="eng-frame relative w-full h-full" style={{ background: object.color, borderColor: object.borderColor }}>
                  <div className="eng-frame-header">{object.text}</div>
                </div>
              )}

              {/* Table */}
              {object.type === 'table' && (
                <div className="eng-table-card w-full h-full flex flex-col">
                  <div className="eng-table-head">{object.text}</div>
                  <div className="eng-table-grid" style={{ '--wb-cols': object.metadata?.columns?.length || 4 }}>
                    {(object.metadata?.columns || []).map((col) => (
                      <span key={col} className="eng-table-cell eng-table-th">{col}</span>
                    ))}
                    {(object.metadata?.rows || []).flatMap((row, rIdx) =>
                      row.map((cell, cIdx) => (
                        <span key={`${rIdx}-${cIdx}`} className="eng-table-cell">{cell}</span>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Timeline */}
              {object.type === 'timeline' && (
                <div className="eng-timeline-card w-full h-full">
                  <div className="eng-timeline-header">⏱ {object.text}</div>
                  <div className="eng-timeline-steps">
                    {(object.metadata?.events || []).map((evt, idx) => (
                      <div key={`${evt}-${idx}`} className={`eng-timeline-step ${idx === 0 ? 'eng-timeline-step-done' : ''}`}>
                        <span>Step {idx + 1}</span>
                        <strong>{evt}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Text Label */}
              {object.type === 'text' && (
                <textarea
                  className="w-full h-full bg-transparent border-none outline-none font-bold text-slate-900 resize-none"
                  style={{ fontSize: `${object.fontSize || 20}px` }}
                  value={object.text}
                  onChange={(e) => updateObject(object.id, { text: e.target.value })}
                  onPointerDown={(e) => e.stopPropagation()}
                />
              )}

              {/* Freehand SVG Drawing */}
              {object.type === 'drawing' && (
                <svg className="w-full h-full overflow-visible pointer-events-none">
                  <path
                    d={(object.path || []).map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ')}
                    fill="none"
                    stroke={object.borderColor || '#0F172A'}
                    strokeWidth={object.strokeWidth || 3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Contextual Toolbar (Rendered above single selected object) */}
      {selectedObject && selectedIds.length === 1 && (
        <div
          className="eng-context-bar"
          style={{
            left: `${selectedObject.x * zoomLevel + panX + (selectedObject.width * zoomLevel) / 2}px`,
            top: `${selectedObject.y * zoomLevel + panY}px`,
          }}
        >
          <div className="eng-context-swatch-group">
            {SWATCH_PALETTE.slice(0, 5).map((swatch) => (
              <span
                key={swatch.color}
                className="eng-context-swatch"
                style={{ background: swatch.color }}
                onClick={() => updateObject(selectedObject.id, { color: swatch.color, borderColor: swatch.border, textColor: swatch.text })}
                title={swatch.label}
              />
            ))}
          </div>
          <span className="eng-context-divider" />
          {selectedObject.type === 'card' && (
            <button
              type="button"
              className="eng-context-btn eng-context-btn-primary"
              onClick={() => onConvertToTask({ title: selectedObject.text, dueTime: selectedObject.metadata?.due || '10:00' })}
            >
              📅 Convert to Task
            </button>
          )}
          <button
            type="button"
            className="eng-context-btn"
            onClick={() => duplicateObject(selectedObject.id)}
            title="Duplicate (Ctrl+D)"
          >
            Duplicate
          </button>
          <button
            type="button"
            className="eng-context-btn"
            onClick={() => updateObject(selectedObject.id, { locked: !selectedObject.locked })}
          >
            {selectedObject.locked ? 'Unlock' : 'Lock'}
          </button>
          <button
            type="button"
            className="eng-context-btn eng-context-btn-danger"
            onClick={() => deleteObject(selectedObject.id)}
            title="Delete (Del)"
          >
            Delete
          </button>
        </div>
      )}

      {/* Right Inspector Sidebar */}
      <aside className={`eng-inspector ${inspectorOpen ? '' : 'eng-inspector-collapsed'}`}>
        <div className="eng-inspector-header">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Inspector</h3>
          <Badge tone="info">{(state?.objects || []).length} Items</Badge>
        </div>
        <div className="eng-inspector-nav">
          <button
            type="button"
            className={`eng-inspector-tab ${inspectorTab === 'properties' ? 'eng-inspector-tab-active' : ''}`}
            onClick={() => setInspectorTab('properties')}
          >
            Properties
          </button>
          <button
            type="button"
            className={`eng-inspector-tab ${inspectorTab === 'layers' ? 'eng-inspector-tab-active' : ''}`}
            onClick={() => setInspectorTab('layers')}
          >
            Layers
          </button>
          <button
            type="button"
            className={`eng-inspector-tab ${inspectorTab === 'export' ? 'eng-inspector-tab-active' : ''}`}
            onClick={() => setInspectorTab('export')}
          >
            Export / Sync
          </button>
        </div>

        <div className="eng-inspector-content">
          {inspectorTab === 'properties' && selectedObject && (
            <>
              <div className="eng-inspector-section">
                <h4>Geometry & Position</h4>
                <div className="eng-inspector-grid-4">
                  <Field label="X"><input type="number" value={Math.round(selectedObject.x)} onChange={(e) => updateObject(selectedObject.id, { x: Number(e.target.value) || 0 })} /></Field>
                  <Field label="Y"><input type="number" value={Math.round(selectedObject.y)} onChange={(e) => updateObject(selectedObject.id, { y: Number(e.target.value) || 0 })} /></Field>
                  <Field label="W"><input type="number" value={Math.round(selectedObject.width)} onChange={(e) => updateObject(selectedObject.id, { width: Math.max(30, Number(e.target.value) || 30) })} /></Field>
                  <Field label="H"><input type="number" value={Math.round(selectedObject.height)} onChange={(e) => updateObject(selectedObject.id, { height: Math.max(30, Number(e.target.value) || 30) })} /></Field>
                </div>
              </div>

              <div className="eng-inspector-section">
                <h4>Styling & Colors</h4>
                <div className="eng-inspector-grid-2">
                  <Field label="Fill">
                    <div className="eng-inspector-color-row">
                      <input type="color" value={selectedObject.color?.startsWith('#') ? selectedObject.color : '#FFFFFF'} onChange={(e) => updateObject(selectedObject.id, { color: e.target.value })} />
                      <span className="text-xs font-mono">{selectedObject.color}</span>
                    </div>
                  </Field>
                  <Field label="Border">
                    <div className="eng-inspector-color-row">
                      <input type="color" value={selectedObject.borderColor?.startsWith('#') ? selectedObject.borderColor : '#2563EB'} onChange={(e) => updateObject(selectedObject.id, { borderColor: e.target.value })} />
                      <span className="text-xs font-mono">{selectedObject.borderColor}</span>
                    </div>
                  </Field>
                </div>
              </div>

              {selectedObject.type === 'card' && (
                <div className="eng-inspector-section">
                  <h4>Asset Metadata</h4>
                  <div className="eng-inspector-grid-2">
                    <Field label="Priority">
                      <select value={selectedObject.metadata?.priority || 'P2'} onChange={(e) => updateObject(selectedObject.id, { metadata: { ...selectedObject.metadata, priority: e.target.value } })}>
                        <option value="P1">P1 - Critical</option>
                        <option value="P2">P2 - High</option>
                        <option value="P3">P3 - Normal</option>
                        <option value="P4">P4 - Low</option>
                      </select>
                    </Field>
                    <Field label="Status">
                      <select value={selectedObject.status || 'Planned'} onChange={(e) => updateObject(selectedObject.id, { status: e.target.value })}>
                        <option value="Planned">Planned</option>
                        <option value="Ready">Ready</option>
                        <option value="In Progress">In Progress</option>
                        <option value="SLA Risk">SLA Risk</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </Field>
                  </div>
                </div>
              )}
            </>
          )}

          {inspectorTab === 'properties' && !selectedObject && (
            <div className="py-6 text-center text-xs text-slate-500">
              Select an object on the canvas to inspect its geometry, styling, and metadata.
            </div>
          )}

          {inspectorTab === 'layers' && (
            <div className="space-y-1">
              {(state?.objects || []).map((obj) => (
                <div
                  key={obj.id}
                  className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer border ${selectedIds.includes(obj.id) ? 'bg-blue-50 border-blue-300 font-bold' : 'bg-white border-slate-200'}`}
                  onClick={() => setSelectedIds([obj.id])}
                >
                  <span className="truncate">{obj.text || obj.type}</span>
                  <Badge tone="neutral">{obj.type}</Badge>
                </div>
              ))}
            </div>
          )}

          {inspectorTab === 'export' && (
            <div className="space-y-3">
              <Button type="button" variant="primary" className="w-full" onClick={exportJson}>
                Export Board JSON Backup
              </Button>
              <Button type="button" variant="secondary" className="w-full" onClick={() => importInputRef.current?.click()}>
                Import Board JSON
              </Button>
              <Button type="button" variant="danger" className="w-full" onClick={() => {
                if (window.confirm('Clear canvas?')) {
                  commit((curr) => ({ ...curr, objects: [] }));
                  onToast('Canvas cleared.');
                }
              }}>
                Clear All Canvas Objects
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Templates Modal */}
      {templateModalOpen && (
        <div className="eng-modal-backdrop" onClick={() => setTemplateModalOpen(false)}>
          <div className="eng-template-modal" onClick={(e) => e.stopPropagation()}>
            <div className="eng-template-modal-header">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Industrial Engineering Templates</h2>
                <p className="text-xs text-slate-500">Insert pre-configured maintenance, inspection, and diagnosis frameworks.</p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={() => setTemplateModalOpen(false)}>
                Close
              </Button>
            </div>
            <div className="eng-template-modal-body">
              {TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.key}
                  className="eng-template-card"
                  onClick={() => {
                    const newObjects = makeTemplateObjects(tmpl.key);
                    commit((curr) => ({ ...curr, objects: [...(curr.objects || []), ...newObjects] }));
                    setTemplateModalOpen(false);
                    onToast(`Inserted ${tmpl.title}`);
                  }}
                >
                  <div>
                    <Badge tone="info">{tmpl.badge}</Badge>
                    <h3 className="mt-2">{tmpl.title}</h3>
                    <p>{tmpl.description}</p>
                  </div>
                  <Button type="button" size="sm" variant="secondary">Insert Template</Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

