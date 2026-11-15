/* =====================================================================
   script.js — Arnawan Dwi Nugraha portfolio
   1. Navigation (sticky state, mobile menu, active section)
   2. Scroll reveal + metric count-up
   3. Certificate filters
   4. Certificate modal / lightbox (prev/next, keyboard, focus)
   5. Looker Studio click-to-load embed
   6. Copy email + toast, footer year, card spotlight
   ===================================================================== */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Navigation ---------- */
  const nav = $('#nav');
  const toggle = $('.nav-toggle');
  const links = $('#navLinks');

  const onScroll = () => {
    nav && nav.classList.toggle('is-scrolled', window.scrollY > 12);
    if (window.scrollY < 200) $$('#navLinks a.is-active').forEach((a) => a.classList.remove('is-active'));
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  function setMenu(open) {
    if (!toggle) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    links.classList.toggle('is-open', open);
    nav.classList.toggle('menu-open', open);
  }
  toggle && toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  $$('#navLinks a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

  // Highlight the nav link of the section in view
  const navMap = new Map($$('#navLinks a[href^="#"]').map((a) => [a.getAttribute('href').slice(1), a]));
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        navMap.forEach((a) => a.classList.remove('is-active'));
        const a = navMap.get(e.target.id);
        a && a.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navMap.forEach((_, id) => { const s = document.getElementById(id); s && spy.observe(s); });
  }

  /* ---------- 2. Reveal + count-up ---------- */
  const revealEls = $$('[data-reveal]');
  // Stagger siblings that share a parent
  const groups = new Map();
  revealEls.forEach((el) => {
    const g = groups.get(el.parentElement) || [];
    g.push(el); groups.set(el.parentElement, g);
  });
  groups.forEach((g) => g.forEach((el, i) => el.style.setProperty('--d', `${Math.min(i, 6) * 0.08}s`)));

  function countUp(el) {
    const target = +el.dataset.count;
    if (reduceMotion || !target) return;
    const start = performance.now(), dur = 1400;
    const tick = (t) => {
      const p = Math.min((t - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-visible');
        $$('[data-count]', e.target).forEach(countUp);
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- 3. Certificate filters ---------- */
  const filterBtns = $$('.filter');
  filterBtns.forEach((btn) => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    filterBtns.forEach((b) => {
      const on = b === btn;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    $$('#certGrid .ach-card, .cred-list li').forEach((card) => {
      const show = f === 'all' || card.dataset.cat === f;
      card.classList.toggle('is-hidden', !show);
      if (show && card.classList.contains('ach-card')) {
        card.classList.remove('is-entering'); void card.offsetWidth; card.classList.add('is-entering');
      }
    });
  }));

  /* ---------- 4. Certificate modal ---------- */
  const modal = $('#certModal');
  if (modal) {
    const img = $('#certModalImage');
    const title = $('#certModalTitle');
    const count = $('#certModalCount');
    const fallback = $('#certImageFallback');
    const closeBtn = $('.cert-modal-close', modal);
    const prev = $('.modal-prev', modal);
    const next = $('.modal-next', modal);
    let group = [], index = 0, lastTrigger = null;

    const visibleTriggers = () => $$('#certGrid .ach-card:not(.is-hidden) [data-image]');

    function render(swap) {
      const t = group[index];
      const apply = () => {
        title.textContent = t.dataset.title || 'Certificate';
        img.alt = `${t.dataset.title || 'Certificate'} — full size`;
        fallback.hidden = true; img.hidden = false;
        img.src = t.dataset.image;
        count.textContent = group.length > 1 ? `· ${index + 1} / ${group.length}` : '';
        img.classList.remove('is-swapping');
      };
      if (swap && !reduceMotion) { img.classList.add('is-swapping'); setTimeout(apply, 160); } else apply();
      prev.hidden = next.hidden = group.length < 2;
    }

    function open(trigger) {
      lastTrigger = trigger;
      group = trigger.closest('#certGrid') ? visibleTriggers() : [trigger];
      index = Math.max(0, group.indexOf(trigger));
      render(false);
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      closeBtn.focus({ preventScroll: true });
    }

    function close() {
      if (!modal.classList.contains('is-open')) return;
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      setTimeout(() => { if (!modal.classList.contains('is-open')) img.removeAttribute('src'); }, 220);
      lastTrigger && lastTrigger.focus({ preventScroll: true });
    }

    const step = (d) => { if (group.length > 1) { index = (index + d + group.length) % group.length; render(true); } };

    document.addEventListener('click', (e) => {
      const t = e.target.closest('[data-image]');
      if (t) { e.preventDefault(); open(t); }
    });
    $$('[data-close-modal]', modal).forEach((el) => el.addEventListener('click', close));
    $$('.modal-nav', modal).forEach((b) => b.addEventListener('click', () => step(+b.dataset.step)));
    img.addEventListener('error', () => {
      if (!img.getAttribute('src')) return;
      img.hidden = true; fallback.hidden = false;
    });

    // Swipe on touch devices
    let x0 = null;
    modal.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    modal.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
      x0 = null;
    });

    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('is-open')) {
        if (e.key === 'Escape') setMenu(false);
        return;
      }
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'Tab') {
        // Focus trap within the dialog
        const f = $$('button:not([hidden])', modal);
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------- 5. Looker Studio click-to-load ---------- */
  const embed = $('#lookerEmbed');
  if (embed) {
    $('.embed-play', embed).addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = embed.dataset.src;
      f.title = embed.dataset.title;
      f.allowFullscreen = true;
      f.setAttribute('sandbox', 'allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox');
      embed.appendChild(f);
      embed.classList.add('is-loaded');
    });
  }

  /* ---------- 6. Utilities ---------- */
  const toast = $('#toast');
  let toastTimer;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-show'), 2200);
  }

  $$('.copy-email').forEach((btn) => btn.addEventListener('click', async () => {
    const email = btn.dataset.email;
    try {
      await navigator.clipboard.writeText(email);
      showToast('Email copied to clipboard ✓');
    } catch {
      window.location.href = `mailto:${email}`;
    }
  }));

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  // Soft spotlight that follows the cursor on capability cards
  $$('.cap-card').forEach((card) => card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  }));
})();
