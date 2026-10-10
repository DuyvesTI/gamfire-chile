export function initCatalog() {
    const buttons = document.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.product-card');

    if (buttons.length === 0) return;

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update accessible pressed states and active classes
            buttons.forEach(b => {
                b.setAttribute('aria-pressed', 'false');
                b.classList.remove('active');
            });

            btn.setAttribute('aria-pressed', 'true');
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');

            cards.forEach(card => {
                const category = card.getAttribute('data-category');
                const matches = filter === 'all' || category === filter;
                card.classList.toggle('is-hidden', !matches);
            });
        });
    });
}
