This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Run commands inside `frontend`:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Auth (Google + Kakao OAuth)

This project uses Supabase Auth with OAuth providers.

### Required env vars (`frontend/.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production (Vercel):

```bash
NEXT_PUBLIC_APP_URL=https://gamelab-zeta.vercel.app
```

### Supabase Console Settings

1. `Authentication -> URL Configuration`
- Site URL: `https://gamelab-zeta.vercel.app`
- Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://gamelab-zeta.vercel.app/auth/callback`

2. `Authentication -> Providers`
- Enable `Google`
- Enable `Kakao`
- Fill provider credentials from each cloud console.

### Google Cloud Console

- Create OAuth client (Web)
- Authorized origins:
  - `http://localhost:3000`
  - `https://gamelab-zeta.vercel.app`
- Redirect URI: use the exact callback URI shown in Supabase Google provider.

### Kakao Developers

- Register Web platform domains:
  - `http://localhost:3000`
  - `https://gamelab-zeta.vercel.app`
- Set Redirect URI: use the exact callback URI shown in Supabase Kakao provider.

## Runtime Notes

- Login page now supports OAuth only (Google/Kakao).
- `/auth/callback` exchanges auth code for session and redirects to `/sessions`.
- Keep backend running locally if dashboard data is needed after login.
