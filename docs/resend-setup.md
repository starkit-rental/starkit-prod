# Resend Email Setup Guide

## 🚀 Quick Start

### 1. Get Your Resend API Key

1. Go to [https://resend.com/api-keys](https://resend.com/api-keys)
2. Sign up or log in
3. Create a new API key
4. Copy the key (starts with `re_`)

### 2. Add API Key to Your Project

Open `.env.local` and add your Resend API key:

```bash
# Replace re_xxxxxxxxx with your real API key
RESEND_API_KEY=re_xxxxxxxxx
ADMIN_EMAIL=admin@starkit.pl
```

**⚠️ Important**: Replace `re_xxxxxxxxx` with your actual API key from Resend!

### 3. Test Your Integration

Run the test script to verify everything works:

```bash
node scripts/test-resend.js
```

You should see:
```
✅ Email sent successfully!
📧 Email ID: abc123...
```

Check your inbox at `starkit.rental@gmail.com` for the test email.

---

## 📧 How It Works in Your Project

### Automatic Emails After Payment

When a customer completes payment, the system automatically sends:

1. **Customer Confirmation Email** 📨
   - Subject: "Twoja rezerwacja Starkit jest już potwierdzona! 🛰️"
   - Includes: Order details, dates, Paczkomat info, pricing breakdown
   - Sent to: Customer's email

2. **Admin Notification Email** 💼
   - Subject: "Nowa kasa! Zamówienie #[ID] od [Name] 💸"
   - Includes: Customer details, logistics, order value
   - Sent to: `ADMIN_EMAIL` from `.env.local`

### Email Templates

Beautiful, responsive React Email templates:
- `emails/customer-confirmation.tsx` - Customer order confirmation
- `emails/admin-notification.tsx` - Admin new order notification

### Email Logging

All emails are logged in the `email_logs` table:
- Track sent/failed status
- View in order details: `/office/orders/[id]` → "Historia Komunikacji"
- Includes error messages for debugging

---

## 🔧 Configuration

### Environment Variables

```bash
# Required
RESEND_API_KEY=re_your_real_api_key_here

# Optional (defaults to admin@starkit.pl)
ADMIN_EMAIL=your-admin-email@starkit.pl

# Required for email links
NEXT_PUBLIC_SITE_URL=https://starkit.pl
```

### Email Addresses

**From addresses** (configured in `lib/email.tsx`):
- All emails: `Starkit - wynajem Starlink <wynajem@starkit.pl>`
- Reply-To: `wynajem@starkit.pl`

**To addresses**:
- Customer: From order data (customer email)
- Admin: From `ADMIN_EMAIL` env variable

---

## 🧪 Testing

### Test Script

```bash
node scripts/test-resend.js
```

This sends a simple test email to verify your API key works.

### Test Real Order Flow

1. Create a test order in your app
2. Complete payment (use Stripe test mode)
3. Check emails are sent
4. Verify in `/office/orders/[id]` → Historia Komunikacji

---

## 📊 Database Setup

Create the `email_logs` table in Supabase:

```sql
CREATE TABLE email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  recipient text NOT NULL,
  subject text NOT NULL,
  type text NOT NULL,
  status text NOT NULL,
  error_message text,
  resend_id text,
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_email_logs_order_id ON email_logs(order_id);
CREATE INDEX idx_email_logs_type ON email_logs(type);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at DESC);
```

---

## 🎨 Customizing Email Templates

Edit the React Email templates:

**Customer Confirmation**: `emails/customer-confirmation.tsx`
```tsx
// Change logo, colors, text, etc.
<Img src="https://starkit.pl/logo.png" ... />
```

**Admin Notification**: `emails/admin-notification.tsx`
```tsx
// Customize admin email content
```

**Preview emails locally**:
```bash
npm run email:dev
```

---

## 🐛 Troubleshooting

### "Missing API key" error
- Check `.env.local` has `RESEND_API_KEY=re_...`
- Restart your dev server after adding the key

### Emails not sending
- Check Resend dashboard for errors
- Verify domain is verified in Resend
- Check `email_logs` table for error messages

### Emails go to spam
- Verify your domain in Resend
- Add SPF/DKIM records to your DNS
- Use a verified "from" address

### Build errors
- Make sure all env variables are set
- The Resend client is lazy-loaded to avoid build-time errors

---

## 📚 Resources

- [Resend Documentation](https://resend.com/docs)
- [React Email Documentation](https://react.email/docs)
- [Email Logs Schema](./email_logs_schema.md)

---

## ✅ Checklist

- [ ] Created Resend account
- [ ] Got API key from Resend
- [ ] Added `RESEND_API_KEY` to `.env.local`
- [ ] Set `ADMIN_EMAIL` in `.env.local`
- [ ] Ran test script: `node scripts/test-resend.js`
- [ ] Created `email_logs` table in Supabase
- [ ] Verified domain in Resend (for production)
- [ ] Tested order flow with real payment

---

**Need help?** Check the Resend dashboard or email logs in your admin panel.
