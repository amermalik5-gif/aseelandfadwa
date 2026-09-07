# Aseel & Fadwa — Wedding RSVP • أصيل وفدوى

Bilingual (Arabic RTL / English) wedding invitation and RSVP site with a private planner dashboard.

- **Guest site**: `/{ar|en}/rsvp/<code>` — personal invitation link per family: hero, event details, add-to-calendar, countdown, and an RSVP form capped to that family's seats. Guests can edit their reply until the deadline.
- **Dashboard**: `/ar/dashboard` or `/en/dashboard` — password-protected. Live stats (confirmed / declined / pending / seats / guests attending), search & filters, add guests one-by-one, Excel upload of the whole guest list, Excel export, copy link & WhatsApp share per family.

## Event configuration

Everything about the event lives in [src/config/event.ts](src/config/event.ts) (names, date, venue, maps link, RSVP deadline) and the copy in [src/messages/ar.json](src/messages/ar.json) / [src/messages/en.json](src/messages/en.json).

Optional background music: drop an `music.mp3` file into `public/audio/` — the music button appears automatically.

WhatsApp link-preview thumbnail: replace `public/og.jpg` with any 1200×630 image (keep it under ~500 KB). Note that WhatsApp caches previews, so an already-shared link may keep showing the old image for a while.

The ready-made WhatsApp invitation text is editable in the dashboard ("WhatsApp invitation message" card); `{name}` inserts the family name and the personal link is appended automatically (or placed at `{link}`).

## Local development

```bash
npm install
npx prisma migrate deploy   # apply schema to the DATABASE_URL in .env
npm run seed                # optional demo invitations
npm run dev
```

Environment variables (see `.env.example`):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `DASHBOARD_PASSWORD` | Password for the planner dashboard |
| `SESSION_SECRET` | Random string that signs the dashboard session cookie |
| `NEXT_PUBLIC_SITE_URL` | Public URL used to build invitation links |

## Excel guest list

Upload columns (first row may be a header, Arabic or English):

| Name / الاسم | Invites / عدد الدعوات | Phone / الهاتف (optional) |
|---|---|---|
| عائلة محمد أحمد | 4 | 0791234567 |

Download the exact template from the dashboard ("Download template"). Rows whose name already exists are skipped, so re-uploading is safe. Each imported row gets a unique personal link.

## Deployment (Railway)

The project deploys as a single Railway service plus the Postgres database. [railway.json](railway.json) sets the start command (`prisma migrate deploy` + `next start`).

Required service variables:

- `DATABASE_URL` → `${{Postgres.DATABASE_URL}}` (reference)
- `DASHBOARD_PASSWORD`, `SESSION_SECRET`
- `NEXT_PUBLIC_SITE_URL` → the public Railway domain

Deploy with `railway up`, or connect the GitHub repo in the Railway dashboard for auto-deploys on push.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS 4 · next-intl (ar default, RTL) · Prisma + PostgreSQL · SheetJS
