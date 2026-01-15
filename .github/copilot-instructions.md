# Copilot Instructions for Scanly Mini App

## Project Overview
- **Framework:** Next.js (App Router)
- **Purpose:** QR-based storefronts, mobile checkout, and real-time booking dashboard for small businesses/creators.
- **Key Integrations:** Supabase (Realtime, Edge Functions), Stripe (payments), Vercel (deployment)

## Architecture & Structure
- **Frontend:**
  - Located in `src/app/` (pages, layouts, API routes)
  - Components in `src/components/`
  - Styles in `src/app/globals.css`
- **APIs:**
  - Next.js API routes in `src/app/api/`
  - Supabase Edge Functions in `supabase/functions/`
- **Realtime:**
  - Dashboard at `/dashboard` uses Supabase Realtime for live booking updates
- **Check-in:**
  - QR check-in at `/checkin` (page and API)
  - Related Edge Function: `supabase/functions/check-in-webhook/index.ts`

## Developer Workflows
- **Start Dev Server:** `npm run dev` (or `yarn dev`, `pnpm dev`, `bun dev`)
- **Install Dependencies:** `npm install`
- **Run Tests:** `npm test` (Jest, see `src/app/checkin/__tests__` and `src/app/dashboard/__tests__`)
- **Deploy:**
  - Vercel for Next.js frontend
  - Supabase for backend/Edge Functions (`supabase/functions/`)
  - Enable Supabase Realtime for `bookings` table

## Patterns & Conventions
- **Branding:** Always use `piqo` (lowercase) for brand references
- **API Design:**
  - Use Next.js API routes for frontend/backend communication
  - Use Supabase Edge Functions for event-driven backend logic
- **Testing:**
  - Place tests in `__tests__` folders next to feature code
  - Focus on dashboard and check-in flows
- **Environment:**
  - Use `.env.local` for secrets and config

## External Services
- **Supabase:**
  - Realtime for bookings dashboard
  - Edge Functions for check-in events
- **Stripe:**
  - Payment integration via API routes
- **Vercel:**
  - Recommended for deployment

## Key Files & Directories
- `src/app/dashboard/realtime.ts` — Supabase Realtime logic
- `src/app/api/bookings/` — Booking-related API routes
- `supabase/functions/check-in-webhook/index.ts` — Check-in event handler
- `src/app/checkin/page.tsx` — QR check-in page
- `src/app/dashboard/page.tsx` — Dashboard page

## Example Workflow
1. Add a new booking API: create a route in `src/app/api/bookings/`
2. Update dashboard logic: edit `src/app/dashboard/realtime.ts`
3. Add a test: place in `src/app/dashboard/__tests__/`
4. Deploy Edge Function: update code in `supabase/functions/` and deploy via Supabase CLI

---
For more details, see the [README.md](../../README.md).
