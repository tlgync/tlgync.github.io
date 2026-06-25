/* mrd site — live download wiring + motion + docs scrollspy */
(function () {
  'use strict';

  const REPO     = 'tlgync/mrd-releases';
  const RELEASES = 'https://github.com/' + REPO + '/releases';
  const API      = 'https://api.github.com/repos/' + REPO + '/releases/latest';
  const MANIFEST = RELEASES + '/latest/download/latest.json';

  const DL_IDS  = ['navDownload', 'heroDownload', 'ctaDownload'];
  const VER_IDS = ['verLabel', 'verLabel2'];

  function setDownloadUrl(url) {
    if (!url) return;
    DL_IDS.forEach((id) => { const el = document.getElementById(id); if (el) el.href = url; });
  }
  function setVersion(v) {
    if (!v) return;
    const label = 'v' + String(v).replace(/^v/, '');
    VER_IDS.forEach((id) => { const el = document.getElementById(id); if (el) el.textContent = label; });
  }

  /* Pick the macOS app asset — prefer .dmg, fall back to .zip. A direct asset
     URL downloads straight away; no GitHub page in between. */
  function pickAsset(assets) {
    if (!Array.isArray(assets)) return null;
    const dmg = assets.find((a) => /\.dmg$/i.test(a.name));
    if (dmg) return dmg.browser_download_url;
    const zip = assets.find((a) => /\.zip$/i.test(a.name) && !/latest\.json/i.test(a.name));
    return zip ? zip.browser_download_url : null;
  }

  /* --- Live, direct download link -------------------------------------------
     1) GitHub API (CORS-enabled) → exact asset URL + version → direct download.
     2) latest.json manifest as a secondary source (url + minSystem).
     3) releases/latest page only as the last resort. ------------------------- */
  function wireDownloads() {
    fetch(API, { cache: 'no-store', headers: { Accept: 'application/vnd.github+json' } })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((rel) => {
        const url = pickAsset(rel.assets);
        setVersion(rel.tag_name || rel.name);
        if (url) { setDownloadUrl(url); return; }
        return fetchManifest(false); // no usable asset → try manifest url
      })
      .catch(() => fetchManifest(false));
    // minSystem lives only in the manifest — fetch it best-effort regardless.
    fetchManifest(true);
  }

  function fetchManifest(systemOnly) {
    return fetch(MANIFEST, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((m) => {
        if (!m) return;
        if (!systemOnly) { setDownloadUrl(m.url); setVersion(m.version); }
        const sys = document.getElementById('metaSystem');
        if (sys && m.minSystem) sys.textContent = 'macOS ' + m.minSystem + ' or newer';
      })
      .catch(() => {
        if (!systemOnly) setDownloadUrl(RELEASES + '/latest');
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
