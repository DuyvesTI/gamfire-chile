export function initContactForm() {
  const form = document.querySelector('.contact-form');
  const feedback = document.getElementById('form-feedback');

  if (!form || !feedback) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const name = form.querySelector('#name').value.trim();
    const email = form.querySelector('#email').value.trim();
    const message = form.querySelector('#message').value.trim();

    feedback.textContent = `¡Gracias, ${name}! Tu mensaje ha sido procesado exitosamente. Nos comunicaremos contigo a ${email} a la brevedad.`;
    feedback.className = 'form-feedback success';

    // Reset form
    form.reset();

    // Prepare mailto link as fallback in background if needed
    const mailtoSubject = encodeURIComponent(`Consulta Web de ${name}`);
    const mailtoBody = encodeURIComponent(`Nombre: ${name}\nCorreo: ${email}\n\nMensaje:\n${message}`);
    const mailtoLink = `mailto:gamfirechile@gmail.com?subject=${mailtoSubject}&body=${mailtoBody}`;
    
    // Add optional direct send button in feedback
    const mailLinkEl = document.createElement('p');
    mailLinkEl.style.marginTop = '0.5rem';
    mailLinkEl.style.fontSize = '0.9rem';
    mailLinkEl.innerHTML = `¿Prefieres abrirlo en tu app de correo? <a href="${mailtoLink}" style="text-decoration: underline; font-weight: bold;">Haz clic aquí</a>.`;
    feedback.appendChild(mailLinkEl);
  });
}
