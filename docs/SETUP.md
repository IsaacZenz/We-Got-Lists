# One-time setup (Milestone 1)

## 1. Turn on GitHub Pages
1. Open https://github.com/IsaacZenz/We-Got-Lists/settings/pages
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Open the **Actions** tab, click **Deploy to GitHub Pages** → **Run workflow** (or push any change).
4. When it's green, the app is at **https://isaaczenz.github.io/We-Got-Lists/**

## 2. Set up the database (Supabase, Coconut-Water project)
1. Open https://supabase.com/dashboard/project/vhipoagjztecsobfrjsz
2. Left sidebar → **SQL Editor** → **New query**.
3. Paste all of `supabase/001-setup.sql` and press **Run**. You should see "Success. No rows returned".
   (It only creates a new `wgl` schema — it does not touch Coconut-Water's tables.)
4. Project Settings (gear, bottom-left) → **Data API** → **Exposed schemas**: add `wgl` next to `public`, then **Save**.
   Leave `public` there — Coconut-Water needs it.

## 3. Install on iPhone
1. Open the app link in **Safari** (not Chrome — iPhone only installs from Safari).
2. Tap **Share** → **Add to Home Screen** → **Add**.
3. Open it from the new icon. The scroll should say **● CONNECTED TO SUPABASE**.

If it says NOT CONNECTED, the message underneath tells you which step was missed. Fix it and tap **CHECK AGAIN**.
