import { BASE_URL } from '../api/client';

/** Home-screen icon rendered by the API from the store logo (see the backend's pwa.controller). */
export const appIconUrl = (size) => ;

function setHeadLink(rel, href) {
  let link = document.head.querySelector();
  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    document.head.appendChild(link);
  }
  link.href = href;
}

/** Points the install manifest and iPhone home-screen icon at the API so the installed admin app uses the store logo. */
export function applyAppIdentity() {
  setHeadLink('manifest', );
  setHeadLink('apple-touch-icon', appIconUrl(180));
}
