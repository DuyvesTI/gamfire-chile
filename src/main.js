import { initNavigation } from './components/Navigation.js';
import { initFooter } from './components/Footer.js';
import { initCatalog } from './components/Catalog.js';
import { initQuote } from './components/Quote.js';
import { initContactForm } from './components/Contact.js';
import { initWhatsAppWidget } from './components/WhatsAppWidget.js';

initNavigation();
initFooter();
initContactForm();
initWhatsAppWidget();

// Inicializar catálogo dinámico primero y luego vincular la selección de cotización
initCatalog().then(() => {
  initQuote();
});
