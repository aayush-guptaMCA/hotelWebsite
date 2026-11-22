(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.hero video');
  const kitchen = document.querySelector('[data-kitchen]');
  function syncMotion() {
    if (motion.matches) {
      if (hero) { hero.autoplay = false; hero.pause(); }
      kitchen?.pause();
    }
  }
  syncMotion();
  motion.addEventListener('change', syncMotion);
  if (!('IntersectionObserver' in window)) return;
  const reveal = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      if (!motion.matches) entry.target.animate(
        [{opacity:.15, transform:'translateY(24px)'}, {opacity:1, transform:'none'}],
        {duration:680, easing:'ease-out'}
      );
      reveal.unobserve(entry.target);
    }
  }, {threshold:.12});
  document.querySelectorAll('.service-grid,.dish-grid figure,.roof-copy,.notes').forEach(item => reveal.observe(item));
  if (kitchen) {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !motion.matches) kitchen.play().catch(() => {});
      else kitchen.pause();
    }, {threshold:.35});
    observer.observe(kitchen);
  }
})();
