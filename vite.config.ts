import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react({
      // Ensure fast refresh works correctly
      fastRefresh: true,
      // Exclude certain files from HMR
      exclude: /\.css$/,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks - simplified to avoid React issues
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react-core';
            }
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('lucide')) {
              return 'vendor-icons';
            }
            if (id.includes('jspdf')) {
              return 'vendor-pdf-core';
            }
            if (id.includes('html2canvas')) {
              return 'vendor-pdf-canvas';
            }
            if (id.includes('@huggingface')) {
              return 'vendor-ai';
            }
            return 'vendor-other';
          }
          // Page chunks
          if (id.includes('src/pages')) {
            return 'pages';
          }
          // Component chunks
          if (id.includes('src/components')) {
            return 'components';
          }
        },
      },
      treeshake: {
        moduleSideEffects: true,
        propertyReadSideEffects: true,
      },
      external: ['flutterwave-node-v3', 'crypto', 'fs', 'https', 'os', 'path', 'querystring'],
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        dead_code: true,
        conditionals: true,
        evaluate: true,
        booleans: true,
        loops: true,
        unused: true,
        hoist_funs: true,
        keep_fargs: false,
        hoist_vars: false,
        if_return: true,
        join_vars: true,
        side_effects: true,
        passes: 2,
      },
      mangle: {
        safari10: true,
      },
    },
    assetsInlineLimit: 4096,
    reportCompressedSize: true,
    sourcemap: false,
    target: 'es2020',
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react', '@supabase/supabase-js'],
    exclude: [],
  },
  server: {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  },
});
