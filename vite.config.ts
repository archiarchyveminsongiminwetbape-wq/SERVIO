import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks - split into smaller chunks for better caching
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
            if (id.includes('date-fns') || id.includes('moment')) {
              return 'vendor-date';
            }
            // Split vendor-other into smaller chunks
            if (id.includes('axios') || id.includes('node-fetch')) {
              return 'vendor-http';
            }
            if (id.includes('dom') || id.includes('dompurify')) {
              return 'vendor-dom';
            }
            // Exclude flutterwave-node-v3 from client bundle
            if (id.includes('flutterwave-node-v3')) {
              return 'vendor-server-only';
            }
            // Put everything else in vendor-other
            return 'vendor-other';
          }
          // Page chunks - lazy load by page
          if (id.includes('src/pages/LandingPage')) {
            return 'page-landing';
          }
          if (id.includes('src/pages/SearchPage')) {
            return 'page-search';
          }
          if (id.includes('src/pages/BookingPage')) {
            return 'page-booking';
          }
          if (id.includes('src/pages/MessagesPage')) {
            return 'page-messages';
          }
          if (id.includes('src/pages/ProfilePage')) {
            return 'page-profile';
          }
          if (id.includes('src/pages/AdminDashboardPage')) {
            return 'page-admin';
          }
          if (id.includes('src/pages')) {
            return 'pages';
          }
          // Component chunks - simplified to avoid circular dependencies
          if (id.includes('src/components/AIChatbot')) {
            return 'component-chatbot';
          }
          if (id.includes('src/components/Navbar')) {
            return 'component-navbar';
          }
          if (id.includes('src/components')) {
            return 'components';
          }
        },
      },
      treeshake: {
        // Keep dynamically imported React routes and their side effects intact.
        moduleSideEffects: true,
        propertyReadSideEffects: true,
      },
      external: ['flutterwave-node-v3', 'crypto', 'fs', 'https', 'os', 'path', 'querystring'],
    },
    chunkSizeWarningLimit: 800,
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
    include: ['lucide-react', '@supabase/supabase-js'],
    exclude: [],
  },
  server: {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  },
});
