export function scrollToLandingHash(
  hash: string,
  behavior: ScrollBehavior = 'smooth'
) {
  const id = hash.replace(/^#/, '');
  if (!id || typeof document === 'undefined') return;
  document.getElementById(id)?.scrollIntoView({ behavior, block: 'start' });
}

export function goToLandingSection(hash: string) {
  const id = hash.replace(/^#/, '');
  if (!id || typeof window === 'undefined') return;
  if (window.location.pathname === '/') {
    scrollToLandingHash(id);
    window.history.replaceState(null, '', `/#${id}`);
    return;
  }
  window.location.assign(`/#${id}`);
}
