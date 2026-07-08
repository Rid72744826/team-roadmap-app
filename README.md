# 🗺️ Team Roadmap — with shared backend

Interactive roadmap page (blueprint theme) for planning a portfolio + AI mini-project library with a friend/team. Every section — hero text, checklist, foundation steps, project modules, timeline, tips — can be added/edited/deleted directly in the browser.

**This version has a real backend**, so when one person adds or edits something, it's saved to the server and shows up on everyone else's screen automatically (polling every 5 seconds) — no more "changes disappear on refresh."

---

## 📁 Project structure

```
team-roadmap-app/
├── server.js           ← Express backend (API + serves the frontend)
├── package.json
├── default-data.json   ← seed content, used for "Reset all"
├── data.json            ← the live shared data (this file gets overwritten as people edit)
└── public/
    └── index.html       ← the whole frontend (HTML+CSS+JS, no build step)
```

---

## 🚀 Run it locally

Requires [Node.js](https://nodejs.org) (v16+).

```bash
cd team-roadmap-app
npm install
npm start
```

Then open **http://localhost:3000** in your browser.

---

## 👥 Making it work across multiple machines

The whole point of the backend is that everyone talks to **one running server**, not to their own local file. Pick whichever fits your team:

### Option A — one teammate hosts it on their machine, everyone else connects over Wi-Fi
1. That person runs `npm start` on their laptop (must stay on and connected to the same network while others use it).
2. Find that machine's local IP (e.g. `192.168.1.23`) — on Mac/Linux: `ifconfig` or `ipconfig getifaddr en0`; on Windows: `ipconfig`.
3. Everyone else opens `http://192.168.1.23:3000` in their browser (phone, laptop — same Wi-Fi network only).

This is free and takes 2 minutes, but only works while that laptop is on and everyone's on the same network (e.g. studying together).

### Option B — deploy it online (recommended for a real team project)
Deploy to a free-tier host so the URL works from anywhere, anytime:
- **[Render](https://render.com)** — connect your GitHub repo, "New Web Service", build command `npm install`, start command `npm start`. Free tier available.
- **[Railway](https://railway.app)** — similar flow, connect repo and deploy.
- **[Fly.io](https://fly.io)** — a bit more setup but generous free tier.

⚠️ Free tiers on these platforms usually **reset the filesystem** when the app restarts/sleeps, which means `data.json` could get wiped. For anything beyond a class project, swap `data.json` for a small real database (see below).

---

## 🔌 API reference

| Method | Path | What it does |
|---|---|---|
| `GET` | `/api/state` | Returns the current shared roadmap data as JSON |
| `PUT` | `/api/state` | Replaces the whole roadmap data (the frontend calls this after every add/edit/delete) |
| `POST` | `/api/state/reset` | Resets the shared data back to `default-data.json` for everyone |

The frontend polls `GET /api/state` every 5 seconds so changes from teammates appear automatically (it skips polling while you have an edit form open, so it won't interrupt you mid-edit).

---

## 🧠 How the sync works (short version)

1. Every browser loads the page → fetches `/api/state` → renders it.
2. When you add/edit/delete anything, the browser updates its local copy immediately (feels instant) **and** sends the whole updated dataset to the server with `PUT /api/state`.
3. Every browser (including yours) polls `/api/state` every 5 seconds. If the data on the server changed since last check, it re-renders.
4. The little status pill next to "โหมดแก้ไข" shows connection state: 🟢 synced, 🔄 saving, 🔴 can't reach the server (edits still work locally but won't be shared until it reconnects).

---

## ⚠️ Current limitations (good to know)

- **`data.json` is a single shared file, last write wins.** If two people edit at the exact same moment, whoever's save lands last overwrites the other. Fine for a small team working on different sections; not built for heavy concurrent editing.
- **No login/auth** — anyone with the URL can edit. Fine for a private team tool; don't expose the URL publicly if that matters to you.
- **File-based storage** — great for a class project or small team; if this grows into something bigger, swap `data.json` for SQLite/Postgres and change `readData()`/`writeData()` in `server.js` accordingly — the API shape (`GET`/`PUT` a JSON blob) can stay the same.

---

## 🛠️ Tech stack

- Backend: Node.js + Express, JSON file storage
- Frontend: vanilla HTML/CSS/JS (no framework, no build step)
- Fonts: JetBrains Mono + IBM Plex Sans Thai (Google Fonts)
