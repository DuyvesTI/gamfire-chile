// Renderizado dinámico del catálogo, cabeceras por división (Corporativa, Fire, Seven, Accesorios)
// y sincronización con las pestañas superiores, URL y cotizador por WhatsApp.
import { fetchProducts } from '../services/api.js';
import { getCategoryLabel, normalizeCategoryId, formatCLP } from '../data/defaultCatalog.js';

const DIVISION_META = {
  all: {
    pageTitle: 'Catálogo General | GAM Chile',
    badge: 'CATÁLOGO GENERAL • GAM CHILE',
    titleHtml: 'TODAS NUESTRAS <span>DIVISIONES</span>',
    desc: 'Confección 100% nacional con proveedores e insumos certificados. Explora nuestras líneas Corporativa, Fire, Seven y Accesorios o selecciona los productos que deseas cotizar por WhatsApp.',
    bgImage: '/hero-banner.jpg',
    theme: 'all',
    pills: [
      '✓ Confección 100% Nacional',
      '✓ Insumos Certificados (3M / YKK)',
      '✓ Tallas Niños (2) a Adultos (6XL)',
      '✓ Envíos a Todo Chile',
    ],
    emptyBadge: 'CATÁLOGO GENERAL • GAM CHILE',
    emptyTitle: 'Catálogo General GAM CHILE',
    emptyLineName: 'GAM CHILE (Corporativa, Fire, Seven y Accesorios)',
    emptyCtaText: 'COTIZAR CATÁLOGO GAM CHILE POR WHATSAPP',
    emptyWhatsappText: 'Hola GAM Chile, quisiera solicitar una cotización de su catálogo',
    emptyCards: [
      {
        tag: 'PRÓXIMO INGRESO',
        title: 'División CORPORATIVA',
        desc: 'Nos especializamos en transformar la vestimenta laboral en una poderosa herramienta de identidad de marca, combinando elegancia, durabilidad en camisas de oxford y gabardina, blusas, pantalones de vestir, pantalones tipo cargo, poleras, chaquetas, parkas, uniforme institucional de oficina; manteniendo un estándar de presentación impecable.',
      },
      {
        tag: 'PRÓXIMO INGRESO',
        title: 'División FIRE & SEVEN',
        desc: 'Uniformes de emergencia, rescate e ignífugos con insumos certificados (NFPA 2112, ASTM F1506, EN 15614) y línea táctica SEVEN.',
      },
      {
        tag: 'PRÓXIMO INGRESO',
        title: 'División ACCESORIOS',
        desc: 'Jockeys y gorros bordados, cobertores y sábanas para guardia nocturna, mochilas y artículos institucionales.',
      },
    ],
  },
  corporativa: {
    pageTitle: 'División Corporativa | GAM Chile',
    badge: 'DIVISIÓN CORPORATIVA • GAM CHILE',
    titleHtml: 'DIVISIÓN <span>CORPORATIVA</span>',
    desc: 'Nos especializamos en transformar la vestimenta laboral en una poderosa herramienta de identidad de marca, combinando elegancia, durabilidad en camisas de oxford y gabardina, blusas, pantalones de vestir, pantalones tipo cargo, poleras, chaquetas, parkas, uniforme institucional de oficina; manteniendo un estándar de presentación impecable.',
    bgImage: 'uploads/division-corporativa.jpg',
    theme: 'corporativa',
    pills: [
      '✓ Telas Oxford, Royal Crop, Casimir y Gabardina',
      '✓ Calce Damas y Varón (Tallas XS a 4XL)',
      '✓ Bordado Institucional Personalizado',
      '✓ Ventas por Volumen con Factura',
    ],
    emptyBadge: 'DIVISIÓN CORPORATIVA • GAM CHILE',
    emptyTitle: 'Catálogo División CORPORATIVA',
    emptyLineName: 'Línea CORPORATIVA',
    emptyCtaText: 'COTIZAR LÍNEA CORPORATIVA POR WHATSAPP',
    emptyWhatsappText: 'Hola GAM Chile, quisiera cotizar prendas de la División CORPORATIVA',
    emptyCards: [
      {
        tag: 'PRÓXIMO INGRESO',
        title: 'Camisas, Blusas y Tenidas de Cuartel CORPORATIVA',
        desc: 'Confección en telas Oxford, Royal Crop y Gabardina para damas y varones, con porta palas, broches y bordado institucional.',
      },
      {
        tag: 'PRÓXIMO INGRESO',
        title: 'Pantalones de Cuartel y Uniformes de Parada CORPORATIVA',
        desc: 'Pantalones formales en casimir y gabardina certificada, chaquetas institucionales con pala y trajes de ceremonia.',
      },
      {
        tag: 'PRÓXIMO INGRESO',
        title: 'Chaquetas Ejecutivas, Comandante y Brigada CORPORATIVA',
        desc: 'Chaquetas impermeables antifluidos, bomber institucionales y uniformes personalizados desde talla 2 a 4XL.',
      },
    ],
  },
  fire: {
    pageTitle: 'División Fire | GAM Chile',
    badge: 'DIVISIÓN FIRE • EMERGENCIA Y ALTA EXIGENCIA',
    titleHtml: 'DIVISIÓN <span>FIRE • EMERGENCIA Y RESCATE</span>',
    desc: 'Indumentaria de emergencia y rescate de confección nacional con proveedores e insumos certificados (ASTM F1506, EN 15614, NFPA 2112, según corresponda), cintas reflectantes 3M, cierres YKK y costuras reforzadas.',
    bgImage: 'uploads/division-fire.jpg',
    theme: 'fire',
    pills: [
      '🔥 Normativas NFPA 2112 • ASTM F1506 • EN 15614',
      '✓ Telas Inherentes Retardantes a la Llama',
      '✓ Cintas Reflectantes 3M y Cierres YKK',
      '✓ Tallas Infantiles (2) a Adultos (6XL)',
    ],
    emptyBadge: 'DIVISIÓN FIRE • GAM CHILE',
    emptyTitle: 'Catálogo División FIRE',
    emptyLineName: 'Línea FIRE',
    emptyCtaText: 'COTIZAR LÍNEA FIRE POR WHATSAPP',
    emptyWhatsappText: 'Hola GAM Chile, quisiera cotizar prendas de la División FIRE',
    emptyCards: [
      {
        tag: 'PRÓXIMO INGRESO',
        title: 'Uniformes Multirol, USAR-GERSA y GRIMP FIRE',
        desc: 'Trajes de rescate técnico, urbano y vehicular con costuras reforzadas, cintas reflectantes 3M y cierres certificados YKK.',
      },
      {
        tag: 'PRÓXIMO INGRESO',
        title: 'Prendas Ignífugas y Forestales Certificadas FIRE',
        desc: 'Camisas, blusones y uniformes agrestes confeccionados con insumos certificados bajo normativas NFPA 2112, ASTM F1506 y EN 15614.',
      },
      {
        tag: 'PRÓXIMO INGRESO',
        title: 'Chaquetas de Rescate Vial y Diseño Rosenbauer FIRE',
        desc: 'Alta visibilidad y protección térmica para compañías de bomberos y brigadas de emergencia (tallas 2 a 6XL).',
      },
    ],
  },
  seven: {
    pageTitle: 'División Seven | GAM Chile',
    badge: 'DIVISIÓN SEVEN • DISEÑO Y RENDIMIENTO',
    titleHtml: 'DIVISIÓN <span>SEVEN</span>',
    desc: 'Línea especializada SEVEN de GAM Chile: vestuario técnico, táctico y operativo de alto desempeño diseñado para brindar movilidad, resistencia y confort térmico a tu equipo en terreno.',
    bgImage: 'uploads/division-seven.jpg',
    theme: 'seven',
    pills: [
      '⚡ Línea Exclusiva SEVEN GAM Chile',
      '✓ Telas Técnicas Ripstop, Softshell y Térmicas',
      '✓ Personalización con Bordado y Estampado',
      '✓ Despachos de Arica a Magallanes',
    ],
    emptyBadge: 'DIVISIÓN SEVEN • GAM CHILE',
    emptyTitle: 'Catálogo División SEVEN',
    emptyLineName: 'Línea SEVEN',
    emptyCtaText: 'COTIZAR LÍNEA SEVEN POR WHATSAPP',
    emptyWhatsappText: 'Hola GAM Chile, quisiera cotizar prendas de la División SEVEN',
    emptyCards: [
      {
        tag: 'PRÓXIMO INGRESO',
        title: 'Cortavientos y Polares Técnicos SEVEN',
        desc: 'Prendas térmicas y cortavientos respirables con ajuste ergonómico y personalización institucional.',
      },
      {
        tag: 'PRÓXIMO INGRESO',
        title: 'Pantalones y Tenidas Tácticas SEVEN',
        desc: 'Confección en telas Ripstop de alta resistencia para trabajo operativo, terreno y brigadas.',
      },
      {
        tag: 'PRÓXIMO INGRESO',
        title: 'Poleras y Primeras Capas SEVEN',
        desc: 'Línea ligera y deportiva con secado rápido, filtro UV y bordado o estampado de tu equipo.',
      },
    ],
  },
  accesorios: {
    pageTitle: 'División Accesorios | GAM Chile',
    badge: 'DIVISIÓN ACCESORIOS Y GUARDIA • GAM CHILE',
    titleHtml: 'DIVISIÓN <span>ACCESORIOS Y GUARDIA</span>',
    desc: 'Complementos institucionales y equipamiento para guardias nocturnas: jockeys, gorros safari y de lana bordados, mochilas de brigada, cobertores y sábanas negras con cinta reflectante y souvenirs 3D.',
    bgImage: 'uploads/division-accesorios.jpg',
    theme: 'accesorios',
    pills: [
      '✓ Jockeys y Gorros con Bordado Full Color',
      '✓ Cobertores y Sábanas Guardia Nocturna',
      '✓ Mochilas y Bananos Personalizados',
      '✓ Souvenirs y Mates Bomberos 3D',
    ],
    emptyBadge: 'DIVISIÓN ACCESORIOS • GAM CHILE',
    emptyTitle: 'Catálogo División ACCESORIOS',
    emptyLineName: 'Línea ACCESORIOS',
    emptyCtaText: 'COTIZAR LÍNEA ACCESORIOS POR WHATSAPP',
    emptyWhatsappText: 'Hola GAM Chile, quisiera cotizar productos de la División ACCESORIOS',
    emptyCards: [
      {
        tag: 'PRÓXIMO INGRESO',
        title: 'Jockeys, Gorros de Lana y Safari ACCESORIOS',
        desc: 'Gorros institucionales en gabardina y lana con bordado personalizado full color para compañías, brigadas y empresas.',
      },
      {
        tag: 'PRÓXIMO INGRESO',
        title: 'Cobertores, Quilts y Sábanas Guardia Nocturna ACCESORIOS',
        desc: 'Ropa de cama institucional en 1 y 1.5 plazas con cinta reflectante y bordado personalizado.',
      },
      {
        tag: 'PRÓXIMO INGRESO',
        title: 'Mochilas, Bananos y Souvenirs 3D ACCESORIOS',
        desc: 'Equipamiento para brigadas juveniles, bolsos personalizados, mates y llaveros institucionales en diseño 3D.',
      },
    ],
  },
};

let currentActiveFilter = 'all';
let currentVisibleCount = 0;
let latestActiveCategories = null;
let catalogApplyFilterFn = null;
let onePageInterceptorBound = false;

export function syncActiveDivisionsUI(products) {
  if (!Array.isArray(products)) return;

  const activeProds = products.filter((p) => p && p.active !== false);
  const activeCategories = new Set(activeProds.map((p) => normalizeCategoryId(p.category)));
  latestActiveCategories = activeCategories;
  const activeDivCount = activeCategories.size;

  // Retirar el estilo síncrono previo del head para que la UI tome el control dinámico exacto
  const guardStyle = document.getElementById('inline-active-divisions-guard');
  if (guardStyle) {
    guardStyle.remove();
  }

  // 1. Pestañas superiores (.top-division-bar mantiene su franja naranja y amarilla; solo se ocultan los botones sin artículos)
  document.querySelectorAll('.top-division-bar [data-division-tab]').forEach((tab) => {
    const cat = normalizeCategoryId(tab.getAttribute('data-division-tab'));
    tab.hidden = !activeCategories.has(cat);
  });
  document.querySelectorAll('.top-division-bar').forEach((bar) => {
    bar.hidden = false;
  });

  // 2. Tarjetas de "NUESTRAS DIVISIONES" en Inicio y One-Page
  document.querySelectorAll('.wa-division-card[data-division-card]').forEach((card) => {
    const cat = normalizeCategoryId(card.getAttribute('data-division-card'));
    card.hidden = !activeCategories.has(cat);
  });
  document.querySelectorAll('.wa-divisions-grid').forEach((grid) => {
    grid.style.setProperty('--active-divisions-cols', String(Math.max(1, activeDivCount)));
  });
  document.querySelectorAll('.wa-divisions-section').forEach((sec) => {
    sec.hidden = activeDivCount === 0;
  });

  // 3. Botones de filtro del Catálogo (.catalog-controls .filter-btn)
  document.querySelectorAll('.catalog-controls .filter-btn[data-filter]').forEach((btn) => {
    const rawFilter = btn.getAttribute('data-filter');
    if (rawFilter === 'all') {
      btn.hidden = activeDivCount <= 1;
    } else {
      const cat = normalizeCategoryId(rawFilter);
      btn.hidden = !activeCategories.has(cat);
    }
  });
  document.querySelectorAll('.catalog-controls').forEach((ctrl) => {
    ctrl.hidden = activeDivCount === 0;
  });

  // 4. Enlaces de Divisiones en el Footer
  document.querySelectorAll('[data-footer-division]').forEach((li) => {
    const cat = normalizeCategoryId(li.getAttribute('data-footer-division'));
    li.hidden = !activeCategories.has(cat);
  });
  document.querySelectorAll('[data-footer-divisions-col]').forEach((col) => {
    col.hidden = activeDivCount === 0;
  });
}

function setupOnePageInternalLinksInterceptor() {
  if (onePageInterceptorBound) return;
  onePageInterceptorBound = true;

  document.addEventListener('click', (e) => {
    if (!document.body.classList.contains('onepage-layout')) return;
    const anchor = e.target.closest('a[href]');
    if (!anchor) return;
    const rawHref = anchor.getAttribute('href') || '';
    if (!rawHref || rawHref.startsWith('http') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
      return;
    }

    if (rawHref.startsWith('index.html')) {
      e.preventDefault();
      document.getElementById('inicio')?.scrollIntoView({ behavior: 'smooth' });
    } else if (rawHref.startsWith('nosotros.html')) {
      e.preventDefault();
      document.getElementById('nosotros')?.scrollIntoView({ behavior: 'smooth' });
    } else if (rawHref.startsWith('contacto.html')) {
      e.preventDefault();
      document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' });
    } else if (rawHref.startsWith('catalogo.html')) {
      e.preventDefault();
      const qIdx = rawHref.indexOf('?');
      const params = qIdx !== -1 ? new URLSearchParams(rawHref.slice(qIdx)) : null;
      const cat = params?.get('categoria') || params?.get('cat') || 'all';
      if (typeof catalogApplyFilterFn === 'function') {
        catalogApplyFilterFn(cat, { updateUrl: false, scroll: true });
      } else {
        document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
}

export function enforceSiteLayoutMode(siteContent) {
  if (!siteContent || typeof siteContent !== 'object') return false;
  const mode = siteContent.siteLayoutMode === 'onepage' ? 'onepage' : 'multipage';
  const pathname = window.location.pathname;
  if (pathname.endsWith('admin.html') || pathname.endsWith('/admin')) return false;

  const isOnePageDoc =
    document.body.classList.contains('onepage-layout') ||
    pathname.endsWith('onepage.html') ||
    pathname.endsWith('/onepage');

  if (mode === 'onepage' && !isOnePageDoc) {
    let hash = window.location.hash || '';
    if (pathname.endsWith('nosotros.html') || pathname.endsWith('/nosotros')) {
      hash = '#nosotros';
    } else if (pathname.endsWith('catalogo.html') || pathname.endsWith('/catalogo')) {
      hash = '#catalogo';
    } else if (pathname.endsWith('contacto.html') || pathname.endsWith('/contacto')) {
      hash = '#contacto';
    }
    const target = `onepage.html${window.location.search || ''}${hash}`;
    window.location.replace(target);
    return true;
  }

  if (mode === 'multipage' && isOnePageDoc) {
    const hash = (window.location.hash || '').toLowerCase();
    let targetPage = 'index.html';
    if (hash === '#nosotros') targetPage = 'nosotros.html';
    else if (hash === '#catalogo') targetPage = 'catalogo.html';
    else if (hash === '#contacto') targetPage = 'contacto.html';
    const target = `${targetPage}${window.location.search || ''}`;
    window.location.replace(target);
    return true;
  }

  if (isOnePageDoc) {
    setupOnePageInternalLinksInterceptor();
  }
  return false;
}

export function applySiteContentToDOM(siteContent) {
  if (!siteContent || typeof siteContent !== 'object') return;
  if (enforceSiteLayoutMode(siteContent)) return;

  let activeContact = null;
  if (siteContent.contact) {
    activeContact = siteContent.contact;
    const cleanWaNum = String(activeContact.whatsappNumber || '').replace(/[^0-9]/g, '');
    const waUrl = activeContact.whatsappUrl || (cleanWaNum ? `https://wa.me/${cleanWaNum}` : '');
    const fbUrl = activeContact.facebookUrl || '';
    const fbName = activeContact.facebookName || 'Gam Fire Chile - Mi Bomberito';
    const igUrl = activeContact.instagramUrl || '';
    const igHandle = activeContact.instagramHandle || '@gam.chile';
    const email = activeContact.email || 'gamfirechile@gmail.com';

    // 1. Enlaces del Footer
    document.querySelectorAll('.main-footer').forEach((footer) => {
      const links = footer.querySelectorAll('a');
      links.forEach((a) => {
        const href = a.getAttribute('href') || '';
        if (href.includes('instagram.com')) {
          if (igUrl) a.href = igUrl;
          a.textContent = `Instagram: ${igHandle}`;
        } else if (href.includes('facebook.com')) {
          if (fbUrl) a.href = fbUrl;
          a.textContent = `Facebook: ${fbName}`;
        } else if (href.includes('wa.me')) {
          if (waUrl) a.href = waUrl;
          a.textContent = `WhatsApp: ${activeContact.whatsappNumber}`;
        } else if (href.startsWith('mailto:')) {
          if (email) {
            a.href = `mailto:${email}`;
            a.textContent = `Email: ${email}`;
          }
        }
      });
    });

    // 2. Bloque de Información en Contacto (contacto.html y onepage.html)
    document.querySelectorAll('.contact-info').forEach((info) => {
      const pList = info.querySelectorAll('p');
      pList.forEach((p) => {
        const strong = p.querySelector('strong');
        const a = p.querySelector('a');
        if (!strong || !a) return;
        const label = strong.textContent.toLowerCase();
        if (label.includes('whatsapp')) {
          if (waUrl) a.href = waUrl;
          a.textContent = activeContact.whatsappNumber;
        } else if (label.includes('facebook')) {
          if (fbUrl) a.href = fbUrl;
          a.textContent = fbName;
        } else if (label.includes('instagram')) {
          if (igUrl) a.href = igUrl;
          a.textContent = igHandle;
        } else if (label.includes('email')) {
          if (email) {
            a.href = `mailto:${email}`;
            a.textContent = email;
          }
        }
      });
    });
  }

  // 1. Bloque Introductorio (FABRICAMOS ROPA CORPORATIVA Y DE EMERGENCIA)
  if (siteContent.intro) {
    const { titleMain, titleHighlight, paragraph } = siteContent.intro;
    document.querySelectorAll('.wa-intro-banner').forEach((sec) => {
      const titleEl = sec.querySelector('.wa-bicolor-title');
      const pEl = sec.querySelector('.wa-intro-paragraph');
      if (titleEl && (titleMain || titleHighlight)) {
        titleEl.innerHTML = `${escapeHtml(titleMain || '')} <span>${escapeHtml(titleHighlight || '')}</span>`;
      }
      if (pEl && paragraph) {
        pEl.textContent = paragraph;
      }
    });
  }

  // 2. Sección Empresa (QUIÉNES SOMOS, Lema, 1. Misión, 2. Visión)
  if (siteContent.empresa) {
    const emp = siteContent.empresa;
    document.querySelectorAll('.wa-empresa-section').forEach((sec) => {
      const mainTitle = sec.querySelector('.wa-empresa-main-title');
      if (mainTitle && (emp.titleMain || emp.titleHighlight)) {
        mainTitle.innerHTML = `${escapeHtml(emp.titleMain || '')} <span>${escapeHtml(emp.titleHighlight || '')}</span>`;
      }

      const copyWrap = sec.querySelector('.wa-empresa-copy');
      if (copyWrap) {
        const paragraphs = copyWrap.querySelectorAll('p:not(.wa-empresa-motto)');
        if (paragraphs[0] && emp.paragraph1 !== undefined) paragraphs[0].textContent = emp.paragraph1;
        if (paragraphs[1] && emp.paragraph2 !== undefined) paragraphs[1].textContent = emp.paragraph2;
        if (paragraphs[2] && emp.paragraph3 !== undefined) paragraphs[2].textContent = emp.paragraph3;

        const mottoEl = copyWrap.querySelector('.wa-empresa-motto');
        if (mottoEl && emp.motto !== undefined) {
          mottoEl.innerHTML = `<strong>${escapeHtml(emp.motto)}</strong>`;
        }
      }

      const blocks = sec.querySelectorAll('.wa-empresa-blocks .wa-empresa-block');
      if (blocks[0]) {
        const hEl = blocks[0].querySelector('h2, h3');
        const pEl = blocks[0].querySelector('p');
        if (hEl && emp.misionTitle) hEl.textContent = emp.misionTitle;
        if (pEl && emp.misionText) pEl.textContent = emp.misionText;
      }
      if (blocks[1]) {
        const hEl = blocks[1].querySelector('h2, h3');
        const pEl = blocks[1].querySelector('p');
        if (hEl && emp.visionTitle) hEl.textContent = emp.visionTitle;
        if (pEl && emp.visionText) pEl.textContent = emp.visionText;
      }
    });
  }

  // 3. Banners de los Catálogos (General, Corporativa, Fire, Seven, Accesorios) y tarjetas de división
  if (siteContent.catalogBanners) {
    ['all', 'corporativa', 'fire', 'seven', 'accesorios'].forEach((key) => {
      const b = siteContent.catalogBanners[key];
      if (!b || !DIVISION_META[key]) return;

      if (b.badge) DIVISION_META[key].badge = b.badge;
      if (b.titleMain || b.titleHighlight) {
        DIVISION_META[key].titleHtml = `${escapeHtml(b.titleMain || '')} <span>${escapeHtml(
          b.titleHighlight || ''
        )}</span>`;
      }
      if (b.desc) DIVISION_META[key].desc = b.desc;
      if (b.bgImage) DIVISION_META[key].bgImage = b.bgImage;
      if (Array.isArray(b.pills)) DIVISION_META[key].pills = b.pills;

      if (key !== 'all') {
        document.querySelectorAll(`.wa-division-card[data-division-card="${key}"]`).forEach((card) => {
          const bgEl = card.querySelector('.wa-division-bg');
          if (bgEl && b.bgImage) {
            bgEl.style.backgroundImage = `url('${resolveImageUrl(b.bgImage)}')`;
          }
          const descEl = card.querySelector('.wa-division-content p');
          if (descEl && (b.cardDesc || b.desc)) {
            descEl.textContent = b.cardDesc || b.desc;
          }
        });
      }
    });

    if (document.getElementById('division-hero')) {
      updateDivisionHero(currentActiveFilter, currentVisibleCount);
    }
  }
}

export async function initCatalog() {
  const catalogGrid = document.getElementById('catalog-grid');
  const featuredGrid = document.getElementById('featured-products');

  const products = await fetchProducts({ includeInactive: false });
  syncActiveDivisionsUI(products);

  if (featuredGrid) {
    renderFeaturedProducts(featuredGrid, products);
  }

  if (catalogGrid) {
    renderCatalogGrid(catalogGrid, products);
    setupCategoryFilters(catalogGrid);
  }

  return products;
}

function resolveImageUrl(img) {
  if (!img) return '';
  if (img.startsWith('http') || img.startsWith('data:') || img.startsWith('/')) {
    return img;
  }
  const rawBase = import.meta.env?.BASE_URL || './';
  if (rawBase === './' || rawBase === '.') {
    return img.replace(/^\//, '');
  }
  const base = rawBase.replace(/\/$/, '');
  return `${base}/${img.replace(/^\//, '')}`;
}

function renderFeaturedProducts(container, products) {
  const featured = products.filter((p) => p.featured);
  const list = featured.length > 0 ? featured : products.slice(0, 3);
  const sectionEl = container.closest('.featured');
  container.replaceChildren();

  if (list.length === 0) {
    if (sectionEl) sectionEl.hidden = true;
    return;
  }
  if (sectionEl) sectionEl.hidden = false;

  list.forEach((product) => {
    const card = document.createElement('div');
    card.className = 'product-card';

    const imgWrap = createProductImageEl(product);
    const title = document.createElement('h3');
    title.textContent = product.name;

    const catBadge = document.createElement('span');
    catBadge.className = 'category';
    catBadge.textContent = getCategoryLabel(product.category);

    const desc = document.createElement('p');
    desc.textContent = product.description || '';

    const priceEl = createPriceBlock(product);

    const normCat = normalizeCategoryId(product.category);
    const link = document.createElement('a');
    link.href = `catalogo.html?categoria=${encodeURIComponent(normCat)}`;
    link.className = 'btn btn-dark-outline';
    link.textContent = `Ver en División ${getCategoryLabel(normCat)}`;

    card.append(imgWrap, title, catBadge, desc);
    if (priceEl) card.appendChild(priceEl);
    card.appendChild(link);

    container.appendChild(card);
  });
}

function renderCatalogGrid(container, products) {
  container.replaceChildren();

  products.forEach((product) => {
    const normCategory = normalizeCategoryId(product.category);
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.category = normCategory;
    card.dataset.productId = product.id;
    card.dataset.productJson = JSON.stringify({
      id: product.id,
      name: product.name,
      category: getCategoryLabel(normCategory),
      normalPrice: product.normalPrice,
      offerPrice: product.offerPrice,
      showPrice: product.showPrice,
      colors: product.colors || [],
      sizes: product.sizes || [],
      minOrderQty: product.minOrderQty || 1,
    });

    const imgWrap = createProductImageEl(product);

    const title = document.createElement('h3');
    title.textContent = product.name;

    const catBadge = document.createElement('span');
    catBadge.className = 'category';
    catBadge.textContent = `División ${getCategoryLabel(normCategory)}`;

    const desc = document.createElement('p');
    desc.className = 'product-desc';
    desc.textContent = product.description || '';

    card.append(imgWrap, title, catBadge, desc);

    const priceEl = createPriceBlock(product);
    if (priceEl) card.appendChild(priceEl);

    const metaEl = createProductMetaBlock(product);
    if (metaEl) card.appendChild(metaEl);

    container.appendChild(card);
  });

  // Bloque dinámico cuando una división (o el catálogo completo) no tiene productos activos cargados
  const emptyNotice = document.createElement('div');
  emptyNotice.className = 'catalog-empty-division is-hidden';
  emptyNotice.id = 'catalog-empty-division';
  container.appendChild(emptyNotice);
}

function updateEmptyDivisionNotice(emptyNotice, filterKey) {
  const meta = DIVISION_META[filterKey] || DIVISION_META.all;
  const cardsHtml = (meta.emptyCards || [])
    .map(
      (c) => `
        <div class="seven-preview-card">
          <span class="seven-preview-tag">${escapeHtml(c.tag)}</span>
          <h4>${escapeHtml(c.title)}</h4>
          <p>${escapeHtml(c.desc)}</p>
        </div>
      `
    )
    .join('');

  const waUrl = `https://wa.me/56979684064?text=${encodeURIComponent(
    meta.emptyWhatsappText || 'Hola GAM Chile, quisiera solicitar una cotización'
  )}`;

  emptyNotice.setAttribute('data-theme', meta.theme || filterKey);
  emptyNotice.innerHTML = `
    <div class="catalog-empty-inner">
      <span class="catalog-empty-badge">${escapeHtml(meta.emptyBadge || meta.badge)}</span>
      <h3 id="empty-division-title">${escapeHtml(meta.emptyTitle || 'Catálogo GAM CHILE')}</h3>
      <p>Esta sección está lista para la carga de fotografías oficiales de la <strong>${escapeHtml(
        meta.emptyLineName || 'Línea GAM CHILE'
      )}</strong> desde el panel de administración. Mientras tanto, conoce las líneas que componen esta división o solicita tu cotización directa:</p>
      <div class="seven-preview-grid">
        ${cardsHtml}
      </div>
      <a href="${escapeAttr(waUrl)}" target="_blank" rel="noopener" class="wa-btn-orange">${escapeHtml(
    meta.emptyCtaText || 'COTIZAR POR WHATSAPP'
  )}</a>
    </div>
  `;
}

function createProductImageEl(product) {
  const imgUrl = resolveImageUrl(product.image);
  const div = document.createElement('div');
  div.className = 'product-img-placeholder';
  div.setAttribute('role', 'img');
  div.setAttribute('aria-label', product.name);
  if (imgUrl) {
    div.style.backgroundImage = `url('${imgUrl}')`;
  }
  if (product.offerPrice && product.showPrice) {
    const badge = document.createElement('span');
    badge.className = 'product-offer-badge';
    badge.textContent = 'OFERTA';
    div.appendChild(badge);
  }
  return div;
}

function createPriceBlock(product) {
  if (!product.showPrice) return null;
  const normal = formatCLP(product.normalPrice);
  const offer = formatCLP(product.offerPrice);
  if (!normal && !offer) return null;

  const wrap = document.createElement('div');
  wrap.className = 'product-pricing';

  if (offer && normal && Number(product.offerPrice) < Number(product.normalPrice)) {
    const oldSpan = document.createElement('span');
    oldSpan.className = 'price-normal-struck';
    oldSpan.textContent = normal;

    const offerSpan = document.createElement('span');
    offerSpan.className = 'price-offer';
    offerSpan.textContent = offer;

    wrap.append(oldSpan, offerSpan);
  } else {
    const mainSpan = document.createElement('span');
    mainSpan.className = 'price-current';
    mainSpan.textContent = offer || normal;
    wrap.appendChild(mainSpan);
  }
  return wrap;
}

function createProductMetaBlock(product) {
  const colors = Array.isArray(product.colors) ? product.colors.filter(Boolean) : [];
  const sizes = Array.isArray(product.sizes) ? product.sizes.filter(Boolean) : [];
  const minQty = Number(product.minOrderQty) || 1;

  if (colors.length === 0 && sizes.length === 0 && minQty <= 1) return null;

  const wrap = document.createElement('div');
  wrap.className = 'product-specs-summary';

  if (colors.length > 0) {
    const row = document.createElement('div');
    row.className = 'spec-pill-row';
    row.innerHTML = `<span class="spec-label">Colores:</span> <span class="spec-val">${escapeHtml(colors.join(', '))}</span>`;
    wrap.appendChild(row);
  }

  if (sizes.length > 0) {
    const row = document.createElement('div');
    row.className = 'spec-pill-row';
    row.innerHTML = `<span class="spec-label">Tallas:</span> <span class="spec-val">${escapeHtml(sizes.join(' · '))}</span>`;
    wrap.appendChild(row);
  }

  if (minQty > 1) {
    const row = document.createElement('div');
    row.className = 'spec-min-qty';
    row.textContent = `Pedido mínimo: ${minQty} unidades`;
    wrap.appendChild(row);
  }

  return wrap;
}

function updateDivisionHero(filterKey, visibleCount) {
  const meta = DIVISION_META[filterKey] || DIVISION_META.all;
  const heroEl = document.getElementById('division-hero');
  const bgEl = document.getElementById('division-hero-bg');
  const badgeEl = document.getElementById('division-hero-badge');
  const titleEl = document.getElementById('division-hero-title');
  const descEl = document.getElementById('division-hero-desc');
  const pillsEl = document.getElementById('division-hero-pills');
  const countEl = document.getElementById('division-results-count');

  if (heroEl) {
    heroEl.setAttribute('data-theme', meta.theme);
  }
  if (bgEl) {
    bgEl.style.backgroundImage = `url('${resolveImageUrl(meta.bgImage)}')`;
  }
  if (badgeEl) {
    badgeEl.textContent = meta.badge;
  }
  if (titleEl) {
    titleEl.innerHTML = meta.titleHtml;
  }
  if (descEl) {
    descEl.textContent = meta.desc;
  }
  if (pillsEl && Array.isArray(meta.pills)) {
    pillsEl.innerHTML = meta.pills
      .map((p) => `<span class="division-pill">${escapeHtml(p)}</span>`)
      .join('');
  }
  if (countEl) {
    if (filterKey === 'all') {
      countEl.textContent = `Mostrando ${visibleCount} productos en todas las divisiones`;
    } else {
      const label = getCategoryLabel(filterKey);
      countEl.textContent =
        visibleCount > 0
          ? `Mostrando ${visibleCount} productos de la División ${label}`
          : `División ${label} — Catálogo en preparación`;
    }
  }

  const isOnePage = document.body.classList.contains('onepage-layout');
  if (!isOnePage && meta.pageTitle) {
    document.title = meta.pageTitle;
  }
}

function setupCategoryFilters(grid) {
  const buttons = document.querySelectorAll('.filter-btn');
  const topTabs = document.querySelectorAll('[data-division-tab]');
  if (buttons.length === 0) return;

  function applyFilter(rawFilter, { updateUrl = false, scroll = false } = {}) {
    let filter = !rawFilter || rawFilter === 'all' ? 'all' : normalizeCategoryId(rawFilter);

    // Si la división solicitada no tiene productos activos, redirigir a 'all' (o a la única división activa)
    if (latestActiveCategories && latestActiveCategories.size > 0) {
      if (filter !== 'all' && !latestActiveCategories.has(filter)) {
        filter = latestActiveCategories.size === 1 ? Array.from(latestActiveCategories)[0] : 'all';
      } else if (filter === 'all' && latestActiveCategories.size === 1) {
        filter = Array.from(latestActiveCategories)[0];
      }
    }

    currentActiveFilter = filter;

    buttons.forEach((b) => {
      const btnFilter = b.getAttribute('data-filter');
      const isMatch = btnFilter === filter;
      b.setAttribute('aria-pressed', String(isMatch));
      b.classList.toggle('active', isMatch);
    });

    topTabs.forEach((tab) => {
      const tabDiv = tab.getAttribute('data-division-tab');
      tab.classList.toggle('is-active', tabDiv === filter);
    });

    // En modo multipágina, si estamos en una división específica (Corporativa/Fire/Seven),
    // desmarcar "CATÁLOGO" general del menú negro para que quede claro en qué pestaña estamos.
    const isOnePage = document.body.classList.contains('onepage-layout');
    if (!isOnePage) {
      const catalogNavLink = document.querySelector('.main-nav a[href="catalogo.html"]');
      if (catalogNavLink) {
        if (filter === 'all') {
          catalogNavLink.setAttribute('aria-current', 'page');
        } else {
          catalogNavLink.removeAttribute('aria-current');
        }
      }
    }

    const cards = grid.querySelectorAll('.product-card');
    let visibleCount = 0;

    cards.forEach((card) => {
      const category = card.getAttribute('data-category');
      const matches = filter === 'all' || category === filter;
      card.classList.toggle('is-hidden', !matches);
      if (matches) visibleCount++;
    });

    currentVisibleCount = visibleCount;
    updateDivisionHero(filter, visibleCount);

    const emptyNotice = grid.querySelector('#catalog-empty-division');
    if (emptyNotice) {
      const showEmpty = visibleCount === 0;
      emptyNotice.classList.toggle('is-hidden', !showEmpty);
      if (showEmpty) {
        updateEmptyDivisionNotice(emptyNotice, filter);
      }
    }

    if (updateUrl && !isOnePage) {
      const url = new URL(window.location.href);
      url.searchParams.delete('cat');
      if (filter === 'all') {
        url.searchParams.delete('categoria');
      } else {
        url.searchParams.set('categoria', filter);
      }
      window.history.pushState({ categoria: filter }, '', url.toString());
    }

    if (scroll) {
      const targetEl = document.getElementById('division-hero') || document.getElementById('catalogo') || document.getElementById('main-content');
      targetEl?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter') || 'all';
      applyFilter(filter, { updateUrl: true, scroll: false });
    });
  });

  // Enlaces con data-division-filter o pestañas superiores dentro de la misma página
  document.querySelectorAll('[data-division-filter], [data-division-tab]').forEach((el) => {
    el.addEventListener('click', (e) => {
      const targetFilter = el.getAttribute('data-division-filter') || el.getAttribute('data-division-tab');
      if (!targetFilter) return;

      const isOnePage = document.body.classList.contains('onepage-layout');
      const isCatalogPage =
        window.location.pathname.endsWith('catalogo.html') ||
        window.location.pathname.endsWith('/catalogo');

      if (isOnePage || isCatalogPage) {
        e.preventDefault();
        applyFilter(targetFilter, { updateUrl: true, scroll: true });
      }
    });
  });

  // Si el usuario hace clic en "CATÁLOGO" del menú negro estando ya en catalogo.html o en onepage.html, mostrar todas las divisiones
  const catalogNavLinks = document.querySelectorAll(
    '.main-nav a[href="catalogo.html"], .main-footer a[href="catalogo.html"], .main-nav a[href="#catalogo"]'
  );
  catalogNavLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const isOnePage = document.body.classList.contains('onepage-layout');
      const isCatalogPage =
        window.location.pathname.endsWith('catalogo.html') ||
        window.location.pathname.endsWith('/catalogo');
      if (isCatalogPage) {
        e.preventDefault();
        applyFilter('all', { updateUrl: true, scroll: true });
      } else if (isOnePage) {
        applyFilter('all', { updateUrl: false, scroll: false });
      }
    });
  });

  // Soportar botón Atrás / Adelante del navegador en catalogo.html
  window.addEventListener('popstate', () => {
    const params = new URLSearchParams(window.location.search);
    const urlCat = params.get('categoria') || params.get('cat') || 'all';
    applyFilter(urlCat, { updateUrl: false, scroll: false });
  });

  // Aplicar filtro inicial según URL (?categoria=corporativa | fire | seven | accesorios)
  catalogApplyFilterFn = applyFilter;
  const params = new URLSearchParams(window.location.search);
  const urlCat = params.get('categoria') || params.get('cat') || 'all';
  applyFilter(urlCat, { updateUrl: false, scroll: false });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, '&#39;');
}
