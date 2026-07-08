// Team Roadmap — Backend Server
// -------------------------------------------------
// Simple Express server that stores the roadmap data in a JSON file
// on disk (data.json). Every client (teammate) that opens the page
// talks to this same server, so edits made by one person show up for
// everyone else — no per-browser memory, no manual JSON passing.
// -------------------------------------------------

const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data.json");
const DEFAULT_FILE = path.join(__dirname, "default-data.json");

app.use(express.json({ limit: "2mb" }));

// Allow the page to be hosted separately from the API if needed
// (e.g. frontend on Netlify, backend on Render). Same-origin setups
// don't need this, but it's harmless to leave on.
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

function readData() {
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

function writeData(data) {
  // Basic shape check so a broken payload can't corrupt the file
  const requiredKeys = ["hero", "checklist", "foundation", "modules", "timeline", "tips"];
  const ok = data && typeof data === "object" && requiredKeys.every(k => k in data);
  if (!ok) throw new Error("Payload is missing required fields");
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// --- API routes ---

// Get the current shared roadmap state
app.get("/api/state", (req, res) => {
  try {
    res.json(readData());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "อ่านข้อมูลไม่สำเร็จ" });
  }
});

// Replace the entire shared state (used after any add/edit/delete)
app.put("/api/state", (req, res) => {
  try {
    writeData(req.body);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || "บันทึกข้อมูลไม่สำเร็จ" });
  }
});

// Reset the shared state back to the original seed content
app.post("/api/state/reset", (req, res) => {
  try {
    const defaults = JSON.parse(fs.readFileSync(DEFAULT_FILE, "utf-8"));
    writeData(defaults);
    res.json(defaults);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "รีเซ็ตข้อมูลไม่สำเร็จ" });
  }
});

// --- Static frontend ---
app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
  console.log(`✅ Roadmap server running: http://localhost:${PORT}`);
  console.log(`   Teammates on the same network can use your LAN IP instead of localhost.`);
});
