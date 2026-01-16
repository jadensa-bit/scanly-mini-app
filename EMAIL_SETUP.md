# Email Configuration Required

## ⚠️ Emails Not Sending - SMTP Setup Needed

Your code is working, but **Supabase needs SMTP configured** to send emails.

### Quick Fix (5 minutes):

#### Option 1: Resend (Recommended - Free)

1. **Sign up at [resend.com](https://resend.com)**
   - Free tier: 3,000 emails/month
   - No credit card required

2. **Get API Key:**
   - Click "API Keys" → "Create API Key"
   - Copy the key (starts with `re_...`)

3. **Configure Supabase:**
   - Go to: [Supabase Dashboard](https://supabase.com/dashboard/project/djghvdbpbjzyxahusnri/settings/auth)
   - Scroll to **SMTP Settings**
   - Click **Enable Custom SMTP**
   - Fill in:
     ```
     Sender name: piqo
     Sender email: onboarding@resend.dev (for testing)
     Host: smtp.resend.com
     Port: 587
     Username: resend
     Password: <paste-your-api-key>
     ```
   - Click **Save**

4. **Test:**
   - Try signup with a real email
   - Should receive confirmation email within seconds

---

#### Option 2: Gmail (Quick but Limited)

1. **Enable 2FA on Gmail account**
2. **Generate App Password:**
   - Google Account → Security → App Passwords
3. **Configure Supabase SMTP:**
   ```
   Host: smtp.gmail.com
   Port: 587
   Username: youremail@gmail.com
   Password: <app-password>
   ```

---

#### Option 3: Disable Email Confirmation (Development Only)

**Temporary workaround for testing:**

Go to [Supabase Auth Settings](https://supabase.com/dashboard/project/djghvdbpbjzyxahusnri/settings/auth):
- Scroll to **Email Auth**
- **DISABLE** "Confirm email"
- Users can login immediately without confirmation

⚠️ **Not recommended for production!**

---

### Verify SMTP is Working:

After configuring SMTP, test with this SQL in Supabase SQL Editor:

```sql
-- Check if SMTP is configured
SELECT * FROM auth.config;

-- Test by creating a user (will send email)
SELECT auth.admin.create_user({
  email: 'test@example.com',
  password: 'test123',
  email_confirm: true
});
```

---

### Status Check:

Run this to see current config:
```bash
# Check Supabase logs for SMTP errors
# Dashboard → Logs → Auth
```

---

**After configuring SMTP, email sending will work automatically!** ✅
