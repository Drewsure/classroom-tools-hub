# 🚀 Classroom Tools Hub — Complete PowerShell Command Reference

> **Copy-paste these commands directly into PowerShell.** No instructions, just commands.
> Every block is self-contained — copy the whole block, paste into PowerShell, press Enter.

---

## 1. DOWNLOAD & EXTRACT THE PROJECT

### Step 1.1 — Download the workspace tar from the chat

Click the **Download** button in the "All files in task" panel. A `.tar` file lands in your Downloads folder.

### Step 1.2 — Extract the tar and grab the ZIP

```powershell
cd $env:USERPROFILE\Downloads
mkdir classroom-tools-extract -Force
cd classroom-tools-extract
tar -xvf (Get-ChildItem ..\workspace-*.tar | Sort-Object LastWriteTime -Descending | Select-Object -First 1).Name
Copy-Item home\z\my-project\download\classroom-tools-hub-2026-08-17-v2.zip C:\Users\User\classroom-tools-hub.zip -Force
cd C:\Users\User
Expand-Archive classroom-tools-hub.zip -DestinationPath classroom-tools-hub -Force
cd classroom-tools-hub
dir
```

**Expected output:** You should see `package.json`, `README.md`, `src`, `public`, `scripts`, etc.

---

## 2. INSTALL & RUN LOCALLY

### Step 2.1 — Install dependencies

```powershell
cd C:\Users\User\classroom-tools-hub
npm install
```

**Expected:** 800+ packages installed, takes 2-4 minutes.

### Step 2.2 — Start the dev server

```powershell
cd C:\Users\User\classroom-tools-hub
npm run dev
```

**Expected:** `▲ Next.js 16.x` → `✓ Ready in ~1s` → open `http://localhost:3000`

### Step 2.3 — Stop the dev server

Press `Ctrl+C` in PowerShell.

---

## 3. ALREADY HAVE THE REPO? GET THE LATEST CHANGES

### Step 3.1 — Pull the latest from GitHub

```powershell
cd C:\Users\User\classroom-tools-hub
git pull origin main
npm install
npm run dev
```

---

## 4. PUSH TO GITHUB (first time)

### Step 4.1 — Create an empty repo on GitHub first

Go to https://github.com/new → name it `classroom-tools-hub` → **DO NOT** add README/.gitignore/license → Create.

### Step 4.2 — Initialize and push

```powershell
cd C:\Users\User\classroom-tools-hub
git init
git add .
git commit -m "Initial commit: Classroom Tools Hub PWA"
git branch -M main
git remote add origin https://github.com/Drewsure/classroom-tools-hub.git
git push -u origin main
```

---

## 5. PUSH UPDATES TO GITHUB (after making changes)

```powershell
cd C:\Users\User\classroom-tools-hub
git add .
git commit -m "Update: describe what changed here"
git push origin main
```

---

## 6. FIX: "remote origin already exists"

If you see `error: remote origin already exists`, run:

```powershell
cd C:\Users\User\classroom-tools-hub
git remote set-url origin https://github.com/Drewsure/classroom-tools-hub.git
git push -u origin main
```

---

## 7. FIX: GitHub rejected push due to large files (>100 MB)

```powershell
cd C:\Users\User\classroom-tools-hub
Remove-Item -Recurse -Force .git
Remove-Item -Force "classroom-tools-hub" -ErrorAction SilentlyContinue
Remove-Item -Force "workspace-*.tar" -ErrorAction SilentlyContinue
Remove-Item -Force "classroom-tools-hub.zip" -ErrorAction SilentlyContinue
git init
git add .
git commit -m "Initial commit: Classroom Tools Hub PWA"
git branch -M main
git remote add origin https://github.com/Drewsure/classroom-tools-hub.git
git push -u origin main
```

---

## 8. DELETE & RECREATE THE GITHUB REPO (clean slate)

If the GitHub repo is in a bad state:

```powershell
# In your browser:
# 1. Go to https://github.com/Drewsure/classroom-tools-hub
# 2. Settings → Danger Zone → Delete this repository
# 3. Go to https://github.com/new
# 4. Name: classroom-tools-hub (NO README, NO .gitignore, NO license)
# 5. Create repository

# Then back in PowerShell:
cd C:\Users\User\classroom-tools-hub
Remove-Item -Recurse -Force .git
git init
git add .
git commit -m "Initial commit: Classroom Tools Hub PWA"
git branch -M main
git remote add origin https://github.com/Drewsure/classroom-tools-hub.git
git push -u origin main
```

---

## 9. FIX: Next.js version vulnerability (Vercel build fails)

### Step 9.1 — Install the latest patched Next.js 15.x

```powershell
cd C:\Users\User\classroom-tools-hub
npm install next@15 eslint-config-next@15
npm list next
```

**Expected:** `next@15.5.x` (where x is the latest patch)

### Step 9.2 — If still vulnerable, install a specific patched version

```powershell
cd C:\Users\User\classroom-tools-hub
npm install next@15.5.8 eslint-config-next@15.5.8
git add .
git commit -m "Fix: upgrade Next.js to patched version"
git push origin main
```

### Step 9.3 — Test the build locally before pushing

```powershell
cd C:\Users\User\classroom-tools-hub
npm run build
```

**Expected:** `✓ Compiled successfully` with no errors.

---

## 10. DEPLOY TO VERCEL

### Step 10.1 — Via Vercel website (easiest)

1. Go to https://vercel.com/new
2. Sign in with GitHub
3. Click **Import** on `classroom-tools-hub`
4. Click **Deploy** (auto-detects Next.js)
5. Wait 2-3 minutes
6. Your PWA is live at `https://classroom-tools-hub.vercel.app`

### Step 10.2 — Via Vercel CLI

```powershell
cd C:\Users\User\classroom-tools-hub
npm install -g vercel
vercel
# Follow the prompts: confirm project, confirm scope, deploy
vercel --prod
```

---

## 11. INSTALL ON ANDROID TABLET

### Step 11.1 — After deploying to Vercel

1. Copy your Vercel URL (e.g. `https://classroom-tools-hub.vercel.app`)
2. On the Android tablet, open **Chrome**
3. Paste the URL and go
4. Three-dot menu → **Install app** (or **Add to Home screen**)
5. Tap the graduation-cap icon on the home screen to launch
6. App opens fullscreen, no browser chrome, works offline

---

## 12. TEST THE NEW FEATURES

### Step 12.1 — Test 100-sided dice with Quick Select

```powershell
cd C:\Users\User\classroom-tools-hub
npm run dev
# Open http://localhost:3000 in browser
# Click "Custom Dice"
# Click "d100" in the Quick Select row
# Click "Roll d100"
# Verify a number 1-100 appears
```

### Step 12.2 — Test dramatic timer audio

```powershell
cd C:\Users\User\classroom-tools-hub
npm run dev
# Open http://localhost:3000 in browser
# Click "Classic Countdown"
# Set to 25 seconds (0:25)
# Click Start
# Listen for:
#   - Ticks during 25-21 sec
#   - Dramatic build-up at 20 sec
#   - Spoken "ten", "nine"... "one" from 10-1 sec
#   - Triumphant fanfare at 0 sec
```

---

## 13. CLEAN UP & START OVER (nuclear option)

```powershell
cd C:\Users\User
Remove-Item -Recurse -Force classroom-tools-hub -ErrorAction SilentlyContinue
Remove-Item -Force classroom-tools-hub.zip -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force Downloads\classroom-tools-extract -ErrorAction SilentlyContinue
```

Then start from Step 1.

---

## 14. VERIFY THE BUILD WORKS

```powershell
cd C:\Users\User\classroom-tools-hub
npm run build
```

**Expected output:**
```
✓ Compiled successfully in ~10s
✓ Generating static pages (4/4)
Route (app)
┌ ○ /
├ ○ /_not-found
└ ƒ /api
```

---

## 15. CHECK WHAT'S IN THE PROJECT FOLDER

```powershell
cd C:\Users\User\classroom-tools-hub
dir
```

**Expected:** `package.json`, `README.md`, `LICENSE`, `CLAUDE.md`, `src`, `public`, `scripts`, `next.config.ts`, `tsconfig.json`, etc.

---

## 16. CHECK INSTALLED NEXT.JS VERSION

```powershell
cd C:\Users\User\classroom-tools-hub
npm list next
```

---

## 17. CHECK GIT STATUS

```powershell
cd C:\Users\User\classroom-tools-hub
git status
git log --oneline -5
```

---

## QUICK COMMAND SUMMARY

| Task | Command |
|------|---------|
| Run dev server | `npm run dev` |
| Build for production | `npm run build` |
| Start production server | `npm start` |
| Install deps | `npm install` |
| Git pull latest | `git pull origin main` |
| Git push changes | `git add . && git commit -m "msg" && git push` |
| Check Next.js version | `npm list next` |
| Check git status | `git status` |
| Open project folder | `cd C:\Users\User\classroom-tools-hub` |

---

**Copy-paste any block above directly into PowerShell. No instructions, just commands.**
