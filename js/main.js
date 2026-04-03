const STEP_ORDER = ['cleansing', 'health-skin', 'spot', 'sun', 'cosmetics', 'internal'];
const EXTRA_NAV_ITEMS = [
  { id: 'awards', step: 7, label: 'AWARDS' },
  { id: 'membership', step: 8, label: 'LOYALTY' }
];

const MANUAL_TITLE_LINES = {
  'y8-soap': ['ADVANCED SKIN', 'CORRECTIVE SOAP'],
  'soap-brown': ['LHA ANTI-DARK', 'SPOT SOAP'],
  'soap-green': ['ANTI-ACNE', 'CLEAR SOAP'],
  'soap-white': ['HYDRATING SOAP'],
  'soap-black': ['HYBRIGHTENING SOAP'],
  'ultra-bright': ['ULTRA BRIGHT'],
  solanox: ['SOLANOX'],
  'fine-antiacne': ['FINE ANTI-ACNE'],
  lumitech: ['LUMITECH'],
  sebotech: ['SEBOTECH'],
  melix14: ['MELIX14'],
  'acne-x0': ['ACNE X0'],
  '8x-blonde': ['8X BLONDE'],
  'lip-oil': ['LIP OIL'],
  'bio-youth': ['BIO YOUTH'],
  'derma-calm': ['DERMA CALM'],
  wellsip: ['WELLSIP'],
  'skincare-powder': ['SKINCARE', 'POWDER']
};

document.addEventListener('DOMContentLoaded', async () => {
  if (window.Y8_LIFF) {
    Y8_LIFF.init().catch(() => {});
  }

  const data = await loadProductData();
  if (!data?.steps?.length) return;

  renderStepNav(data.steps);
  renderMainSections(data.steps);

  if (window.ScrollReveal) ScrollReveal.init();
  if (window.CardToggle) CardToggle.init();

  initCoverScrollCue();
  initScrollUI();
  initSoapGalleries();
  initExternalLinks();
});

async function loadProductData() {
  try {
    const res = await fetch('data/products.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('[Y8] Failed to load products.json', err);
    return null;
  }
}

function renderStepNav(steps) {
  const stepNavList = document.getElementById('stepNavList');
  if (!stepNavList) return;

  [...steps, ...EXTRA_NAV_ITEMS].forEach((step) => {
    const li = document.createElement('li');
    li.className = 'step-nav-item';
    li.dataset.target = step.id;
    li.innerHTML = `
      <span class="step-nav-num">0${step.step}</span>
      <span class="step-nav-label">${escapeHtml(stripTrademark(step.label))}</span>
    `;
    li.addEventListener('click', () => scrollToSection(step.id));
    stepNavList.appendChild(li);
  });
}

function renderMainSections(steps) {
  const main = document.getElementById('mainContent');
  if (!main) return;

  const orderedSteps = [...steps].sort((a, b) => STEP_ORDER.indexOf(a.id) - STEP_ORDER.indexOf(b.id));
  orderedSteps.forEach((step) => main.appendChild(createSection(step)));
}

function createSection(step) {
  const section = document.createElement('section');
  section.id = step.id;
  section.className = 'step-section';
  section.dataset.step = step.step;

  const iconHtml = step.icon
    ? `
      <div class="section-icon-wrap">
        <img src="${step.icon}" alt="${escapeHtml(step.label)} icon" loading="eager" onerror="this.style.display='none'; this.parentElement.classList.add('is-missing');" />
        <span class="section-icon-fallback">0${step.step}</span>
      </div>`
    : `<div class="section-icon-wrap is-missing"><span class="section-icon-fallback">0${step.step}</span></div>`;

  section.innerHTML = `
    <div class="section-header reveal">
      ${iconHtml}
      <div class="section-title-block">
        <div class="section-title">${escapeHtml(stripTrademark(step.label))}</div>
        <div class="section-tagline">${escapeHtml(cleanTagline(step.tagline))}</div>
        <p class="section-support">${escapeHtml(step.introText || '')}</p>
      </div>
    </div>
    <div class="product-list" id="list-${step.id}"></div>
  `;

  const list = section.querySelector('.product-list');
  step.products.forEach((product) => list.appendChild(createProductCard(product)));
  return section;
}

function createProductCard(product) {
  if (product.type === 'soap-slider') return createSoapGalleryCard(product);

  const card = document.createElement('article');
  card.className = `product-card collapsed ${getTitleSizeClass(product.id, product.name)}`;
  card.dataset.productId = product.id;

  card.innerHTML = `
    <div class="product-body">
      ${createProductImageStage(product.image, stripTrademark(product.name), product.id)}
      ${renderTitleBlock(product.id, product.name, 'product-name')}
      <div class="product-subname">${escapeHtml(stripTrademark(product.subname || ''))}</div>
      ${createMetrics(product.metrics || [])}
      ${product.description ? `<p class="product-desc">${escapeHtml(product.description)}</p>` : ''}
      ${createHowToUse(product.howToUse)}
    </div>
  `;

  return card;
}

function createSoapGalleryCard(product) {
  const card = document.createElement('article');
  card.className = 'product-card product-card-soap collapsed product-name-long';
  card.dataset.productId = product.id;
  card.dataset.slider = 'soap';
  card.dataset.currentIndex = '-1';
  card.dataset.defaultImage = product.overviewImage;
  card.dataset.defaultTitle = product.name;
  card.dataset.defaultSubname = product.subname || '';
  card.dataset.defaultDescription = product.description || '';
  card.dataset.defaultMetrics = JSON.stringify(product.familyMetrics || []);

  const variants = product.variants || [];
  const thumbs = variants.map((variant, index) => `
    <button class="soap-thumb" type="button" data-index="${index}" aria-label="${escapeHtml(stripTrademark(variant.name))}">
      <img src="${variant.image}" alt="${escapeHtml(stripTrademark(variant.name))}" loading="lazy" onerror="this.style.visibility='hidden'" />
    </button>
  `).join('');

  card.innerHTML = `
    <div class="product-body">
      ${createProductImageStage(product.overviewImage, stripTrademark(product.name), product.id, 'soap-main-image', 'assets/images/products/y8-soap.png', 'eager')}
      <div class="soap-series-label">${escapeHtml(stripTrademark(product.seriesLabel || 'Y8 SOAP'))}</div>
      <div class="soap-title-slot">${renderTitleBlock(product.id, product.name, 'product-name soap-product-name')}</div>
      <div class="product-subname soap-product-subname">${escapeHtml(stripTrademark(product.subname || ''))}</div>
      <div class="soap-thumbs">${thumbs}</div>
      <div class="soap-slider-copy" data-soap-copy>
        ${createMetrics(product.variants?.[0]?.metrics || [])}
        <p class="product-desc soap-product-desc">${escapeHtml(product.description || '')}</p>
      </div>
      ${createHowToUse(product.howToUse)}
    </div>
  `;

  card.dataset.variants = JSON.stringify(variants);
  return card;
}

function createProductImageStage(src, alt, productId, extraClass = '', fallbackSrc = '', loading = 'lazy') {
  const fallbackAttr = fallbackSrc ? ` data-fallback-src="${fallbackSrc}"` : '';
  return `
    <div class="product-img-wrap">
      <div class="product-img-stage">
        <div class="product-img-motion">
          <img
            class="${extraClass}"${fallbackAttr}
            src="${src}"
            alt="${escapeHtml(alt)}"
            loading="${loading}"
            onerror="handleProductImageError(this)"
          />
        </div>
        <div class="img-placeholder">
          <span>${escapeHtml(stripTrademark(productId || alt || 'Product'))}</span>
        </div>
      </div>
    </div>
  `;
}

function createMetrics(metrics) {
  if (!metrics?.length) return '';
  const rows = metrics.map((metric) => {
    const value = clamp(Number(metric.value || 0), 0, 10);
    const segments = Array.from({ length: 10 }, (_, index) => {
      const active = index < value ? ' active' : '';
      return `<span class="metric-segment${active}"></span>`;
    }).join('');

    return `
      <div class="metric-row">
        <div class="metric-label">${escapeHtml(metric.label || '')}</div>
        <div class="metric-bar" aria-hidden="true">${segments}</div>
        <div class="metric-value">LV ${value}</div>
      </div>
    `;
  }).join('');

  return `<div class="product-metrics">${rows}</div>`;
}

function createHowToUse(howToUse) {
  return `
    <div class="product-how">
      <div class="product-how-inner">
        <div class="product-how-label">วิธีใช้</div>
        <div class="product-how-text">${escapeHtml(howToUse || '')}</div>
      </div>
    </div>
    <button class="expand-btn" aria-expanded="false" type="button">
      <span class="btn-text">วิธีใช้</span>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M3 5L7 9L11 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  `;
}

function initCoverScrollCue() {
  const cue = document.getElementById('coverScrollCue');
  const founder = document.getElementById('founderSection');
  if (!cue || !founder) return;
  cue.addEventListener('click', () => founder.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}

function initScrollUI() {
  const headerShell = document.getElementById('headerShell');
  const coverHero = document.getElementById('coverHero');
  const transitionScene = document.getElementById('transitionScene');
  const transitionLayer = transitionScene?.querySelector('.transition-scene-layer');
  const transitionYoung = transitionScene?.querySelector('.transition-word-young');
  const transitionAge = transitionScene?.querySelector('.transition-word-age');
  const transitionStart = transitionScene?.querySelector('.transition-word-start');
  const navItems = Array.from(document.querySelectorAll('.step-nav-item'));
  const navEl = document.querySelector('.step-nav');
  const btn = document.getElementById('backToTop');
  const trackedSections = Array.from(document.querySelectorAll('.step-section, #awards, #membership'));
  const productMotionEls = Array.from(document.querySelectorAll('.product-img-motion'));
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!headerShell || !coverHero || !navEl || !navItems.length || !trackedSections.length) return;

  const setActive = (id) => {
    navItems.forEach((item) => item.classList.toggle('active', item.dataset.target === id));
    const activeItem = navItems.find((item) => item.dataset.target === id);
    if (!activeItem) return;
    const scrollLeft = activeItem.offsetLeft - navEl.offsetWidth / 2 + activeItem.offsetWidth / 2;
    navEl.scrollTo({ left: scrollLeft, behavior: 'smooth' });
  };

  let ticking = false;

  const update = () => {
    ticking = false;
    const threshold = coverHero.offsetHeight - 72;
    const headerVisible = window.scrollY > Math.max(120, threshold);
    headerShell.classList.toggle('is-visible', headerVisible);
    headerShell.setAttribute('aria-hidden', headerVisible ? 'false' : 'true');

    const brandH = document.querySelector('.brand-bar')?.offsetHeight || 0;
    const navH = navEl.offsetHeight || 0;
    const offset = brandH + navH + 28;
    let current = trackedSections[0].id;

    for (const section of trackedSections) {
      const rect = section.getBoundingClientRect();
      const top = rect.top;
      const bottom = rect.bottom;

      if (top <= offset && bottom > offset) {
        current = section.id;
        break;
      }

      if (top <= offset) {
        current = section.id;
      }
    }

    setActive(current);

    if (btn) btn.classList.toggle('visible', window.scrollY > 900);

    if (!reducedMotion && transitionScene && transitionLayer && transitionYoung && transitionAge && transitionStart) {
      const rect = transitionScene.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const progress = clamp((vh - rect.top) / (vh + rect.height * 0.58), 0, 1);
      const layerOpacity = clamp(progress * 1.18, 0, 1);
      const layerY = 56 - progress * 56;
      transitionLayer.style.opacity = layerOpacity.toFixed(3);
      transitionLayer.style.transform = `translate3d(0, ${layerY.toFixed(2)}px, 0)`;

      applyTransitionWord(transitionYoung, progress, 0.04, 0.3, 'float');
      applyTransitionWord(transitionAge, progress, 0.27, 0.56, 'float');
      applyTransitionWord(transitionStart, progress, 0.55, 0.88, 'start');
    }

    if (!reducedMotion) {
      const vh = window.innerHeight || 1;
      productMotionEls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const visible = rect.bottom > 0 && rect.top < vh;
        if (!visible) return;

        const centerProgress = clamp((vh - rect.top) / (vh + rect.height), 0, 1);
        const scale = 0.965 + centerProgress * 0.075;
        const translateY = (0.5 - centerProgress) * 14;
        el.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0) scale(${scale.toFixed(3)})`;
      });
    }
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  if (btn) btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function applyTransitionWord(element, progress, start, end, mode) {
  const local = clamp((progress - start) / (end - start), 0, 1);
  if (local <= 0 || local >= 1) {
    element.style.opacity = local >= 1 ? '0' : '0';
    if (mode === 'start') {
      element.style.transform = 'translate3d(0, 52px, 0) scale(0.88)';
    } else {
      element.style.transform = 'translate3d(0, 30px, 0) scale(0.98)';
    }
    return;
  }

  let opacity;
  let translateY;
  let scale;

  if (mode === 'start') {
    opacity = local < 0.42 ? local / 0.42 : 1 - ((local - 0.42) / 0.58) * 0.85;
    translateY = 60 - local * 74;
    scale = 0.84 + local * 0.24;
  } else {
    opacity = local < 0.46 ? local / 0.46 : 1 - ((local - 0.46) / 0.54);
    translateY = 26 - local * 46;
    scale = 0.985 + local * 0.03;
  }

  element.style.opacity = clamp(opacity, 0, 1).toFixed(3);
  element.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0) scale(${scale.toFixed(3)})`;
}

function initSoapGalleries() {
  document.querySelectorAll('[data-slider="soap"]').forEach((card) => {
    const variants = safeJsonParse(card.dataset.variants, []);
    if (!variants.length) return;

    const mainImage = card.querySelector('.soap-main-image');
    const titleSlot = card.querySelector('.soap-title-slot');
    const subnameEl = card.querySelector('.soap-product-subname');
    const copyEl = card.querySelector('[data-soap-copy]');
    const thumbs = Array.from(card.querySelectorAll('.soap-thumb'));

    const renderCopy = (metrics, description) => {
      if (!copyEl) return;
      copyEl.innerHTML = `${createMetrics(metrics || [])}<p class="product-desc soap-product-desc">${escapeHtml(description || '')}</p>`;
    };

    const applyImage = (src, alt) => {
      if (!mainImage) return;
      mainImage.classList.remove('is-missing');
      mainImage.style.display = '';
      mainImage.src = src;
      mainImage.alt = stripTrademark(alt || 'Y8 Soap');
    };

    const renderDefault = () => {
      card.dataset.currentIndex = '-1';
      thumbs.forEach((thumb) => thumb.classList.remove('is-active'));
      applyImage(card.dataset.defaultImage, card.dataset.defaultTitle || 'Y8 Soap');
      if (titleSlot) {
        titleSlot.innerHTML = renderTitleBlock('y8-soap', card.dataset.defaultTitle || 'ADVANCED SKIN CORRECTIVE SOAP', 'product-name soap-product-name');
      }
      if (subnameEl) subnameEl.textContent = stripTrademark(card.dataset.defaultSubname || '');
      renderCopy(safeJsonParse(card.dataset.defaultMetrics, []), card.dataset.defaultDescription || '');
    };

    const renderVariant = (index) => {
      const variant = variants[index];
      if (!variant) return;
      card.dataset.currentIndex = String(index);
      thumbs.forEach((thumb, thumbIndex) => thumb.classList.toggle('is-active', thumbIndex === index));
      applyImage(variant.image, variant.name || 'Soap');
      if (titleSlot) {
        titleSlot.innerHTML = renderTitleBlock(variant.id || `soap-${index}`, variant.name || '', 'product-name soap-product-name');
      }
      if (subnameEl) subnameEl.textContent = stripTrademark(variant.subname || '');
      renderCopy(variant.metrics || [], variant.description || '');
    };

    thumbs.forEach((thumb, index) => {
      thumb.addEventListener('click', () => {
        const activeIndex = Number(card.dataset.currentIndex || -1);
        if (activeIndex === index) {
          renderDefault();
          return;
        }
        renderVariant(index);
      });
    });

    renderDefault();
  });
}

function initExternalLinks() {
  document.querySelectorAll('[data-external-url]').forEach((element) => {
    element.addEventListener('click', (event) => {
      const url = element.getAttribute('data-external-url');
      if (!url) return;
      event.preventDefault();
      if (window.Y8_LIFF) {
        Y8_LIFF.openExternalUrl(url);
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    });
  });
}

function scrollToSection(id) {
  const target = document.getElementById(id);
  if (!target) return;
  const brandH = document.querySelector('.brand-bar')?.offsetHeight || 0;
  const navH = document.querySelector('.step-nav')?.offsetHeight || 0;
  const top = target.getBoundingClientRect().top + window.scrollY - brandH - navH - 10;
  window.scrollTo({ top, behavior: 'smooth' });
}

function getTitleLines(id, name) {
  return MANUAL_TITLE_LINES[id] || [stripTrademark(name)];
}

function getTitleSizeClass(id, name) {
  const lines = getTitleLines(id, name);
  const joined = lines.join(' ');
  if (joined.length > 24 || lines.length > 2) return 'product-name-xlong';
  if (joined.length > 16 || lines.length > 1) return 'product-name-long';
  return 'product-name-normal';
}

function renderTitleBlock(id, name, className) {
  const lines = getTitleLines(id, name);
  const sizeClass = getTitleSizeClass(id, name);
  const content = lines.map((line) => `<span class="product-name-line">${escapeHtml(line)}</span>`).join('');
  return `<div class="${className} ${sizeClass}">${content}</div>`;
}

function stripTrademark(text = '') {
  return String(text).replace(/[™]/g, '').replace(/\s{2,}/g, ' ').trim();
}

function cleanTagline(text = '') {
  return String(text).replace(/\s+[—-]\s+.*$/u, '').trim();
}

function escapeHtml(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function safeJsonParse(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

window.handleProductImageError = function handleProductImageError(img) {
  const fallbackSrc = img.getAttribute('data-fallback-src');
  if (fallbackSrc && !img.dataset.fallbackTried) {
    img.dataset.fallbackTried = 'true';
    img.src = fallbackSrc;
    return;
  }
  img.style.display = 'none';
  img.parentElement?.classList.add('is-missing');
};
