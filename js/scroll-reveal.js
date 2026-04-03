/**
 * Y8 YOUNG AGE — Scroll Reveal
 * IntersectionObserver-based reveal with stagger for product cards
 */

const ScrollReveal = (() => {
  const THRESHOLD   = 0.08;
  const ROOT_MARGIN = '0px 0px -40px 0px';
  const CARD_STAGGER_MS = 70;

  let sectionObserver = null;
  let cardObserver    = null;

  const revealElement = (el) => {
    el.classList.add('visible');
  };

  // Observe section headers and general .reveal elements
  const initSectionReveal = () => {
    sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            revealElement(entry.target);
            sectionObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: THRESHOLD, rootMargin: ROOT_MARGIN }
    );

    document.querySelectorAll('.section-header, .reveal').forEach((el) => {
      sectionObserver.observe(el);
    });
  };

  // Observe product cards with stagger delay per group
  const initCardReveal = () => {
    cardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const card  = entry.target;
          const list  = card.closest('.product-list');
          const cards = list ? Array.from(list.querySelectorAll('.product-card')) : [card];
          const idx   = cards.indexOf(card);

          setTimeout(() => {
            revealElement(card);
          }, idx * CARD_STAGGER_MS);

          cardObserver.unobserve(card);
        });
      },
      { threshold: THRESHOLD, rootMargin: ROOT_MARGIN }
    );

    document.querySelectorAll('.product-card').forEach((card) => {
      cardObserver.observe(card);
    });
  };

  const init = () => {
    if (!('IntersectionObserver' in window)) {
      // Fallback: show everything immediately
      document.querySelectorAll('.reveal, .section-header, .product-card').forEach((el) => {
        el.classList.add('visible');
      });
      return;
    }

    initSectionReveal();
    initCardReveal();
  };

  const refresh = () => {
    // Call after dynamic content injection
    if (sectionObserver) {
      document.querySelectorAll('.section-header:not(.visible), .reveal:not(.visible)').forEach((el) => {
        sectionObserver.observe(el);
      });
    }
    if (cardObserver) {
      document.querySelectorAll('.product-card:not(.visible)').forEach((card) => {
        cardObserver.observe(card);
      });
    }
  };

  return { init, refresh };
})();

window.ScrollReveal = ScrollReveal;
