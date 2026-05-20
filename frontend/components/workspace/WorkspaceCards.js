import Link from 'next/link';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export const taskStatuses = [
  { value: 'todo', label: 'Todo' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'blocked', label: 'Blocked' },
];

export const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export function priorityTone(priority) {
  if (priority === 'critical') return 'critical';
  if (priority === 'high') return 'warning';
  if (priority === 'low') return 'neutral';
  return 'info';
}

export function statusTone(status) {
  if (status === 'done') return 'completed';
  if (status === 'blocked') return 'critical';
  if (status === 'in_progress') return 'live';
  if (status === 'archived') return 'archived';
  return 'pending';
}

export function formatWorkspaceDate(value) {
  if (!value) return 'No date';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: value.includes('T') ? '2-digit' : undefined,
    minute: value.includes('T') ? '2-digit' : undefined,
  }).format(new Date(value));
}

export function tagsToText(tags = []) {
  return Array.isArray(tags) ? tags.join(', ') : String(tags || '');
}

export function textToTags(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function NoteCard({ note, onEdit, onArchive, onPin }) {
  const href = `/workspace/notes/${note.id}`;

  return (
    <article className="workspace-note-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={href} className="workspace-card-title">{note.title}</Link>
          <p className="mt-1 text-xs font-bold text-[var(--color-muted)]">
            {note.category || 'General'} / {note.author?.fullName || 'Engineering'} / {formatWorkspaceDate(note.updatedAt)}
          </p>
        </div>
        <Badge tone={note.isPinned ? 'info' : statusTone(note.status)}>{note.isPinned ? 'Pinned' : note.status}</Badge>
      </div>
      <p className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-[var(--color-muted)]">
        {note.excerpt || 'No note content yet.'}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {(note.tags || []).slice(0, 4).map((tag) => <Badge key={tag} tone="neutral">{tag}</Badge>)}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={href} className="ds-button ds-button-secondary ds-button-small">Open</Link>
        {onEdit && <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(note)}>Edit</Button>}
        {onPin && <Button type="button" variant="ghost" size="sm" onClick={() => onPin(note)}>{note.isPinned ? 'Unpin' : 'Pin'}</Button>}
        {onArchive && <Button type="button" variant="danger" size="sm" onClick={() => onArchive(note)}>Archive</Button>}
      </div>
    </article>
  );
}

export function TaskCard({ task, onStatusChange, onEdit, onDelete }) {
  return (
    <article className="workspace-task-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="workspace-card-title">{task.title}</p>
          <p className="mt-1 text-xs font-bold text-[var(--color-muted)]">
            {task.assignedTo?.fullName || task.createdBy?.fullName || 'Engineering'} / {formatWorkspaceDate(task.dueDate)}
          </p>
        </div>
        <Badge tone={priorityTone(task.priority)}>{task.priority}</Badge>
      </div>
      {task.description && <p className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-[var(--color-muted)]">{task.description}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone={statusTone(task.status)}>{task.status.replace('_', ' ')}</Badge>
        {(task.tags || []).slice(0, 3).map((tag) => <Badge key={tag} tone="neutral">{tag}</Badge>)}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {onStatusChange && (
          <select className="ds-input min-h-0 h-9 text-xs" value={task.status} onChange={(event) => onStatusChange(task, event.target.value)}>
            {taskStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
        )}
        {onEdit && <Button type="button" variant="secondary" size="sm" onClick={() => onEdit(task)}>Edit</Button>}
        {onDelete && <Button type="button" variant="danger" size="sm" onClick={() => onDelete(task)}>Delete</Button>}
      </div>
    </article>
  );
}

export function TemplateCard({ template, onUse, onEdit, onDelete }) {
  return (
    <article className="workspace-note-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="workspace-card-title">{template.title}</p>
          <p className="mt-1 text-xs font-bold text-[var(--color-muted)]">{template.category || 'Template'}</p>
        </div>
        <Badge tone={template.isSystem ? 'ready' : 'info'}>{template.isSystem ? 'System' : 'Custom'}</Badge>
      </div>
      <p className="mt-3 text-sm font-semibold leading-6 text-[var(--color-muted)]">{template.description || 'Reusable engineering template.'}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {(template.tags || []).slice(0, 4).map((tag) => <Badge key={tag} tone="neutral">{tag}</Badge>)}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => onUse(template)}>Create Note</Button>
        {onEdit && !template.isSystem && <Button type="button" variant="secondary" size="sm" onClick={() => onEdit(template)}>Edit</Button>}
        {onDelete && !template.isSystem && <Button type="button" variant="danger" size="sm" onClick={() => onDelete(template)}>Delete</Button>}
      </div>
    </article>
  );
}
