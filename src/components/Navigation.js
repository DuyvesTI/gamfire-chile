// El encabezado ahora viene en el HTML (partials/header.html).
// Aquí solo se agrega el comportamiento.
export function initNavigation() {
  const toggle = document.querySelector('.mobile-toggle');
  const nav = document.querySelector('.main-nav');

  // Mobile Menu Logic
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('active');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  // Manejo de clic en enlaces internos de la misma página (One-Page)
  const isOnePage = document.body.classList.contains('onepage-layout');
  const navLinks = document.querySelectorAll('.main-nav a');

  if (isOnePage) {
    let manualScrollLockUntil = 0;

    // Al hacer clic en un enlace de sección, actualizar estado activo y cerrar menú móvil
    navLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href') || '';
        if (href.startsWith('#')) {
          manualScrollLockUntil = Date.now() + 1000;
          navLinks.forEach((a) => {
            if (a.getAttribute('href')?.startsWith('#')) {
              a.removeAttribute('aria-current');
            }
          });
          link.setAttribute('aria-current', 'page');

          if (href === '#inicio') {
            e.preventDefault();
            history.replaceState(null, '', '#inicio');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
        if (nav && nav.classList.contains('active')) {
          nav.classList.remove('active');
          if (toggle) toggle.setAttribute('aria-expanded', 'false');
        }
      });
    });

    // ScrollSpy mediante IntersectionObserver para resaltar la sección actual
    const sections = document.querySelectorAll('section.section-scroll');
    if ('IntersectionObserver' in window && sections.length > 0) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (Date.now() < manualScrollLockUntil) return;
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const id = entry.target.getAttribute('id');
              navLinks.forEach((a) => {
                if (a.getAttribute('href') === `#${id}`) {
                  a.setAttribute('aria-current', 'page');
                } else if (a.getAttribute('href')?.startsWith('#')) {
                  a.removeAttribute('aria-current');
                }
              });
            }
          });
        },
        { rootMargin: '-15% 0px -55% 0px', threshold: 0 }
      );

      sections.forEach((sec) => observer.observe(sec));
    }
  } else {
    // Modo tradicional multipágina: Marca la página actual soportando prefijos de carpeta
    const segments = location.pathname.split('/').filter(Boolean);
    const lastSeg = segments[segments.length - 1] || 'index.html';
    const isBaseDir = /^gamfire-chile(?:-web(?:-main)?)?$/i.test(lastSeg);
    const current = isBaseDir
      ? 'index.html'
      : lastSeg.endsWith('.html')
        ? lastSeg
        : `${lastSeg}.html`;

    navLinks.forEach((a) => {
      if (a.getAttribute('href') === current) {
        a.setAttribute('aria-current', 'page');
      } else {
        a.removeAttribute('aria-current');
      }
    });
  }
}
