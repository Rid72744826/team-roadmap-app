// Team Roadmap — Backend Server
// -------------------------------------------------
// Stores the roadmap data either in:
//   - Upstash Redis (if UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
//     env vars are set) — survives server restarts/spin-downs, good for
//     hosting on Render's free tier.
//   - A local data.json file (fallback) — fine for running on your own
//     machine, but on Render's free tier this resets whenever the
//     service spins down from inactivity, since the disk isn't persistent.
// -------------------------------------------------

const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data.json");
const DEFAULT_FILE = path.join(__dirname, "default-data.json");
const STATE_KEY = "roadmap-state";

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const USE_REDIS = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

app.use(express.json({ limit: "2mb" }));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

function loadDefaults() {
  return JSON.parse(fs.readFileSync(DEFAULT_FILE, "utf-8"));
}

function isValidState(data) {
  const requiredKeys = ["hero", "checklist", "foundation", "modules", "timeline", "tips"];
  return data && typeof data === "object" && requiredKeys.every(k => k in data);
}

// --- Upstash Redis storage ---
async function redisGet() {
  const res = await fetch(`${UPSTASH_URL}/get/${STATE_KEY}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
  });
  if (!res.ok) throw new Error(`Upstash GET failed: ${res.status}`);
  const data = await res.json();
  return data.result ? JSON.parse(data.result) : null;
}

async function redisSet(value) {
  const res = await fetch(`${UPSTASH_URL}/set/${STATE_KEY}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "text/plain",
    },
    body: JSON.stringify(value),
  });
  if (!res.ok) throw new Error(`Upstash SET failed: ${res.status}`);
}

// --- Local file storage (fallback for local dev) ---
function fileGet() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch (err) {
    return null;
  }
}

function fileSet(value) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(value, null, 2), "utf-8");
}

// --- Unified storage interface ---
async function readState() {
  let data = USE_REDIS ? await redisGet() : fileGet();
  if (!data) {
    // first run / empty store — seed with the default content
    data = loadDefaults();
    await writeState(data);
  }
  return data;
}

async function writeState(data) {
  if (!isValidState(data)) throw new Error("Payload is missing required fields");
  if (USE_REDIS) await redisSet(data);
  else fileSet(data);
}

// --- API routes ---

app.get("/api/state", async (req, res) => {
  try {
    res.json(await readState());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "อ่านข้อมูลไม่สำเร็จ" });
  }
});

app.put("/api/state", async (req, res) => {
  try {
    await writeState(req.body);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || "บันทึกข้อมูลไม่สำเร็จ" });
  }
});

app.post("/api/state/reset", async (req, res) => {
  try {
    const defaults = loadDefaults();
    await writeState(defaults);
    res.json(defaults);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "รีเซ็ตข้อมูลไม่สำเร็จ" });
  }
});

// --- Static frontend ---
app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
  console.log(`✅ Roadmap server running on port ${PORT}`);
  console.log(`   Storage: ${USE_REDIS ? "Upstash Redis (persistent)" : "local data.json (resets on redeploy/spin-down on Render free tier)"}`);
});