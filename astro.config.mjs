// @ts-check
import { defineConfig } from 'astro/config';
// import cloudflare from '@astrojs/cloudflare'; // temporarily disabled — miniflare hangs in dev
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // adapter: cloudflare(),
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/three/')) return 'three';
            if (id.includes('node_modules/@dimforge/')) return 'rapier';
            if (id.includes('node_modules/gsap/')) return 'gsap';
          },
        },
      },
    },
  },
});
