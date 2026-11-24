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

  /* --- Staggered reveal for intro section --- */
  const intro = document.querySelector('.exp-intro');
  if (intro) {
    const introObs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          intro.style.opacity = '1';
          intro.style.transform = 'translateY(0)';
          introObs.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    Object.assign(intro.style, {
      opacity: '0',
      transform: 'translateY(40px)',
      transition: 'opacity .9s ease, transform .9s ease',
    });
    introObs.observe(intro);
  }

})();
