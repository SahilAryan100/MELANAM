# Backend (Express)

- Copy `.env.example` to `.env` and set values.
- Install: `npm install` then `npm run dev`.
- Endpoints:
  - `POST /api/auth/register` - register
  - `POST /api/auth/login` - login
  - `POST /api/content/upload` - upload file (auth header `Bearer <token>`)
  - `POST /api/payments/create-session` - create Stripe checkout session
