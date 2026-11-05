// Hero slider: autoplay every 6s, pauses on hover, focus and the pause button; never under reduced motion.
(() => {
  const slides = [...document.querySelectorAll('.hero__slide')];
  if (!slides.length) return;
  const count = document.querySelector('.hero__count b');
  const pauseBtn = document.querySelector('[data-hero-pause]');
  const hero = document.querySelector('.hero');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let i = 0, timer = null, paused = reduce, hold = false;
  const show = (n) => {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => { const on = k === i; s.classList.toggle('is-on', on); s.toggleAttribute('aria-hidden', !on); s.querySelectorAll('a').forEach((a) => a.tabIndex = on ? 0 : -1); });
    if (count) count.textContent = i + 1;
  };
  const tick = () => { clearInterval(timer); if (!paused && !hold) timer = setInterval(() => show(i + 1), 6000); };
  document.querySelectorAll('[data-hero]').forEach((b) => b.addEventListener('click', () => { show(i + Number(b.dataset.hero)); tick(); }));
  const setPause = (p) => {
    paused = p; pauseBtn.setAttribute('aria-pressed', String(p));
    pauseBtn.setAttribute('aria-label', p ? '자동 넘김 시작' : '자동 넘김 멈춤');
    pauseBtn.innerHTML = p
      ? '<svg class="ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 3 14 9-14 9z"/></svg>'
      : '<svg class="ic" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
    tick();
  };
  pauseBtn.addEventListener('click', () => setPause(!paused));
  hero.addEventListener('mouseenter', () => { hold = true; tick(); });
  hero.addEventListener('mouseleave', () => { hold = false; tick(); });
  hero.addEventListener('focusin', () => { hold = true; tick(); });
  hero.addEventListener('focusout', () => { hold = false; tick(); });
  document.addEventListener('visibilitychange', () => { hold = document.hidden; tick(); });
  show(0); setPause(paused);
})();

// Carousel arrows scroll their rail by one card.
document.querySelectorAll('.ctrl').forEach((c) => {
  const rail = document.getElementById(c.dataset.for);
  if (!rail) return;
  c.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    const item = rail.querySelector(':scope > li');
    const step = item ? item.getBoundingClientRect().width + parseFloat(getComputedStyle(rail).columnGap || 0) : rail.clientWidth;
    rail.scrollBy({ left: step * Number(b.dataset.dir), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }));
});

// Close the all-menu on Escape or when a link inside it is chosen.
const allmenu = document.querySelector('.allmenu');
if (allmenu) {
  const IDLE_MS = 5000;   // close after 5s with no action inside the open menu
  const LEAVE_MS = 1500;  // close 1.5s after the pointer leaves the menu
  let idle = null;
  const close = () => { clearTimeout(idle); if (allmenu.open) allmenu.open = false; };
  const arm = (ms = IDLE_MS) => { clearTimeout(idle); if (allmenu.open) idle = setTimeout(close, ms); };
  allmenu.addEventListener('toggle', () => { if (allmenu.open) arm(); else clearTimeout(idle); });
  ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'focusin'].forEach((ev) =>
    allmenu.addEventListener(ev, () => arm(), { passive: true }));
  const panel = allmenu.querySelector('.allmenu__panel');
  if (panel) ['scroll', 'touchmove'].forEach((ev) => panel.addEventListener(ev, () => arm(), { passive: true }));
  allmenu.addEventListener('pointerleave', () => arm(LEAVE_MS));
  allmenu.addEventListener('pointerenter', () => arm());
  document.addEventListener('pointerdown', (e) => { if (allmenu.open && !allmenu.contains(e.target)) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && allmenu.open) { close(); allmenu.querySelector('summary').focus(); } });
  allmenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
}

// 오시는길: copy the address to the clipboard.
document.querySelectorAll('.loc__copy').forEach((b) => b.addEventListener('click', async () => {
  const out = document.querySelector('.loc__status');
  try { await navigator.clipboard.writeText(b.dataset.copy); if (out) out.textContent = '주소를 복사했습니다.'; }
  catch (e) { if (out) out.textContent = '복사하지 못했습니다. 주소를 직접 선택해 복사해 주세요.'; }
}));

// Sub-page tabs: on a narrow screen, scroll the strip so the current page's tab is in view.
document.querySelectorAll('.ph__tabs ul').forEach((ul) => {
  const cur = ul.querySelector('[aria-current="page"]');
  if (!cur || ul.scrollWidth <= ul.clientWidth) return;
  const li = cur.closest('li');
  ul.scrollLeft = Math.max(0, li.offsetLeft - (ul.clientWidth - li.offsetWidth) / 2);
});
