<div align="center">

<img src="public/icon.png" alt="ERU Desktop Logo" width="140" />

# E R U &nbsp; D E S K T O P &nbsp; · &nbsp; エ ル ミ

**Cinema-Grade Desktop Streaming Platform for Movies & TV Shows**

[![Electron](https://img.shields.io/badge/Electron-45.3.3-47848F?logo=electron&logoColor=white)](https://electronjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Windows](https://img.shields.io/badge/Platform-Windows%20Desktop-0078D6?logo=windows&logoColor=white)](https://microsoft.com/windows)
[![License](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)

---

*Inspired by [Erumi Android App](https://github.com/jhudel26/Erumi-Android-App) · Reimagined for Desktop Cinema Experience*

</div>

---

## 🌟 Overview

**ERU** is a cinema-grade standalone desktop application engineered specifically for streaming **Movies** and **TV Shows** with a modern, high-contrast **Teal** accent aesthetic (`#00e5bc`), glassmorphic panels, and smooth animations.

Unlike anime-specific applications, **ERU** focuses on western and international cinema, blockbuster movies, trending series, and episodic TV shows powered by dual multi-server streaming backends:
1. **RidoMovie** (`https://ridomovie.to/rd1`) — Ultra-fast Closeload HD streams & instant JSON search.
2. **MoviesFree** (`https://moviesfree.cv/home`) — Cinezo, SuperEmbed 4K, VidSrc & VidPlay fallback servers.

---

## ✨ Features

- **Teal Cinema UI/UX**:
  - Deep noir background (`#081114`) with glowing teal neon accents (`#00e5bc`, `#14f4c9`).
  - Glassmorphic translucent cards, ambient backdrop lighting, and smooth hover micro-interactions.
  - Custom frameless title bar with integrated search, source switcher pill, and native window controls.

- **Dual Source Engine**:
  - One-click source switching between **RidoMovie** and **MoviesFree** without reloading the app.
  - Redundant fallback resolvers: If one server buffers, switch between **Closeload HD**, **Cinezo Server**, **SuperEmbed 4K**, **VidSrc Alpha**, and **VidPlay Pro**.

- **Cinema Player Experience**:
  - Full-screen / Theater mode player with dedicated controls.
  - Multi-server switcher directly inside the player bar.
  - Integrated Season & Episode Drawer for TV Series (switch episodes without leaving the video player).
  - Next / Previous episode shortcuts.

- **Watchlist & History**:
  - Local persistent **Watchlist** (Bookmark movies and shows with 1 click).
  - Continuous **Watch History** tracking recently played media and episode numbers.

- **Ad-Block & Security Layer**:
  - Electron-level webRequest interception blocking invasive ad networks, popunders, and redirect scripts.
  - Automatic `X-Frame-Options` and `Content-Security-Policy` header rewriting for seamless embed playback.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v24.12)
- npm 9+

### Installation
```bash
git clone https://github.com/jhudel26/ERU.git
cd ERU
npm install
```

### Run in Development (with Hot Reloading)
```bash
npm run dev
```

### Build Production Bundle
```bash
npm run build
```

### Launch Built Desktop Application
```bash
npm start
```

### Package Windows Installer (`.exe`)
```bash
npm run package
```
The standalone installer executable will be generated inside the `release/` directory.

---

## 🗂️ Project Architecture

```
ERU/
├── electron/
│   ├── main.js             # Electron main process, window management, ad-block, IPC
│   ├── preload.js          # ContextBridge secure APIs
│   └── scrapers.js         # Dedicated scrapers for RidoMovie & MoviesFree
├── public/
│   └── icon.png            # Application logo & window icon
├── src/
│   ├── assets/             # Brand graphics & icons
│   ├── components/
│   │   ├── TitleBar.jsx          # Custom frameless titlebar with search & controls
│   │   ├── Sidebar.jsx           # Modern navigation drawer
│   │   ├── HeroBanner.jsx        # Cinema hero banner with auto-carousel
│   │   ├── MediaCard.jsx         # Glassmorphic poster card with rating & badges
│   │   ├── MediaGrid.jsx         # Category filter pills & responsive media grid
│   │   ├── MediaDetailModal.jsx  # Rich details sheet with seasons & server list
│   │   ├── PlayerView.jsx        # Cinema player mode with multi-server switcher
│   │   └── SettingsModal.jsx     # User preferences & history manager
│   ├── services/
│   │   ├── api.js                # Frontend API abstraction
│   │   └── storage.js            # LocalStorage persistence manager
│   ├── App.jsx             # Main application orchestrator
│   ├── index.css           # Custom Teal theme & glassmorphic styles
│   └── main.jsx            # React root entry
├── index.html              # HTML shell
├── tailwind.config.js      # Custom Teal color palette configuration
├── vite.config.mjs         # Vite bundler configuration
└── package.json            # Scripts & dependencies
```

---

## ⚖️ Disclaimer

This project is created for **educational purposes only**. ERU does not host, store, or distribute any media files or copyright-protected content. All streams and metadata are indexed and fetched dynamically from public external providers.
