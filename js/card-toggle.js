/**
 * Y8 YOUNG AGE — Card Toggle
 * Expand / collapse product how-to-use section
 */

const CardToggle = (() => {

  const attachListeners = (container = document) => {
    container.querySelectorAll('.expand-btn').forEach((btn) => {
      // Avoid double-binding
      if (btn.dataset.bound) return;
      btn.dataset.bound = 'true';

      btn.addEventListener('click', (e) => {
        e.stopPropagation();

        const card = btn.closest('.product-card');
        if (!card) return;

        const isCollapsed = card.classList.contains('collapsed');
        const expanded    = !isCollapsed; // after toggle

        card.classList.toggle('collapsed', !isCollapsed === false);
        // Simpler: just toggle
        if (isCollapsed) {
          card.classList.remove('collapsed');
          btn.setAttribute('aria-expanded', 'true');
          btn.querySelector('.btn-text').textContent = 'ปิด';
        } else {
          card.classList.add('collapsed');
          btn.setAttribute('aria-expanded', 'false');
          btn.querySelector('.btn-text').textContent = 'วิธีใช้';
        }
      });
    });
  };

  const init = () => {
    attachListeners(document);
  };

  // Allow calling after dynamic render
  const refresh = (container) => {
    attachListeners(container || document);
  };

  return { init, refresh };
})();

window.CardToggle = CardToggle;
