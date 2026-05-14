const ARABIC_STATUS_TO_INTERNAL = {
  'جديد': 'NEW',
  'قيد المراجعة': 'TRIAGED',
  'تم التعيين': 'ASSIGNED',
  'قيد التنفيذ': 'IN_PROGRESS',
  'معلق': 'ON_HOLD',
  'تم الإنجاز': 'COMPLETED',
  'مغلق': 'CLOSED',
  'أعيد فتحه': 'REOPENED',
  'ملغي': 'CANCELLED',
};

const INTERNAL_STATUS_TO_ARABIC = Object.fromEntries(
  Object.entries(ARABIC_STATUS_TO_INTERNAL).map(([arabic, internal]) => [internal, arabic])
);

function normalizeArabicStatus(label) {
  return ARABIC_STATUS_TO_INTERNAL[label] || label;
}

module.exports = {
  ARABIC_STATUS_TO_INTERNAL,
  INTERNAL_STATUS_TO_ARABIC,
  normalizeArabicStatus,
};
