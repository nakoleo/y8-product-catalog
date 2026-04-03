/**
 * Y8 YOUNG AGE — Main Entry
 * Orchestrates: LIFF init · Data fetch · DOM render · Interactions
 */

const STEP_METRIC_LABELS = {
  cleansing: ['Deep Clean', 'Oil Balance', 'Gentle Care', 'Barrier Comfort'],
  'health-skin': ['Brightening', 'Moisture Plump', 'Pore Refining', 'Barrier Strength'],
  spot: ['Blemish Reduction', 'Tone Correction', 'Repair Recovery', 'Calm Control'],
  sun: ['UV Shield', 'Comfort Wear', 'Tone Support', 'Skin Defense'],
  cosmetics: ['Tone Perfecting', 'Oil Control', 'Smooth Finish', 'Hydration Comfort'],
  internal: ['Antioxidant Support', 'Metabolic Support', 'Gut Balance', 'Daily Vitality']
};

document.addEventListener('DOMContentLoaded', async () => {
  if (window.Y8_LIFF) {
    Y8_LIFF.init().catch(() => {});
  }

  let data = null;
  try {
    const res = await fetch('data/products.json');
    data = await res.json();
  } catch (err) {
    console.error('[Y8] Could not load products.json:', err);
    return;
  }

  const stepNavList = document.getElementById('stepNavList');
  if (stepNavList && data.steps) {
    data.steps.forEach((step) => {
      const li = document.createElement('li');
      li.className = 'step-nav-item';
      li.dataset.target = step.id;
      li.innerHTML = `
        <span class="step-nav-num">0${step.step}</span>
        <span class="step-nav-label">${step.label}</span>
      `;
      li.addEventListener('click', () => {
        const target = document.getElementById(step.id);
        if (!target) return;
        const offset = document.querySelector('.brand-bar')?.offsetHeight || 52;
        const navOffset = document.querySelector('.step-nav')?.offsetHeight || 44;
        const top = target.getBoundingClientRect().top + window.scrollY - offset - navOffset - 8;
        window.scrollTo({ top, behavior: 'smooth' });
      });
      stepNavList.appendChild(li);
    });
  }

  const main = document.getElementById('mainContent');
  if (main && data.steps) {
    data.steps.forEach((step) => {
      main.appendChild(createSection(step));
    });
  }

  if (window.ScrollReveal) ScrollReveal.init();
  if (window.CardToggle) CardToggle.init();

  initActiveNav();
  initBackToTop();
  initSectionParallax();
});

function createSection(step) {
  const section = document.createElement('section');
  section.id = step.id;
  section.className = 'step-section';
  section.dataset.step = step.step;

  const iconHtml = step.icon
    ? `<div class="section-icon-wrap"><img src="${step.icon}" alt="${step.label} icon" loading="lazy" onerror="this.style.display='none'"></div>`
    : '';

  section.innerHTML = `
    <div class="section-header reveal" data-parallax>
      ${iconHtml}
      <div class="section-title-block">
        <div class="section-title">${escapeHtml(stripTrademark(step.label))}</div>
        <div class="section-tagline">${escapeHtml(cleanTagline(step.tagline))}</div>
      </div>
    </div>
    <div class="product-list" id="list-${step.id}"></div>
  `;

  const list = section.querySelector('.product-list');
  step.products.forEach((product) => {
    list.appendChild(createProductCard(product, step.id));
  });

  return section;
}

function createProductCard(product, stepId) {
  const card = document.createElement('article');
  card.className = 'product-card collapsed';
  card.dataset.productId = product.id;

  const displayName = escapeHtml(stripTrademark(product.name));
  const subname = escapeHtml(stripTrademark(product.subname || ''));
  const description = product.description ? `<p class="product-desc">${escapeHtml(product.description)}</p>` : '';
  const metrics = createMetrics(product.metrics || [], stepId);

  card.innerHTML = `
    <div class="product-body">
      <div class="product-img-wrap">
        <div class="product-img-stage">
          <img
            src="${product.image}"
            alt="${displayName}"
            loading="lazy"
            onerror="this.style.display='none'; this.parentElement.classList.add('is-missing');"
          />
          <div class="img-placeholder">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <rect width="32" height="32" rx="8" fill="#f2f2f2"/>
              <path d="M8 22l6-8 4 5 3-3 5 6H8z" fill="#a3a8b3"/>
              <circle cx="21" cy="11" r="2.5" fill="#a3a8b3"/>
            </svg>
            <span>Image unavailable</span>
          </div>
        </div>
      </div>
      <div class="product-name">${displayName}</div>
      <div class="product-subname">${subname}</div>
      ${metrics}
      ${description}
      <div class="product-how">
        <div class="product-how-inner">
          <div class="product-how-label">วิธีใช้</div>
          <div class="product-how-text">${escapeHtml(product.howToUse)}</div>
        </div>
      </div>
      <button class="expand-btn" aria-expanded="false" type="button">
        <span class="btn-text">วิธีใช้</span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M3 5L7 9L11 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  `;

  return card;
}

function createMetrics(values, stepId) {
  const labels = STEP_METRIC_LABELS[stepId] || [];
  if (!labels.length || !values.length) return '';

  const rows = labels.map((label, index) => {
    const value = Math.max(0, Math.min(5, Number(values[index] || 0)));
    const segments = Array.from({ length: 5 }, (_, segmentIndex) => {
      const active = segmentIndex < value ? ' active' : '';
      return `<span class="metric-segment${active}"></span>`;
    }).join('');

    return `
      <div class="metric-row">
        <div class="metric-label">${escapeHtml(label)}</div>
        <div class="metric-bar" aria-hidden="true">${segments}</div>
      </div>
    `;
  }).join('');

  return `<div class="product-metrics">${rows}</div>`;
}

function stripTrademark(text = '') {
  return text.replace(/[™]/g, '').replace(/\s{2,}/g, ' ').trim();
}

function cleanTagline(text = '') {
  return text
    .replace(/\s+[—-]\s+.*$/u, '')
    .replace(/[—-].*$/u, (match, offset, source) => (offset === 0 ? '' : match))
    .trim();
}

function escapeHtml(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function initActiveNav() {
  const navItems = document.querySelectorAll('.step-nav-item');
  const sections = document.querySelectorAll('.step-section');
  const navEl = document.querySelector('.step-nav');

  if (!navItems.length || !sections.length) return;

  const brandH = document.querySelector('.brand-bar')?.offsetHeight || 52;
  const navH = navEl?.offsetHeight || 44;
  const offset = brandH + navH + 20;

  const setActive = (id) => {
    navItems.forEach((item) => {
      item.classList.toggle('active', item.dataset.target === id);
    });
    const activeItem = document.querySelector(`.step-nav-item[data-target="${id}"]`);
    if (activeItem && navEl) {
      const itemLeft = activeItem.offsetLeft;
      const itemWidth = activeItem.offsetWidth;
      const navWidth = navEl.offsetWidth;
      const scrollLeft = itemLeft - navWidth / 2 + itemWidth / 2;
      navEl.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  };

  if (sections[0]) setActive(sections[0].id);

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      let current = sections[0]?.id;
      sections.forEach((sec) => {
        const top = sec.getBoundingClientRect().top;
        if (top <= offset) current = sec.id;
      });
      setActive(current);
      ticking = false;
    });
  }, { passive: true });
}

function initSectionParallax() {
  const items = document.querySelectorAll('[data-parallax]');
  if (!items.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let ticking = false;
  const update = () => {
    items.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const delta = (rect.top + rect.height / 2 - viewportCenter) * -0.035;
      item.style.setProperty('--parallax-y', `${Math.max(-10, Math.min(10, delta)).toFixed(2)}px`);
    });
    ticking = false;
  };

  update();
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
  window.addEventListener('resize', update);
}

function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
