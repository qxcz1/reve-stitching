import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'server',  // Changed from 'hybrid' to 'server'
  adapter: vercel(),
  integrations: [
    tailwind({ applyBaseStyles: false }),
  ],
  site: 'https://revestitching.com',
  build: {
    inlineStylesheets: 'auto',
  },
});