/**
 * Fonts the admin can pick for headings and body text. Ids must match FONT_IDS in the backend's
 * Setting model and FONTS in the store's utils/fonts.js.
 */
export const FONTS = [
  { id: 'playfair', name: 'Playfair Display', family: "'Playfair Display', Georgia, serif", google: 'Playfair+Display:wght@500;700' },
  { id: 'cormorant', name: 'Cormorant Garamond', family: "'Cormorant Garamond', Georgia, serif", google: 'Cormorant+Garamond:wght@500;700' },
  { id: 'marcellus', name: 'Marcellus', family: "'Marcellus', Georgia, serif", google: 'Marcellus' },
  { id: 'cinzel', name: 'Cinzel', family: "'Cinzel', Georgia, serif", google: 'Cinzel:wght@500;700' },
  { id: 'lora', name: 'Lora', family: "'Lora', Georgia, serif", google: 'Lora:wght@400;500;700' },
  { id: 'dm-serif', name: 'DM Serif Display', family: "'DM Serif Display', Georgia, serif", google: 'DM+Serif+Display' },
  { id: 'inter', name: 'Inter', family: "'Inter', system-ui, sans-serif", google: 'Inter:wght@400;500;600;700' },
  { id: 'poppins', name: 'Poppins', family: "'Poppins', system-ui, sans-serif", google: 'Poppins:wght@400;500;600' },
  { id: 'montserrat', name: 'Montserrat', family: "'Montserrat', system-ui, sans-serif", google: 'Montserrat:wght@400;500;600;700' },
  { id: 'lato', name: 'Lato', family: "'Lato', system-ui, sans-serif", google: 'Lato:wght@400;700' },
  { id: 'dm-sans', name: 'DM Sans', family: "'DM Sans', system-ui, sans-serif", google: 'DM+Sans:wght@400;500;700' },
  { id: 'nunito', name: 'Nunito', family: "'Nunito', system-ui, sans-serif", google: 'Nunito:wght@400;600;700' },
  { id: 'jost', name: 'Jost', family: "'Jost', system-ui, sans-serif", google: 'Jost:wght@400;500;600' },
];

export const getFont = (id) => FONTS.find((f) => f.id === id);

/** Adds one Google Fonts stylesheet for the given font ids (ignores 'theme' and unknown ids). */
export function loadFonts(ids) {
  const fonts = [...new Set(ids)].map(getFont).filter(Boolean);
  if (!fonts.length) return;
  const href = `https://fonts.googleapis.com/css2?${fonts.map((f) => `family=${f.google}`).join('&')}&display=swap`;
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}
