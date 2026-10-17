// Wiki tree. `node` pulls in that place's info cards; `routes` lists the legs
// shown as explorers on the page. A route may fix or restrict input options
// (`fixedTo`, `filterFrom`...) so one leg file can serve several pages.
const r = (from, to, extra = {}) => ({ from, to, ...extra });

const NORTH_AREAS = ['Area 1', 'Area 2', 'Area 5', 'Area 6'];
const SOUTH_AREAS = ['Area 3', 'Area 4', 'Area 7', 'Area 8'];

export const WIKI_TREE = [
  {
    slug: 'taxi',
    title: 'Taxi',
    children: [
      { slug: 'north-flow', title: 'North Flow – Outbound' },
      { slug: 'south-flow', title: 'South Flow – Outbound' },
    ],
  },
  {
    slug: 'departures',
    title: 'Departures',
    children: [
      {
        slug: 'rusty',
        title: 'Rusty Departure',
        routes: [r('kngp', 'kings4'), r('kngp', 'goliad'), r('kngp', 'ingleside')],
      },
      {
        slug: 'beach-line',
        title: 'Beach Line Departure',
        routes: [
          r('kngp', 'mustang'),
          r('kngp', 'foxtrot'),
          r('kngp', 'waldron', { fixedTo: { route: 'Course rules' } }),
          r('kngp', 'acounty'),
        ],
      },
    ],
  },
  {
    slug: 'working-areas',
    title: 'Working Areas',
    children: [
      {
        slug: 'kings-4',
        title: 'KINGS 4',
        node: 'kings4',
        routes: [
          r('kngp', 'kings4'),
          r('goliad', 'kings4'),
          r('kings4', 'kngp'),
          r('kings4', 'goliad'),
          r('kings4', 'acounty'),
        ],
      },
      {
        slug: 'mustang',
        title: 'Mustang',
        node: 'mustang',
        routes: [
          r('kngp', 'mustang'),
          r('mustang', 'kngp'),
          r('mustang', 'acounty'),
          r('mustang', 'ingleside'),
          r('mustang', 'waldron'),
        ],
        children: [
          {
            slug: 'north',
            title: 'Mustang North',
            routes: [
              r('kngp', 'mustang', { filterTo: { area: NORTH_AREAS } }),
              r('mustang', 'kngp', { filterFrom: { area: NORTH_AREAS } }),
              r('mustang', 'acounty', { filterFrom: { area: NORTH_AREAS } }),
              r('mustang', 'ingleside', { filterFrom: { area: NORTH_AREAS } }),
              r('mustang', 'waldron', { filterFrom: { area: NORTH_AREAS } }),
            ],
          },
          {
            slug: 'central',
            title: 'Mustang Central',
            routes: [
              r('kngp', 'mustang', { fixedTo: { area: 'Central' } }),
              r('mustang', 'kngp', { fixedFrom: { area: 'Central' } }),
            ],
          },
          {
            slug: 'south',
            title: 'Mustang South',
            routes: [
              r('kngp', 'mustang', { filterTo: { area: SOUTH_AREAS } }),
              r('mustang', 'kngp', { filterFrom: { area: SOUTH_AREAS } }),
              r('mustang', 'ingleside', { filterFrom: { area: SOUTH_AREAS } }),
              r('mustang', 'waldron', { filterFrom: { area: SOUTH_AREAS } }),
            ],
          },
        ],
      },
      {
        slug: 'foxtrot',
        title: 'Foxtrot',
        node: 'foxtrot',
        routes: [
          r('kngp', 'foxtrot'),
          r('foxtrot', 'kngp'),
          r('foxtrot', 'acounty'),
          r('foxtrot', 'ingleside'),
          r('foxtrot', 'waldron'),
        ],
      },
    ],
  },
  {
    slug: 'outlying-fields',
    title: 'Outlying Fields',
    children: [
      {
        slug: 'aransas-county',
        title: 'Aransas County',
        node: 'acounty',
        routes: [
          r('kngp', 'acounty'),
          r('goliad', 'acounty'),
          r('kings4', 'acounty'),
          r('foxtrot', 'acounty'),
          r('acounty', 'kngp'),
        ],
      },
      {
        slug: 'goliad',
        title: 'Goliad',
        node: 'goliad',
        routes: [
          r('kngp', 'goliad'),
          r('kings4', 'goliad'),
          r('goliad', 'kngp'),
          r('goliad', 'acounty'),
          r('goliad', 'ingleside'),
          r('goliad', 'kings4'),
        ],
      },
      {
        slug: 'ingleside',
        title: 'Ingleside',
        node: 'ingleside',
        routes: [
          r('kngp', 'ingleside'),
          r('goliad', 'ingleside'),
          r('mustang', 'ingleside'),
          r('foxtrot', 'ingleside'),
          r('ingleside', 'kngp'),
        ],
      },
      {
        slug: 'corpus-christi-intl',
        title: 'Corpus Christi Intl',
        node: 'kcrp',
        routes: [r('kngp', 'kcrp'), r('kcrp', 'kngp')],
      },
      {
        slug: 'waldron',
        title: 'Waldron',
        node: 'waldron',
        routes: [
          r('kngp', 'waldron', { fixedTo: { route: 'Course rules' } }),
          r('mustang', 'waldron'),
          r('foxtrot', 'waldron'),
          r('waldron', 'kngp', { fixedTo: { route: 'Course rules' } }),
        ],
      },
    ],
  },
  {
    slug: 'arrivals',
    title: 'Arrivals',
    children: [
      {
        slug: 'goliad-northern',
        title: 'Goliad / Northern',
        routes: [
          r('goliad', 'kngp'),
          r('kings4', 'kngp'),
          r('acounty', 'kngp'),
          r('ingleside', 'kngp'),
          r('foxtrot', 'kngp'),
          r('mustang', 'kngp', { filterFrom: { area: NORTH_AREAS } }),
        ],
      },
      {
        slug: 'southern',
        title: 'Southern Arrival',
        routes: [
          r('waldron', 'kngp', { fixedTo: { route: 'Course rules' } }),
          r('mustang', 'kngp', { filterFrom: { area: SOUTH_AREAS } }),
        ],
      },
      {
        slug: 'eastern',
        title: 'Eastern Arrival',
        routes: [r('mustang', 'kngp', { fixedFrom: { area: 'Central' } })],
      },
      {
        slug: 'shamrock',
        title: 'Shamrock Re-entry',
        node: 'reentry',
        routes: [r('kngp', 'reentry')],
      },
      {
        slug: 'oso-transition',
        title: 'Oso Transition',
        routes: [
          r('kngp', 'waldron', { fixedTo: { route: 'Oso Transition' } }),
          r('waldron', 'kngp', { fixedTo: { route: 'Oso Transition' } }),
        ],
      },
      {
        slug: 'sunrise-transition',
        title: 'Sunrise Transition',
        routes: [r('waldron', 'kngp', { fixedTo: { route: 'Sunrise Transition' } })],
      },
      {
        slug: 'nueces-transition',
        title: 'Nueces Transition',
        routes: [r('kngp', 'kcrp'), r('kcrp', 'kngp', { fixedTo: { route: 'Nueces Transition' } })],
      },
    ],
  },
];

export function flattenWiki(tree = WIKI_TREE, parents = []) {
  return tree.flatMap((item) => {
    const path = [...parents, item.slug];
    return [
      { ...item, path: path.join('/'), trail: [...parents] },
      ...(item.children ? flattenWiki(item.children, path) : []),
    ];
  });
}

export function findWikiPage(path) {
  return flattenWiki().find((page) => page.path === path);
}
