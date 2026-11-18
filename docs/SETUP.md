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
4. Left sidebar → **Integrations** → **Data API** → **Settings** tab → **Exposed schemas**: tick `wgl`
   (keep `public` ticked — Coconut-Water needs it), then **Save**.
   If `wgl` isn't in the list, step 3 hasn't run yet; run it and reload the page.

## 3. Install on iPhone
1. Open the app link in **Safari** (not Chrome — iPhone only installs from Safari).
2. Tap **Share** → **Add to Home Screen** → **Add**.
3. Open it from the new icon. The scroll should say **● CONNECTED TO SUPABASE**.

If it says NOT CONNECTED, the message underneath tells you which step was missed. Fix it and tap **CHECK AGAIN**.

---

# Milestone 2: accounts

## 4. Run the accounts script
Supabase → **SQL Editor** → **New query** → paste all of `supabase/002-accounts.sql` → **Run**.
It adds a `wgl.profiles` table (your display name + initials). Coconut-Water is not touched.

## 5. Let Supabase emails link back to this app
Confirmation and password-reset emails must be allowed to open We Got Lists.
1. Supabase → **Authentication** → **URL Configuration**.
2. Under **Redirect URLs**, click **Add URL** and add:
   `https://isaaczenz.github.io/We-Got-Lists/**`
3. **Do not change the "Site URL"** — it belongs to Rate My Coconut Water.

## Good to know
- Your Rate My Coconut Water email + password already works here (shared sign-in).
- On iPhone, the Home Screen app keeps its own sign-in, separate from Safari. Sign in inside the installed app.
- Email links open in Safari. After confirming your email, go back to the app and sign in.
