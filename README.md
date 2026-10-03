# AIForge

Full-stack AI Tools SaaS starter: React/Vite/Tailwind frontend + Node/Express/MongoDB REST backend.

## Run

### Backend
```bash
cd server
npm install
cp .env.example .env
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

Client: http://localhost:5173 · API: http://localhost:5000

Set `DEMO_MODE=true` to run AI endpoints with realistic demo responses without provider keys.

Never commit `.env` or expose provider/payment/database secrets to the frontend.
