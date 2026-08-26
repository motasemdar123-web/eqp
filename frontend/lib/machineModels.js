/**
 * Standard Komatsu Equipment Catalog for Work Orders, Scheduling, and Fleet Dispatch
 */

export const MACHINE_CATEGORIES = [
  {
    category: 'Excavators',
    models: [
      { id: 'PC210-10M0', label: 'Komatsu PC210-10M0 Excavator', shortName: 'PC210-10M0' },
      { id: 'PC350LC-8M0', label: 'Komatsu PC350LC-8M0 Excavator', shortName: 'PC350LC-8M0' },
      { id: 'PC400-8R', label: 'Komatsu PC400-8R Excavator', shortName: 'PC400-8R' },
      { id: 'PC500LC-10R', label: 'Komatsu PC500LC-10R Excavator', shortName: 'PC500LC-10R' },
    ],
  },
  {
    category: 'Wheel Loader',
    models: [
      { id: 'WA380-6R', label: 'Komatsu WA380-6R Wheel Loader', shortName: 'WA380-6R' },
      { id: 'WA480-6', label: 'Komatsu WA480-6 Wheel Loader', shortName: 'WA480-6' },
      { id: 'WA500-6', label: 'Komatsu WA500-6 Wheel Loader', shortName: 'WA500-6' },
    ],
  },
  {
    category: 'Motor Grader',
    models: [
      { id: 'GD555-5', label: 'Komatsu GD555-5 Motor Grader', shortName: 'GD555-5' },
      { id: 'GD675-5', label: 'Komatsu GD675-5 Motor Grader', shortName: 'GD675-5' },
      { id: 'GD705-5', label: 'Komatsu GD705-5 Motor Grader', shortName: 'GD705-5' },
      { id: 'GD755-5', label: 'Komatsu GD755-5 Motor Grader', shortName: 'GD755-5' },
    ],
  },
  {
    category: 'Dump Truck',
    models: [
      { id: 'HM400-3R', label: 'Komatsu HM400-3R Articulated Dump Truck', shortName: 'HM400-3R' },
    ],
  },
  {
    category: 'Bulldozer',
    models: [
      { id: 'D155A-6R', label: 'Komatsu D155A-6R Bulldozer', shortName: 'D155A-6R' },
    ],
  },
  {
    category: 'Other',
    models: [
      { id: 'OTHER', label: 'Other Machinery / Equipment', shortName: 'Other' },
    ],
  },
];

export const ALL_MACHINE_MODELS = MACHINE_CATEGORIES.flatMap((c) => c.models);

export function getMachineModelLabel(modelId) {
  if (!modelId) return 'General Machinery';
  const found = ALL_MACHINE_MODELS.find(
    (m) => m.id.toLowerCase() === String(modelId).toLowerCase() || m.shortName.toLowerCase() === String(modelId).toLowerCase()
  );
  return found ? found.label : modelId;
}
