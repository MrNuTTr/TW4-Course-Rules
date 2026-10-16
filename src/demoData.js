export const STOP_CATEGORIES = {
  WORK_AREA: 'work-area',
  OLF: 'olf',
};

export const STOP_CATEGORY_LABELS = {
  [STOP_CATEGORIES.WORK_AREA]: 'High Work Area',
  [STOP_CATEGORIES.OLF]: 'OLF',
};

export const DEMO_RUNWAYS = ['13L', '31R', '18', '36'];

export const DEMO_STOPS = [
  { id: 'kings-4', name: 'Kings 4', category: STOP_CATEGORIES.WORK_AREA },
  { id: 'mustang', name: 'Mustang', category: STOP_CATEGORIES.WORK_AREA },
  { id: 'waldron', name: 'Waldron', category: STOP_CATEGORIES.WORK_AREA },
  { id: 'goliad-nolf', name: 'Goliad NOLF', category: STOP_CATEGORIES.OLF },
  { id: 'chase-nolf', name: 'Chase NOLF', category: STOP_CATEGORIES.OLF },
];
