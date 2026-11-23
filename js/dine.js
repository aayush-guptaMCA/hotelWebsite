(() => {
  const filters = [...document.querySelectorAll('[data-category-filter]')];
  const sections = [...document.querySelectorAll('.menu-category')];
  const search = document.querySelector('#menu-search');
  const clear = document.querySelector('.clear-search');
  const count = document.querySelector('.result-count');
  const empty = document.querySelector('.empty-state');
  let active = 'breakfast';
  const showMenu = () => {
    const query = search.value.trim().toLocaleLowerCase();
    let visible = 0;
    sections.forEach(section => {
      const inCategory = !query && section.dataset.menuCategory === active;
      let sectionCount = 0;
      section.querySelectorAll('.menu-item').forEach(item => {
        const match = !query || item.textContent.toLocaleLowerCase().includes(query);
        item.hidden = !match;
        if (match) sectionCount++;
      });
      section.hidden = query ? sectionCount === 0 : !inCategory;
      if (!section.hidden) visible += sectionCount;
    });
    filters.forEach(button => button.setAttribute('aria-pressed', String(!query && button.dataset.categoryFilter === active)));
    count.textContent = query ? `Showing ${visible} result${visible === 1 ? '' : 's'} for “${search.value.trim()}”` : `Showing ${visible} ${filters.find(button => button.dataset.categoryFilter === active)?.querySelector('span')?.textContent.toLowerCase() || ''} items`;
    empty.hidden = visible !== 0;
    clear.hidden = !query;
  };
  document.querySelector('[data-filter-controls]').hidden = false;
  document.querySelector('[data-search-controls]').hidden = false;
  filters.forEach(button => button.addEventListener('click', () => {
    active = button.dataset.categoryFilter;
    search.value = '';
    showMenu();
    document.querySelector('#menu-search-area').scrollIntoView({behavior:'smooth',block:'start'});
  }));
  search.addEventListener('input', showMenu);
  clear.addEventListener('click', () => { search.value = ''; showMenu(); search.focus(); });
  document.querySelector('[data-reset-menu]').addEventListener('click', () => { search.value = ''; showMenu(); search.focus(); });
  document.querySelectorAll('[data-find]').forEach(card => card.addEventListener('click', () => {
    search.value = card.dataset.find;
    showMenu();
  }));
  showMenu();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Set();
  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        reveal.unobserve(entry.target);
        if (reducedMotion.matches || !entry.target.animate) return;
        const animation = entry.target.animate(
          [{opacity:0,translate:'0 20px'},{opacity:1,translate:'0 0'}],
          {duration:650,easing:'cubic-bezier(.2,.65,.3,1)',fill:'backwards'}
        );
        animations.add(animation);
        animation.finished.catch(() => {}).finally(() => animations.delete(animation));
      });
    }, {threshold:.06,rootMargin:'0px 0px -20px 0px'});
    document.querySelectorAll('[data-reveal]').forEach(element => reveal.observe(element));
  }
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) animations.forEach(animation => animation.cancel());
  });
  document.querySelectorAll('img[src^="https://"]').forEach(img => {
    const fallback = () => img.parentElement.classList.add('image-unavailable');
    img.addEventListener('error', fallback, {once:true});
    if (img.complete && !img.naturalWidth) fallback();
  });
  const backTop = document.querySelector('.back-top');
  const syncBackTop = () => backTop.classList.toggle('is-visible', scrollY > 500);
  addEventListener('scroll', syncBackTop, {passive:true});
  syncBackTop();
})();
