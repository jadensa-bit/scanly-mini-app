This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Scanly Mini App

## Features Added
- Real-time dashboard for bookings (Supabase Realtime)
- QR check-in page and API
- Supabase Edge Function for check-in events
- Basic tests for dashboard and check-in pages

## How to Run Locally

```bash
npm install
npm run dev
```
Visit `/dashboard` for the real-time dashboard and `/checkin` for QR check-in.

## Testing

```bash
npm test
```

## Deployment
- Ensure Supabase Realtime is enabled for the `bookings` table.
- Deploy Edge Functions in `supabase/functions` as per Supabase docs.

## Next Steps
- Customize UI and add more analytics
- Add push notifications for check-in events
- Improve QR code scanning UX
