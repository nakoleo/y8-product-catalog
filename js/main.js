const STEP_ORDER = ['cleansing', 'health-skin', 'spot', 'sun', 'cosmetics', 'internal'];

const JOURNEY_TITLES = {
  cleansing: 'Cleansing',
  'health-skin': 'Health Skin',
  spot: 'Spot Corrective',
  sun: 'Sun Protection',
  cosmetics: 'Cosmetics',
  internal: 'Internal Health'
};

document.addEventListener('DOMContentLoaded', async () => {
  if (window.Y8_LIFF) {
    Y8_LIFF.init().catch(() => {});
  }

  const data = await loadProductData();
  if (!data?.steps?.length) return;

  renderStepNav(data.steps);
  renderJourneyIntro(data.steps);
  renderMainSections(data.steps);

  if (window.ScrollReveal) ScrollReveal.init();
  if (window.CardToggle) CardToggle.init();

  initCoverScrollCue();
  initHeaderVisibility();
  initActiveNav();
  initJourneyScroller(data.steps);
  initReactiveIcons();
  initSoapSliders();
  initExternalLinks();
  initBackToTop();
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

  steps.forEach((step) => {
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

function renderJourneyIntro(steps) {
  const track = document.getElementById('journeyIntroTrack');
  const icon = document.getElementById('journeyStageIcon');
  const copy = document.getElementById('journeyStageCopy');
  if (!track || !icon || !copy) return;

  steps.forEach((step, index) => {
    const beat = document.createElement('div');
    beat.className = 'journey-intro-beat';
    beat.dataset.index = String(index);
    track.appendChild(beat);
  });

  updateJourneyStage(steps, 0, 0);
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
      <button class="section-icon-wrap reactive-icon" type="button" aria-label="${escapeHtml(step.label)}">
        <img src="${step.icon}" alt="${escapeHtml(step.label)} icon" loading="lazy" onerror="this.style.display='none'">
      </button>`
    : '';

  section.innerHTML = `
    <div class="section-header reveal">
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
    list.appendChild(createProductCard(product));
  });

  return section;
}

function createProductCard(product) {
  if (product.type === 'soap-slider') {
    return createSoapSliderCard(product);
  }

  const card = document.createElement('article');
  card.className = 'product-card collapsed';
  card.dataset.productId = product.id;

  card.innerHTML = `
    <div class="product-body">
      <div class="product-img-wrap">
        <div class="product-img-stage">
          <img
            src="${product.image}"
            alt="${escapeHtml(stripTrademark(product.name))}"
            loading="lazy"
            onerror="this.style.display='none'; this.parentElement.classList.add('is-missing');"
          />
          <div class="img-placeholder">
            <span>Image unavailable</span>
          </div>
        </div>
      </div>
      <div class="product-name">${escapeHtml(stripTrademark(product.name))}</div>
      <div class="product-subname">${escapeHtml(stripTrademark(product.subname || ''))}</div>
      ${createMetrics(product.metrics || [])}
      ${product.description ? `<p class="product-desc">${escapeHtml(product.description)}</p>` : ''}
      ${createHowToUse(product.howToUse)}
    </div>
  `;

  return card;
}

function createSoapSliderCard(product) {
  const card = document.createElement('article');
  card.className = 'product-card product-card-soap collapsed';
  card.dataset.productId = product.id;
  card.dataset.slider = 'soap';

  const variants = product.variants || [];
  const thumbs = variants.map((variant, index) => `
    <button class="soap-thumb${index === 0 ? ' is-active' : ''}" type="button" data-index="${index}" aria-label="${escapeHtml(stripTrademark(variant.name))}">
      <img src="${variant.image}" alt="${escapeHtml(stripTrademark(variant.name))}" loading="lazy" />
    </button>
  `).join('');

  const first = variants[0] || {};

  card.innerHTML = `
    <div class="product-body">
      <div class="product-img-wrap soap-main-wrap">
        <div class="product-img-stage soap-stage">
          <img
            class="soap-overview-image"
            src="${product.overviewImage}"
            alt="${escapeHtml(stripTrademark(product.seriesLabel || product.name))} overview"
            loading="lazy"
            onerror="this.style.display='none'"
          />
          <img
            class="soap-main-image is-active"
            src="${first.image || ''}"
            alt="${escapeHtml(stripTrademark(first.name || product.name))}"
            loading="lazy"
          />
        </div>
      </div>
      <div class="soap-series-label">${escapeHtml(stripTrademark(product.seriesLabel || 'Y8 SOAP'))}</div>
      <div class="product-name soap-product-name">${escapeHtml(stripTrademark(first.name || product.name))}</div>
      <div class="product-subname soap-product-subname">${escapeHtml(stripTrademark(first.subname || product.subname || ''))}</div>
      <div class="soap-thumbs">${thumbs}</div>
      <div class="soap-slider-copy" data-soap-copy>
        ${createMetrics(first.metrics || [])}
        <p class="product-desc soap-product-desc">${escapeHtml(first.description || product.description || '')}</p>
      </div>
      ${createHowToUse(product.howToUse)}
    </div>
  `;

  card.dataset.variants = JSON.stringify(variants);
  card.dataset.currentIndex = '0';
  return card;
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

  cue.addEventListener('click', () => {
    founder.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function initHeaderVisibility() {
  const headerShell = document.getElementById('headerShell');
  const coverHero = document.getElementById('coverHero');
  if (!headerShell || !coverHero) return;

  const update = () => {
    const threshold = coverHero.offsetHeight - 72;
    const visible = window.scrollY > Math.max(120, threshold);
    headerShell.classList.toggle('is-visible', visible);
    headerShell.setAttribute('aria-hidden', visible ? 'false' : 'true');
    document.body.classList.toggle('has-floating-header', visible);
  };

  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
}

function initJourneyScroller(steps) {
  const intro = document.getElementById('journeyIntro');
  if (!intro) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const onScroll = () => {
    const rect = intro.getBoundingClientRect();
    const viewport = window.innerHeight;
    const total = Math.max(1, intro.offsetHeight - viewport);
    const traveled = clamp(-rect.top, 0, total);
    const progress = traveled / total;
    const rawIndex = progress * steps.length;
    const index = clamp(Math.floor(rawIndex), 0, steps.length - 1);
    const localProgress = rawIndex - index;
    updateJourneyStage(steps, index, reduced ? 0 : localProgress);
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
}

function updateJourneyStage(steps, index, localProgress) {
  const icon = document.getElementById('journeyStageIcon');
  const copy = document.getElementById('journeyStageCopy');
  if (!icon || !copy || !steps[index]) return;

  const step = steps[index];
  const directionClass = index % 2 === 0 ? 'is-left' : 'is-right';
  const travel = Math.min(1, Math.max(0, localProgress || 0));
  const fade = 1 - Math.abs((travel - 0.5) * 0.85);

  icon.style.setProperty('--journey-rise', `${(1 - travel) * 32}px`);
  icon.style.setProperty('--journey-opacity', `${fade}`);
  icon.innerHTML = step.icon
    ? `<img src="${step.icon}" alt="${escapeHtml(step.label)} icon" loading="lazy" />`
    : '';

  copy.className = `journey-stage-copy ${directionClass}`;
  copy.style.setProperty('--journey-shift', `${(directionClass === 'is-left' ? -1 : 1) * (1 - travel) * 28}px`);
  copy.style.setProperty('--journey-opacity', `${fade}`);
  copy.innerHTML = `
    <span class="journey-stage-step">0${step.step}</span>
    <h2>${escapeHtml(JOURNEY_TITLES[step.id] || step.label)}</h2>
    <p class="journey-stage-th">${escapeHtml(step.labelTh || '')}</p>
    <p class="journey-stage-desc">${escapeHtml(cleanTagline(step.introText || step.tagline || ''))}</p>
  `;
}

function initReactiveIcons() {
  document.querySelectorAll('.reactive-icon').forEach((button) => {
    button.addEventListener('pointerdown', (event) => {
      const rect = button.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      button.style.setProperty('--react-x', `${clamp(-dx * 0.12, -8, 8)}px`);
      button.style.setProperty('--react-y', `${clamp(-dy * 0.12, -8, 8)}px`);
      button.classList.add('is-reacting');
    });

    const reset = () => {
      button.classList.remove('is-reacting');
      button.style.setProperty('--react-x', '0px');
      button.style.setProperty('--react-y', '0px');
    };

    button.addEventListener('pointerup', reset);
    button.addEventListener('pointerleave', reset);
    button.addEventListener('pointercancel', reset);
  });
}

function initSoapSliders() {
  document.querySelectorAll('[data-slider="soap"]').forEach((card) => {
    const variants = safeJsonParse(card.dataset.variants, []);
    if (!variants.length) return;

    const mainImage = card.querySelector('.soap-main-image');
    const nameEl = card.querySelector('.soap-product-name');
    const subnameEl = card.querySelector('.soap-product-subname');
    const copyEl = card.querySelector('[data-soap-copy]');
    const thumbs = Array.from(card.querySelectorAll('.soap-thumb'));
    let currentIndex = Number(card.dataset.currentIndex || 0);
    let timer = null;
    let startX = 0;

    const render = (index) => {
      const variant = variants[index];
      if (!variant) return;
      currentIndex = index;
      card.dataset.currentIndex = String(index);
      thumbs.forEach((thumb, thumbIndex) => thumb.classList.toggle('is-active', thumbIndex === index));

      if (mainImage) {
        mainImage.classList.remove('is-active');
        requestAnimationFrame(() => {
          mainImage.src = variant.image;
          mainImage.alt = stripTrademark(variant.name || 'Soap');
          mainImage.classList.add('is-active');
        });
      }

      if (nameEl) nameEl.textContent = stripTrademark(variant.name || '');
      if (subnameEl) subnameEl.textContent = stripTrademark(variant.subname || '');
      if (copyEl) {
        copyEl.classList.remove('is-active');
        requestAnimationFrame(() => {
          copyEl.innerHTML = `${createMetrics(variant.metrics || [])}<p class="product-desc soap-product-desc">${escapeHtml(variant.description || '')}</p>`;
          copyEl.classList.add('is-active');
        });
      }
    };

    const next = () => render((currentIndex + 1) % variants.length);
    const resetTimer = () => {
      window.clearInterval(timer);
      timer = window.setInterval(next, 4200);
    };

    thumbs.forEach((thumb, index) => {
      thumb.addEventListener('click', () => {
        render(index);
        resetTimer();
      });
    });

    card.addEventListener('touchstart', (event) => {
      startX = event.touches[0]?.clientX || 0;
    }, { passive: true });

    card.addEventListener('touchend', (event) => {
      const endX = event.changedTouches[0]?.clientX || 0;
      const delta = endX - startX;
      if (Math.abs(delta) < 28) return;
      render(delta < 0 ? (currentIndex + 1) % variants.length : (currentIndex - 1 + variants.length) % variants.length);
      resetTimer();
    }, { passive: true });

    render(0);
    copyEl?.classList.add('is-active');
    resetTimer();
  });
}

function initActiveNav() {
  const navItems = Array.from(document.querySelectorAll('.step-nav-item'));
  const sections = Array.from(document.querySelectorAll('.step-section'));
  const navEl = document.querySelector('.step-nav');
  if (!navItems.length || !sections.length || !navEl) return;

  const setActive = (id) => {
    navItems.forEach((item) => item.classList.toggle('active', item.dataset.target === id));
    const activeItem = navItems.find((item) => item.dataset.target === id);
    if (!activeItem) return;
    const scrollLeft = activeItem.offsetLeft - navEl.offsetWidth / 2 + activeItem.offsetWidth / 2;
    navEl.scrollTo({ left: scrollLeft, behavior: 'smooth' });
  };

  const update = () => {
    const brandH = document.querySelector('.brand-bar')?.offsetHeight || 0;
    const navH = navEl?.offsetHeight || 0;
    const offset = brandH + navH + 20;
    let current = sections[0].id;
    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= offset) current = section.id;
    });
    setActive(current);
  };

  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
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

function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  const update = () => btn.classList.toggle('visible', window.scrollY > 900);
  update();
  window.addEventListener('scroll', update, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function scrollToSection(id) {
  const target = document.getElementById(id);
  if (!target) return;
  const brandH = document.querySelector('.brand-bar')?.offsetHeight || 0;
  const navH = document.querySelector('.step-nav')?.offsetHeight || 0;
  const top = target.getBoundingClientRect().top + window.scrollY - brandH - navH - 10;
  window.scrollTo({ top, behavior: 'smooth' });
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
