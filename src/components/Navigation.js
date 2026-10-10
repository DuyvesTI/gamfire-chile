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

  // Marca la página actual en el menú
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.main-nav a').forEach((a) => {
    if (a.getAttribute('href') === current) a.setAttribute('aria-current', 'page');
  });
}
