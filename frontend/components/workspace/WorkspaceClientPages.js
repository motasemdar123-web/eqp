'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import WorkspaceShell from './WorkspaceShell';
import {
  NoteCard,
  TaskCard,
  TemplateCard,
  formatWorkspaceDate,
  statusTone,
  taskStatuses,
  priorities,
  tagsToText,
  textToTags,
} from './WorkspaceCards';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Field from '../ui/Field';
import EmptyState from '../ui/EmptyState';
import Skeleton from '../ui/Skeleton';
import Toast from '../ui/Toast';
import {
  archiveWorkspaceNote,
  createWorkspaceNote,
  createWorkspaceTask,
  createWorkspaceTemplate,
  deleteWorkspaceTask,
  deleteWorkspaceTemplate,
  getWorkspaceNote,
  getWorkspaceNotes,
  getWorkspaceSummary,
  getWorkspaceTasks,
  getWorkspaceTemplates,
  updateWorkspaceNote,
  updateWorkspaceTask,
  updateWorkspaceTemplate,
} from '../../lib/api';

const emptyNoteForm = {
  title: '',
  category: '',
  tags: '',
  visibility: 'private',
  content: '',
  isPinned: false,
};

const emptyTaskForm = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
  tags: '',
  linkedMachineId: '',
  linkedTechnicianId: '',
  linkedReportId: '',
};

const emptyTemplateForm = {
  title: '',
  category: '',
  description: '',
  tags: '',
  content: '',
};

const blockTypes = [
  { value: 'heading', label: 'Heading' },
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'bullet', label: 'Bullet' },
  { value: 'checklist', label: 'Checklist' },
  { value: 'callout', label: 'Callout' },
  { value: 'divider', label: 'Divider' },
  { value: 'table', label: 'Table' },
];

function contentFromText(text) {
  const lines = String(text || '').split('\n');
  return {
    blocks: (lines.length ? lines : ['']).map((line) => ({
      type: 'paragraph',
      text: line,
    })),
  };
}

function textFromContent(content) {
  const blocks = Array.isArray(content?.blocks) ? content.blocks : [];
  return blocks.map((block) => block.text || '').join('\n');
}

function noteFormFromNote(note) {
  return {
    title: note.title || '',
    category: note.category || '',
    tags: tagsToText(note.tags),
    visibility: note.visibility || 'private',
    content: textFromContent(note.content),
    isPinned: Boolean(note.isPinned),
  };
}

function notePayloadFromForm(form, type = 'note') {
  return {
    title: form.title,
    category: form.category || null,
    tags: textToTags(form.tags),
    visibility: form.visibility,
    isPinned: form.isPinned,
    type,
    status: 'active',
    content: contentFromText(form.content),
  };
}

function taskPayloadFromForm(form) {
  return {
    title: form.title,
    description: form.description || null,
    status: form.status,
    priority: form.priority,
    dueDate: form.dueDate || null,
    tags: textToTags(form.tags),
    linkedMachineId: form.linkedMachineId || null,
    linkedTechnicianId: form.linkedTechnicianId || null,
    linkedReportId: form.linkedReportId || null,
  };
}

function templatePayloadFromForm(form) {
  return {
    title: form.title,
    category: form.category || null,
    description: form.description || null,
    tags: textToTags(form.tags),
    content: contentFromText(form.content),
  };
}

function formatInputDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function sameDay(value, target) {
  if (!value) return false;
  const date = new Date(value);
  return date.getFullYear() === target.getFullYear()
    && date.getMonth() === target.getMonth()
    && date.getDate() === target.getDate();
}

function withinWeek(value, target) {
  if (!value) return false;
  const date = new Date(value);
  const start = new Date(target);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return date >= start && date < end;
}

function WorkspaceStats({ stats = {} }) {
  const items = [
    { label: 'Notes', value: stats.notes || 0, detail: 'Active technical notes', code: 'NT', tone: 'info' },
    { label: 'Open Tasks', value: stats.openTasks || 0, detail: 'Todo / in progress / blocked', code: 'TK', tone: 'pending' },
    { label: 'Done Today', value: stats.completedToday || 0, detail: 'Completed engineering tasks', code: 'DN', tone: 'completed' },
    { label: 'Pinned Knowledge', value: stats.pinnedKnowledge || 0, detail: 'Critical references', code: 'KB', tone: 'ready' },
    { label: 'Critical Items', value: stats.criticalItems || 0, detail: 'Needs attention', code: 'CR', tone: 'critical' },
  ];

  return (
    <div className="workspace-stats-grid">
      {items.map((item) => (
        <article key={item.label} className="workspace-stat-card">
          <div className="ds-icon-tile ds-icon-tile-accent">{item.code}</div>
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="workspace-stat-label">{item.label}</p>
              <Badge tone={item.tone}>{item.tone === 'critical' ? 'Watch' : 'Live'}</Badge>
            </div>
            <p className="workspace-stat-value">{item.value}</p>
            <p className="workspace-stat-detail">{item.detail}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function WorkspaceCardHeader({ title, description, action }) {
  return (
    <div className="workspace-card-header">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-24" />
      <Skeleton className="h-52" />
    </div>
  );
}

function ErrorPanel({ message, onRetry }) {
  return (
    <div className="ds-alert ds-alert-error">
      <strong>{message || 'Failed to load workspace data.'}</strong>
      {onRetry && <Button type="button" variant="secondary" size="sm" onClick={onRetry}>Retry</Button>}
    </div>
  );
}

function TaskForm({ form, setForm, onSubmit, submitLabel = 'Save Task', saving = false, onCancel }) {
  return (
    <form className="workspace-form-grid" onSubmit={onSubmit}>
      <Field label="Task title">
        <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Inspect hydraulic oil temperature" required />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Status">
          <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
            {taskStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
        </Field>
        <Field label="Priority">
          <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}>
            {priorities.map((priority) => <option key={priority.value} value={priority.value}>{priority.label}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Due date / time">
        <input type="datetime-local" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} />
      </Field>
      <Field label="Description">
        <textarea rows={4} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Context, constraints, measurements, or follow-up notes." />
      </Field>
      <Field label="Tags">
        <input value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} placeholder="hydraulic, D155A, inspection" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Machine ID">
          <input value={form.linkedMachineId} onChange={(event) => setForm((current) => ({ ...current, linkedMachineId: event.target.value }))} placeholder="Optional" />
        </Field>
        <Field label="Technician ID">
          <input value={form.linkedTechnicianId} onChange={(event) => setForm((current) => ({ ...current, linkedTechnicianId: event.target.value }))} placeholder="Optional" />
        </Field>
        <Field label="Report ID">
          <input value={form.linkedReportId} onChange={(event) => setForm((current) => ({ ...current, linkedReportId: event.target.value }))} placeholder="Optional" />
        </Field>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : submitLabel}</Button>
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}

function NoteForm({ mode = 'note', form, setForm, onSubmit, submitLabel, saving, onCancel }) {
  return (
    <form className="workspace-form-grid" onSubmit={onSubmit}>
      <Field label={mode === 'knowledge' ? 'Article title' : 'Note title'}>
        <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder={mode === 'knowledge' ? 'Standard hydraulic inspection checklist' : 'Hydraulic overheating investigation'} required />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Category">
          <input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} placeholder="Troubleshooting" />
        </Field>
        <Field label="Visibility">
          <select value={form.visibility} onChange={(event) => setForm((current) => ({ ...current, visibility: event.target.value }))}>
            <option value="private">Private</option>
            <option value="team">Team</option>
          </select>
        </Field>
      </div>
      <Field label="Tags">
        <input value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} placeholder="hydraulic, troubleshooting, D155A" />
      </Field>
      <Field label="Content">
        <textarea rows={7} value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} placeholder="Write observations, decisions, checklists, and next actions." />
      </Field>
      <label className="workspace-check-row">
        <input type="checkbox" checked={form.isPinned} onChange={(event) => setForm((current) => ({ ...current, isPinned: event.target.checked }))} />
        Pin this item
      </label>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : submitLabel}</Button>
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}

export function WorkspaceHomePage() {
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadWorkspace() {
    setLoading(true);
    setError('');
    try {
      const data = await getWorkspaceSummary();
      setWorkspace(data.workspace);
    } catch (loadError) {
      setError(loadError.message || 'Failed to load workspace.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadWorkspace, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <WorkspaceShell
      title="Engineering Workspace"
      description="Organize ideas, plan daily tasks, document observations, and build shared maintenance knowledge."
      actions={(
        <div className="flex flex-wrap gap-2">
          <Link href="/workspace/notes" className="ds-button ds-button-primary">New Note</Link>
          <Link href="/workspace/planner" className="ds-button ds-button-secondary">New Task</Link>
          <Link href="/workspace/templates" className="ds-button ds-button-ghost">Templates</Link>
        </div>
      )}
    >
      {loading ? <LoadingPanel /> : error ? <ErrorPanel message={error} onRetry={loadWorkspace} /> : (
        <>
          <WorkspaceStats stats={workspace?.stats} />

          <div className="workspace-home-grid">
            <Card className="workspace-panel">
              <WorkspaceCardHeader title="Today's Plan" description="Current work that needs engineering attention." action={<Link href="/workspace/planner" className="ds-button ds-button-secondary ds-button-small">Open My Day</Link>} />
              <div className="workspace-list">
                {(workspace?.openTasks || []).slice(0, 5).map((task) => <TaskCard key={task.id} task={task} />)}
                {(workspace?.openTasks || []).length === 0 && <EmptyState title="No open tasks" description="Create a task to start planning today's engineering work." />}
              </div>
            </Card>

            <Card className="workspace-panel">
              <WorkspaceCardHeader title="Recent Notes" description="Latest observations and engineering decisions." action={<Link href="/workspace/notes" className="ds-button ds-button-secondary ds-button-small">View Notes</Link>} />
              <div className="workspace-list">
                {(workspace?.recentNotes || []).slice(0, 4).map((note) => <NoteCard key={note.id} note={note} />)}
                {(workspace?.recentNotes || []).length === 0 && <EmptyState title="No notes yet" description="Capture investigation notes, handovers, and ideas." />}
              </div>
            </Card>

            <Card className="workspace-panel">
              <WorkspaceCardHeader title="Pinned Notes" description="High-value references kept close." />
              <div className="workspace-list">
                {(workspace?.pinnedNotes || []).slice(0, 4).map((note) => <NoteCard key={note.id} note={note} />)}
                {(workspace?.pinnedNotes || []).length === 0 && <EmptyState title="Nothing pinned" description="Pin important notes or articles for quick access." />}
              </div>
            </Card>

            <Card className="workspace-panel">
              <WorkspaceCardHeader title="Knowledge Shortcuts" description="Reusable checklists and troubleshooting references." action={<Link href="/workspace/knowledge" className="ds-button ds-button-secondary ds-button-small">Open KB</Link>} />
              <div className="workspace-shortcut-grid">
                {(workspace?.knowledge || []).slice(0, 5).map((item) => (
                  <Link key={item.id} href={`/workspace/notes/${item.id}`} className="workspace-shortcut">
                    <span>{item.category || 'Article'}</span>
                    <strong>{item.title}</strong>
                  </Link>
                ))}
              </div>
            </Card>

            <Card className="workspace-panel workspace-activity-panel">
              <WorkspaceCardHeader title="Recent Activity" description="Workspace changes across notes, tasks, and templates." />
              <div className="workspace-activity-list">
                {(workspace?.activity || []).slice(0, 8).map((item) => (
                  <div key={item.id} className="workspace-activity-row">
                    <span className="workspace-activity-dot" />
                    <span>
                      <strong>{item.action}</strong>
                      <small>{item.user?.fullName || 'Workspace'} / {formatWorkspaceDate(item.createdAt)}</small>
                    </span>
                  </div>
                ))}
                {(workspace?.activity || []).length === 0 && <EmptyState title="No activity yet" description="Workspace actions will appear here." />}
              </div>
            </Card>
          </div>
        </>
      )}
    </WorkspaceShell>
  );
}

function WorkspaceCollectionPage({ type = 'note', archived = false }) {
  const isKnowledge = type === 'knowledge';
  const title = archived ? 'Archived Workspace' : isKnowledge ? 'Knowledge Base' : 'Engineering Notes';
  const description = archived
    ? 'Review archived notes and knowledge articles, then restore anything that becomes relevant again.'
    : isKnowledge
      ? 'Build reusable SOPs, troubleshooting guides, safety procedures, and lessons learned.'
      : 'Create, edit, pin, archive, search, and organize technical engineering notes.';
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [form, setForm] = useState(emptyNoteForm);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  async function loadItems() {
    setLoading(true);
    setError('');
    try {
      const data = await getWorkspaceNotes({
        type,
        search,
        category,
        status: archived ? 'archived' : '',
      });
      setItems(data.notes || []);
    } catch (loadError) {
      setError(loadError.message || 'Failed to load workspace content.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadItems, 200);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, archived, search, category]);

  function startEdit(item) {
    setEditingItem(item);
    setForm(noteFormFromNote(item));
  }

  function resetForm() {
    setEditingItem(null);
    setForm(emptyNoteForm);
  }

  async function saveItem(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = notePayloadFromForm(form, type);
      if (editingItem) {
        await updateWorkspaceNote(editingItem.id, payload);
        setToast(isKnowledge ? 'Knowledge article updated.' : 'Note updated.');
      } else {
        await createWorkspaceNote(payload);
        setToast(isKnowledge ? 'Knowledge article created.' : 'Note created.');
      }
      resetForm();
      await loadItems();
    } catch (saveError) {
      setError(saveError.message || 'Failed to save item.');
    } finally {
      setSaving(false);
    }
  }

  async function archiveItem(item) {
    if (!window.confirm(`Archive "${item.title}"?`)) return;
    try {
      await archiveWorkspaceNote(item.id);
      setToast('Item archived.');
      await loadItems();
    } catch (archiveError) {
      setError(archiveError.message || 'Failed to archive item.');
    }
  }

  async function restoreItem(item) {
    try {
      await updateWorkspaceNote(item.id, { status: 'active' });
      setToast('Item restored.');
      await loadItems();
    } catch (restoreError) {
      setError(restoreError.message || 'Failed to restore item.');
    }
  }

  async function togglePin(item) {
    try {
      await updateWorkspaceNote(item.id, { isPinned: !item.isPinned });
      await loadItems();
    } catch (pinError) {
      setError(pinError.message || 'Failed to update pin.');
    }
  }

  return (
    <WorkspaceShell
      title={title}
      description={description}
      actions={<Link href={isKnowledge ? '/workspace/templates' : '/workspace/notes/new'} className="ds-button ds-button-primary">{isKnowledge ? 'Use Template' : 'New Note'}</Link>}
    >
      <Toast message={toast} onClose={() => setToast('')} />
      <div className="workspace-two-column">
        <div className="workspace-main-stack">
          <Card className="workspace-panel workspace-toolbar-panel">
            <div className="workspace-toolbar">
              <label className="workspace-search">
                <span>Search</span>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={isKnowledge ? 'Search SOPs, guides, checklists...' : 'Search notes, tags, categories...'} />
              </label>
              <label className="workspace-filter">
                <span>Category</span>
                <input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="All categories" />
              </label>
              <Badge tone={archived ? 'archived' : 'live'}>{items.length} Items</Badge>
            </div>
          </Card>

          {error && <ErrorPanel message={error} onRetry={loadItems} />}
          {loading ? <LoadingPanel /> : (
            <div className="workspace-card-grid">
              {items.map((item) => (
                <NoteCard
                  key={item.id}
                  note={item}
                  onEdit={archived ? null : startEdit}
                  onArchive={archived ? null : archiveItem}
                  onPin={archived ? null : togglePin}
                />
              ))}
              {items.length === 0 && <EmptyState title={archived ? 'No archived items' : 'No content found'} description="Adjust filters or create the first workspace item." />}
            </div>
          )}
        </div>

        <Card className="workspace-panel workspace-form-panel">
          <WorkspaceCardHeader
            title={editingItem ? `Edit ${isKnowledge ? 'Article' : 'Note'}` : `New ${isKnowledge ? 'Knowledge Article' : 'Note'}`}
            description={isKnowledge ? 'Capture reusable engineering procedures.' : 'Document observations, decisions, and next steps.'}
          />
          {archived ? (
            <div className="workspace-list">
              {items.map((item) => (
                <div key={item.id} className="workspace-mini-row">
                  <span>{item.title}</span>
                  <Button type="button" size="sm" variant="secondary" onClick={() => restoreItem(item)}>Restore</Button>
                </div>
              ))}
            </div>
          ) : (
            <NoteForm
              mode={type}
              form={form}
              setForm={setForm}
              onSubmit={saveItem}
              submitLabel={editingItem ? 'Update' : 'Create'}
              saving={saving}
              onCancel={editingItem ? resetForm : null}
            />
          )}
        </Card>
      </div>
    </WorkspaceShell>
  );
}

export function WorkspaceNotesPage() {
  return <WorkspaceCollectionPage type="note" />;
}

export function WorkspaceKnowledgePage() {
  return <WorkspaceCollectionPage type="knowledge" />;
}

export function WorkspaceArchivedPage() {
  const [notes, setNotes] = useState([]);
  const [knowledge, setKnowledge] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  async function loadArchived() {
    setLoading(true);
    setError('');
    try {
      const [noteData, knowledgeData] = await Promise.all([
        getWorkspaceNotes({ type: 'note', status: 'archived' }),
        getWorkspaceNotes({ type: 'knowledge', status: 'archived' }),
      ]);
      setNotes(noteData.notes || []);
      setKnowledge(knowledgeData.notes || []);
    } catch (loadError) {
      setError(loadError.message || 'Failed to load archive.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadArchived, 0);
    return () => clearTimeout(timer);
  }, []);

  async function restore(item) {
    try {
      await updateWorkspaceNote(item.id, { status: 'active' });
      setToast('Item restored.');
      await loadArchived();
    } catch (restoreError) {
      setError(restoreError.message || 'Failed to restore item.');
    }
  }

  return (
    <WorkspaceShell
      title="Archived"
      description="Recover archived engineering notes and knowledge articles when they become relevant again."
    >
      <Toast message={toast} onClose={() => setToast('')} />
      {error && <ErrorPanel message={error} onRetry={loadArchived} />}
      {loading ? <LoadingPanel /> : (
        <div className="workspace-two-panel">
          <Card className="workspace-panel">
            <WorkspaceCardHeader title="Archived Notes" description={`${notes.length} notes archived`} />
            <div className="workspace-list">
              {notes.map((note) => (
                <div key={note.id} className="workspace-mini-row">
                  <span>{note.title}</span>
                  <Button type="button" variant="secondary" size="sm" onClick={() => restore(note)}>Restore</Button>
                </div>
              ))}
              {notes.length === 0 && <EmptyState title="No archived notes" description="Archived notes will appear here." />}
            </div>
          </Card>
          <Card className="workspace-panel">
            <WorkspaceCardHeader title="Archived Knowledge" description={`${knowledge.length} articles archived`} />
            <div className="workspace-list">
              {knowledge.map((item) => (
                <div key={item.id} className="workspace-mini-row">
                  <span>{item.title}</span>
                  <Button type="button" variant="secondary" size="sm" onClick={() => restore(item)}>Restore</Button>
                </div>
              ))}
              {knowledge.length === 0 && <EmptyState title="No archived articles" description="Archived knowledge articles will appear here." />}
            </div>
          </Card>
        </div>
      )}
    </WorkspaceShell>
  );
}

export function WorkspaceNoteEditorPage() {
  const params = useParams();
  const router = useRouter();
  const noteId = params?.id;
  const isNew = noteId === 'new';
  const [note, setNote] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [status, setStatus] = useState('active');
  const [isPinned, setIsPinned] = useState(false);
  const [blocks, setBlocks] = useState([{ type: 'paragraph', text: '' }]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  async function loadNote() {
    if (isNew || !noteId) return;
    setLoading(true);
    setError('');
    try {
      const data = await getWorkspaceNote(noteId);
      const nextNote = data.note;
      setNote(nextNote);
      setTitle(nextNote.title || '');
      setCategory(nextNote.category || '');
      setTags(tagsToText(nextNote.tags));
      setVisibility(nextNote.visibility || 'private');
      setStatus(nextNote.status || 'active');
      setIsPinned(Boolean(nextNote.isPinned));
      setBlocks(Array.isArray(nextNote.content?.blocks) && nextNote.content.blocks.length ? nextNote.content.blocks : [{ type: 'paragraph', text: '' }]);
    } catch (loadError) {
      setError(loadError.message || 'Failed to load note.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadNote, 0);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId, isNew]);

  function updateBlock(index, patch) {
    setBlocks((current) => current.map((block, blockIndex) => (blockIndex === index ? { ...block, ...patch } : block)));
  }

  function addBlock(type = 'paragraph') {
    setBlocks((current) => [...current, { type, text: '' }]);
  }

  function removeBlock(index) {
    setBlocks((current) => current.filter((_, blockIndex) => blockIndex !== index));
  }

  async function saveNote() {
    setSaving(true);
    setError('');
    try {
      const payload = {
        title,
        category: category || null,
        tags: textToTags(tags),
        visibility,
        status,
        isPinned,
        type: note?.type || 'note',
        content: { blocks },
      };
      if (isNew) {
        const data = await createWorkspaceNote(payload);
        setToast('Note created.');
        router.replace(`/workspace/notes/${data.note.id}`);
      } else {
        await updateWorkspaceNote(noteId, payload);
        setToast('Note saved.');
        await loadNote();
      }
    } catch (saveError) {
      setError(saveError.message || 'Failed to save note.');
    } finally {
      setSaving(false);
    }
  }

  async function archiveNote() {
    if (isNew || !window.confirm(`Archive "${title}"?`)) return;
    try {
      await archiveWorkspaceNote(noteId);
      router.push('/workspace/notes');
    } catch (archiveError) {
      setError(archiveError.message || 'Failed to archive note.');
    }
  }

  return (
    <WorkspaceShell
      title={isNew ? 'New Note' : title || 'Note Editor'}
      description="Write structured engineering knowledge with lightweight blocks, checklists, and callouts."
      actions={(
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={saveNote} disabled={saving || !title.trim()}>{saving ? 'Saving...' : 'Save'}</Button>
          {!isNew && <Button type="button" variant="danger" onClick={archiveNote}>Archive</Button>}
        </div>
      )}
    >
      <Toast message={toast} onClose={() => setToast('')} />
      {loading ? <LoadingPanel /> : (
        <div className="workspace-editor-grid">
          <Card className="workspace-panel workspace-editor">
            {error && <ErrorPanel message={error} />}
            <input className="workspace-editor-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Untitled engineering note" />
            <div className="workspace-editor-meta">
              <Field label="Category">
                <input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Troubleshooting" />
              </Field>
              <Field label="Visibility">
                <select value={visibility} onChange={(event) => setVisibility(event.target.value)}>
                  <option value="private">Private</option>
                  <option value="team">Team</option>
                </select>
              </Field>
              <Field label="Status">
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </Field>
            </div>
            <Field label="Tags">
              <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="hydraulic, troubleshooting" />
            </Field>
            <label className="workspace-check-row">
              <input type="checkbox" checked={isPinned} onChange={(event) => setIsPinned(event.target.checked)} />
              Pin this note
            </label>

            <div className="workspace-block-toolbar">
              {blockTypes.map((type) => (
                <Button key={type.value} type="button" variant="secondary" size="sm" onClick={() => addBlock(type.value)}>{type.label}</Button>
              ))}
            </div>

            <div className="workspace-block-list">
              {blocks.map((block, index) => (
                <div key={`${block.type}-${index}`} className={`workspace-block workspace-block-${block.type}`}>
                  <select value={block.type} onChange={(event) => updateBlock(index, { type: event.target.value })} aria-label="Block type">
                    {blockTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                  {block.type === 'divider' ? (
                    <div className="workspace-divider-preview" />
                  ) : (
                    <textarea
                      rows={block.type === 'heading' ? 1 : 3}
                      value={block.text || ''}
                      onChange={(event) => updateBlock(index, { text: event.target.value })}
                      placeholder={block.type === 'table' ? 'Column A | Column B | Column C' : 'Write here...'}
                    />
                  )}
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeBlock(index)} disabled={blocks.length === 1}>Remove</Button>
                </div>
              ))}
            </div>
          </Card>

          <Card className="workspace-panel">
            <WorkspaceCardHeader title="Document Context" description="Linking fields are ready for machine, EQP report, and technician references." />
            <div className="workspace-meta-list">
              <div><span>Author</span><strong>{note?.author?.fullName || 'Engineering'}</strong></div>
              <div><span>Last edited</span><strong>{note?.updatedAt ? formatWorkspaceDate(note.updatedAt) : 'New draft'}</strong></div>
              <div><span>Status</span><Badge tone={statusTone(status)}>{status}</Badge></div>
              <div><span>Visibility</span><Badge tone={visibility === 'team' ? 'live' : 'neutral'}>{visibility}</Badge></div>
            </div>
          </Card>
        </div>
      )}
    </WorkspaceShell>
  );
}

export function WorkspacePlannerPage() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(emptyTaskForm);
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  async function loadTasks() {
    setLoading(true);
    setError('');
    try {
      const data = await getWorkspaceTasks();
      setTasks(data.tasks || []);
    } catch (loadError) {
      setError(loadError.message || 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadTasks, 0);
    return () => clearTimeout(timer);
  }, []);

  const grouped = useMemo(() => {
    const today = new Date();
    return {
      today: tasks.filter((task) => task.status !== 'done' && sameDay(task.dueDate, today)),
      week: tasks.filter((task) => task.status !== 'done' && !sameDay(task.dueDate, today) && withinWeek(task.dueDate, today)),
      completed: tasks.filter((task) => task.status === 'done').slice(0, 12),
    };
  }, [tasks]);

  function startEdit(task) {
    setEditingTask(task);
    setForm({
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      dueDate: formatInputDateTime(task.dueDate),
      tags: tagsToText(task.tags),
      linkedMachineId: task.linkedMachineId || '',
      linkedTechnicianId: task.linkedTechnicianId || '',
      linkedReportId: task.linkedReportId || '',
    });
  }

  function resetTaskForm() {
    setEditingTask(null);
    setForm(emptyTaskForm);
  }

  async function saveTask(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingTask) {
        await updateWorkspaceTask(editingTask.id, taskPayloadFromForm(form));
        setToast('Task updated.');
      } else {
        await createWorkspaceTask(taskPayloadFromForm(form));
        setToast('Task created.');
      }
      resetTaskForm();
      await loadTasks();
    } catch (saveError) {
      setError(saveError.message || 'Failed to save task.');
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(task, status) {
    try {
      await updateWorkspaceTask(task.id, { status });
      await loadTasks();
    } catch (statusError) {
      setError(statusError.message || 'Failed to update task.');
    }
  }

  return (
    <WorkspaceShell
      title="My Day"
      description="Plan daily engineering tasks, priorities, blockers, and follow-up work."
      actions={<Link href="/workspace/tasks" className="ds-button ds-button-secondary">Task Board</Link>}
    >
      <Toast message={toast} onClose={() => setToast('')} />
      <div className="workspace-two-column">
        <div className="workspace-main-stack">
          {error && <ErrorPanel message={error} onRetry={loadTasks} />}
          {loading ? <LoadingPanel /> : (
            <>
              <Card className="workspace-panel">
                <WorkspaceCardHeader title="Today" description="Tasks due today or needing immediate action." />
                <div className="workspace-list">
                  {grouped.today.map((task) => <TaskCard key={task.id} task={task} onStatusChange={updateStatus} onEdit={startEdit} />)}
                  {grouped.today.length === 0 && <EmptyState title="Today is clear" description="Add a due date to tasks that should appear in today's plan." />}
                </div>
              </Card>
              <Card className="workspace-panel">
                <WorkspaceCardHeader title="This Week" description="Upcoming engineering work." />
                <div className="workspace-list">
                  {grouped.week.map((task) => <TaskCard key={task.id} task={task} onStatusChange={updateStatus} onEdit={startEdit} />)}
                  {grouped.week.length === 0 && <EmptyState title="No weekly tasks" description="Upcoming tasks with due dates will appear here." />}
                </div>
              </Card>
              <Card className="workspace-panel">
                <WorkspaceCardHeader title="Completed" description="Recently completed engineering tasks." />
                <div className="workspace-list">
                  {grouped.completed.map((task) => <TaskCard key={task.id} task={task} onStatusChange={updateStatus} onEdit={startEdit} />)}
                  {grouped.completed.length === 0 && <EmptyState title="No completed tasks" description="Mark tasks done to build completion history." />}
                </div>
              </Card>
            </>
          )}
        </div>
        <Card className="workspace-panel workspace-form-panel">
          <WorkspaceCardHeader title={editingTask ? 'Edit Daily Task' : 'Quick Task'} description="Create a task, assign priority, and link future references." />
          <TaskForm form={form} setForm={setForm} onSubmit={saveTask} submitLabel={editingTask ? 'Update Task' : 'Create Task'} saving={saving} onCancel={editingTask ? resetTaskForm : null} />
        </Card>
      </div>
    </WorkspaceShell>
  );
}

export function WorkspaceTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(emptyTaskForm);
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  async function loadTasks() {
    setLoading(true);
    setError('');
    try {
      const data = await getWorkspaceTasks({ search, priority });
      setTasks(data.tasks || []);
    } catch (loadError) {
      setError(loadError.message || 'Failed to load task board.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadTasks, 200);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, priority]);

  async function createTask(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createWorkspaceTask(taskPayloadFromForm(form));
      setForm(emptyTaskForm);
      setToast('Task created.');
      await loadTasks();
    } catch (saveError) {
      setError(saveError.message || 'Failed to create task.');
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(task, status) {
    try {
      await updateWorkspaceTask(task.id, { status });
      await loadTasks();
    } catch (statusError) {
      setError(statusError.message || 'Failed to update task.');
    }
  }

  async function removeTask(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    try {
      await deleteWorkspaceTask(task.id);
      setToast('Task deleted.');
      await loadTasks();
    } catch (deleteError) {
      setError(deleteError.message || 'Failed to delete task.');
    }
  }

  const columns = [
    { value: 'todo', label: 'Todo' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
    { value: 'blocked', label: 'Blocked' },
  ];

  return (
    <WorkspaceShell
      title="Task Board"
      description="A compact Kanban board for engineering tasks, blockers, and completion tracking."
      actions={<Link href="/workspace/planner" className="ds-button ds-button-secondary">My Day</Link>}
    >
      <Toast message={toast} onClose={() => setToast('')} />
      <div className="workspace-two-column">
        <div className="workspace-main-stack">
          <Card className="workspace-panel workspace-toolbar-panel">
            <div className="workspace-toolbar">
              <label className="workspace-search">
                <span>Search</span>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks..." />
              </label>
              <label className="workspace-filter">
                <span>Priority</span>
                <select value={priority} onChange={(event) => setPriority(event.target.value)}>
                  <option value="">All priorities</option>
                  {priorities.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
            </div>
          </Card>
          {error && <ErrorPanel message={error} onRetry={loadTasks} />}
          {loading ? <LoadingPanel /> : (
            <div className="workspace-kanban">
              {columns.map((column) => {
                const columnTasks = tasks.filter((task) => task.status === column.value);
                return (
                  <section key={column.value} className="workspace-kanban-column">
                    <div className="workspace-kanban-head">
                      <span>{column.label}</span>
                      <Badge tone={statusTone(column.value)}>{columnTasks.length}</Badge>
                    </div>
                    <div className="workspace-list">
                      {columnTasks.map((task) => (
                        <TaskCard key={task.id} task={task} onStatusChange={updateStatus} onDelete={removeTask} />
                      ))}
                      {columnTasks.length === 0 && <div className="workspace-kanban-empty">No tasks</div>}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
        <Card className="workspace-panel workspace-form-panel">
          <WorkspaceCardHeader title="New Board Task" description="Create work and move it through Todo, In Progress, Done, or Blocked." />
          <TaskForm form={form} setForm={setForm} onSubmit={createTask} submitLabel="Create Task" saving={saving} />
        </Card>
      </div>
    </WorkspaceShell>
  );
}

export function WorkspaceTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState(emptyTemplateForm);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  async function loadTemplates() {
    setLoading(true);
    setError('');
    try {
      const data = await getWorkspaceTemplates();
      setTemplates(data.templates || []);
    } catch (loadError) {
      setError(loadError.message || 'Failed to load templates.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadTemplates, 0);
    return () => clearTimeout(timer);
  }, []);

  function startEdit(template) {
    setEditingTemplate(template);
    setForm({
      title: template.title || '',
      category: template.category || '',
      description: template.description || '',
      tags: tagsToText(template.tags),
      content: textFromContent(template.content),
    });
  }

  function resetTemplateForm() {
    setEditingTemplate(null);
    setForm(emptyTemplateForm);
  }

  async function saveTemplate(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingTemplate) {
        await updateWorkspaceTemplate(editingTemplate.id, templatePayloadFromForm(form));
        setToast('Template updated.');
      } else {
        await createWorkspaceTemplate(templatePayloadFromForm(form));
        setToast('Template created.');
      }
      resetTemplateForm();
      await loadTemplates();
    } catch (saveError) {
      setError(saveError.message || 'Failed to save template.');
    } finally {
      setSaving(false);
    }
  }

  async function useTemplate(template) {
    try {
      const data = await createWorkspaceNote({
        title: template.title,
        category: template.category,
        tags: template.tags,
        type: 'note',
        status: 'draft',
        visibility: 'private',
        content: template.content,
      });
      router.push(`/workspace/notes/${data.note.id}`);
    } catch (useError) {
      setError(useError.message || 'Failed to create note from template.');
    }
  }

  async function removeTemplate(template) {
    if (!window.confirm(`Delete template "${template.title}"?`)) return;
    try {
      await deleteWorkspaceTemplate(template.id);
      setToast('Template deleted.');
      await loadTemplates();
    } catch (deleteError) {
      setError(deleteError.message || 'Failed to delete template.');
    }
  }

  return (
    <WorkspaceShell
      title="Templates"
      description="Reusable structures for daily plans, handovers, investigations, inspections, and safety observations."
      actions={<Link href="/workspace/notes/new" className="ds-button ds-button-secondary">Blank Note</Link>}
    >
      <Toast message={toast} onClose={() => setToast('')} />
      <div className="workspace-two-column">
        <div className="workspace-main-stack">
          {error && <ErrorPanel message={error} onRetry={loadTemplates} />}
          {loading ? <LoadingPanel /> : (
            <div className="workspace-card-grid">
              {templates.map((template) => (
                <TemplateCard key={template.id} template={template} onUse={useTemplate} onEdit={startEdit} onDelete={removeTemplate} />
              ))}
            </div>
          )}
        </div>
        <Card className="workspace-panel workspace-form-panel">
          <WorkspaceCardHeader title={editingTemplate ? 'Edit Template' : 'New Template'} description="Create reusable engineering documentation patterns." />
          <form className="workspace-form-grid" onSubmit={saveTemplate}>
            <Field label="Title">
              <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Fault Investigation" required />
            </Field>
            <Field label="Category">
              <input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} placeholder="Troubleshooting" />
            </Field>
            <Field label="Description">
              <textarea rows={3} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="When engineers should use this template." />
            </Field>
            <Field label="Tags">
              <input value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} placeholder="fault, rca, safety" />
            </Field>
            <Field label="Template content">
              <textarea rows={7} value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} placeholder="Write each section on a new line." />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving}>{saving ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}</Button>
              {editingTemplate && <Button type="button" variant="ghost" onClick={resetTemplateForm}>Cancel</Button>}
            </div>
          </form>
        </Card>
      </div>
    </WorkspaceShell>
  );
}
