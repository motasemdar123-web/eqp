const LIFECYCLE_REPORT_COUNTS = {
  9582: { W41X: 17 },
  9583: { W41X: 17 },
  9586: { W41X: 16 },
  9589: { W41X: 16 },
  9590: { W41X: 17 },
  9630: { W41X: 16 },
  9631: { W41X: 14 },
  9634: { W41X: 16 },
  9635: { W41X: 12 },
  9720: { W30: 7, W41X: 5 },
  9724: { W30: 7, W41X: 5 },
  9725: { W30: 7, W41X: 5 },
  9726: { W30: 7, W41X: 5 },
  9732: { W30: 7, W41X: 5 },
  9737: { W30: 7, W41X: 5 },
  9741: { W30: 7, W41X: 5 },
  9751: { W30: 7, W41X: 5 },
  9752: { W30: 7, W41X: 5 },
  9753: { W30: 7, W41X: 5 },
  88685: { W30: 1, W41X: 27 },
  88687: { W30: 1, W41X: 27 },
  88695: { W30: 1, W41X: 30 },
  88696: { W30: 1, W41X: 21 },
  88701: { W30: 3, W41X: 22 },
  88704: { W30: 2, W41X: 21 },
  88726: { W30: 2, W41X: 21 },
  88727: { W30: 2, W41X: 21 },
  88728: { W30: 2, W41X: 21 },
  88729: { W30: 2, W41X: 17 },
  88762: { W30: 9, W41X: 16 },
  88763: { W30: 9, W41X: 16 },
  88764: { W30: 9, W41X: 16 },
  88765: { W30: 9, W41X: 12 },
  88766: { W30: 9, W41X: 16 },
  88767: { W30: 9, W41X: 16 },
};

function getLifecycleReportCount(machineNumber, reportType) {
  const counts = LIFECYCLE_REPORT_COUNTS[String(machineNumber)] || {};
  return counts[reportType] || 0;
}

module.exports = {
  LIFECYCLE_REPORT_COUNTS,
  getLifecycleReportCount,
};
