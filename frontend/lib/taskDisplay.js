export const TASK_ACTIVE_STATUSES = ['PLANNED', 'CONFIRMED', 'ON_DUTY'];

const statusLabels = {
  ar: {
    PLANNED: 'مجدولة',
    CONFIRMED: 'مجدولة',
    ON_DUTY: 'قيد التنفيذ',
    OFF_DUTY: 'متوقفة',
    LEAVE: 'متوقفة',
    COMPLETED: 'مكتملة',
    CANCELLED: 'ملغاة',
  },
  en: {
    PLANNED: 'Scheduled',
    CONFIRMED: 'Scheduled',
    ON_DUTY: 'In progress',
    OFF_DUTY: 'On hold',
    LEAVE: 'On hold',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  },
};

const statusTones = {
  PLANNED: 'pending',
  CONFIRMED: 'info',
  ON_DUTY: 'warning',
  OFF_DUTY: 'neutral',
  LEAVE: 'warning',
  COMPLETED: 'completed',
  CANCELLED: 'critical',
};

const actionLabels = {
  ar: {
    start: 'بدء المهمة',
    continue: 'متابعة المهمة',
    view: 'عرض المهمة',
  },
  en: {
    start: 'Start task',
    continue: 'Continue task',
    view: 'View task',
  },
};

export function getTaskStatusLabel(status, locale = 'ar') {
  const labels = statusLabels[locale] || statusLabels.ar;
  return labels[status] || labels.PLANNED;
}

export function getTaskStatusTone(status) {
  return statusTones[status] || 'neutral';
}

export function getTaskActionLabel(status, locale = 'ar') {
  const labels = actionLabels[locale] || actionLabels.ar;
  if (status === 'ON_DUTY') return labels.continue;
  if (status === 'COMPLETED' || status === 'CANCELLED') return labels.view;
  return labels.start;
}

export function isTaskCompleted(task) {
  return task?.status === 'COMPLETED';
}

export function isTaskInProgress(task) {
  return task?.status === 'ON_DUTY';
}

export function isTaskOverdue(task, now = new Date()) {
  if (!task || isTaskCompleted(task)) return false;
  const dateText = String(task.workDate || '').slice(0, 10);
  const endTime = task.endsAt || task.startsAt;
  if (!dateText || !endTime) return false;
  const dueDate = new Date(`${dateText}T${endTime}:00`);
  return !Number.isNaN(dueDate.getTime()) && dueDate < now;
}

export function getTaskDisplayStatus(task, locale = 'ar') {
  if (isTaskOverdue(task)) {
    return { label: locale === 'en' ? 'Overdue' : 'متأخرة', tone: 'critical' };
  }

  return {
    label: getTaskStatusLabel(task?.status, locale),
    tone: getTaskStatusTone(task?.status),
  };
}

export function formatArabicDate(value) {
  if (!value) return '-';
  const dateText = String(value).slice(0, 10);
  return new Intl.DateTimeFormat('ar-SA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${dateText}T00:00:00`));
}
