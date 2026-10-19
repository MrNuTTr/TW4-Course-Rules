// Deep links into the wiki. `card` is `info.<n>` for an overview card or `route.<route>.<n>` for a
// card in one of the page's route explorers; `from.<input>` and `to.<input>` carry the runway,
// area or entry picks that route needs to show that card.
export function wikiHref(wiki) {
  return `/wiki/${wiki.path}?${wiki.query}`;
}

export function parseFocus(search) {
  const params = new URLSearchParams(search);
  const card = params.get('card')?.split('.');
  if (!card) return null;
  const picks = { from: {}, to: {} };
  for (const [key, value] of params) {
    const [side, id] = key.split('.');
    if (id && picks[side]) picks[side][id] = value;
  }
  if (card[0] === 'info') return { info: Number(card[1]) };
  if (card[0] === 'route') return { route: Number(card[1]), card: Number(card[2]), picks };
  return null;
}
