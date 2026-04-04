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

const MANUAL_SUBNAME_LINES = {
  'y8-soap': ['ADVANCED SKIN', 'CORRECTIVE SOAP'],
  'derma-calm': ['SUN SHIELD ULTRA CLEAR UV', 'SPF 50 PA++++'],
  'bio-youth': ['SUNSCREEN PROTECTION UV', 'SPF 50+ PA++++'],
  '8x-blonde': ['PERFECTING SUNSCREEN PROTECTION', 'SPF 50+ PA++++'],
  'ultra-bright': ['SOFT COMPACT POWDER', 'SPF 20 PA+++'],
  'lip-oil': ['INSTANT PLUMPER CARE OIL', 'SPF15 PA++']
};

const PRODUCT_LOOKUP = new Map();

document.addEventListener('DOMContentLoaded', async () => {
  if (window.Y8_LIFF) {
    Y8_LIFF.init().catch(() => {});
  }

  const data = await loadProductData();
  if (!data?.steps?.length) return;

  buildProductLookup(data.steps);
  renderStepNav(data.steps);
  renderMainSections(data.steps);

  if (window.ScrollReveal) ScrollReveal.init();
  if (window.CardToggle) CardToggle.init();

  initCoverScrollCue();
  initScrollUI();
  initSoapGalleries();
  initProductActionModal();
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

function buildProductLookup(steps) {
  PRODUCT_LOOKUP.clear();

  steps.forEach((step) => {
    (step.products || []).forEach((product) => {
      PRODUCT_LOOKUP.set(product.id, product);
    });
  });
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
      ${renderSubnameBlock(product.id, product.subname || '', 'product-subname')}
      ${product.description ? `<p class="product-desc">${escapeHtml(product.description)}</p>` : ''}
      ${createEvidenceBlock(product)}
      ${createMetrics(product.metrics || [])}
      ${createHowToUse(product.howToUse)}
    </div>
  `;

  return card;
}

function renderProductDescription(product, description) {
  const text = String(description || '').trim();
  if (!text) return '';

  if (product?.id === 'y8-soap') {
    const parts = text.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
    const intro = parts[0] || '';
    const items = parts.slice(1).join('\n').split(/\n+/).map((item) => item.trim()).filter(Boolean);
    const list = items.length
      ? `<ol class="product-desc-list">${items.map((item) => `<li>${escapeHtml(item.replace(/^\d+\.\s*/, ''))}</li>`).join('')}</ol>`
      : '';
    return `<div class="product-desc product-desc-soap">${intro ? `<p>${escapeHtml(intro)}</p>` : ''}${list}</div>`;
  }

  return `<p class="product-desc">${escapeHtml(text)}</p>`;
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
  card.dataset.defaultClaims = JSON.stringify(product.claims || []);
  card.dataset.defaultRegNo = product.regNo || '';

  const variants = product.variants || [];
  const thumbs = `
    <button class="soap-thumb soap-thumb-reset is-active" type="button" data-index="-1" aria-label="Y8 SOAP set overview">
      <span>SET</span>
    </button>
  ` + variants.map((variant, index) => `
    <button class="soap-thumb" type="button" data-index="${index}" aria-label="${escapeHtml(stripTrademark(variant.name))}">
      <img src="${variant.image}" alt="${escapeHtml(stripTrademark(variant.name))}" loading="lazy" onerror="this.style.visibility='hidden'" />
    </button>
  `).join('');

  card.innerHTML = `
    <div class="product-body">
      ${createProductImageStage(product.overviewImage, stripTrademark(product.name), product.id, 'soap-main-image', 'assets/images/products/y8-soap.png', 'eager')}
      <div class="soap-series-label">${escapeHtml(stripTrademark(product.seriesLabel || 'Y8 SOAP'))}</div>
      <div class="soap-title-slot">${renderTitleBlock(product.id, product.name, 'product-name soap-product-name')}</div>
      ${renderSubnameBlock(product.id, product.subname || '', 'product-subname soap-product-subname')}
      <div class="soap-thumbs">${thumbs}</div>
      <div class="soap-slider-copy" data-soap-copy>
        <p class="product-desc soap-product-desc">${escapeHtml(product.description || '')}</p>
        ${createEvidenceBlock(product)}
        ${createMetrics(product.variants?.[0]?.metrics || [])}
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
      <div
        class="product-img-stage"
        data-open-product-modal="true"
        data-product-id="${escapeHtml(productId || '')}"
        role="button"
        tabindex="0"
        aria-label="เปิดรายละเอียดสินค้า ${escapeHtml(alt)}"
      >
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

  return `
    <div class="product-metrics-block collapsed">
      <button class="metrics-toggle-btn" aria-expanded="false" type="button">
        <span class="btn-text">ประสิทธิภาพ</span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M3 5L7 9L11 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="product-metrics-panel">
        <div class="product-metrics">${rows}</div>
      </div>
    </div>
  `;
}

function createEvidenceBlock(product) {
  const regNo = String(product?.regNo || '').trim();
  if (!regNo) return '';
  return `<div class="product-evidence"><div class="product-regno">เลขที่จดแจ้ง ${escapeHtml(regNo)}</div></div>`;
}

function createHowToUse(howToUse) {
  const items = String(howToUse || '')
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const content = items.length
    ? `<ul class="product-how-list">${items.map((item) => `<li>${escapeHtml(item.replace(/^[•▪■-]\s*/, ''))}</li>`).join('')}</ul>`
    : `<div class="product-how-text"></div>`;

  return `
    <div class="product-how">
      <div class="product-how-inner">
        <div class="product-how-label">วิธีใช้</div>
        ${content}
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
  const transitionScene = document.getElementById('transitionScene');
  if (!cue || !transitionScene) return;
  cue.addEventListener('click', () => transitionScene.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}

function initScrollUI() {
  const headerShell = document.getElementById('headerShell');
  const coverHero = document.getElementById('coverHero');
  const coverArt = coverHero?.querySelector('.cover-hero-art');
  const coverLogoShell = coverHero?.querySelector('.cover-hero-logo-shell');
  const coverLogo = coverHero?.querySelector('.cover-hero-logo');
  const coverProduces = coverHero?.querySelector('.cover-hero-produces');
  const coverScrollCue = document.getElementById('coverScrollCue');
  const transitionScene = document.getElementById('transitionScene');
  const founderSection = document.getElementById('founderSection');
  const membershipSection = document.getElementById('membership');
  const membershipCardStage = membershipSection?.querySelector('.membership-card-stage');
  const membershipCardImage = membershipSection?.querySelector('.membership-card-image');
  const transitionLayer = transitionScene?.querySelector('.transition-scene-layer');
  const transitionYoung = transitionScene?.querySelector('.transition-word-young');
  const transitionAge = transitionScene?.querySelector('.transition-word-age');
  const transitionStart = transitionScene?.querySelector('.transition-word-start');
  const navItems = Array.from(document.querySelectorAll('.step-nav-item'));
  const navEl = document.querySelector('.step-nav');
  const btn = document.getElementById('backToTop');
  const trackedSections = Array.from(document.querySelectorAll('.step-section, #awards, #membership'));
  const productMotionEls = Array.from(document.querySelectorAll('.product-img-motion'));
  const sectionIconEls = Array.from(document.querySelectorAll('.section-icon-wrap'));
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
    const founderTrigger = founderSection
      ? founderSection.getBoundingClientRect().top + window.scrollY - 120
      : coverHero.offsetHeight - 72;
    const headerVisible = window.scrollY > Math.max(120, founderTrigger);
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

    if (coverHero && !reducedMotion) {
      const coverProgress = clamp(window.scrollY / Math.max(1, coverHero.offsetHeight * 0.92), 0, 1);

      if (coverScrollCue) {
        const cueY = -coverProgress * 122;
        const cueOpacity = clamp(1 - coverProgress * 2.6, 0, 1);
        coverScrollCue.style.transform = `translate3d(0, ${cueY.toFixed(2)}px, 0)`;
        coverScrollCue.style.opacity = cueOpacity.toFixed(3);
      }

      if (coverProduces) {
        const producesProgress = clamp((coverProgress - 0.14) / 0.58, 0, 1);
        const producesY = -producesProgress * 92;
        const producesOpacity = clamp(1 - producesProgress * 1.55, 0, 1);
        coverProduces.style.transform = `translate3d(0, ${producesY.toFixed(2)}px, 0)`;
        coverProduces.style.opacity = producesOpacity.toFixed(3);
      }

      if (coverLogoShell) {
        const logoProgress = clamp((coverProgress - 0.3) / 0.62, 0, 1);
        const logoShellY = -logoProgress * 126;
        const logoShellScale = 1 - logoProgress * 0.06;
        const logoImageY = -logoProgress * 24;
        const logoImageScale = 1 - logoProgress * 0.024;
        const logoOpacity = clamp(1 - logoProgress * 1.12, 0, 1);
        const glowY = logoProgress * 10;
        const glowScale = 1 + logoProgress * 0.09;
        const glowOpacity = 1 - logoProgress * 0.22;
        const shadowScale = 1 - logoProgress * 0.18;
        const shadowOpacity = 1 + logoProgress * 0.16;
        coverLogoShell.style.setProperty('--scroll-logo-shell-y', `${logoShellY.toFixed(2)}px`);
        coverLogoShell.style.setProperty('--scroll-logo-shell-scale', `${logoShellScale.toFixed(3)}`);
        coverLogoShell.style.setProperty('--scroll-logo-glow-y', `${glowY.toFixed(2)}px`);
        coverLogoShell.style.setProperty('--scroll-logo-glow-scale', `${glowScale.toFixed(3)}`);
        coverLogoShell.style.setProperty('--scroll-logo-glow-opacity', `${glowOpacity.toFixed(3)}`);
        coverLogoShell.style.setProperty('--scroll-logo-shadow-scale', `${shadowScale.toFixed(3)}`);
        coverLogoShell.style.setProperty('--scroll-logo-shadow-opacity', `${shadowOpacity.toFixed(3)}`);
        coverLogoShell.style.opacity = logoOpacity.toFixed(3);

        if (coverLogo) {
          coverLogo.style.setProperty('--scroll-logo-image-y', `${logoImageY.toFixed(2)}px`);
          coverLogo.style.setProperty('--scroll-logo-image-scale', `${logoImageScale.toFixed(3)}`);
        }
      }

      if (coverArt) {
        const artY = -coverProgress * 34;
        coverArt.style.transform = `translate3d(0, ${artY.toFixed(2)}px, 0) scale(1.02)`;
      }
    }

    if (!reducedMotion && transitionScene && transitionLayer && transitionYoung && transitionAge && transitionStart) {
      const rect = transitionScene.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const progress = clamp((-rect.top) / Math.max(1, rect.height - vh), 0, 1);
      const layerOpacity = clamp(progress * 1.2, 0, 1);
      const layerY = 36 - progress * 36;
      transitionLayer.style.opacity = layerOpacity.toFixed(3);
      transitionLayer.style.transform = `translate3d(0, ${layerY.toFixed(2)}px, 0)`;

      applyTransitionWord(transitionYoung, progress, 0.05, 0.44, 'float');
      applyTransitionWord(transitionAge, progress, 0.44, 0.74, 'float');
      applyTransitionWord(transitionStart, progress, 0.74, 0.985, 'start');
    }

    if (!reducedMotion) {
      const vh = window.innerHeight || 1;
      sectionIconEls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const visible = rect.bottom > 0 && rect.top < vh;
        if (!visible) {
          el.style.transform = 'translate3d(0, 18px, 0) scale(0.9)';
          el.style.boxShadow = '0 20px 42px rgba(35, 41, 51, 0.09), 0 10px 22px rgba(255, 255, 255, 0.58) inset';
          return;
        }

        const centerProgress = clamp((vh - rect.top) / (vh + rect.height), 0, 1);
        const iconScale = 0.9 + centerProgress * 0.2;
        const iconY = (0.56 - centerProgress) * 34;
        const iconLift = 0.25 + centerProgress * 0.12;
        el.style.transform = `translate3d(0, ${iconY.toFixed(2)}px, 0) scale(${iconScale.toFixed(3)})`;
        el.style.boxShadow = `0 ${(26 + centerProgress * 16).toFixed(2)}px ${(48 + centerProgress * 12).toFixed(2)}px rgba(35, 41, 51, ${iconLift.toFixed(3)}), 0 10px 22px rgba(255, 255, 255, 0.58) inset`;
      });

      productMotionEls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const visible = rect.bottom > 0 && rect.top < vh;
        if (!visible) {
          el.style.transform = 'translate3d(0, 0, 0) scale(0.94)';
          return;
        }

        const centerProgress = clamp((vh - rect.top) / (vh + rect.height), 0, 1);
        const scale = 0.94 + centerProgress * 0.12;
        const translateY = (0.5 - centerProgress) * 20;
        el.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0) scale(${scale.toFixed(3)})`;
      });

      if (membershipCardStage && membershipCardImage) {
        const rect = membershipCardStage.getBoundingClientRect();
        const visible = rect.bottom > 0 && rect.top < vh;

        if (!visible) {
          membershipCardStage.style.transform = 'translate3d(0, 36px, 0) scale(0.965)';
          membershipCardStage.style.filter = 'drop-shadow(0 24px 42px rgba(15, 18, 24, 0.12))';
          membershipCardImage.style.transform = 'translate3d(0, 0, 0) scale(1)';
          membershipCardImage.style.filter = 'drop-shadow(0 28px 34px rgba(13, 15, 20, 0.18))';
        } else {
          const centerProgress = clamp((vh - rect.top) / (vh + rect.height), 0, 1);
          const stageY = (0.62 - centerProgress) * 48;
          const stageScale = 0.965 + centerProgress * 0.08;
          const imageY = (0.54 - centerProgress) * 16;
          const imageScale = 1.005 + centerProgress * 0.032;
          membershipCardStage.style.transform = `translate3d(0, ${stageY.toFixed(2)}px, 0) scale(${stageScale.toFixed(3)})`;
          membershipCardStage.style.filter = `drop-shadow(0 ${(26 + centerProgress * 22).toFixed(2)}px ${(44 + centerProgress * 18).toFixed(2)}px rgba(15, 18, 24, ${(0.14 + centerProgress * 0.14).toFixed(3)}))`;
          membershipCardImage.style.transform = `translate3d(0, ${imageY.toFixed(2)}px, 0) scale(${imageScale.toFixed(3)})`;
          membershipCardImage.style.filter = `drop-shadow(0 ${(32 + centerProgress * 18).toFixed(2)}px ${(38 + centerProgress * 14).toFixed(2)}px rgba(13, 15, 20, ${(0.18 + centerProgress * 0.12).toFixed(3)}))`;
        }
      }
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
    element.style.opacity = '0';
    if (mode === 'start') {
      element.style.transform = 'translate3d(0, 86px, 0) scale(0.78)';
    } else {
      element.style.transform = 'translate3d(0, 46px, 0) scale(0.965)';
    }
    return;
  }

  let opacity;
  let translateY;
  let scale;

  if (mode === 'start') {
    if (local < 0.28) {
      opacity = local / 0.28;
    } else if (local < 0.74) {
      opacity = 1;
    } else {
      opacity = 1 - ((local - 0.74) / 0.26) * 0.68;
    }
    translateY = 86 - local * 104;
    scale = 0.78 + local * 0.24;
  } else {
    if (local < 0.22) {
      opacity = local / 0.22;
    } else if (local < 0.68) {
      opacity = 1;
    } else {
      opacity = 1 - ((local - 0.68) / 0.32);
    }
    translateY = 36 - local * 58;
    scale = 0.965 + local * 0.045;
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
    const copyEl = card.querySelector('[data-soap-copy]');
    const thumbs = Array.from(card.querySelectorAll('.soap-thumb'));

    const renderCopy = (metrics, description) => {
      if (!copyEl) return;
      const currentProduct = {
        claims: safeJsonParse(card.dataset.currentClaims, []),
        regNo: card.dataset.currentRegNo || ''
      };
      const descHtml = card.dataset.currentIndex === '-1'
        ? renderProductDescription({ id: 'y8-soap' }, description || '')
        : `<p class="product-desc soap-product-desc">${escapeHtml(description || '')}</p>`;
      copyEl.innerHTML = `${descHtml}${createEvidenceBlock(currentProduct)}${createMetrics(metrics || [])}`;
      if (window.CardToggle) CardToggle.refresh(card);
    };

    const applyImage = (src, alt) => {
      if (!mainImage) return;
      mainImage.classList.remove('is-missing');
      mainImage.style.display = '';
      mainImage.src = src;
      mainImage.alt = stripTrademark(alt || 'Y8 Soap');
    };

    const updateSubname = (id, subname) => {
      const current = card.querySelector('.soap-product-subname');
      if (!current) return;
      current.outerHTML = renderSubnameBlock(id, subname || '', 'product-subname soap-product-subname');
    };

    const renderDefault = () => {
      card.dataset.currentIndex = '-1';
      thumbs.forEach((thumb) => thumb.classList.remove('is-active'));
      applyImage(card.dataset.defaultImage, card.dataset.defaultTitle || 'Y8 Soap');
      if (titleSlot) {
        titleSlot.innerHTML = renderTitleBlock('y8-soap', card.dataset.defaultTitle || 'ADVANCED SKIN CORRECTIVE SOAP', 'product-name soap-product-name');
      }
      updateSubname('y8-soap', card.dataset.defaultSubname || '');
      card.dataset.currentClaims = card.dataset.defaultClaims || '[]';
      card.dataset.currentRegNo = card.dataset.defaultRegNo || '';
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
      updateSubname(variant.id || `soap-${index}`, variant.subname || '');
      card.dataset.currentClaims = JSON.stringify(variant.claims || []);
      card.dataset.currentRegNo = variant.regNo || '';
      renderCopy(variant.metrics || [], variant.description || '');
    };

    thumbs.forEach((thumb) => {
      thumb.addEventListener('click', () => {
        const activeIndex = Number(card.dataset.currentIndex || -1);
        const thumbIndex = Number(thumb.dataset.index || -1);
        if (thumbIndex < 0 || activeIndex === thumbIndex) {
          renderDefault();
          return;
        }
        renderVariant(thumbIndex);
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

function initProductActionModal() {
  const modal = document.getElementById('productActionModal');
  const main = document.getElementById('mainContent');
  if (!modal || !main) return;

  const dialog = modal.querySelector('.product-action-dialog');
  const imageEl = modal.querySelector('[data-modal-image]');
  const titleEl = modal.querySelector('[data-modal-title]');
  const subnameEl = modal.querySelector('[data-modal-subname]');
  const highlightsEl = modal.querySelector('[data-modal-highlights]');
  const ingredientsEl = modal.querySelector('[data-modal-ingredients]');
  const howToTextEl = modal.querySelector('[data-modal-howto]');
  const promoBtn = modal.querySelector('[data-modal-action="promo"]');
  const infoBtn = modal.querySelector('[data-modal-action="info"]');
  const noticeEl = modal.querySelector('[data-modal-notice]');
  const closeButtons = modal.querySelectorAll('[data-modal-close]');

  const state = {
    isOpen: false,
    historyPushed: false,
    product: null
  };

  const setNotice = (message = '', type = 'info') => {
    if (!noticeEl) return;
    noticeEl.textContent = message;
    noticeEl.dataset.state = type;
    noticeEl.hidden = !message;
  };

  const getHighlightPoints = (product) => {
    const items = Array.isArray(product?.quickHighlights) ? product.quickHighlights : [];
    return items.filter(Boolean).slice(0, 5);
  };

  const renderHighlightItem = (item, isSoapOverview = false) => {
    if (!isSoapOverview) return `<li>${escapeHtml(item)}</li>`;
    const [tone = '', title = '', detail = ''] = String(item).split('\n');
    return `
      <li class="product-action-highlight-soap">
        <span class="product-action-highlight-tone">${escapeHtml(tone)}</span>
        <span class="product-action-highlight-name">${escapeHtml(title)}</span>
        <span class="product-action-highlight-detail">${escapeHtml(detail)}</span>
      </li>
    `;
  };

  const getHowToParagraph = (product) => String(product?.howToUse || '')
    .split(/\n+/)
    .map((item) => item.trim().replace(/^[•▪■-]\s*/, '').replace(/^\d+\.\s*/, ''))
    .filter(Boolean)
    .slice(0, 5)
    .join(' ');

  const getSoapModalProduct = (card) => {
    const soapProduct = PRODUCT_LOOKUP.get(card.dataset.productId);
    if (!soapProduct) return null;

    const currentIndex = Number(card.dataset.currentIndex || -1);
    const mainImage = card.querySelector('.soap-main-image');
    const variant = currentIndex >= 0 ? soapProduct.variants?.[currentIndex] : null;

    return {
      id: variant?.id || soapProduct.id,
      name: stripTrademark(variant?.name || soapProduct.name || ''),
      subname: variant?.subname || soapProduct.subname || '',
      image: mainImage?.currentSrc || mainImage?.src || mainImage?.getAttribute('src') || variant?.image || soapProduct.overviewImage || '',
      fallbackImage: mainImage?.getAttribute('data-fallback-src') || '',
      description: variant?.description || soapProduct.description || '',
      metrics: variant?.metrics || soapProduct.familyMetrics || [],
      claims: variant?.claims || soapProduct.claims || [],
      regNo: variant?.regNo || soapProduct.regNo || '',
      howToUse: soapProduct.howToUse || ''
    };
  };

  const getModalProduct = (card) => {
    if (!card) return null;
    if (card.dataset.slider === 'soap') return getSoapModalProduct(card);

    const product = PRODUCT_LOOKUP.get(card.dataset.productId);
    if (!product) return null;

    const img = card.querySelector('.product-img-stage img');
    return {
      ...product,
      name: stripTrademark(product.name || ''),
      image: img?.currentSrc || img?.src || img?.getAttribute('src') || product.image || '',
      fallbackImage: img?.getAttribute('data-fallback-src') || ''
    };
  };

  const renderParagraph = (element, text) => {
    if (!element) return;
    if (!text) {
      element.textContent = '';
      element.closest('.product-action-section')?.setAttribute('hidden', 'hidden');
      return;
    }

    element.closest('.product-action-section')?.removeAttribute('hidden');
    element.textContent = text;
  };

  const hideModal = ({ fromPopState = false, keepHistory = false } = {}) => {
    if (!state.isOpen) return;

    if (!fromPopState && state.historyPushed && !keepHistory) {
      window.history.back();
      return;
    }

    state.isOpen = false;
    state.historyPushed = false;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    setNotice('');
  };

  const openModal = (product) => {
    if (!product || !imageEl || !titleEl || !subnameEl || !ingredientsEl) return;

    state.product = product;
    titleEl.innerHTML = getTitleLines(product.id, product.name || '')
      .map((line) => `<span class="product-name-line">${escapeHtml(stripTrademark(line))}</span>`)
      .join('');
    subnameEl.innerHTML = renderSubnameBlock(product.id, product.subname || '', 'product-action-subname');
    if (dialog) {
      dialog.scrollTo({ top: 0, behavior: 'auto' });
    }

    if (highlightsEl) {
      const points = getHighlightPoints(product);
      const isSoapOverview = product.id === 'y8-soap';
      highlightsEl.innerHTML = points.map((item) => renderHighlightItem(item, isSoapOverview)).join('');
      highlightsEl.hidden = !points.length;
      highlightsEl.classList.toggle('is-soap-overview', isSoapOverview);
    }
    ingredientsEl.textContent = product.ingredientsSummary || '';
    ingredientsEl.hidden = !product.ingredientsSummary;

    imageEl.style.display = '';
    imageEl.parentElement?.classList.remove('is-missing');
    imageEl.dataset.fallbackTried = '';
    imageEl.setAttribute('data-fallback-src', product.fallbackImage || '');
    imageEl.src = product.image || '';
    imageEl.alt = stripTrademark(product.name || 'Y8 Product');

    renderParagraph(howToTextEl, getHowToParagraph(product));

    setNotice('');

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    state.isOpen = true;

    if (!state.historyPushed) {
      window.history.pushState({ y8Modal: 'product-action' }, '', '#product-action');
      state.historyPushed = true;
    }

    window.requestAnimationFrame(() => {
      promoBtn?.focus();
    });
  };

  const runChatAction = async (kind) => {
    if (!state.product) return;

    const productName = stripTrademark(state.product.name || 'สินค้านี้');
    const templates = {
      promo: `สนใจ ${productName} ขอราคาโปรโมชั่นปัจจุบันค่ะ`,
      info: `สนใจ ${productName} อยากสอบถามข้อมูลเพิ่มเติมค่ะ`
    };

    const message = templates[kind];
    if (!message) return;

    if (window.Y8_LIFF?.canSendMessages()) {
      setNotice('กำลังส่งข้อความไปยัง LINE OA...', 'info');
      const sent = await Y8_LIFF.sendTextMessage(message);

      if (sent) {
        setNotice('ส่งข้อความแล้ว กำลังกลับไปที่แชต LINE OA', 'success');
        hideModal({ keepHistory: true, fromPopState: true });
        window.setTimeout(() => {
          Y8_LIFF.closeWindow();
        }, 180);
        return;
      }
    }

    setNotice('กำลังเปิดแชต LINE OA พร้อมข้อความให้กดส่งได้ทันที', 'info');
    window.setTimeout(() => {
      hideModal({ keepHistory: true, fromPopState: true });
      if (window.Y8_LIFF) {
        Y8_LIFF.openLineOaChat(message);
      }
    }, 180);
  };

  main.addEventListener('click', (event) => {
    if (event.target.closest('.soap-thumb')) return;

    const stage = event.target.closest('[data-open-product-modal="true"]');
    if (!stage) return;

    const card = stage.closest('.product-card');
    const product = getModalProduct(card);
    if (!product) return;
    openModal(product);
  });

  main.addEventListener('keydown', (event) => {
    const stage = event.target.closest('[data-open-product-modal="true"]');
    if (!stage) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;

    event.preventDefault();
    const card = stage.closest('.product-card');
    const product = getModalProduct(card);
    if (!product) return;
    openModal(product);
  });

  modal.addEventListener('click', (event) => {
    if (event.target === modal) hideModal();
  });

  closeButtons.forEach((button) => {
    button.addEventListener('click', () => hideModal());
  });

  promoBtn?.addEventListener('click', () => runChatAction('promo'));
  infoBtn?.addEventListener('click', () => runChatAction('info'));

  document.addEventListener('keydown', (event) => {
    if (!state.isOpen) return;
    if (event.key === 'Escape') hideModal();
  });

  window.addEventListener('popstate', () => {
    if (!state.isOpen) return;
    hideModal({ fromPopState: true });
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

function renderSubnameBlock(id, subname, className) {
  const lines = MANUAL_SUBNAME_LINES[id];
  const cleaned = stripTrademark(subname || '');
  if (!cleaned) return `<div class="${className}"></div>`;
  if (!lines) return `<div class="${className}">${escapeHtml(cleaned)}</div>`;
  return `<div class="${className}">${lines.map((line) => `<span class="product-subname-line">${escapeHtml(stripTrademark(line))}</span>`).join('')}</div>`;
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
