import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Bundle analyzer - run 'npm run build' to generate stats.html
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    // PWA for offline caching and performance
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer', // Defer SW registration to not block render
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'ESCORIA',
        short_name: 'ESCORIA',
        description: 'Verifizierte Anbieter in der Schweiz',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/placeholder.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg}'],
        runtimeCaching: [
          // Aggressive image caching for profile photos
          {
            urlPattern: /^https:\/\/fwatgrgbwgtueunihbwv\.supabase\.co\/storage\/v1\/object\/public\/profile-photos\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'profile-images',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 90, // 90 days for profile photos
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              // Use background sync for better offline experience
              plugins: [
                {
                  cacheWillUpdate: async ({ response }: any) => {
                    // Cache successful responses and transformed images
                    if (response.status === 200 || response.status === 0) {
                      return response;
                    }
                    return null;
                  },
                },
              ],
            },
          },
          // Cache other Supabase storage assets (verification images, etc.)
          {
            urlPattern: /^https:\/\/fwatgrgbwgtueunihbwv\.supabase\.co\/storage\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Cache profile pages for faster navigation
          {
            urlPattern: /^https?:\/\/.*\/profil\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'profile-pages',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              networkTimeoutSeconds: 3,
            },
          },
          // Cache API responses
          {
            urlPattern: /^https:\/\/fwatgrgbwgtueunihbwv\.supabase\.co\/rest\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5, // 5 minutes for API responses
              },
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Disable module preload polyfill to prevent unnecessary preloading
    modulePreload: {
      polyfill: false, // Don't polyfill for older browsers
    },
    // Optimize bundle size
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core vendor chunks - always needed
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') || 
              id.includes('node_modules/react-router-dom/')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'query-vendor';
          }
          // Supabase - only load when needed for API calls
          if (id.includes('node_modules/@supabase/')) {
            return 'supabase-vendor';
          }
          // Charts - admin only, load lazily
          if (id.includes('node_modules/recharts/') || 
              id.includes('node_modules/d3-') ||
              id.includes('node_modules/victory-')) {
            return 'charts';
          }
          // Split Radix UI - load as needed
          if (id.includes('@radix-ui/react-dialog')) return 'radix-dialog';
          if (id.includes('@radix-ui/react-select')) return 'radix-select';
          if (id.includes('@radix-ui/react-dropdown-menu')) return 'radix-dropdown';
          if (id.includes('@radix-ui/react-popover')) return 'radix-popover';
          if (id.includes('@radix-ui/react-tabs')) return 'radix-tabs';
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 500,
    reportCompressedSize: true,
    // Enable source maps in production for debugging
    sourcemap: mode === 'production' ? false : true,
    // Minify with terser for better compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production', // Remove console.logs in production
        drop_debugger: true,
      },
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js'],
  },
}));
