import { BASE_URL } from '../api/client';

/** Home-screen icon rendered by the API from the store logo (see the backend's pwa.controller). */
export const appIconUrl = (size) => `${BASE_URL}/pwa/icon/${size}.png?app=admin`;

function setHeadLink(rel, href) {
  let link = document.head.querySelector(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    document.head.appendChild(link);
  }
  link.href = href;
}

/** Points the install manifest and iPhone home-screen icon at the API so the installed admin app uses the store logo. */
export function applyAppIdentity() {
  setHeadLink('manifest', `${BASE_URL}/pwa/manifest.webmanifest?app=admin&origin=${encodeURIComponent(window.location.origin)}`);
  setHeadLink('apple-touch-icon', appIconUrl(180));
}
