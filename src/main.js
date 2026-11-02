import { initNavigation } from './components/Navigation.js';
import { initFooter } from './components/Footer.js';
import { initCatalog, syncActiveDivisionsUI, applySiteContentToDOM } from './components/Catalog.js';
import { initQuote, updateQuoteWhatsAppNumber } from './components/Quote.js';
import { initContactForm } from './components/Contact.js';
import { initWhatsAppWidget, updateWhatsAppWidgetNumber } from './components/WhatsAppWidget.js';
import { initHeroCarousel } from './components/HeroCarousel.js';
import {
  fetchBanners,
  fetchSiteContent,
  getCachedActiveBanners,
  getCachedActiveProducts,
  getCachedSiteContent,
} from './services/api.js';

initNavigation();
initFooter();
initContactForm();
initWhatsAppWidget();

// Aplicar textos editables, contactos y visibilidad de divisiones activas desde caché inmediatamente
const cachedProducts = getCachedActiveProducts();
if (cachedProducts) {
  syncActiveDivisionsUI(cachedProducts);
}
const initialContent = getCachedSiteContent();
if (initialContent?.contact?.whatsappNumber) {
  updateWhatsAppWidgetNumber(initialContent.contact.whatsappNumber);
  updateQuoteWhatsAppNumber(initialContent.contact.whatsappNumber);
}
applySiteContentToDOM(initialContent);

// Renderizado instantáneo de banners promocionales (<sr7-poster>) y productos desde caché
initHeroCarousel({
  banners: getCachedActiveBanners(),
  products: cachedProducts,
});

// Sincronizar catálogo, banners de propaganda y contenidos web desde el servidor
Promise.all([initCatalog(), fetchBanners(), fetchSiteContent()]).then(([products, banners, siteContent]) => {
  syncActiveDivisionsUI(products);
  if (siteContent?.contact?.whatsappNumber) {
    updateWhatsAppWidgetNumber(siteContent.contact.whatsappNumber);
    updateQuoteWhatsAppNumber(siteContent.contact.whatsappNumber);
  }
  applySiteContentToDOM(siteContent);
  initHeroCarousel({ banners, products });
  initQuote();
});
