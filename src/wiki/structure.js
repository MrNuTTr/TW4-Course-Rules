// Wiki skeleton. `node` links a page to a data node once content is filled in.
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
      { slug: 'rusty', title: 'Rusty Departure' },
      { slug: 'beach-line', title: 'Beach Line Departure' },
    ],
  },
  {
    slug: 'working-areas',
    title: 'Working Areas',
    children: [
      { slug: 'kings-4', title: 'KINGS 4', node: 'kings4' },
      {
        slug: 'mustang',
        title: 'Mustang',
        node: 'mustang',
        children: [
          { slug: 'north', title: 'Mustang North' },
          { slug: 'central', title: 'Mustang Central' },
          { slug: 'south', title: 'Mustang South' },
        ],
      },
      { slug: 'foxtrot', title: 'Foxtrot', node: 'foxtrot' },
    ],
  },
  {
    slug: 'outlying-fields',
    title: 'Outlying Fields',
    children: [
      { slug: 'aransas-county', title: 'Aransas County', node: 'acounty' },
      { slug: 'goliad', title: 'Goliad', node: 'goliad' },
      { slug: 'ingleside', title: 'Ingleside', node: 'ingleside' },
      { slug: 'corpus-christi-intl', title: 'Corpus Christi Intl', node: 'kcrp' },
      { slug: 'shamrock', title: 'Shamrock Re-entry', node: 'reentry' },
      { slug: 'waldron', title: 'Waldron', node: 'waldron' },
    ],
  },
  {
    slug: 'arrivals',
    title: 'Arrivals',
    children: [
      { slug: 'goliad-northern', title: 'Goliad / Northern' },
      { slug: 'southern', title: 'Southern Arrival' },
      { slug: 'eastern', title: 'Eastern Arrival' },
      { slug: 'oso-transition', title: 'Oso Transition' },
      { slug: 'sunrise-transition', title: 'Sunrise Transition' },
      { slug: 'nueces-transition', title: 'Nueces Transition' },
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
