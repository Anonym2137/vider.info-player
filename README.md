# 🎬 Vider Player

> A sleek, self-hosted Nuxt 4 web player for [vider.info](https://vider.info) videos. Paste a vider.info link and watch your movie — no ads, no popups, no hassle.

| Home | Player |
|---|---|
| ![Home page](public/home.png) | ![Video player](public/player.png) |


---

## ✨ Features

- 🔗 **Paste & Play** — drop any `vider.info` link into the input; the app resolves the stream URL automatically
- 📺 **Custom Video.js player** — full custom-themed controls, playback speed, ±15s skip buttons, PiP, and fullscreen support
- 🧩 **Seamless Captcha bypass** — detects human-verification challenges and embeds them securely in-player, auto-refreshing once solved without breaking the proxy session
- 📋 **Watchlist** — save and manage videos for later
- 🌙 **Dark, glassmorphism UI** — built with Inter & Space Grotesk, smooth animations
- 🔒 **Privacy-first proxy** — all stream requests are routed through the server with your cookies; the browser never talks to vider.info directly

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Nuxt 4](https://nuxt.com) (Vue 3) |
| Language | TypeScript |
| Styling | Vanilla CSS (custom design system) |
| Fonts | Inter, Space Grotesk (Google Fonts) |
| Server | Nitro (built into Nuxt) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** (or pnpm / yarn / bun)

### 1. Clone the repository

```bash
git clone https://github.com/Anonym2137/vider.info-player.git
cd vider.info-player
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.



## 🎞️ How to Play a Video

1. Go to the **Home** page
2. Paste a `vider.info` video URL into the input field  
   (e.g. `https://vider.info/video/12345/movie-title`)
3. Click **Play** (or press Enter)
4. The app resolves the direct stream URL and loads the player
   - *Note: If a Captcha is detected, a challenge box will automatically load in place of the video. Just solve it and click "Wchodzę" to start playing.*

---

## 📦 Building for Production

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

See the [Nuxt deployment docs](https://nuxt.com/docs/getting-started/deployment) for hosting on Node.js, Docker, static hosts, etc.

---

## 🗂️ Project Structure

```
vider-player/
├── app/
│   ├── components/
│   │   ├── AppNavbar.vue      # Top navigation bar
│   │   ├── UrlInput.vue       # URL paste & resolve input
│   │   ├── VideoCard.vue      # Watchlist video card
│   │   └── VideoPlayer.vue    # Video.js player with proxy & captcha wrapper
│   ├── pages/
│   │   ├── index.vue          # Home / player page
│   │   └── watchlist.vue      # Saved videos
│   └── assets/css/main.css    # Global styles & design tokens
├── server/
│   ├── api/
│   │   ├── captcha.post.ts    # Securely proxies Captcha form submissions to vider.info
│   │   ├── cookies.delete.ts  # Clears backend session cookies manually
│   │   ├── resolve.post.ts    # Extracts stream URL from a vider.info page
│   │   └── stream.get.ts      # Proxies video bytes (handles Range requests)
│   └── utils/
│       └── cookieStore.ts     # In-memory session synchronization store
├── nuxt.config.ts
└── package.json
```

---

## ⚙️ Server API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/resolve` | `POST` | Accepts `{ url }`, returns `{ streamUrl, embedUrl, html, title }` |
| `/api/stream` | `GET` | Proxies video bytes; pass `?url=<encoded-stream-url>` |
| `/api/captcha` | `POST` | Intercepts iframe Captcha solutions to synchronize global cookies |
| `/api/cookies` | `DELETE` | Triggers a hard reset of the local authenticated session variables |