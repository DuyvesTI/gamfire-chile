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
    // Al hacer clic en un enlace de sección en móvil, cerrar el menú
    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        if (nav.classList.contains('active')) {
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
        { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
      );

      sections.forEach((sec) => observer.observe(sec));
    }
  } else {
    // Modo tradicional multipágina: Marca la página actual
    const current = location.pathname.split('/').pop() || 'index.html';
    navLinks.forEach((a) => {
      if (a.getAttribute('href') === current) a.setAttribute('aria-current', 'page');
    });
  }
}
