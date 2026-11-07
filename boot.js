/* ------------------------------------------------------------------
   BOOT
   Runs in the head, before first paint, so the page never flashes an
   un-styled state. Kept in its own file rather than inline so the
   Content-Security-Policy can be script-src 'self' with no hashes and
   nothing to re-compute whenever this changes.

   Pages that play the opening carry data-intro-page on <html>.
   ------------------------------------------------------------------ */
(function () {
  var d = document.documentElement;
  d.classList.add('js');

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    d.classList.add('calm');
    return;
  }

  if (d.hasAttribute('data-intro-page') && !location.hash) {
    d.setAttribute('data-intro', 'on');
  }
})();
