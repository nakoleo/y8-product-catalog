/**
 * Y8 YOUNG AGE — LIFF Initialisation
 * LINE LIFF SDK integration with graceful degradation
 */

const Y8_LIFF = (() => {
  let _initialized = false;
  let _profile = null;

  // LIFF ID fallback — อ่านจาก liff/config.js หรือ fallback เป็น ''
  const getLiffId = () => {
    try {
      return window.LIFF_CONFIG?.liffId || '';
    } catch {
      return '';
    }
  };

  const isInLine = () => {
    try {
      return (
        /Line/i.test(navigator.userAgent) ||
        (typeof liff !== 'undefined' && liff.isInClient())
      );
    } catch {
      return false;
    }
  };

  const init = async () => {
    const liffId = getLiffId();

    if (!liffId) {
      console.info('[Y8 LIFF] No LIFF ID configured — running in standalone mode');
      return false;
    }

    if (typeof liff === 'undefined') {
      console.warn('[Y8 LIFF] LIFF SDK not loaded — running in standalone mode');
      return false;
    }

    try {
      await liff.init({ liffId });
      _initialized = true;
      console.info('[Y8 LIFF] Initialized successfully');

      // Fetch and cache user profile
      if (liff.isLoggedIn()) {
        try {
          _profile = await liff.getProfile();
          sessionStorage.setItem('y8_liff_profile', JSON.stringify(_profile));
          console.info('[Y8 LIFF] Profile loaded:', _profile.displayName);
        } catch (profileErr) {
          console.warn('[Y8 LIFF] Could not fetch profile:', profileErr);
        }
      }

      return true;
    } catch (err) {
      console.warn('[Y8 LIFF] Init failed — running in standalone mode:', err.message);
      return false;
    }
  };

  const getProfile = () => {
    if (_profile) return _profile;
    try {
      const cached = sessionStorage.getItem('y8_liff_profile');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };

  const openExternalUrl = (url) => {
    try {
      if (_initialized && liff.isInClient()) {
        liff.openWindow({ url, external: true });
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const closeWindow = () => {
    try {
      if (_initialized && liff.isInClient()) {
        liff.closeWindow();
      }
    } catch {
      // noop
    }
  };

  return {
    init,
    getProfile,
    openExternalUrl,
    closeWindow,
    isInLine,
    isInitialized: () => _initialized,
  };
})();

window.Y8_LIFF = Y8_LIFF;
