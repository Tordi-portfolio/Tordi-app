import { useEffect, useState } from 'react';

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isInStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) {
      setInstalled(true);
      return;
    }

    if (isIos()) {
      // iOS Safari has no install prompt API — the only way in is the
      // Share sheet's "Add to Home Screen", so just show instructions.
      const dismissed = sessionStorage.getItem('tordi_ios_hint_dismissed');
      if (!dismissed) setShowIosHint(true);
      return;
    }

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;

  if (showIosHint) {
    return (
      <div className="ios-install-hint">
        <span>Install Tordi: tap <strong>Share ⬆</strong>, then <strong>Add to Home Screen</strong>.</span>
        <button
          type="button"
          onClick={() => {
            setShowIosHint(false);
            sessionStorage.setItem('tordi_ios_hint_dismissed', '1');
          }}
        >
          ✕
        </button>
      </div>
    );
  }

  if (!deferredPrompt) return null;

  const handleInstall = async () => {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <button className="install-btn" onClick={handleInstall}>
      ⬇ Install Tordi
    </button>
  );
}
