import { useEffect, useState } from 'react';

const DISMISSED_KEY = 'install_prompt_dismissed_at';
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000; // ask again two weeks after "Not now"
const SHOW_DELAY_MS = 4000; // let the page load before asking

const isInstalled = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

// Safari on iPhone/iPad has no install event; the app is added from the Share menu instead.
function isIosSafari() {
  const ua = navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return ios && /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
}

function isSnoozed() {
  try {
    return Date.now() - Number(localStorage.getItem(DISMISSED_KEY) || 0) < SNOOZE_MS;
  } catch {
    return false;
  }
}

function snooze() {
  try {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  } catch {
    // storage blocked: the prompt just comes back next visit
  }
}

// Safari's Share glyph, so the instruction matches what's on screen.
const ShareIcon = () => (
  <svg className="install-share-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3v12M8 7l4-4 4 4M6 11H5v10h14V11h-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Invites first-time visitors to install the site as an app. Browsers only open the real install dialog from a tap. */
export default function InstallPrompt({ name, icon }) {
  const [installEvent, setInstallEvent] = useState(null);
  const [mode, setMode] = useState(null); // 'native' (Chrome, Edge, Samsung…) | 'ios'

  useEffect(() => {
    if (isInstalled() || isSnoozed()) return undefined;
    let timer;
    const showLater = (m) => {
      clearTimeout(timer);
      timer = setTimeout(() => setMode(m), SHOW_DELAY_MS);
    };
    const onInstallable = (e) => {
      e.preventDefault(); // use this banner instead of the browser's mini-infobar
      setInstallEvent(e);
      showLater('native');
    };
    const onInstalled = () => {
      setMode(null);
      setInstallEvent(null);
      snooze();
    };
    window.addEventListener('beforeinstallprompt', onInstallable);
    window.addEventListener('appinstalled', onInstalled);
    if (isIosSafari()) showLater('ios');
    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', onInstallable);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!mode) return null;

  const close = () => {
    snooze();
    setMode(null);
  };

  const install = async () => {
    installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome !== 'accepted') snooze();
    setInstallEvent(null);
    setMode(null);
  };

  return (
    <div className="install-prompt card" role="dialog" aria-label={`Install ${name}`}>
      <img src={icon} alt="" className="install-prompt-icon" />
      <div className="install-prompt-text">
        <strong>Install {name}</strong>
        <p className="muted small">
          {mode === 'ios' ? (
            <>Tap <ShareIcon /> <strong>Share</strong> in Safari, then <strong>Add to Home Screen</strong>.</>
          ) : (
            'Open the admin like an app, straight from your home screen.'
          )}
        </p>
      </div>
      <div className="install-prompt-actions">
        {mode === 'native' && <button className="btn btn-primary" onClick={install}>Install</button>}
        <button className="btn btn-ghost" onClick={close}>{mode === 'ios' ? 'Got it' : 'Not now'}</button>
      </div>
    </div>
  );
}
