// Carrusel Principal de Propaganda y Vitrina (Estilo Slider Revolution SR7 de Working Apparel)
// Soporta <sr7-poster> de fondo, videos HTML5 (.mp4/.webm) en bucle, 5 diseños publicitarios y vitrina de productos.
import { DEFAULT_BANNERS, getCategoryLabel, normalizeCategoryId } from '../data/defaultCatalog.js';

const FALLBACK_SHOWCASE_CARDS = [
  {
    title: 'DIVISIÓN CORPORATIVA',
    subtitle: 'EJECUTIVA • CUARTEL • PARADA',
    image: 'uploads/division-corporativa.jpg',
    cat: 'corporativa',
  },
  {
    title: 'DIVISIÓN FIRE',
    subtitle: 'NFPA 2112 • ASTM F1506 • EN 15614',
    image: 'uploads/division-fire.jpg',
    cat: 'fire',
  },
  {
    title: 'DIVISIÓN SEVEN',
    subtitle: 'TÁCTICA • RIPSTOP • SOFTSHELL',
    image: 'uploads/division-seven.jpg',
    cat: 'seven',
  },
  {
    title: 'DIVISIÓN ACCESORIOS',
    subtitle: 'JOCKEYS • GUARDIA • MOCHILAS',
    image: 'uploads/division-accesorios.jpg',
    cat: 'accesorios',
  },
  {
    title: 'UNIFORME MULTIROL',
    subtitle: 'INSUMOS CERTIFICADOS 3M / YKK',
    image: 'uploads/uniforme-multirol-antillama.jpg',
    cat: 'fire',
  },
  {
    title: 'CAMISA Y BLUSÓN',
    subtitle: 'CONFECCIÓN 100% NACIONAL',
    image: 'uploads/camisa-bluson-ignifugo.jpg',
    cat: 'fire',
  },
];

function resolveMediaUrl(url) {
  if (!url) return '/hero-banner.jpg';
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('/')) {
    return url;
  }
  const rawBase = import.meta.env?.BASE_URL || './';
  if (rawBase === './' || rawBase === '.') {
    return url.replace(/^\//, '');
  }
  const base = rawBase.replace(/\/$/, '');
  return `${base}/${url.replace(/^\//, '')}`;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, '&#39;');
}

function resolveCtaHref(rawHref, isOnePage) {
  const href = String(rawHref || 'catalogo.html').trim();
  if (!isOnePage) return href;
  if (href.includes('contacto')) return '#contacto';
  if (href.includes('nosotros')) return '#nosotros';
  if (href.includes('catalogo')) return '#catalogo';
  return href;
}

function renderShowcaseGridHtml(products, isOnePage, bannerProductIds = []) {
  const activeProducts = Array.isArray(products) ? products.filter((p) => p.active !== false) : [];
  let sourceProducts = [];

  if (Array.isArray(bannerProductIds) && bannerProductIds.length > 0) {
    sourceProducts = bannerProductIds
      .map((id) => activeProducts.find((p) => p.id === id))
      .filter(Boolean)
      .slice(0, 6);
  }

  if (sourceProducts.length === 0) {
    const featured = activeProducts.filter((p) => Boolean(p.featured));
    sourceProducts = featured.length > 0 ? featured.slice(0, 6) : activeProducts.slice(0, 6);
  }

  const cards =
    sourceProducts.length > 0
      ? sourceProducts.map((p) => {
          const normCat = normalizeCategoryId(p.category);
          return {
            title: p.name.toUpperCase(),
            subtitle: `DIVISIÓN ${getCategoryLabel(normCat).toUpperCase()}`,
            image: p.image,
            cat: normCat,
          };
        })
      : FALLBACK_SHOWCASE_CARDS;

  const colCount = Math.min(6, Math.max(1, cards.length));

  return `
    <div class="wa-showcase-grid" style="--showcase-cols: ${colCount};">
      ${cards
        .map((c) => {
          const href = isOnePage ? '#catalogo' : `catalogo.html?categoria=${encodeURIComponent(c.cat)}`;
          const dataAttr = isOnePage ? `data-division-filter="${escapeAttr(c.cat)}"` : '';
          return `
            <a href="${escapeAttr(href)}" ${dataAttr} class="wa-showcase-card">
              <div class="wa-card-head">
                <h3>${escapeHtml(c.title)}<sup>®</sup></h3>
                <span>${escapeHtml(c.subtitle)}</span>
              </div>
              <div class="wa-card-img">
                <img src="${escapeAttr(resolveMediaUrl(c.image))}" alt="${escapeAttr(c.title)}" loading="lazy" width="220" height="220">
              </div>
            </a>
          `;
        })
        .join('')}
    </div>
  `;
}

function renderBannerSlideHtml(banner, idx, products, isOnePage) {
  const posterUrl = resolveMediaUrl(banner.posterImage || banner.poster || '/hero-banner.jpg');
  const rawVideo = banner.videoUrl || banner.video || '';
  const videoUrl = rawVideo ? resolveMediaUrl(rawVideo) : '';
  const layout = banner.layout || 'vignette';
  const ctaText = banner.ctaText || 'CONOCE MÁS AQUÍ';
  const ctaHref = resolveCtaHref(banner.ctaLink, isOnePage);
  const posterId = `SR7_GAM_${idx + 1}_poster`;
  const videoMime = videoUrl.toLowerCase().endsWith('.webm') ? 'video/webm' : 'video/mp4';

  const videoHtml = videoUrl
    ? `<video class="wa-sr7-video" autoplay muted loop playsinline preload="auto" poster="${escapeAttr(posterUrl)}">
         <source src="${escapeAttr(videoUrl)}" type="${videoMime}" />
       </video>`
    : '';

  if (layout === 'showcase') {
    return `
      <div class="wa-carousel-slide ${idx === 0 ? 'is-active' : ''}" data-cta-label="${escapeAttr(
      ctaText
    )}" data-cta-href="${escapeAttr(ctaHref)}" aria-hidden="${idx === 0 ? 'false' : 'true'}">
        <div class="wa-sr7-showcase-wrap">
          <sr7-poster id="${escapeAttr(posterId)}" class="sr7-poster sr7-html5-poster wa-sr7-poster" style="background-image: url(&quot;${escapeAttr(
      posterUrl
    )}&quot;); background-position: 50% 50%; background-repeat: no-repeat; background-size: cover;"></sr7-poster>
          ${videoHtml}
          <div class="wa-sr7-showcase-inner">
            ${renderShowcaseGridHtml(products, isOnePage, banner.productIds)}
          </div>
        </div>
      </div>
    `;
  }

  let overlayContentHtml = '';

  if (layout === 'split') {
    const leftTop = banner.title || 'EL MEJOR';
    const leftBottom = banner.highlight || 'ALIADO';
    const rightTop = banner.titleRight || 'PARA TU';
    const rightBottom = banner.highlightRight || 'EQUIPO';

    overlayContentHtml = `
      <div class="wa-promo-split-band">
        <div class="wa-promo-split-side left">
          <span class="wa-promo-line-white">${escapeHtml(leftTop)}</span>
          <span class="wa-promo-line-orange">${escapeHtml(leftBottom)}</span>
        </div>
        <div class="wa-promo-split-spacer" aria-hidden="true"></div>
        <div class="wa-promo-split-side right">
          <span class="wa-promo-line-white">${escapeHtml(rightTop)}</span>
          <span class="wa-promo-line-orange">${escapeHtml(rightBottom)}</span>
        </div>
      </div>
      <div class="wa-promo-bottom-brand">
        <span class="wa-promo-brand-gam">GAM</span>
        <span class="wa-promo-brand-chile">CHILE</span>
        <span class="wa-promo-brand-flags" aria-hidden="true">
          <i class="flag-y"></i><i class="flag-o"></i><i class="flag-y"></i>
        </span>
      </div>
    `;
  } else if (layout === 'bottom-bar') {
    overlayContentHtml = `
      <div class="wa-promo-bottom-bar-layout">
        ${banner.badge ? `<span class="wa-promo-top-badge">${escapeHtml(banner.badge)}</span>` : ''}
        <div class="wa-promo-arrow-row">
          <span class="wa-promo-arrow-circle" aria-hidden="true">&#10095;</span>
          <div class="wa-promo-arrow-texts">
            <h2>${escapeHtml(banner.title)} <span>${escapeHtml(banner.highlight)}</span></h2>
            ${banner.subtitle ? `<p>${escapeHtml(banner.subtitle)}</p>` : ''}
          </div>
        </div>
      </div>
    `;
  } else if (layout === 'clean') {
    overlayContentHtml = `<a href="${escapeAttr(ctaHref)}" class="wa-promo-clean-link" aria-label="${escapeAttr(
      banner.title || ctaText
    )}"></a>`;
  } else {
    // 'vignette' (por defecto)
    overlayContentHtml = `
      <div class="wa-promo-vignette-layout">
        <div class="wa-promo-vignette-box">
          ${banner.badge ? `<span class="wa-promo-top-badge">${escapeHtml(banner.badge)}</span>` : ''}
          <h2>${escapeHtml(banner.title)} <span>${escapeHtml(banner.highlight)}</span></h2>
          ${banner.subtitle ? `<p>${escapeHtml(banner.subtitle)}</p>` : ''}
        </div>
      </div>
    `;
  }

  return `
    <div class="wa-carousel-slide ${idx === 0 ? 'is-active' : ''}" data-cta-label="${escapeAttr(
    ctaText
  )}" data-cta-href="${escapeAttr(ctaHref)}" aria-hidden="${idx === 0 ? 'false' : 'true'}">
      <div class="wa-sr7-banner-frame layout-${escapeAttr(layout)}">
        <sr7-poster id="${escapeAttr(posterId)}" class="sr7-poster sr7-html5-poster wa-sr7-poster" style="background-image: url(&quot;${escapeAttr(
    posterUrl
  )}&quot;); background-position: 50% 50%; background-repeat: no-repeat; background-size: cover;"></sr7-poster>
        ${videoHtml}
        <div class="wa-sr7-banner-overlay"></div>
        <div class="container wa-sr7-banner-content">
          ${overlayContentHtml}
        </div>
      </div>
    </div>
  `;
}

export function initHeroCarousel({ banners = null, products = null } = {}) {
  const carousels = document.querySelectorAll('[data-hero-carousel]');
  if (carousels.length === 0) return;

  const isOnePage = document.body.classList.contains('onepage-layout');
  const activeBanners =
    Array.isArray(banners) && banners.length > 0
      ? banners.filter((b) => b.active !== false)
      : DEFAULT_BANNERS.filter((b) => b.active !== false);

  carousels.forEach((carousel) => {
    if (carousel._stopAutoplay) {
      carousel._stopAutoplay();
    }

    const viewport = carousel.querySelector('.wa-carousel-viewport');
    const dotsContainer = carousel.querySelector('.wa-carousel-dots');
    const prevBtn = carousel.querySelector('[data-carousel-prev]');
    const nextBtn = carousel.querySelector('[data-carousel-next]');
    const ctaBtn = carousel.querySelector('[data-carousel-cta]');

    if (viewport) {
      const listToRender = activeBanners.length > 0 ? activeBanners : DEFAULT_BANNERS;
      viewport.innerHTML = listToRender
        .map((banner, idx) => renderBannerSlideHtml(banner, idx, products, isOnePage))
        .join('');

      if (dotsContainer) {
        if (listToRender.length > 1) {
          dotsContainer.hidden = false;
          dotsContainer.innerHTML = listToRender
            .map(
              (b, idx) => `
                <button type="button" class="wa-dot ${idx === 0 ? 'is-active' : ''}" data-carousel-dot="${idx}" role="tab" aria-label="${escapeAttr(
                b.title || `Propaganda ${idx + 1}`
              )}" aria-selected="${idx === 0 ? 'true' : 'false'}"></button>
              `
            )
            .join('');
        } else {
          dotsContainer.hidden = true;
          dotsContainer.innerHTML = '';
        }
      }

      if (prevBtn) prevBtn.hidden = listToRender.length <= 1;
      if (nextBtn) nextBtn.hidden = listToRender.length <= 1;
    }

    const slides = Array.from(carousel.querySelectorAll('.wa-carousel-slide'));
    const dots = Array.from(carousel.querySelectorAll('[data-carousel-dot]'));

    let currentIndex = 0;
    let autoplayTimer = null;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function goToSlide(index) {
      if (slides.length === 0) return;
      currentIndex = (index + slides.length) % slides.length;

      slides.forEach((slide, idx) => {
        const isActive = idx === currentIndex;
        slide.classList.toggle('is-active', isActive);
        slide.setAttribute('aria-hidden', String(!isActive));
        const vid = slide.querySelector('video.wa-sr7-video');
        if (vid) {
          if (isActive) {
            vid.play().catch(() => {});
          } else {
            vid.pause();
          }
        }
      });

      dots.forEach((dot, idx) => {
        const isActive = idx === currentIndex;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-selected', String(isActive));
      });

      const activeSlide = slides[currentIndex];
      if (ctaBtn && activeSlide) {
        const ctaText = activeSlide.getAttribute('data-cta-label');
        const ctaHref = activeSlide.getAttribute('data-cta-href');
        if (ctaText) ctaBtn.textContent = ctaText;
        if (ctaHref) ctaBtn.setAttribute('href', ctaHref);
      }
    }

    function nextSlide() {
      if (slides.length <= 1) return;
      goToSlide(currentIndex + 1);
      scheduleNextAutoplay();
    }

    function prevSlide() {
      if (slides.length <= 1) return;
      goToSlide(currentIndex - 1);
      scheduleNextAutoplay();
    }

    function scheduleNextAutoplay() {
      if (prefersReducedMotion || slides.length <= 1) return;
      stopAutoplay();
      const activeSlide = slides[currentIndex];
      const hasVideo = Boolean(activeSlide?.querySelector('video.wa-sr7-video'));
      const delayMs = hasVideo ? 12000 : 6500;
      autoplayTimer = window.setTimeout(nextSlide, delayMs);
    }

    function startAutoplay() {
      scheduleNextAutoplay();
    }

    function stopAutoplay() {
      if (autoplayTimer) {
        clearTimeout(autoplayTimer);
        autoplayTimer = null;
      }
    }

    carousel._stopAutoplay = stopAutoplay;

    if (prevBtn) {
      prevBtn.onclick = () => {
        prevSlide();
        startAutoplay();
      };
    }

    if (nextBtn) {
      nextBtn.onclick = () => {
        nextSlide();
        startAutoplay();
      };
    }

    dots.forEach((dot, idx) => {
      dot.onclick = () => {
        goToSlide(idx);
        startAutoplay();
      };
    });

    if (!carousel._hoverBound) {
      carousel.addEventListener('mouseenter', () => carousel._stopAutoplay?.());
      carousel.addEventListener('mouseleave', () => startAutoplay());
      carousel.addEventListener('focusin', () => carousel._stopAutoplay?.());
      carousel.addEventListener('focusout', () => startAutoplay());
      carousel._hoverBound = true;
    }

    goToSlide(0);
    startAutoplay();
  });
}
