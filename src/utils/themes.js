/**
 * Storefront theme presets. Ids must match THEME_PRESETS in the backend's Setting model and the
 * [data-theme] blocks in the store's index.css; the values here only drive the admin preview.
 */
export const THEMES = [
  {
    id: 'classic', name: 'Classic Gold', description: 'Warm cream and gold with elegant serif headings.',
    accent: '#b8892f', accentDark: '#8f6a1f', ink: '#2a2420', muted: '#7a6f66', bg: '#fbf8f3', surface: '#ffffff', border: '#ece4d8',
    hero: 'linear-gradient(120deg, #2a2420 0%, #4a3a28 60%, #b8892f 140%)', announce: ['#2a2420', '#fff'],
    heading: "'Playfair Display', Georgia, serif", body: "'Inter', system-ui, sans-serif", radius: 12, btnRadius: 8,
  },
  {
    id: 'midnight', name: 'Midnight Luxe', description: 'Dark mode with glowing gold — dramatic and premium.',
    accent: '#d4af5f', accentDark: '#e8c97f', onAccent: '#1a1408', ink: '#f2ece2', muted: '#a69d90', bg: '#121014', surface: '#1c1a1f', border: '#2f2b31',
    hero: 'linear-gradient(120deg, #0b0a0c 0%, #241e17 60%, #d4af5f 150%)', announce: ['#000', '#d4af5f'],
    heading: "'Cormorant Garamond', Georgia, serif", body: "'Inter', system-ui, sans-serif", radius: 12, btnRadius: 8,
  },
  {
    id: 'minimal', name: 'Modern Minimal', description: 'Black and white, sharp corners, clean sans-serif type.',
    accent: '#111111', accentDark: '#000000', ink: '#111111', muted: '#6b6b6b', bg: '#ffffff', surface: '#ffffff', border: '#e6e6e6',
    hero: 'linear-gradient(120deg, #111 0%, #2b2b2b 70%, #111 140%)', announce: ['#111111', '#fff'],
    heading: "'Inter', system-ui, sans-serif", body: "'Inter', system-ui, sans-serif", radius: 4, btnRadius: 2,
  },
  {
    id: 'rose', name: 'Rose Blush', description: 'Soft pinks, rounded cards and pill buttons.',
    accent: '#c2577a', accentDark: '#9e3d5e', ink: '#3a2530', muted: '#8a6f7a', bg: '#fff7f8', surface: '#ffffff', border: '#f3dce3',
    hero: 'linear-gradient(120deg, #5a2a3c 0%, #9e3d5e 60%, #c2577a 140%)', announce: ['#3a2530', '#fff'],
    heading: "'Playfair Display', Georgia, serif", body: "'Poppins', system-ui, sans-serif", radius: 18, btnRadius: 999,
  },
  {
    id: 'emerald', name: 'Royal Emerald', description: 'Deep green with antique-gold highlights.',
    accent: '#1f6f54', accentDark: '#14513c', ink: '#1d2a24', muted: '#64756c', bg: '#f5f8f4', surface: '#ffffff', border: '#dbe6de',
    hero: 'linear-gradient(120deg, #0e2a20 0%, #14513c 60%, #c9a14a 140%)', announce: ['#0e2a20', '#e9d29a'],
    heading: "'Cormorant Garamond', Georgia, serif", body: "'Inter', system-ui, sans-serif", radius: 12, btnRadius: 8,
  },
  {
    id: 'festive', name: 'Festive Maroon', description: 'Maroon and saffron for Diwali and wedding season.',
    accent: '#b5172f', accentDark: '#8a0f22', ink: '#3b1212', muted: '#8a5a4a', bg: '#fff8ec', surface: '#fffdf7', border: '#f0d9b5',
    hero: 'linear-gradient(120deg, #5c0a17 0%, #8a0f22 55%, #f39c12 140%)', announce: ['#f39c12', '#3b1212'],
    heading: "'Marcellus', Georgia, serif", body: "'Poppins', system-ui, sans-serif", radius: 12, btnRadius: 8,
  },
];

export const getTheme = (id) => THEMES.find((t) => t.id === id) ?? THEMES[0];
