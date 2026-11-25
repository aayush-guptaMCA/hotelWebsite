(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const controls = document.querySelector('.review-controls');
  const toggle = controls.querySelector('.rotation');
  const slides = [...document.querySelectorAll('.slides figure')];
  let active = 0;
  let paused = motion.matches;
  let timer;

  const dots = slides.map((slide, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'review-dot';
    button.setAttribute('aria-label', 'Show review from ' + slide.querySelector('figcaption').textContent.trim());
    controls.append(button);
    button.addEventListener('click', () => {
      show(index);
      schedule();
    });
    return button;
  });

  function show(index) {
    active = index;
    slides.forEach((slide, i) => {
      slide.hidden = i !== active;
      dots[i].setAttribute('aria-current', String(i === active));
    });
  }

  function schedule() {
    clearInterval(timer);
    toggle.textContent = paused ? 'Play' : 'Pause';
    toggle.setAttribute('aria-label', toggle.textContent + ' automatic reviews');
    if (!paused && !document.hidden) {
      timer = setInterval(() => show((active + 1) % slides.length), 6000);
    }
  }

  toggle.addEventListener('click', () => {
    paused = !paused;
    schedule();
  });
  motion.addEventListener('change', () => {
    paused = motion.matches;
    schedule();
  });
  document.addEventListener('visibilitychange', schedule);
  controls.hidden = false;
  show(0);
  schedule();

  const video = document.querySelector('.room-film video');
  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          reveal.unobserve(entry.target);
        }
      }
    });
    document.querySelectorAll('[data-reveal]').forEach(item => reveal.observe(item));

    let filmVisible = false;
    function syncFilm() {
      if (filmVisible && !motion.matches && !document.hidden) video.play().catch(() => {});
      else video.pause();
    }
    motion.addEventListener('change', syncFilm);
    document.addEventListener('visibilitychange', syncFilm);
    const player = new IntersectionObserver(([entry]) => {
      filmVisible = entry.isIntersecting;
      syncFilm();
    });
    player.observe(video);
  }
})();
