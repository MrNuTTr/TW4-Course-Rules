// Brings a card opened from a quiz link into view, and again once the lazy map has settled the layout.
export function revealCard(element) {
  if (!element) return;
  element.scrollIntoView?.({ block: 'center' });
  window.setTimeout(() => element.scrollIntoView?.({ block: 'center' }), 600);
}
