import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

// Plugin to add build timestamp / version query to scripts and assets for aggressive cache busting
function htmlCacheBusterPlugin(): Plugin {
  const version = Date.now().toString(36);
  return {
    name: 'html-cache-buster',
    transformIndexHtml(html) {
      return html
        .replace(/(<script\b[^>]*src=["'])([^"']+)(["'][^>]*>)/gi, (match, p1, p2, p3) => {
          const separator = p2.includes('?') ? '&' : '?';
          return `${p1}${p2}${separator}v=${version}${p3}`;
        })
        .replace(/(<link\b[^>]*href=["'])([^"']+\.css)(["'][^>]*>)/gi, (match, p1, p2, p3) => {
          const separator = p2.includes('?') ? '&' : '?';
          return `${p1}${p2}${separator}v=${version}${p3}`;
        });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      htmlCacheBusterPlugin(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]',
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
