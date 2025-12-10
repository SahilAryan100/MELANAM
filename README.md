# Creators App (Monorepo)

This repository contains a starter frontend (Vite + React) and backend (Node + Express) for a creators platform.

Quick start:

1. Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env and set MONGO_URI and JWT_SECRET and Stripe keys
npm run dev
```

2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Notes:
- Payments: configured to use Stripe Checkout for subscriptions. Use Stripe test keys for local testing.
- Storage: file uploads are stored locally under `uploads/` (use S3 later for production).
- Auth: JWT. Refresh tokens not implemented yet.
- Vercel: frontend is a standard Vite app and can be deployed to Vercel. Backend should be deployed separately (e.g. Render, Heroku) or converted to serverless functions for Vercel.

Stripe webhook testing (local)
1. Install the Stripe CLI: https://stripe.com/docs/stripe-cli
2. Log in and forward webhook events to your local backend:

```bash
# from your machine
stripe login
stripe listen --forward-to localhost:5000/api/payments/webhook --events checkout.session.completed invoice.payment_succeeded customer.subscription.deleted
```

3. Create a Price in your Stripe dashboard and copy the Price ID (e.g. `price_...`).
4. In the frontend go to `/subscribe`, paste the Price ID and click Checkout — complete the test payment using Stripe test cards.
5. The Stripe CLI will show webhook events and your backend will log them. Make sure `STRIPE_WEBHOOK_SECRET` in `.env` matches the secret shown by the Stripe CLI when running `stripe listen`.

Note: For local webhook signature verification we rely on the `STRIPE_WEBHOOK_SECRET` and the server saves the raw request body to verify the signature.
<img width="587" height="466" alt="image" src="https://github.com/user-attachments/assets/4897bf1a-0c85-4f14-82e4-d26f62d5ffa1" />

