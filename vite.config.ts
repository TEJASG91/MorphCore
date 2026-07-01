import { defineConfig } from 'vite';

export default defineConfig({
  // relative base => works when hosted under a subpath (e.g. GitHub Pages project sites)
  base: './',
  build: {
    target: 'es2020',
    sourcemap: true,
  },
});
