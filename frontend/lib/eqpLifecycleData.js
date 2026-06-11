export const EQP_LIFECYCLE_RECORDS = [
  ['9635', 'D155A', '2024-03-16', '2024-03-17', '2024-05-19', '2024-09-05', '2025-01-10', '2026-01-26', 'W41X', 'Add. Service', 8, 12],
  ['9634', 'D155A', '2024-03-16', '2024-03-17', '2024-05-19', '2024-09-05', '2025-01-10', '2026-01-26', 'W41X', 'Add. Service', 8, 16],
  ['9631', 'D155A', '2024-03-16', '2024-03-17', '2024-05-19', '2024-09-05', '2025-01-10', '2026-01-26', 'W41X', 'Add. Service', 8, 14],
  ['9630', 'D155A', '2024-03-16', '2024-03-17', '2024-05-19', '2024-09-05', '2025-01-10', '2026-01-26', 'W41X', 'Add. Service', 8, 16],
  ['9590', 'D155A', '2024-02-28', '2024-02-29', '2024-04-24', '2024-09-05', '2025-01-10', '2026-01-26', 'W41X', 'Add. Service', 8, 17],
  ['9589', 'D155A', '2024-02-28', '2024-02-29', '2024-04-22', '2024-09-05', '2025-01-10', '2026-01-26', 'W41X', 'Add. Service', 8, 16],
  ['9586', 'D155A', '2024-02-28', '2024-02-29', '2024-04-22', '2024-09-05', '2025-01-10', '2026-01-26', 'W41X', 'Add. Service', 8, 16],
  ['9583', 'D155A', '2024-02-28', '2024-02-29', '2024-04-22', '2024-09-05', '2025-01-10', '2026-01-26', 'W41X', 'Add. Service', 8, 17],
  ['9582', 'D155A', '2024-02-28', '2024-02-29', '2024-04-22', '2024-09-05', '2025-01-10', '2026-01-26', 'W41X', 'Add. Service', 8, 17],
  ['9753', 'HM400', null, '2025-06-30', '2025-07-30', '2026-01-25', null, '2026-01-25', 'W412', '2nd Service', null, 12],
  ['9752', 'HM400', null, '2025-06-30', '2025-07-30', '2026-01-25', null, '2026-01-25', 'W412', '2nd Service', null, 12],
  ['9751', 'HM400', null, '2025-06-30', '2025-07-30', '2026-01-25', null, '2026-01-25', 'W412', '2nd Service', null, 12],
  ['9741', 'HM400', null, '2025-06-30', '2025-07-30', '2026-01-25', null, '2026-01-25', 'W412', '2nd Service', null, 12],
  ['9737', 'HM400', null, '2025-06-30', '2025-07-30', '2026-01-25', null, '2026-01-25', 'W412', '2nd Service', null, 12],
  ['9732', 'HM400', null, '2025-06-30', '2025-07-30', '2026-01-25', null, '2026-01-25', 'W412', '2nd Service', null, 12],
  ['9726', 'HM400', null, '2025-06-30', '2025-07-30', '2026-01-25', null, '2026-01-25', 'W412', '2nd Service', null, 12],
  ['9725', 'HM400', null, '2025-06-30', '2025-07-30', '2026-01-25', null, '2026-01-25', 'W412', '2nd Service', null, 12],
  ['9724', 'HM400', null, '2025-06-30', '2025-07-30', '2026-01-25', null, '2026-01-25', 'W412', '2nd Service', null, 12],
  ['9720', 'HM400', null, '2025-06-30', '2025-07-30', '2026-01-25', null, '2026-01-25', 'W412', '2nd Service', null, 12],
].map(([
  machineNumber,
  model,
  preDeliveryDate,
  deliveryDate,
  firstServiceDate,
  secondServiceDate,
  thirdServiceDate,
  latestReportDate,
  latestReportCode,
  latestReportType,
  latestSmr,
  addServiceCount,
]) => {
  const inAddServiceCycle = latestReportCode === 'W41X';
  const missingReports = [
    { label: 'Pre Delivery', missing: !preDeliveryDate },
    { label: 'Delivery', missing: !deliveryDate },
    { label: '1st Service', missing: !firstServiceDate },
    { label: '2nd Service', missing: !secondServiceDate },
    { label: '3rd Service', missing: !thirdServiceDate && latestReportCode !== 'W412' },
  ].filter((item) => item.missing).map((item) => item.label);

  return {
    machineNumber,
    model,
    preDeliveryDate,
    deliveryDate,
    firstServiceDate,
    secondServiceDate,
    thirdServiceDate,
    latestReportDate,
    latestReportCode,
    latestReportType,
    latestSmr,
    addServiceCount,
    missingReports,
    hasLifecycleGap: missingReports.length > 0,
    status: inAddServiceCycle ? 'Monthly add-service cycle' : 'Second service completed',
    statusTone: inAddServiceCycle ? 'yellow' : 'ready',
    nextAction: inAddServiceCycle
      ? 'Continue monthly Add. Service until the machine starts working.'
      : 'Plan 3rd Service around 10 months after delivery; add monthly service if not working.',
    milestones: [
      { label: 'Pre Delivery', date: preDeliveryDate, code: 'W41P' },
      { label: 'Delivery', date: deliveryDate, code: 'W41N' },
      { label: '1st Service', date: firstServiceDate, code: 'W411' },
      { label: '2nd Service', date: secondServiceDate, code: 'W412' },
      { label: '3rd Service', date: thirdServiceDate, code: 'W413' },
    ],
  };
});

export function formatLifecycleDate(value) {
  if (!value) return '-';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB');
}
