import tailwindcss from '@tailwindcss/vite';
import vinext from 'vinext';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';

const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === 'seatbelt';

export default defineConfig({
  optimizeDeps: {
    exclude: ['lucide-react'],
  },

  server: isCodexSeatbeltSandbox
    ? {
        watch: {
          useFsEvents: false,
          usePolling: true,
        },
      }
    : undefined,

  plugins: [
    tailwindcss(),
    vinext(),
    nitro({
      preset: 'vercel',
      compatibilityDate: '2026-08-31',
      // Work around Nitro/Rolldown's invalid split SSR re-export until upstream
      // issue #4533 is fixed. Remove after upgrading to a release with the fix.
      inlineDynamicImports: true,
      vercel: {
        functions: {
          runtime: 'nodejs22.x',
        },
      },
    }),
  ],
});
