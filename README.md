# Victory Training Portal

Ready-to-deploy project. Already connected to your Supabase database.

## Deploy to Vercel — step by step

### 1. Get this onto GitHub
- Go to github.com, click "New repository," name it (e.g. `victory-training-portal`), keep it private if you'd like.
- Download this whole folder, unzip it, then either:
  - Use GitHub Desktop (drag the folder in, commit, push), or
  - Use the command line:
    ```
    cd victory-portal-app
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git remote add origin <your-new-repo-url>
    git push -u origin main
    ```

### 2. Connect it to Vercel
- Go to vercel.com and sign in (GitHub sign-in is easiest)
- Click "Add New" → "Project"
- Select the GitHub repo you just pushed
- Vercel will auto-detect it's a Vite project — leave the defaults
- Click "Deploy"

That's it. In about a minute you'll have a live URL like `victory-training-portal.vercel.app`.

## Testing locally first (optional but recommended)
If you have Node.js installed on your computer:
```
cd victory-portal-app
npm install
npm run dev
```
This opens the app on your own machine at `localhost:5173` so you can test everything before it's public.

## Notes
- Supabase URL and key are already in `src/App.jsx` — no extra setup needed there.
- Admin PIN: victory2026 (name: Linda Cao) — stored in your Supabase `admins` table, not in this code.
- Trainer/CFT PIN: cft2026 — this one IS in the code (`src/App.jsx`, near the top).
