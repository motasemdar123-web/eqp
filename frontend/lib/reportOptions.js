export const MACHINE_MODELS = [
  { value: 'AUTO', label: 'Auto' },
  { value: 'D155A', label: 'D155A' },
  { value: 'HM400', label: 'HM400' },
  { value: 'PC400', label: 'PC400' },
];

export const REPORT_TYPES = ['W30', 'W41', 'W41X'];

export const SERVICE_TYPES = [
  'Pre Delivery',
  'Delivery New',
  '1st Service',
  '2nd Service',
  '3rd Service',
  'Storage Service',
  'Add. Service',
];

function normalizeServiceType(serviceType) {
  return String(serviceType || '')
    .trim()
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ');
}

export function getRequiredReportType(serviceType) {
  const normalized = normalizeServiceType(serviceType);

  if (normalized === 'storage service') return 'W30';
  if (normalized === 'add service') return 'W41X';

  return null;
}
