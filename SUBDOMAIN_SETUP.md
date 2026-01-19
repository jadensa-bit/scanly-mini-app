# Subdomain Storefront Setup Guide

## Overview
Storefronts are now accessible via branded subdomains (e.g., `coffeeshop.piqo.app`) in addition to the path-based format (`/u/coffeeshop`). This provides a more professional, white-label experience for your users.

## How It Works

### Routing Logic
- **Subdomain format**: `handle.piqo.app` → automatically routed to `/u/[handle]`
- **Path format**: `/u/[handle]` → continues to work as before
- Both URLs serve the same storefront content

### URL Generation
- QR codes and share links now use subdomain format by default
- Controlled via `NEXT_PUBLIC_BASE_DOMAIN` environment variable
- Can be toggled with `NEXT_PUBLIC_USE_SUBDOMAIN` flag

---

## Vercel Setup

### 1. Add Wildcard Domain
1. Go to your Vercel project settings
2. Navigate to **Domains**
3. Add domain: `*.piqo.app`
4. Vercel will provide DNS records

### 2. Configure DNS (Cloudflare/Your Provider)

Add an **A record** for wildcard subdomain:
```
Type: A
Name: *
Value: 76.76.21.21 (Vercel's IP - check Vercel dashboard for current IP)
Proxy: DNS only (if using Cloudflare)
```

Or use **CNAME** (recommended):
```
Type: CNAME
Name: *
Value: cname.vercel-dns.com
```

### 3. SSL/HTTPS
- Vercel automatically provisions SSL certificates for wildcard domains
- May take 5-10 minutes after DNS propagation
- Check status in Vercel project → Domains

---

## Environment Variables

Add these to your Vercel project environment variables:

```bash
# Base domain for storefront subdomains
NEXT_PUBLIC_BASE_DOMAIN=piqo.app

# Enable/disable subdomain routing (default: true)
NEXT_PUBLIC_USE_SUBDOMAIN=true

# Application base URL
NEXT_PUBLIC_APP_URL=https://piqo.app
```

**In Vercel:**
1. Project Settings → Environment Variables
2. Add each variable for Production, Preview, and Development
3. Redeploy to apply changes

---

## Local Development

### Testing Subdomains Locally

Since `localhost` doesn't support subdomains, use one of these methods:

#### Option 1: Hosts File (Recommended)
Edit `/etc/hosts` (Mac/Linux) or `C:\Windows\System32\drivers\etc\hosts` (Windows):

```
127.0.0.1 test.localhost
127.0.0.1 demo.localhost
127.0.0.1 coffeeshop.localhost
```

Then access: `http://test.localhost:3000`

#### Option 2: Use lvh.me
`lvh.me` is a free service that resolves to `127.0.0.1`:
- Access: `http://yourhandle.lvh.me:3000`
- No configuration needed

#### Option 3: Disable Subdomain Routing Locally
Set in `.env.local`:
```bash
NEXT_PUBLIC_USE_SUBDOMAIN=false
```

This will use path-based URLs (`/u/handle`) during development.

---

## DNS Propagation

After adding DNS records:
- **Propagation time**: 5 minutes to 48 hours (typically < 1 hour)
- **Check status**: Use [WhatsMyDNS.net](https://www.whatsmydns.net/)
- **Vercel status**: Project → Domains tab shows verification status

---

## Testing

### Verify Subdomain Routing
1. Deploy to Vercel
2. Wait for DNS propagation
3. Visit: `https://yourhandle.piqo.app`
4. Should display the storefront for that handle

### Check Middleware
Monitor Vercel logs for:
```
Subdomain routing: coffeeshop.piqo.app -> /u/coffeeshop
```

### Test Fallback
Both URLs should work:
- ✅ `https://coffeeshop.piqo.app`
- ✅ `https://piqo.app/u/coffeeshop`

---

## Custom Domains (Premium Feature)

You can also let merchants use their own domains:

### Setup
1. Merchant adds their domain in Vercel: `shop.merchant.com`
2. Merchant adds DNS records (provided by Vercel)
3. Update middleware to map custom domains to handles

### Database Schema Addition
```sql
ALTER TABLE scanly_sites 
ADD COLUMN custom_domain TEXT UNIQUE;
```

### Middleware Update
Check `custom_domain` in database before subdomain logic.

---

## Troubleshooting

### Subdomain not resolving
- ✅ Check DNS records with `dig *.piqo.app`
- ✅ Verify Vercel domain configuration
- ✅ Wait for DNS propagation
- ✅ Clear browser DNS cache

### SSL certificate errors
- ✅ Wait 10-15 minutes after DNS setup
- ✅ Check Vercel dashboard for certificate status
- ✅ Ensure wildcard DNS is correctly configured

### Middleware not triggering
- ✅ Check environment variables are set
- ✅ Verify `NEXT_PUBLIC_BASE_DOMAIN` matches your domain
- ✅ Check Vercel function logs

### Path-based URLs not working
- ✅ Middleware should only rewrite subdomain requests
- ✅ `/u/[handle]` routes continue to work normally
- ✅ No breaking changes to existing URLs

---

## Architecture Notes

### Why This Approach?

1. **Non-breaking**: Existing `/u/[handle]` URLs continue to work
2. **Progressive enhancement**: Subdomains are a better experience but not required
3. **SEO-friendly**: Each storefront gets its own subdomain
4. **Scalable**: Vercel handles SSL and routing automatically
5. **Flexible**: Can add custom domains later

### Middleware Flow
```
Request: coffeeshop.piqo.app
  ↓
Middleware detects subdomain
  ↓
Extracts handle: "coffeeshop"
  ↓
NextResponse.rewrite("/u/coffeeshop")
  ↓
Same page component, different URL
```

### Performance
- Rewrites happen at edge (no round-trip)
- No additional database queries
- Same page component serves both URL formats
- Zero impact on existing functionality

---

## Future Enhancements

- [ ] Custom domain support per storefront
- [ ] Geo-routing for international domains
- [ ] Analytics per subdomain
- [ ] A/B testing different domain formats
- [ ] White-label platform instances

---

## Support

Questions? Check:
- [Vercel Wildcard Domains Docs](https://vercel.com/docs/projects/domains/working-with-domains)
- [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)
