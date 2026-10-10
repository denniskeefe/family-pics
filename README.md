# Family Photos

A private photo-sharing site for the family. Everyone enters their name (no password for now), then can browse, upload, download, and delete (their own) photos.

- Next.js (App Router), Tailwind
- Photos stored in a **private** Vercel Blob store; every image is served through an authenticated route, so nothing is reachable by URL without signing in
- Session: signed, HTTP-only cookie (30 days)

## Deploy to Vercel

```bash
npm i -g vercel
vercel link
vercel blob create-store family-photos --access private   # then connect it to the project
vercel env add AUTH_SECRET         # e.g. output of: openssl rand -base64 32
vercel --prod
```

## Local development

```bash
vercel env pull .env.local
npm run dev
```
