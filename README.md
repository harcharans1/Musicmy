# AIForge

AIForge is a full-stack AI productivity platform with a React/Vite frontend, Express API, Supabase database, Gemini AI integration, authentication, credits, manual UPI Pro subscriptions, dashboard, saved outputs, favorites, blog, FAQ and contact workflows.

## Stack
- Frontend: React 19, Vite, Tailwind CSS, React Router
- Backend: Node.js, Express 5
- Database: Supabase PostgreSQL
- AI: Google Gemini API
- Email: Resend (password reset)
- Payments: UPI + manual UTR verification

## Setup
1. Create a Supabase project.
2. Run `server/supabase/schema.sql` in Supabase SQL Editor.
3. Copy `server/.env.example` to `server/.env` and fill the values.
4. Set `VITE_API_URL` in `client/.env` for production, e.g. `https://your-api.example.com/api`.
5. Run `npm install` inside both `client` and `server`.
6. Start backend with `npm run dev` and frontend with `npm run dev`.

## Admin
Register normally, then in Supabase SQL Editor run:
`update users set role='admin' where email='YOUR_ADMIN_EMAIL';`

## Production
Set `CLIENT_URL` to your frontend origin and `RESET_PASSWORD_URL` to the deployed reset-password route. Never expose the Supabase service-role key or Gemini API key in the frontend.
