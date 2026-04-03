/**
 * Y8 YOUNG AGE — LIFF Initialisation
 * LINE LIFF SDK integration with graceful degradation
 */

const Y8_LIFF = (() => {
  let _initialized = false;
  let _profile = null;

  const getConfig = () => {
    try {
      return window.LIFF_CONFIG || {};
    } catch {
      return {};
    }
  };

  const getLiffId = () => {
    try {
      return window.LIFF_CONFIG?.liffId || '';
    } catch {
      return '';
    }
  };

  const isInLine = () => {
    try {
      return /Line/i.test(navigator.userAgent) || (typeof liff !== 'undefined' && liff.isInClient());
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

  const isApiAvailable = (apiName) => {
    try {
      return Boolean(
        _initialized &&
        typeof liff !== 'undefined' &&
        typeof liff.isApiAvailable === 'function' &&
        liff.isApiAvailable(apiName)
      );
    } catch {
      return false;
    }
  };

  const canSendMessages = () => {
    try {
      return Boolean(_initialized && liff.isInClient() && isApiAvailable('sendMessages'));
    } catch {
      return false;
    }
  };

  const sendTextMessage = async (text) => {
    if (!text || !canSendMessages()) return false;

    try {
      await liff.sendMessages([{ type: 'text', text }]);
      return true;
    } catch (err) {
      console.warn('[Y8 LIFF] sendMessages failed:', err);
      return false;
    }
  };

  const openUrl = (url, { external = true } = {}) => {
    if (!url) return;

    try {
      if (_initialized && liff.isInClient()) {
        liff.openWindow({ url, external });
      } else if (external) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = url;
      }
    } catch {
      if (external) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = url;
      }
    }
  };

  const openExternalUrl = (url) => openUrl(url, { external: true });

  const openLineOaChat = () => {
    const lineOaUrl = getConfig().lineOaUrl || '';
    if (!lineOaUrl) return;
    openUrl(lineOaUrl, { external: false });
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
    getConfig,
    openExternalUrl,
    openLineOaChat,
    closeWindow,
    isApiAvailable,
    canSendMessages,
    sendTextMessage,
    isInLine,
    isInitialized: () => _initialized,
  };
})();

window.Y8_LIFF = Y8_LIFF;
