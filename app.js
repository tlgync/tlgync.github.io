/* mrd site — live download wiring + motion + docs scrollspy */
(function () {
  'use strict';

  const RELEASES = 'https://github.com/tlgync/mrd-releases/releases';
  const MANIFEST = 'https://github.com/tlgync/mrd-releases/releases/latest/download/latest.json';

  /* --- Live download link from the in-app update manifest ---------------- */
  function wireDownloads() {
    const dlIds  = ['navDownload', 'heroDownload', 'ctaDownload'];
    const verIds = ['verLabel', 'verLabel2'];
    fetch(MANIFEST, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((m) => {
        if (m && m.url) {
          dlIds.forEach((id) => { const el = document.getElementById(id); if (el) el.href = m.url; });
        }
        if (m && m.version) {
          verIds.forEach((id) => { const el = document.getElementById(id); if (el) el.textContent = 'v' + m.version; });
        }
        const sys = document.getElementById('metaSystem');
        if (sys && m && m.minSystem) sys.textContent = 'macOS ' + m.minSystem + ' or newer';
      })
      .catch(() => {
        /* Fallback: the releases/latest page already redirects to the newest tag. */
        dlIds.forEach((id) => { const el = document.getElementById(id); if (el) el.href = RELEASES + '/latest'; });
      });
  }

  /* --- Sticky nav shadow on scroll --------------------------------------- */
  function wireNav() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* --- Reveal on scroll --------------------------------------------------- */
  function wireReveal() {
    const els = document.querySelectorAll('.reveal, [data-stagger]');
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    els.forEach((el) => io.observe(el));
  }

  /* --- Docs scrollspy (only on docs page) -------------------------------- */
  function wireDocsSpy() {
    const links = document.querySelectorAll('.docs-nav a[href^="#"]');
    if (!links.length) return;
    const map = {};
    links.forEach((a) => { map[a.getAttribute('href').slice(1)] = a; });
    const sections = Array.from(document.querySelectorAll('.docs-main section[id]'));
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            links.forEach((l) => l.classList.remove('active'));
            const a = map[e.target.id];
            if (a) a.classList.add('active');
          }
        });
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
    );
    sections.forEach((s) => spy.observe(s));
  }

  document.addEventListener('DOMContentLoaded', function () {
    wireDownloads();
    wireNav();
    wireReveal();
    wireDocsSpy();
  });
})();
