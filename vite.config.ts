import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_WS  = SUPABASE_URL.replace(/^https?:\/\//, 'wss://')

const PROD_CSP = [
  "default-src 'self'",
  `script-src 'self' https://challenges.cloudflare.com`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `font-src 'self' https://fonts.gstatic.com data:`,
  `img-src 'self' data: blob: https:`,
  SUPABASE_URL ? `connect-src 'self' ${SUPABASE_URL} ${SUPABASE_WS} https://challenges.cloudflare.com` : `connect-src 'self' https: wss:`,
  `frame-src 'self' https://challenges.cloudflare.com`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
].join('; ')

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  esbuild: {
    pure: ['console.debug'],
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
  preview: {
    headers: {
      'Content-Security-Policy':   PROD_CSP,
      'X-Frame-Options':           'DENY',
      'X-Content-Type-Options':    'nosniff',
      'Referrer-Policy':           'strict-origin-when-cross-origin',
      'Cross-Origin-Opener-Policy':'same-origin-allow-popups',
    },
  },
})
