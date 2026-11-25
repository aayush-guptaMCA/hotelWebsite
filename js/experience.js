/* ══════════════════════════════════════════════════
   EXPERIENCE PAGE — Scroll-Reveal & Interactions
   ══════════════════════════════════════════════════ */
(() => {
  /* --- Scroll-reveal for cards --- */
  const cards = document.querySelectorAll('.exp-card');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    cards.forEach((card) => observer.observe(card));
  } else {
    /* Fallback: show everything */
    cards.forEach((c) => c.classList.add('is-visible'));
  }

})();
