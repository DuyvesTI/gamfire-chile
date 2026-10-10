// El pie de página ahora viene en el HTML (partials/footer.html).
// Aquí solo se actualiza el año.
export function initFooter() {
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}
