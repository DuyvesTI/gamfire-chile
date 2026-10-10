// style.css se carga con <link> en el <head> (partials/head.html) para evitar parpadeos.
import { initNavigation } from './components/Navigation.js';
import { initFooter } from './components/Footer.js';
import { initCatalog } from './components/Catalog.js';
import { initContactForm } from './components/Contact.js';

initNavigation();
initFooter();
initCatalog();
initContactForm();
