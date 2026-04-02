/**
 * Y8 YOUNG AGE — Main Entry
 * Orchestrates: LIFF init · Data fetch · DOM render · Interactions
 */

document.addEventListener('DOMContentLoaded', async () => {

  // ──────────────────────────────────────────────
  // 1. LIFF Init (non-blocking)
  // ──────────────────────────────────────────────
  if (window.Y8_LIFF) {
    Y8_LIFF.init().catch(() => {});
  }

  // ──────────────────────────────────────────────
  // 2. Load product data
  // ──────────────────────────────────────────────
  let data = null;
  try {
    const res = await fetch('data/products.json');
    data = await res.json();
  } catch (err) {
    console.error('[Y8] Could not load products.json:', err);
    return;
  }

  // ──────────────────────────────────────────────
  // 3. Render step navigation
  // ──────────────────────────────────────────────
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
        if (target) {
          const offset = document.querySelector('.brand-bar')?.offsetHeight || 52;
          const navOffset = document.querySelector('.step-nav')?.offsetHeight || 44;
          const top = target.getBoundingClientRect().top + window.scrollY - offset - navOffset - 8;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
      stepNavList.appendChild(li);
    });
  }

  // ──────────────────────────────────────────────
  // 4. Render product sections
  // ──────────────────────────────────────────────
  const main = document.getElementById('mainContent');
  if (main && data.steps) {
    data.steps.forEach((step) => {
      const section = createSection(step);
      main.appendChild(section);
    });
  }

  // ──────────────────────────────────────────────
  // 5. Activate interactions
  // ──────────────────────────────────────────────
  if (window.ScrollReveal) ScrollReveal.init();
  if (window.CardToggle)   CardToggle.init();

  // ──────────────────────────────────────────────
  // 6. Sticky nav active state on scroll
  // ──────────────────────────────────────────────
  initActiveNav();

  // ──────────────────────────────────────────────
  // 7. Back to Top button
  // ──────────────────────────────────────────────
  initBackToTop();

});

// ── Section builder ──
function createSection(step) {
  const section = document.createElement('section');
  section.id        = step.id;
  section.className = 'step-section';
  section.dataset.step = step.step;

  const iconHtml = step.icon
    ? `<div class="section-icon-wrap">
         <img src="${step.icon}" alt="${step.label} icon" loading="lazy" onerror="this.style.display='none'">
       </div>`
    : '';

  section.innerHTML = `
    <div class="section-header">
      ${iconHtml}
      <div class="section-title-block">
        <div class="section-step-label">STEP 0${step.step}</div>
        <div class="section-title">${step.label}</div>
        <div class="section-tagline">${step.tagline}</div>
      </div>
    </div>
    <div class="product-list" id="list-${step.id}"></div>
  `;

  const list = section.querySelector('.product-list');
  step.products.forEach((product) => {
    list.appendChild(createProductCard(product));
  });

  return section;
}

// ── Product card builder ──
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card collapsed';
  card.dataset.productId = product.id;

  const tagsHtml = (product.tags || [])
    .map(t => `<span class="tag tag-${t.type}">${t.label}</span>`)
    .join('');
  const descHtml = product.description
    ? `<p class="product-desc">${product.description}</p>`
    : '';

  card.innerHTML = `
    <div class="product-accent"></div>
    <div class="product-body">
      <div class="product-img-wrap">
        <img
          src="${product.image}"
          alt="${product.name}"
          loading="lazy"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
        />
        <div class="img-placeholder" style="display:none;">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="4" fill="#e8e8e8"/>
            <path d="M8 22l6-8 4 5 3-3 5 6H8z" fill="#b0b0b0"/>
            <circle cx="21" cy="11" r="2.5" fill="#b0b0b0"/>
          </svg>
          <span>No Image</span>
        </div>
      </div>
      <div class="product-name">${product.name}</div>
      <div class="product-subname">${product.subname}</div>
      ${descHtml}
      <div class="product-tags">${tagsHtml}</div>
      <div class="product-how">
        <div class="product-how-inner">
          <div class="product-how-label">วิธีใช้</div>
          <div class="product-how-text">${product.howToUse}</div>
        </div>
      </div>
      <button class="expand-btn" aria-expanded="false">
        <span class="btn-text">วิธีใช้</span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M3 5L7 9L11 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  `;

  return card;
}

// ── Active nav on scroll ──
function initActiveNav() {
  const navItems = document.querySelectorAll('.step-nav-item');
  const sections = document.querySelectorAll('.step-section');
  const navEl    = document.querySelector('.step-nav');

  if (!navItems.length || !sections.length) return;

  const brandH = document.querySelector('.brand-bar')?.offsetHeight  || 52;
  const navH   = navEl?.offsetHeight || 44;
  const offset = brandH + navH + 20;

  const setActive = (id) => {
    navItems.forEach((item) => {
      item.classList.toggle('active', item.dataset.target === id);
    });
    // Scroll nav tab into view
    const activeItem = document.querySelector(`.step-nav-item[data-target="${id}"]`);
    if (activeItem && navEl) {
      const itemLeft   = activeItem.offsetLeft;
      const itemWidth  = activeItem.offsetWidth;
      const navWidth   = navEl.offsetWidth;
      const scrollLeft = itemLeft - navWidth / 2 + itemWidth / 2;
      navEl.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  };

  // Activate first by default
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

// ── Back to Top ──
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
