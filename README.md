# Codely

A modern full-stack Next.js (TypeScript) application that helps users create apps and websites by chatting with an AI assistant. The project demonstrates a production-ready setup using modern tools: Next 15, React 19, Tailwind CSS, Prisma, tRPC, Clerk for auth, and Inngest for background/offline processing.

This README provides an overview, local development steps, environment configuration notes, deployment suggestions, and pointers to helpful files inside the repo.

## Quick overview

- Framework: Next.js 15 (App Router)
- Language: TypeScript + React 19
- Styling: Tailwind CSS
- Database: Prisma (migrations in `prisma/migrations`)
- Auth: Clerk
- Background / Jobs: Inngest
- API layer: tRPC + React Query
- UI primitives: Radix, Lucide, Sonner

## Features

- AI-powered project creation and workflows (front-end UI to create projects)
- User authentication and session management via Clerk
- Background event handling using Inngest
- Database models managed with Prisma and migrations checked into `prisma/migrations`
- Component-driven UI with accessible primitives (Radix) and Tailwind utilities

## Repository structure (high level)

- `src/app/` — Next.js app routes and layouts
- `src/components/` — Reusable UI components
- `src/modules/` — Feature modules (home, projects, usage, messages)
- `prisma/` — Prisma schema and migrations
- `public/` — Static assets
- `package.json` — Scripts and dependencies

## Tech / Dependencies

See `package.json` for the full list, notable items include:

- `next` (15.x)
- `react` / `react-dom` (19.x)
- `tailwindcss`
- `prisma` / `@prisma/client`
- `@clerk/nextjs` (auth)
- `inngest` (background jobs)
- `@trpc/server` / `@trpc/client` (API)

## Local development

Prerequisites:

- Node.js (18+ recommended)
- A database for Prisma (Postgres recommended) or use `sqlite` for quick tests

Install dependencies and generate Prisma client:

```powershell
npm install
npm run postinstall    # runs `prisma generate` (postinstall hook)
```

Run development server:

```powershell
npm run dev
```

Build for production:

```powershell
npm run build
npm run start
```

Notes:

- The project script `dev` uses `next dev --turbopack` (see `package.json`). If you encounter issues with Turbopack, you can run `next dev` directly.
- If you add or change Prisma models, run `npx prisma migrate dev` to create a migration and update the client.

## Environment variables

This project integrates with external services — set these environment variables for local development and production:

- `DATABASE_URL` — connection string for your database (Postgres/SQLite)
- Clerk (if used): `CLERK_FRONTEND_API`, `CLERK_SECRET_KEY`, and other Clerk-specific envs
- `NEXT_PUBLIC_INNGEST_CLIENT_KEY` / `INNGEST_API_KEY` — if Inngest is used with external services
- Any other provider keys (OpenAI keys, third-party APIs) used by the AI assistant

Store env vars in a `.env.local` file (do not commit it).

## Prisma

- Schema is in `prisma/schema.prisma` and migrations are kept in `prisma/migrations/`.
- The project runs `prisma generate` on `postinstall`, so after `npm install` the generated client should be available under `node_modules/.prisma` and `src/generated/prisma` (see `src/generated/prisma` for shipped client files).

## Deployment

Vercel is recommended for Next.js apps and provides seamless deployment for the App Router. To deploy:

1. Create a Vercel project and connect the GitHub repository.
2. Add the required environment variables in the Vercel dashboard (DATABASE_URL, Clerk keys, Inngest keys, etc.).
3. Set the build command to `npm run build` (Vercel detects Next automatically).

Example (recommended live URL placeholder): `https://codely-v1.vercel.app/` — replace with the actual Vercel URL after you deploy.

## Scripts

- `npm run dev` — start dev server (`next dev --turbopack`)
- `npm run build` — build for production
- `npm run start` — run built server
- `npm run lint` — lints the project

## Migrations and DB reset (development)

Use Prisma CLI to manage migrations locally:

```powershell
npx prisma migrate dev --name init
npx prisma studio   # view data in browser
```

If you need to reset the dev DB (destructive):

```powershell
npx prisma migrate reset
```

## Screenshots / Project image

For your portfolio card, add an image at `public/images/projects/vibe.webp`. A recommended size is 1200×630 (16:9) for sharing previews. If you don't have a screenshot yet, create a hero screenshot of the home page and export as `.webp`.

## Contributing

Contributions are welcome — open issues or PRs for bug fixes, improvements, or feature additions. Run the dev server and follow the repository conventions.

## License

This repository does not currently include a license file. Add an appropriate `LICENSE` if you plan to open-source or share the project.
