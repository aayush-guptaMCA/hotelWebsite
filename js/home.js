(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const hero = document.querySelector('.hero');
  const kitchen = document.querySelector('[data-kitchen]');

  // Animate only as content enters the viewport; content stays visible without JS.
  if (document.body.classList.contains('hp-home') && 'IntersectionObserver' in window) {
    const activeAnimations = new Set();
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const element = entry.target;
        reveal.unobserve(element);
        if (motion.matches || element.contains(document.activeElement) || !element.animate) return;
        const animation = element.animate(
          [{opacity:0, translate:'0 28px'}, {opacity:1, translate:'0 0'}],
          {duration:700, delay:Number(element.dataset.revealDelay || 0), easing:'cubic-bezier(.2,.65,.3,1)', fill:'backwards'}
        );
        activeAnimations.add(animation);
        animation.finished.catch(() => {}).finally(() => activeAnimations.delete(animation));
      });
    }, {threshold:.08, rootMargin:'0px 0px -24px 0px'});

    document.querySelectorAll('.section-heading,.comforts > .eyebrow,.comforts > h2,.culinary-photo,.culinary-copy,.guestbook > .eyebrow,.guestbook > h2,.notes,.footer-grid > *').forEach(element => reveal.observe(element));
    document.querySelectorAll('.room-grid,.comfort-grid,.gallery-grid').forEach(grid => {
      [...grid.children].forEach((element, index) => {
        element.dataset.revealDelay = String((index % 4) * 75);
        reveal.observe(element);
      });
    });
    motion.addEventListener('change', () => {
      if (motion.matches) activeAnimations.forEach(animation => animation.cancel());
    });
  }

  if (hero) {
    const slides = [...hero.querySelectorAll('[data-slide]')];
    const dots = [...hero.querySelectorAll('[data-slide-to]')];
    const pause = hero.querySelector('.slide-pause');
    let current = 0;
    let timer;
    let paused = motion.matches;
    let inView = true;
    let focusWithin = false;
    const canPlay = () => !paused && !document.hidden && inView && !focusWithin;

    const slideDuration = 5500;
    const copyParts = hero.querySelectorAll('.hero-copy > p, .hero-copy h1 > *, .home-actions a');
    let zoom;
    let entrances = [];

    function animateSlide() {
      zoom?.cancel();
      entrances.forEach(animation => animation.cancel());
      entrances = [];
      if (motion.matches || !hero.animate) return;
      zoom = slides[current].querySelector('img').animate(
        [{ transform: 'scale(1.09)' }, { transform: 'scale(1)' }],
        { duration: slideDuration, easing: 'ease-out', fill: 'both' }
      );
      copyParts.forEach((part, index) => {
        entrances.push(part.animate(
          [{ opacity: 0, translate: '0 16px' }, { opacity: 1, translate: '0 0' }],
          { duration: 500, delay: index * 135, easing: 'ease-out', fill: 'backwards' }
        ));
      });
    }
    function syncPlayback() {
      clearTimeout(timer);
      pause.textContent = paused ? 'Play' : 'Pause';
      pause.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
      if (canPlay()) {
        if (zoom?.playState === 'paused') zoom.play();
        timer = setTimeout(next, slideDuration);
      } else if (zoom?.playState === 'running') {
        zoom.pause();
      }
    }
    function showSlide(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const active = i === current;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
        slide.inert = !active;
        dots[i].classList.toggle('is-active', active);
        if (active) dots[i].setAttribute('aria-current', 'true');
        else dots[i].removeAttribute('aria-current');
      });
      animateSlide();
      syncPlayback();
    }
    function next() { showSlide(current + 1); }
    dots.forEach(dot => dot.addEventListener('click', () => showSlide(Number(dot.dataset.slideTo))));
    pause.addEventListener('click', () => { paused = !paused; syncPlayback(); });
    hero.addEventListener('focusin', event => {
      // Pause while a guest reads or follows a slide's link; controls stay usable.
      focusWithin = !!event.target.closest('.hero-copy');
      syncPlayback();
    });
    hero.addEventListener('focusout', event => {
      focusWithin = !!event.relatedTarget?.closest('.hero-copy');
      syncPlayback();
    });
    hero.addEventListener('keydown', event => {
      if (!event.target.closest('.hero-controls')) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        showSlide(current + (event.key === 'ArrowRight' ? 1 : -1));
        dots[current].focus();
      }
    });
    document.addEventListener('visibilitychange', syncPlayback);
    motion.addEventListener('change', () => { paused = motion.matches; animateSlide(); syncPlayback(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; syncPlayback(); }, {threshold:.15}).observe(hero);
    }
    animateSlide();
    syncPlayback();
  }

  const tabs = [...document.querySelectorAll('.room-picks [role="tab"]')];
  function selectTab(tab) {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
    });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') selectTab(tab); });
    tab.addEventListener('focus', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      let target;
      if (event.key === 'ArrowRight') target = tabs[(index + 1) % tabs.length];
      if (event.key === 'ArrowLeft') target = tabs[(index + tabs.length - 1) % tabs.length];
      if (event.key === 'Home') target = tabs[0];
      if (event.key === 'End') target = tabs[tabs.length - 1];
      if (target) { event.preventDefault(); selectTab(target); target.focus(); }
    });
  });

  function moveRoom(direction) {
    const index = tabs.findIndex(tab => tab.getAttribute('aria-selected') === 'true');
    selectTab(tabs[(index + direction + tabs.length) % tabs.length]);
  }
  document.querySelector('.pick-prev')?.addEventListener('click', () => moveRoom(-1));
  document.querySelector('.pick-next')?.addEventListener('click', () => moveRoom(1));

  const filters = [...document.querySelectorAll('[data-filter]')];
  const photos = [...document.querySelectorAll('[data-category]')];
  filters.forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    photos.forEach(photo => { photo.hidden = filter !== 'all' && !photo.dataset.category.split(' ').includes(filter); });
    const count = photos.filter(photo => !photo.hidden).length;
    document.querySelector('[data-gallery-status]').textContent = `Showing ${count} ${filter === 'all' ? 'hotel' : filter} photos`;
  }));

  // This file is shared with the dining page; retain its kitchen video behavior.
  if (kitchen && 'IntersectionObserver' in window) {
    let visible = false;
    function syncKitchen() {
      if (visible && !motion.matches && !document.hidden) kitchen.play().catch(() => {});
      else kitchen.pause();
    }
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; syncKitchen(); }, {threshold:.35}).observe(kitchen);
    motion.addEventListener('change', syncKitchen);
    document.addEventListener('visibilitychange', syncKitchen);
  }
})();
