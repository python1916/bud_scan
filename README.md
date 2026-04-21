# Bug Analyzer Web App (MVP)

A full-stack ready MVP for a Bug Analyzer tool built with HTML, CSS, vanilla JavaScript, and Node.js + Express.

## What it includes

- Landing page with hero, features, and CTA
- Login / signup authentication flow
- Protected dashboard with code input and file upload
- **Pro tier system**: Free users see upgrade prompt; pro users can analyze code
- Stripe checkout integration for one-click upgrades
- Webhook handling for subscription events (success and cancellation)
- `/analyze` backend endpoint returning structured bug reports
- Simple JSON user storage for MVP auth
- Dark, responsive UI with modern SaaS-style layout

## Run locally

```bash
cd backend
npm install
npm start
```

Then open `http://localhost:4000`.

## Backend API

- `POST /auth/signup` — sign up with email and password
- `POST /auth/login` — log in with email and password
- `GET /api/dashboard` — get user plan, scan count, and pro status
- `POST /analyze` — analyze submitted code (requires pro upgrade); tracks scans used
- `POST /stripe/create-checkout-session` — create a Stripe checkout session for upgrading to pro
- `POST /stripe/webhook` — handle Stripe webhook events for subscription management

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

- `PORT` — server port (default: 4000)
- `STRIPE_SECRET_KEY` — your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` — webhook endpoint secret from Stripe dashboard
- `STRIPE_PRICE_ID` — your Stripe price ID for subscriptions

## Notes

- User data is stored in `backend/users.json` with pro status, Stripe customer IDs, and scan count.
- New users start on the free plan; they can upgrade via the dashboard upgrade button.
- The analyzer is locked behind a pro paywall—free users get a 403 error and see an upgrade prompt.
- **Webhook events handled**:
  - `checkout.session.completed` — user upgrades to pro
  - `customer.subscription.deleted` — user cancels subscription, downgraded to free
  - `invoice.payment_failed` — payment fails, user downgraded to free
  - `invoice.paid` — successful renewal, user stays/becomes pro
- **Scan tracking**: Each analysis increments user `scans_used` counter
- Dashboard displays real-time plan status and scan count
- No real AI analysis; the analyzer uses mock lint-style checks for demo purposes.
- The frontend is served statically from the backend for an end-to-end flow.

## Testing the pro flow

1. Sign up a new account (free plan by default)
2. Dashboard shows "Free plan" and "0" scans
3. Try to analyze code → get upgrade prompt
4. Click upgrade → redirected to Stripe checkout
5. Use Stripe test card: `4242 4242 4242 4242` (exp: 12/25, CVC: any 3 digits)
6. After payment, Stripe webhook updates your account to pro
7. Return to dashboard → plan changes to "Pro"
8. Analyze code successfully → scan count increments in real-time on dashboard
