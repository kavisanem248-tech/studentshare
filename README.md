# StudentShare

StudentShare is a student-to-student study-material library for discovering, sharing, and previewing PDF notes. Its product promise is simple: **Find. Share. Learn.**

## What is included

The app includes a responsive public landing page, Manus OAuth sign-in, student dashboard, subjects directory, friend-circle groups with unique IDs and bcrypt-protected passwords, member-only PDF visibility, PostgreSQL/MySQL-compatible Drizzle schema provided by WebDev, PDF metadata upload flow backed by persistent Manus storage, search and filters, in-browser PDF preview, download/view tracking, sharing, reports, ownership-protected edit/delete flows, profile editing, and an admin moderation dashboard.

The WebDev `web-db-user` scaffold uses the platform's managed MySQL/TiDB-compatible database connection rather than PostgreSQL because that is the stable database service exposed by this deployment environment. Uploaded files are stored through the managed S3-compatible storage helper in `server/storage.ts`; the local filesystem is not used for PDF persistence.

## Run locally in the WebDev project

```bash
pnpm install
pnpm db:push
pnpm tsx server/seed.ts
pnpm dev
```

The WebDev environment supplies `DATABASE_URL`, `JWT_SECRET`, Manus OAuth variables, and built-in storage credentials at runtime. The optional PDF upload cap is controlled by `MAX_FILE_SIZE_BYTES` and defaults to 20 MB when absent.

## Authentication and admin access

Authentication is handled by the preconfigured Manus OAuth flow. Use **Log in** or **Continue with StudentShare** in the app. The project owner is promoted to admin automatically by the existing auth upsert logic. To promote another user, update that user's `role` to `admin` through the managed database interface; no credentials are hardcoded in source.

## PDF upload and storage

PDF files are validated by MIME type, extension, and configurable size before being uploaded through `storagePut()`. A unique storage key is generated from the authenticated user id, timestamp, and a sanitized filename. The database stores only file metadata plus the managed storage key and URL. The viewer embeds the managed URL directly in the browser, and download events are recorded before a download is opened.

## Data model

The schema in `drizzle/schema.ts` contains `users`, `groups`, `group_members`, `subjects`, `pdf_files`, `downloads`, `views`, and `reports`. Indexed fields cover subject, group, uploader, title, creation date, download count, and report status. The group-access migration is in `drizzle/0005_sweet_cloak.sql`.

## Useful routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/login` and `/signup` | Auth entry points |
| `/dashboard` | Personal student dashboard |
| `/subjects` | Subject directory and subject creation |
| `/browse` | Searchable, filterable PDF library, including circles the signed-in user belongs to |
| `/groups` | Create or join password-protected friend circles |
| `/upload` | PDF upload form |
| `/uploads` | Current user's uploads |
| `/studentshare/pdf/:id` | PDF preview, download, share, and report |
| `/edit/:id` | Owner-only metadata editing |
| `/profile` | Profile and contribution stats |
| `/admin` | Admin-only moderation dashboard |

## Verification

Run the static checks and test suite with:

```bash
pnpm check
pnpm test
pnpm build
```

The app is designed mobile-first with touch-friendly controls, a compact hamburger navigation, responsive card grids, visible focus states, friendly empty/error states, and reduced-motion support. Group PDFs are hidden from signed-out users and non-members at both the tRPC layer and direct file/download endpoints; only a bcrypt hash is stored for each group password.
