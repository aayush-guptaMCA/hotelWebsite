(() => {
  const header = document.querySelector('.hp-header');
  const toggle = header.querySelector('.hp-toggle');
  const page = location.pathname.split('/').pop() || 'index.html';
  header.querySelectorAll('nav a').forEach(link => {
    if (link.getAttribute('href') === page) link.setAttribute('aria-current', 'page');
  });
  function setMenu(open) {
    header.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  }
  function syncHeader() { header.classList.toggle('compact', scrollY > 28); }
  toggle.addEventListener('click', () => setMenu(!header.classList.contains('is-open')));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && header.classList.contains('is-open')) {
      setMenu(false);
      toggle.focus();
    }
  });
  matchMedia('(max-width:700px)').addEventListener('change', () => setMenu(false));
  addEventListener('scroll', syncHeader, {passive:true});
  syncHeader();
})();
