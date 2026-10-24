// Cotización por WhatsApp: permite seleccionar uno o más productos del catálogo,
// elegir talla/color disponibles, respetar cantidad mínima de pedido, agregar especificaciones
// y enviar el resumen como mensaje de WhatsApp.
import { formatCLP } from '../data/defaultCatalog.js';

const WHATSAPP_NUMBER = '56979684064';

export function initQuote() {
  const grid = document.getElementById('catalog-grid');
  if (!grid) return;

  const cards = grid.querySelectorAll('.product-card');
  if (cards.length === 0) return;

  /** @type {Map<string, {name: string, category: string, qty: number, minQty: number, colors: string[], sizes: string[], chosenColor: string, chosenSize: string, unitPriceText: string, note: string, input: HTMLInputElement}>} */
  const selected = new Map();
  const usedIds = new Set();

  // ---------- 1. Selector en cada tarjeta ----------
  cards.forEach((card, index) => {
    const name = card.querySelector('h3')?.textContent.trim() || `Producto ${index + 1}`;
    const category = card.querySelector('.category')?.textContent.trim() || '';

    let meta = {};
    if (card.dataset.productJson) {
      try {
        meta = JSON.parse(card.dataset.productJson);
      } catch {
        meta = {};
      }
    }

    let id = card.dataset.productId || slugify(name) || `producto-${index + 1}`;
    if (usedIds.has(id)) id = `${id}-${index + 1}`;
    usedIds.add(id);
    card.dataset.productId = id;

    const minQty = Math.max(1, Number(meta.minOrderQty) || 1);
    const colors = Array.isArray(meta.colors) ? meta.colors : [];
    const sizes = Array.isArray(meta.sizes) ? meta.sizes : [];
    let unitPriceText = '';
    if (meta.showPrice) {
      const effectivePrice = meta.offerPrice || meta.normalPrice;
      unitPriceText = formatCLP(effectivePrice);
    }

    const label = document.createElement('label');
    label.className = 'quote-toggle';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'quote-check';
    input.value = id;

    const offText = createEl('span', 'quote-toggle-off', 'Agregar a cotización');
    const onText = createEl('span', 'quote-toggle-on', 'Agregado');
    offText.setAttribute('aria-hidden', 'true');
    onText.setAttribute('aria-hidden', 'true');
    const srText = createEl('span', 'sr-only', `Agregar ${name} a la cotización`);

    label.append(input, offText, onText, srText);

    const existingCotizarBtn = card.querySelector('a[href="#contacto"], .btn-dark-outline');
    if (existingCotizarBtn) {
      existingCotizarBtn.replaceWith(label);
    } else {
      card.appendChild(label);
    }

    input.addEventListener('change', () => {
      if (input.checked) {
        selected.set(id, {
          name,
          category,
          qty: minQty,
          minQty,
          colors,
          sizes,
          chosenColor: colors[0] || '',
          chosenSize: sizes[0] || '',
          unitPriceText,
          note: '',
          input,
        });
      } else {
        selected.delete(id);
      }
      card.classList.toggle('is-selected', input.checked);
      updateBar();
    });
  });

  // ---------- 2. Barra flotante ----------
  let bar = document.querySelector('.quote-bar');
  let live = document.getElementById('quote-live-region');

  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'quote-bar';
    bar.hidden = true;
    bar.innerHTML = `
      <p class="quote-bar-count"><strong>0</strong> <span>productos seleccionados</span></p>
      <div class="quote-bar-actions">
        <button type="button" class="btn btn-sm quote-bar-clear">Limpiar</button>
        <button type="button" class="btn btn-primary btn-sm quote-bar-open" aria-haspopup="dialog">Solicitar cotización</button>
      </div>
    `;
    document.body.appendChild(bar);
  }

  if (!live) {
    live = createEl('div', 'sr-only');
    live.id = 'quote-live-region';
    live.setAttribute('aria-live', 'polite');
    document.body.appendChild(live);
  }

  const countEl = bar.querySelector('.quote-bar-count strong');
  const countLabel = bar.querySelector('.quote-bar-count span');

  bar.querySelector('.quote-bar-clear').onclick = clearSelection;
  bar.querySelector('.quote-bar-open').onclick = openDialog;

  function updateBar() {
    const count = selected.size;
    const text = count === 1 ? 'producto seleccionado' : 'productos seleccionados';
    countEl.textContent = String(count);
    countLabel.textContent = text;
    bar.hidden = count === 0;
    document.body.classList.toggle('has-quote-bar', count > 0);
    live.textContent = count > 0 ? `${count} ${text} para cotizar` : 'Cotización vacía';
  }

  function deselect(id) {
    const item = selected.get(id);
    if (!item) return;
    item.input.checked = false;
    item.input.closest('.product-card')?.classList.remove('is-selected');
    selected.delete(id);
  }

  function clearSelection() {
    [...selected.keys()].forEach(deselect);
    updateBar();
  }

  // ---------- 3. Diálogo de cotización ----------
  let dialog = document.getElementById('quote-dialog');
  if (dialog) dialog.remove();

  dialog = document.createElement('dialog');
  dialog.className = 'quote-dialog';
  dialog.id = 'quote-dialog';
  dialog.setAttribute('aria-labelledby', 'quote-dialog-title');
  dialog.setAttribute('closedby', 'any');
  dialog.innerHTML = `
    <form class="quote-form" novalidate>
      <header class="quote-dialog-header">
        <h2 id="quote-dialog-title">Solicitar cotización</h2>
        <button type="button" class="quote-dialog-close" aria-label="Cerrar">&times;</button>
      </header>
      <div class="quote-dialog-body">
        <p class="quote-dialog-intro">Revisa los productos seleccionados, indica la cantidad, talla/color y agrega las especificaciones que necesites (medidas, bordado, etc.).</p>
        <ol class="quote-items"></ol>
        <div class="form-group">
          <label for="quote-general-notes">Observaciones generales <span class="optional">(opcional)</span></label>
          <textarea id="quote-general-notes" rows="3" placeholder="Ej: plazo de entrega, despacho a regiones, datos de facturación..."></textarea>
        </div>
        <div class="form-group">
          <label for="quote-customer">Nombre / Institución <span class="optional">(opcional)</span></label>
          <input type="text" id="quote-customer" autocomplete="organization" placeholder="Ej: Juan Pérez - 3ª Compañía de Bomberos">
        </div>
      </div>
      <footer class="quote-dialog-footer">
        <button type="button" class="btn btn-dark-outline quote-dialog-cancel">Seguir viendo</button>
        <button type="submit" class="btn btn-whatsapp">Enviar por WhatsApp</button>
      </footer>
    </form>
  `;
  document.body.appendChild(dialog);

  const form = dialog.querySelector('.quote-form');
  const list = dialog.querySelector('.quote-items');
  const generalNotes = dialog.querySelector('#quote-general-notes');
  const customer = dialog.querySelector('#quote-customer');

  dialog.querySelector('.quote-dialog-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.quote-dialog-cancel').addEventListener('click', () => dialog.close());

  dialog.addEventListener('click', (e) => {
    const rect = dialog.getBoundingClientRect();
    const isInDialog =
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width;
    if (!isInDialog) {
      dialog.close();
    }
  });

  function openDialog() {
    if (selected.size === 0) return;
    renderItems();
    dialog.showModal();
  }

  function renderItems() {
    list.replaceChildren();

    selected.forEach((item, id) => {
      const li = createEl('li', 'quote-item');

      const head = createEl('div', 'quote-item-head');
      const title = createEl('div', 'quote-item-title');
      title.append(createEl('strong', 'quote-item-name', item.name));
      if (item.category) title.append(' ', createEl('span', 'category', item.category));
      if (item.unitPriceText) {
        title.append(' ', createEl('span', 'quote-item-price-tag', item.unitPriceText));
      }

      const remove = createEl('button', 'quote-item-remove', 'Quitar');
      remove.type = 'button';
      remove.setAttribute('aria-label', `Quitar ${item.name} de la cotización`);
      remove.addEventListener('click', () => {
        deselect(id);
        li.remove();
        updateBar();
        if (selected.size === 0) {
          dialog.close();
        } else {
          list.querySelector('.quote-item-remove')?.focus();
        }
      });
      head.append(title, remove);

      // Selectores rápidos de Talla y Color si el producto los tiene configurados
      let variantsRow = null;
      if (item.sizes.length > 0 || item.colors.length > 0) {
        variantsRow = createEl('div', 'quote-item-variants');
        if (item.sizes.length > 0) {
          const sizeGroup = createEl('div', 'form-group');
          const sizeLbl = createEl('label', '', 'Talla');
          sizeLbl.htmlFor = `quote-size-${id}`;
          const sizeSelect = document.createElement('select');
          sizeSelect.id = `quote-size-${id}`;
          const multiOpt = document.createElement('option');
          multiOpt.value = 'Varias tallas (detallar abajo)';
          multiOpt.textContent = 'Varias tallas (detallar)';
          item.sizes.forEach((sz) => {
            const opt = document.createElement('option');
            opt.value = sz;
            opt.textContent = `Talla ${sz}`;
            if (sz === item.chosenSize) opt.selected = true;
            sizeSelect.appendChild(opt);
          });
          sizeSelect.appendChild(multiOpt);
          sizeSelect.addEventListener('change', () => {
            item.chosenSize = sizeSelect.value;
          });
          sizeGroup.append(sizeLbl, sizeSelect);
          variantsRow.appendChild(sizeGroup);
        }

        if (item.colors.length > 0) {
          const colorGroup = createEl('div', 'form-group');
          const colorLbl = createEl('label', '', 'Color');
          colorLbl.htmlFor = `quote-color-${id}`;
          const colorSelect = document.createElement('select');
          colorSelect.id = `quote-color-${id}`;
          item.colors.forEach((col) => {
            const opt = document.createElement('option');
            opt.value = col;
            opt.textContent = col;
            if (col === item.chosenColor) opt.selected = true;
            colorSelect.appendChild(opt);
          });
          colorSelect.addEventListener('change', () => {
            item.chosenColor = colorSelect.value;
          });
          colorGroup.append(colorLbl, colorSelect);
          variantsRow.appendChild(colorGroup);
        }
      }

      const fields = createEl('div', 'quote-item-fields');

      const qtyGroup = createEl('div', 'form-group quote-qty');
      const qtyLabel = createEl(
        'label',
        '',
        item.minQty > 1 ? `Cantidad (mín. ${item.minQty})` : 'Cantidad'
      );
      qtyLabel.htmlFor = `quote-qty-${id}`;
      const qty = document.createElement('input');
      qty.type = 'number';
      qty.id = `quote-qty-${id}`;
      qty.min = String(item.minQty);
      qty.step = '1';
      qty.inputMode = 'numeric';
      qty.required = true;
      qty.value = String(item.qty);
      qty.addEventListener('input', () => {
        const value = parseInt(qty.value, 10);
        item.qty = Number.isFinite(value) && value >= item.minQty ? value : item.minQty;
      });
      qtyGroup.append(qtyLabel, qty);

      const noteGroup = createEl('div', 'form-group quote-note');
      const noteLabel = createEl('label');
      noteLabel.htmlFor = `quote-note-${id}`;
      noteLabel.append('Especificaciones ', createEl('span', 'optional', '(opcional)'));
      const note = document.createElement('textarea');
      note.id = `quote-note-${id}`;
      note.rows = 2;
      note.placeholder = 'Desglose de tallas, medidas, bordado institucional...';
      note.value = item.note;
      note.addEventListener('input', () => {
        item.note = note.value;
      });
      noteGroup.append(noteLabel, note);

      fields.append(qtyGroup, noteGroup);
      li.append(head);
      if (variantsRow) li.appendChild(variantsRow);
      li.appendChild(fields);
      list.appendChild(li);
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const message = buildMessage(selected, generalNotes.value, customer.value);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    dialog.close();
  });
}

function buildMessage(selected, generalNotes, customer) {
  const lines = [
    'Hola Gamfire Chile, quisiera solicitar una cotización de los siguientes productos:',
    '',
  ];

  let n = 1;
  selected.forEach((item) => {
    lines.push(`${n}. *${item.name}*${item.category ? ` (${item.category})` : ''}`);
    lines.push(`   Cantidad: ${item.qty}`);
    if (item.unitPriceText) lines.push(`   Precio ref.: ${item.unitPriceText} c/u`);
    if (item.chosenSize) lines.push(`   Talla: ${item.chosenSize}`);
    if (item.chosenColor) lines.push(`   Color: ${item.chosenColor}`);
    const note = item.note.trim();
    if (note) lines.push(`   Especificaciones: ${note.replace(/\s*\n\s*/g, '; ')}`);
    lines.push('');
    n += 1;
  });

  const notes = generalNotes.trim();
  if (notes) {
    lines.push('*Observaciones generales:*', notes, '');
  }

  const name = customer.trim();
  if (name) lines.push(`*Solicitado por:* ${name}`, '');

  lines.push('Quedo atento(a) a su respuesta. ¡Gracias!');
  return lines.join('\n');
}

function createEl(tag, className = '', text = '') {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
