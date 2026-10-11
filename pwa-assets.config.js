import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Regenerate the PNG icons from public/icon.svg with: npm run generate-pwa-assets
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#1f1b17' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#1f1b17' } },
  },
  images: ['public/icon.svg'],
});
