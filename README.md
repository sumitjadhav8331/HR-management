# HR-managemnt

Full-stack HR Management Web Application built with Next.js App Router, Supabase, Tailwind CSS, and ShadCN-style UI primitives.

## Features

- Supabase Auth with email/password login and HR account creation
- Protected HR workspace with responsive sidebar navigation
- Dashboard with overview cards, daily summary, and trend charts
- Employee management with search, filter, edit, and delete
- Attendance tracking with login/logout times and computed hours
- Recruitment tracking with call outcomes and conversion metrics
- Task management with priorities, deadlines, and completion toggles
- Leave management with employee-linked leave history
- Notes and self-task capture for daily HR work
- Server-side PDF daily report generation with upload to Supabase Storage
- RLS-first database design with per-user data isolation

## Stack

- Next.js 16.2.2
- React 19
- TypeScript
- Tailwind CSS v4
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- Zustand
- pdf-lib
- Recharts
- Sonner

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create your local env file:

```bash
cp .env.example .env.local
```

3. Add your Supabase project values to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
APP_SESSION_SECRET=replace-with-a-long-random-secret
DATABASE_URL=postgresql://postgres:[password]@db.your-project-ref.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[password]@db.your-project-ref.supabase.co:5432/postgres
```

If your provider shows a `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` instead of `NEXT_PUBLIC_SUPABASE_ANON_KEY`, this app accepts that name too.

If these values are missing, HR login will stay disabled and employee login can fail until you add them and restart `npm run dev`.

4. Apply the schema in Supabase:

Use the SQL in [20260408113000_initial_schema.sql](./supabase/migrations/20260408113000_initial_schema.sql) inside the Supabase SQL Editor, or run it through the Supabase CLI if your project is initialized locally.

This migration creates:

- `users`
- `employees`
- `attendance`
- `candidates`
- `tasks`
- `leaves`
- `notes`
- `reports`
- `daily-reports` private storage bucket
- RLS policies for all tables and report files

5. Start the app:

```bash
npm run dev
```

6. Open:

```txt
http://localhost:3000
```

## Auth Notes

- The login page supports both sign-in and account creation.
- New accounts are created with the `hr` role.
- If email confirmation is enabled in Supabase Auth, users must verify before they can sign in.

## Report Generation

The daily PDF report pulls from the selected day and includes:

- total calls
- candidate response breakdown
- present employees
- completed tasks
- pending tasks
- HR notes
- self tasks
- additional boss notes entered during generation

Generated PDFs are uploaded to the private `daily-reports` bucket and listed in the Reports module with signed download links.

## Deployment on Vercel

1. Push the repo to GitHub.
2. Import the project into Vercel.
3. Add these environment variables in Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
APP_SESSION_SECRET
DATABASE_URL
```

If your deployment uses Vercel Postgres, this app also accepts `POSTGRES_URL` or `POSTGRES_URL_NON_POOLING` automatically. If your Supabase dashboard exposes `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, you can use that instead of `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

4. Redeploy after the variables are added.

## Validation

The project was validated with:

```bash
npm run lint
npm run build
```
