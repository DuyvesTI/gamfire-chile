// Botón flotante draggable de WhatsApp con ventana de chat emergente
const WHATSAPP_NUMBER = '56979684064';

export function initWhatsAppWidget() {
  // Evitar duplicados si se inicializa más de una vez
  if (document.getElementById('wa-floating-widget')) return;

  const widget = document.createElement('div');
  widget.id = 'wa-floating-widget';
  widget.className = 'wa-widget';

  widget.innerHTML = `
    <!-- Ventana / Nube de chat -->
    <div class="wa-chat-box" id="wa-chat-box" role="dialog" aria-label="Chat de WhatsApp" aria-hidden="true">
      <div class="wa-chat-header">
        <div class="wa-chat-avatar">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"/>
          </svg>
        </div>
        <div class="wa-chat-header-info">
          <h4>Gamfire Chile</h4>
          <span class="wa-status-dot"></span> <span>En línea • Respuesta rápida</span>
        </div>
        <button type="button" class="wa-chat-close" id="wa-chat-close" aria-label="Cerrar chat">&times;</button>
      </div>

      <div class="wa-chat-body">
        <div class="wa-bubble-received">
          <p>¡Hola! 👋 Bienvenido a Gamfire Chile.</p>
          <p>¿En qué podemos ayudarte hoy? Escríbenos tu consulta aquí y te responderemos de inmediato por WhatsApp.</p>
          <span class="wa-bubble-time" id="wa-bubble-time">10:00</span>
        </div>
      </div>

      <form class="wa-chat-footer" id="wa-chat-form">
        <textarea 
          id="wa-chat-input" 
          rows="2" 
          placeholder="Escribe tu mensaje aquí..." 
          required
        ></textarea>
        <button type="submit" class="wa-send-btn" aria-label="Enviar mensaje por WhatsApp">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </form>
    </div>

    <!-- Botón flotante WhatsApp -->
    <button 
      type="button" 
      class="wa-float-btn" 
      id="wa-float-btn" 
      aria-label="Abrir chat de WhatsApp"
      title="Arrastra para mover o haz clic para chatear"
    >
      <svg class="wa-btn-icon" viewBox="0 0 448 512" width="34" height="34" fill="#ffffff" aria-hidden="true">
        <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
      </svg>
      <span class="wa-tooltip">¿Necesitas ayuda? Escríbenos</span>
    </button>
  `;

  document.body.appendChild(widget);

  const floatBtn = widget.querySelector('#wa-float-btn');
  const chatBox = widget.querySelector('#wa-chat-box');
  const closeBtn = widget.querySelector('#wa-chat-close');
  const chatForm = widget.querySelector('#wa-chat-form');
  const chatInput = widget.querySelector('#wa-chat-input');
  const timeEl = widget.querySelector('#wa-bubble-time');

  // Hora actual en el mensaje de bienvenida
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  timeEl.textContent = `${hours}:${minutes}`;

  // ==========================================================
  // 1. DRAG AND DROP (Soporte Mouse y Touch en móviles)
  // ==========================================================
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initialLeft = 0;
  let initialTop = 0;
  let hasMoved = false;
  const DRAG_THRESHOLD = 6; // px de tolerancia antes de considerarse arrastre

  // Posicionar inicialmente el botón en bottom-right
  function initPosition() {
    const margin = 24;
    const btnSize = 60;
    const left = window.innerWidth - btnSize - margin;
    const top = window.innerHeight - btnSize - margin;
    widget.style.left = `${Math.max(10, left)}px`;
    widget.style.top = `${Math.max(10, top)}px`;
    widget.style.bottom = 'auto';
    widget.style.right = 'auto';
  }

  // Esperar al siguiente render para posicionar
  requestAnimationFrame(initPosition);

  // Resize listener para mantener dentro de pantalla
  window.addEventListener('resize', () => {
    clampWidgetPosition();
    adjustChatBoxPosition();
  });

  function clampWidgetPosition() {
    const rect = widget.getBoundingClientRect();
    const btnRect = floatBtn.getBoundingClientRect();
    const maxLeft = window.innerWidth - btnRect.width - 10;
    const maxTop = window.innerHeight - btnRect.height - 10;

    const currentLeft = parseFloat(widget.style.left) || rect.left;
    const currentTop = parseFloat(widget.style.top) || rect.top;

    const clampedLeft = Math.min(Math.max(10, currentLeft), maxLeft);
    const clampedTop = Math.min(Math.max(10, currentTop), maxTop);

    widget.style.left = `${clampedLeft}px`;
    widget.style.top = `${clampedTop}px`;
  }

  function onDragStart(clientX, clientY) {
    isDragging = true;
    hasMoved = false;
    startX = clientX;
    startY = clientY;

    const rect = widget.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop = rect.top;

    widget.classList.add('is-dragging');
  }

  function onDragMove(clientX, clientY) {
    if (!isDragging) return;

    const deltaX = clientX - startX;
    const deltaY = clientY - startY;

    if (!hasMoved && Math.hypot(deltaX, deltaY) > DRAG_THRESHOLD) {
      hasMoved = true;
    }

    if (hasMoved) {
      const btnRect = floatBtn.getBoundingClientRect();
      const maxLeft = window.innerWidth - btnRect.width - 8;
      const maxTop = window.innerHeight - btnRect.height - 8;

      const newLeft = Math.min(Math.max(8, initialLeft + deltaX), maxLeft);
      const newTop = Math.min(Math.max(8, initialTop + deltaY), maxTop);

      widget.style.left = `${newLeft}px`;
      widget.style.top = `${newTop}px`;

      adjustChatBoxPosition();
    }
  }

  function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;
    widget.classList.remove('is-dragging');
  }

  // Eventos de Mouse
  floatBtn.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // Solo botón izquierdo
    onDragStart(e.clientX, e.clientY);

    const onMouseMove = (ev) => onDragMove(ev.clientX, ev.clientY);
    const onMouseUp = () => {
      onDragEnd();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  });

  // Eventos Touch (Móviles / Tablets)
  floatBtn.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    onDragStart(touch.clientX, touch.clientY);
  }, { passive: true });

  floatBtn.addEventListener('touchmove', (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    onDragMove(touch.clientX, touch.clientY);
  }, { passive: true });

  floatBtn.addEventListener('touchend', () => {
    onDragEnd();
  });

  // ==========================================================
  // 2. ABRIR / CERRAR VENTANA DE CHAT
  // ==========================================================
  floatBtn.addEventListener('click', (e) => {
    // Si se estuvo arrastrando, no disparar el toggle del chat
    if (hasMoved) {
      e.preventDefault();
      return;
    }
    toggleChat();
  });

  closeBtn.addEventListener('click', () => {
    closeChat();
  });

  function toggleChat() {
    const isOpen = widget.classList.contains('is-open');
    if (isOpen) {
      closeChat();
    } else {
      openChat();
    }
  }

  function openChat() {
    adjustChatBoxPosition();
    widget.classList.add('is-open');
    chatBox.setAttribute('aria-hidden', 'false');
    setTimeout(() => chatInput.focus(), 150);
  }

  function closeChat() {
    widget.classList.remove('is-open');
    chatBox.setAttribute('aria-hidden', 'true');
    floatBtn.focus();
  }

  // Ajustar la orientación de la nube de chat según la posición del botón
  function adjustChatBoxPosition() {
    const btnRect = floatBtn.getBoundingClientRect();
    const chatWidth = 330;
    const chatHeight = 420;

    // Si está muy arriba, abrir hacia abajo; sino hacia arriba
    const openDown = btnRect.top < chatHeight && (window.innerHeight - btnRect.bottom) > chatHeight;
    // Si está muy a la izquierda, alinear a la izquierda del botón; si está a la derecha, a la derecha
    const alignRight = btnRect.left > (window.innerWidth / 2);

    chatBox.classList.toggle('open-down', openDown);
    chatBox.classList.toggle('align-left', !alignRight);
  }

  // Cerrar al presionar Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && widget.classList.contains('is-open')) {
      closeChat();
    }
  });

  // ==========================================================
  // 3. ENVÍO DE MENSAJE POR WHATSAPP
  // ==========================================================
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');

    chatInput.value = '';
    closeChat();
  });
}
