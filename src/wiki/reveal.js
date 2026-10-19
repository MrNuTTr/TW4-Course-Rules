// Brings a card opened from a quiz link into view, and again once the lazy map has settled the layout.
export function revealCard(element) {
  if (!element) return;
  element.scrollIntoView?.({ block: 'center' });
  window.setTimeout(() => element.scrollIntoView?.({ block: 'center' }), 600);
}

// A short eased scroll that takes the same time at any distance (the browser's own smooth scroll
// slows down on long pages). `offset` leaves room for the sticky header.
export function scrollToElement(element, { offset = 72, duration = 450 } = {}) {
  if (!element) return;
  const start = window.scrollY;
  const distance = Math.max(0, element.getBoundingClientRect().top + start - offset) - start;
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!distance || reduceMotion) {
    window.scrollTo(0, start + distance);
    return;
  }
  const began = performance.now();
  const step = (now) => {
    const progress = Math.min(1, (now - began) / duration);
    window.scrollTo(0, start + distance * (1 - (1 - progress) ** 3));
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
