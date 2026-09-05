# 🎓 Classroom Tools Hub

**A premium, offline-capable PWA for teachers.** 24 classroom tools — timers, pickers, games, counters, math, letters, sounds, and a custom dashboard — wrapped in a Dark Premium Tinted-Glass UI. Built for tablets, Chromebooks, and projectors.

> **Install it on your Android tablet:** open the deployed URL in Chrome → menu → **"Install app"** → it appears on the home screen as a native-style app, works offline, and fullscreens on launch.

---

## ✨ Features

### ⏰ 10 Classroom Timers
Classic Countdown · Stopwatch · Rocket Launch · Bomb Fuse · Burning Candle · Hourglass · Radial Progress · Snail Race · Traffic Light · Progress Bar

Each timer has themed animations, dramatic audio (Web Audio synthesis + real Mixkit sound effects), confetti bursts, screen flash, and screen shake on completion.

### 🎯 Name Pickers (shared roster)
- **Enter Names** — class roster manager (save/load multiple class lists to localStorage)
- **Random Name Picker** — slot-machine spin animation with **remove-on-pick** (default ON) so the next spin gives a different student
- **Random Group Generator** — splits names into 2-6 teams with shuffle drama
- **Order Shuffler** — random presentation order, no repeats

All pickers share a single roster via localStorage + custom event sync. Add a name in one tool, it's instantly available in all others.

### 🎲 Chance Games
Coin Flip · Dice Roll (1-6, 1-3, 4-6 ranges) · Colour Wheel · Magic 8-Ball

Each game has a build-up tension phase, dramatic reveal, and per-color text contrast (no more yellow text on green).

### 🔢 Counters
- **Tally Counter** — multi-counter scorekeeper with custom labels
- **Stopwatch + Splits** — lap timing with history

### 🧮 Math & 🔤 Letters
- **Math Fact Generator** — +, −, ×, ÷ practice with instant feedback
- **Letter Card Generator** — A-Z flash cards with no-repeat mode

### 🎨 Skins (15 themes, per-tool persistence)
Classic · Spring · Summer · Autumn · Winter · Halloween · Christmas · Easter · Valentine's · Birthday · St. Patrick's · Diwali · Hanukkah · Lunar New Year · Thanksgiving

Each skin applies a themed gradient background, particle effects (snow, leaves, hearts, bats, balloons…), and a scene decorator. **Each tool remembers its own skin independently** — your Name Picker can be Spring while your Spinner Wheel is Halloween.

### 🔊 Sound Pad
18 real audio files (cheer, applause, buzzer, drum roll, alarm, whistle, magic, …) + Web Audio synthesis fallback. Per-sound volume. STOP button that kills all active audio clones.

### 📊 Custom Dashboard
Drag-and-drop dashboard (`@dnd-kit/sortable`) where you can:
- Add any of the 24 tools as a widget
- Add any of the 18 sounds as a one-tap sound button
- Drag to rearrange (works on touch)
- Rename widgets inline
- **Click the maximize icon** on any widget to expand it into a full-screen tool launcher
- Save/load multiple dashboard layouts (e.g. "Math Class", "Reading Group")

### ⭐ Favorites
Star any tool card → it appears in the Favorites strip at the top of the home page.

---

## 🎨 Design System: Dark Premium Tinted-Glass

A 5-variable brand token system in `src/app/globals.css`:

```css
:root {
  --brand-primary: #7c3aed;    /* deep violet */
  --brand-accent:  #22d3ee;    /* cyan */
  --brand-bg:       #05030f;   /* near-black violet */
  --brand-card:     #1a1535;   /* dark violet card */
  --brand-text:     #f8fafc;   /* near-white */
}
```

- **No `backdrop-filter: blur()`** — uses `color-mix(in oklab, ...)` for translucent layers. Better performance on Chromebooks and iPads.
- **Radial gradient blooms** in `.glass-bg` for the hero background
- **Iridescent per-tool card borders** (`.tool-card-glow`) — each tool has its own accent color, gradient border, outer glow, and diagonal sheen sweep on hover
- **shadcn/ui tokens re-pointed** at the brand palette so every `<Button>`, `<Input>`, `<Dialog>`, `<Card>` uses the dark-violet + cyan theme with zero component edits

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** (tested on 20.x and 22.x)
- **npm** (or pnpm/yarn — adjust commands accordingly)

### Install & Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/classroom-tools-hub.git
cd classroom-tools-hub

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
# → http://localhost:3000
```

### Production Build

```bash
npm run build
npm start
```

### Build the PWA Icons (optional — icons are committed)

If you want to regenerate the icons (e.g. after changing the brand colors):

```bash
python3 scripts/generate-pwa-icons.py
# → writes to public/icons/*.png
```

Requires `Pillow` (`pip install Pillow`).

---

## 📱 Installing on Your Android Tablet

### Option A — Install as a PWA (recommended, no setup)

1. **Deploy the app** to any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages — see [Deployment](#-deployment) below).
2. **On your Android tablet**, open Chrome and navigate to the deployed URL.
3. Tap the **three-dot menu** → **"Install app"** (or **"Add to Home screen"**).
4. The app appears on your home screen with the graduation-cap icon.
5. Tap to launch — it opens **fullscreen, no browser chrome**, works **offline**.

### Option B — Run locally on your tablet (same Wi-Fi)

1. On your dev machine: `npm run dev -- -H 0.0.0.0`
2. Find your dev machine's local IP (e.g. `192.168.1.50`).
3. On the tablet, open Chrome to `http://192.168.1.50:3000`.
4. Install as above. (Note: PWA install from LAN works in Chrome on Android.)

### Option C — Wrap as a real APK (advanced)

For a Play Store listing, wrap the PWA with [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) (Google's Trusted Web Activity tool):

```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest=https://YOUR_DEPLOYED_URL/manifest.json
bubblewrap build
# → produces app-release-signed.apk
```

---

## 🌐 Deployment

### Vercel (recommended — 1 click)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new), import the repo.
3. Vercel auto-detects Next.js — just click **Deploy**.
4. Your PWA is live on `https://your-project.vercel.app` — install it on your tablet from there.

### Netlify

```bash
npm install -g netlify-cli
netlify deploy --build
```

Build command: `npm run build` · Publish directory: `.next` (Netlify auto-detects the Next.js plugin)

### Cloudflare Pages

Build command: `npm run build` · Output: `.next` (use the `@cloudflare/next-on-pages` adapter)

### GitHub Pages

GitHub Pages only serves static files, so you need the static export:

1. In `next.config.ts`, add `output: "export"`.
2. Run `npm run build` → produces an `out/` directory.
3. Push `out/` to the `gh-pages` branch (or use the `gh-pages` npm package).

> **Note:** the SW + manifest work on GitHub Pages, but the path prefix must match your repo name. Set `basePath` in `next.config.ts` if deploying to `https://USER.github.io/REPO/`.

---

## 🧱 Tech Stack

| Layer | Tech |
|------|------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **Drag-and-drop** | @dnd-kit/sortable |
| **Icons** | lucide-react |
| **Audio** | Web Audio API + Mixkit sound files (in `public/sounds/`) |
| **PWA** | `manifest.json` + custom service worker (`public/sw.js`) |
| **State** | React hooks + localStorage (no server, no database) |

---

## 📁 Project Structure

```
classroom-tools-hub/
├── public/
│   ├── icons/              # PWA icons (192, 512, maskable, 32)
│   ├── sounds/             # 18 MP3 sound effects
│   ├── manifest.json       # PWA manifest
│   └── sw.js               # Service worker (offline cache)
├── scripts/
│   └── generate-pwa-icons.py  # Icon generator (Pillow)
├── src/
│   ├── app/
│   │   ├── globals.css     # Dark Premium Tinted-Glass system
│   │   ├── layout.tsx      # PWA meta tags + SW registration
│   │   └── page.tsx        # Home page (bento grid of 24 tools)
│   ├── components/
│   │   ├── tools/          # All 24 tool components
│   │   ├── timers/         # 10 timer components
│   │   ├── ui/             # shadcn/ui primitives
│   │   └── service-worker-register.tsx
│   ├── hooks/
│   │   ├── use-student-roster.ts  # Shared class roster (localStorage + event sync)
│   │   ├── use-tool-skin.ts       # Per-tool skin persistence
│   │   ├── use-sound-pad.ts       # 18 sounds + per-widget volume
│   │   ├── use-effects.ts         # Confetti, flash, shake, dramatic audio
│   │   ├── use-favorites.ts       # Starred tools
│   │   ├── use-timer.ts           # Countdown + stopwatch hooks
│   │   └── use-toast.ts
│   └── lib/
│       ├── tools.ts        # 24 tool definitions (id, name, accent color, icon)
│       ├── skins.tsx       # 15 skins + SkinParticleField + SkinSceneDecorator
│       ├── timers.ts       # Time formatting helpers
│       └── utils.ts        # cn() class merger
├── .gitignore
├── README.md               # ← you are here
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## 🛠️ NPM Scripts

| Script | What it does |
|--------|--------------|
| `npm run dev` | Start dev server at `localhost:3000` |
| `npm run build` | Production build (outputs to `.next/`) |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint |
| `python3 scripts/generate-pwa-icons.py` | Regenerate PWA icons |

---

## 🔧 Configuration Notes

### Why no `next-pwa`?
We use a hand-rolled service worker (`public/sw.js`) instead of `next-pwa` because:
- `next-pwa` is unofficially unmaintained for Next.js 16 / Turbopack
- A custom SW gives precise control over caching strategies (sounds must be cache-first, app shell must be stale-while-revalidate)
- Zero extra dependencies — easier to audit and maintain

### Offline behavior
- **First visit:** All assets load from network. The SW pre-caches the app shell, 18 sounds, and icons on install.
- **Repeat visits:** App shell loads instantly from cache (stale-while-revalidate updates in the background).
- **Fully offline:** Open the installed PWA with no Wi-Fi — all tools work, all sounds play, no missing-asset errors.

### Browser support
- ✅ Chrome / Edge / Brave (Android, Windows, macOS, ChromeOS) — full PWA install support
- ✅ Safari (iOS 16.4+ / iPadOS) — PWA install support ("Add to Home Screen")
- ✅ Firefox — works as a normal web app (no install prompt, but everything else works)
- ⚠️ Internet Explorer — not supported (uses `color-mix()`, `oklch()`, and other modern CSS)

---

## 🤝 Contributing

This is a personal teaching tool, but issues and PRs are welcome.

### Development workflow

1. Fork & clone the repo.
2. `npm install`
3. `npm run dev`
4. Make your changes.
5. `npm run build` to verify the production build passes.
6. Open a PR describing what you changed and why.

### Code style

- TypeScript strict mode
- Functional React components, hooks for state
- Tailwind utility classes for styling (no CSS-in-JS)
- Every new tool should: register in `src/lib/tools.ts` (with an `accent` color), add a case in `ToolRenderer` in `src/components/tools/tool-launcher.tsx`, and embed in the Custom Dashboard's `WidgetContent` if appropriate

---

## 📄 License

MIT — see [LICENSE](LICENSE). The 18 sound effects in `public/sounds/` are from [Mixkit](https://mixkit.co/free-sound-effects/) (free for commercial use, no attribution required).

---

## 🙏 Acknowledgments

- **Sound effects:** [Mixkit](https://mixkit.co/free-sound-effects/)
- **UI primitives:** [shadcn/ui](https://ui.shadcn.com/)
- **Drag-and-drop:** [@dnd-kit](https://dndkit.com/)
- **Icons:** [lucide-react](https://lucide.dev/)
- **Framework:** [Next.js](https://nextjs.org/)

---

## 🐛 Troubleshooting

**"I installed the PWA but the icons/sounds are missing"**
- Make sure you're on the latest version: open Chrome → menu → the app should auto-update on next launch. To force an update, clear the app's storage in Android Settings → Apps → Classroom Tools Hub → Storage → Clear data, then re-install.

**"The service worker isn't registering"**
- SW only registers in production (`npm run build && npm start`), not in `npm run dev`. This is intentional — caching hot-reloaded assets breaks the dev experience.

**"Audio doesn't play on first click"**
- Browsers block autoplay until the user has interacted with the page. The first tap anywhere on the app counts as interaction; subsequent sound plays will work.

**"The app is too big on my tablet"**
- The PWA respects your device's DPI. If cards look too small, use your browser's zoom (pinch-to-zoom also works on touch devices).

---

Made with 💜 for teachers everywhere.
