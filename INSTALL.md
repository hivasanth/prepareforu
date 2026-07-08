# 🚀 PrepareForU Local Setup Guide

Follow these steps to get the enterprise question bank system running on your local machine.

## 1. Prerequisites
- **Node.js** (v18 or higher)
- **Supabase Project** (Create one at [supabase.com](https://supabase.com))

## 2. Environment Configuration
1. Copy `.env.example` to a new file named `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in your **Supabase URL** and **Anon Key** from the Supabase Dashboard (Settings -> API).

## 3. Supabase Setup
1. **Authentication**: Enable `Email/Password` and `Google` providers (if needed).
2. **Database**: 
   - Ensure the `users` table exists (see SQL schema in migrations if available).
   - Ensure Row Level Security (RLS) policies are configured.
3. **Storage**:
   - Create any necessary buckets if your app uses static assets or user uploads.

## 4. Launch the App
Run the following commands in your terminal:

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173).

## 🛡️ Admin Setup
To access the Admin Panel (`/admin`):
1. Sign up as a regular user via the `/signup` page.
2. Go to your **Supabase Dashboard**.
3. Go to the **Table Editor** and find your user in the `users` table.
4. Manually change the `role` field from `"user"` to `"admin"`.
5. Refresh the app. You now have full administrative access.

---

> [!TIP]
> **Troubleshooting**: If you see a blank screen, check your browser console (F12) for Supabase configuration or network errors.
