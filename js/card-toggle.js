/**
 * Y8 YOUNG AGE — Card Toggle
 * Expand / collapse product how-to-use section
 */

const CardToggle = (() => {
  const attachListeners = (container = document) => {
    container.querySelectorAll('.expand-btn').forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = 'true';

      btn.addEventListener('click', () => {
        const card = btn.closest('.product-card');
        if (!card) return;

        const willExpand = card.classList.contains('collapsed');
        card.classList.toggle('collapsed', !willExpand);
        btn.setAttribute('aria-expanded', willExpand ? 'true' : 'false');

        const text = btn.querySelector('.btn-text');
        if (text) text.textContent = willExpand ? 'ปิด' : 'วิธีใช้';
      });
    });
  };

  return {
    init() {
      attachListeners(document);
    },
    refresh(container) {
      attachListeners(container || document);
    }
  };
})();

window.CardToggle = CardToggle;
