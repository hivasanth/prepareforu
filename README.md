# PrepareForU

Enterprise question bank system for UPSC & State PSC exam preparation with role-based access, AI-powered testing, and real-time analytics.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 5, Tailwind CSS v4
- **Backend**: Supabase (Auth, Database, Realtime, Storage)
- **State**: Redux Toolkit, React Hook Form + Zod
- **Visualization**: Recharts, react-simple-maps, Mermaid
- **Mobile**: Capacitor (Android)
- **Security**: Cloudflare Turnstile, CSP headers, row-level security

## Features

- **Role-Based Access**: Admin, Sub-Admin, and User dashboards with route guards
- **Auth**: Email/password + Google OAuth, email verification, OTP, account management
- **Exams**: Question bank management, timed exams, auto-grading, analytics
- **Dashboard**: Performance charts, map-based geo-analytics, progress tracking
- **Admin Panel**: User management, exam configuration, system monitoring
- **Sub-Admin**: Delegated management for specific domains/regions
- **Math Rendering**: KaTeX for mathematical expressions in questions
- **Security**: CSP headers, Turnstile CAPTCHA, Supabase RLS, input validation

## Getting Started

1. Copy `.env.example` to `.env` and fill in your Supabase credentials and Turnstile key
2. Run `npm install`
3. Run `npm run dev` — app starts at `http://localhost:5173`

See [INSTALL.md](INSTALL.md) for detailed setup instructions and [FORMS.md](FORMS.md) for form conventions.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run android` | Build and sync with Capacitor for Android |

## Project Structure

```
src/
├── components/   # Reusable UI components
├── pages/        # Route pages (admin, auth, exam, user, sub-admin)
├── context/      # React context providers (auth, etc.)
├── hooks/        # Custom hooks
├── services/     # Supabase client and API services
├── store/        # Redux store and slices
├── config/       # App configuration
├── constants/    # Constants and enums
├── types/        # TypeScript type definitions
├── validations/  # Zod schemas
├── utils/        # Utility functions
├── guards/       # Route guards (role-based)
├── layouts/      # Page layouts
├── data/         # Static data and mock data
├── lib/          # Library wrappers (KaTeX, etc.)
├── scripts/      # Build and utility scripts
├── observability/# Logging and error tracking
└── assets/       # Static assets (images, icons)
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key |
| `VITE_USE_SUPABASE_LOCAL` | Use local Supabase containers |
| `VITE_DEV_REQUEST_SUFFIX` | Request ID suffix for dev |
