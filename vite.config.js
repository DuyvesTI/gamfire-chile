import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { apiServerPlugin } from './server/apiPlugin.js';

// Inserta los fragmentos de partials/ en cada página al servir/compilar,
// para que el menú y el pie vengan en el HTML (sin esperar a JavaScript).
// Además normaliza prefijos heredados (/gamfire-chile-web/ o /gamfire-chile/) en dev/preview
// para que todas las páginas (nosotros.html, catalogo.html, contacto.html, onepage.html) e imágenes resuelvan correctamente.
function normalizeLegacyBasePrefix(req, res, next) {
  if (!req.url) return next();
  if (/^\/gamfire-chile(?:-web(?:-main)?)?$/.test(req.url)) {
    res.statusCode = 302;
    res.setHeader('Location', `${req.url}/`);
    return res.end();
  }
  req.url = req.url.replace(/^\/gamfire-chile(?:-web(?:-main)?)?(?=\/)/, '') || '/';
  next();
}

function htmlPartials() {
  const partialsDir = resolve(__dirname, 'partials');
  const read = (name) => readFileSync(resolve(partialsDir, `${name}.html`), 'utf-8');
  return {
    name: 'html-partials',
    configureServer(server) {
      server.middlewares.use(normalizeLegacyBasePrefix);
    },
    configurePreviewServer(server) {
      server.middlewares.use(normalizeLegacyBasePrefix);
    },
    transformIndexHtml: {
      order: 'pre',
      handler: (html) =>
        html.replace(/<!--\s*@(head|header|footer)\s*-->/g, (_, name) => read(name)),
    },
    handleHotUpdate({ file, server }) {
      if (file.startsWith(partialsDir)) {
        server.ws.send({ type: 'full-reload' });
        return [];
      }
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [htmlPartials(), apiServerPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        nosotros: resolve(__dirname, 'nosotros.html'),
        catalogo: resolve(__dirname, 'catalogo.html'),
        contacto: resolve(__dirname, 'contacto.html'),
        onepage: resolve(__dirname, 'onepage.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
    },
  },
});
