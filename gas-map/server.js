// Gas price map: serves the page and proxies the EIA API so the key stays on the server.
// Usage: EIA_API_KEY=your_key node server.js   (Node 18+, no dependencies)
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 3000;
const API_KEY = process.env.EIA_API_KEY;
const EIA_BASE = process.env.EIA_API_BASE || "https://api.eia.gov";
const CACHE_MS = 60 * 60 * 1000; // EIA updates weekly; one fetch an hour is plenty

// Weekly retail regular gasoline, all formulations, $/gal (EIA series IDs).
// These ten are the cities EIA publishes weekly city-level prices for.
const US = { series: "EMM_EPMR_PTE_NUS_DPG", name: "U.S." };
const CA = { series: "EMM_EPMR_PTE_SCA_DPG", name: "California" };
const CITIES = [
  { series: "EMM_EPMR_PTE_Y05SF_DPG", name: "San Francisco", lat: 37.7749, lng: -122.4194 },
  { series: "EMM_EPMR_PTE_Y05LA_DPG", name: "Los Angeles", lat: 34.0522, lng: -118.2437 },
  { series: "EMM_EPMR_PTE_Y48SE_DPG", name: "Seattle", lat: 47.6062, lng: -122.3321 },
  { series: "EMM_EPMR_PTE_YDEN_DPG", name: "Denver", lat: 39.7392, lng: -104.9903 },
  { series: "EMM_EPMR_PTE_Y44HO_DPG", name: "Houston", lat: 29.7604, lng: -95.3698 },
  { series: "EMM_EPMR_PTE_YORD_DPG", name: "Chicago", lat: 41.8781, lng: -87.6298 },
  { series: "EMM_EPMR_PTE_YCLE_DPG", name: "Cleveland", lat: 41.4993, lng: -81.6944 },
  { series: "EMM_EPMR_PTE_YMIA_DPG", name: "Miami", lat: 25.7617, lng: -80.1918 },
  { series: "EMM_EPMR_PTE_Y35NY_DPG", name: "New York City", lat: 40.7128, lng: -74.006 },
  { series: "EMM_EPMR_PTE_YBOS_DPG", name: "Boston", lat: 42.3601, lng: -71.0589 },
];

let cache = null; // { at, body }

async function fetchPrices() {
  const all = [US, CA, ...CITIES];
  const params = new URLSearchParams({
    api_key: API_KEY,
    frequency: "weekly",
    "data[0]": "value",
    "sort[0][column]": "period",
    "sort[0][direction]": "desc",
    length: String(all.length * 4), // last ~4 weeks, enough to cover a late series
  });
  for (const s of all) params.append("facets[series][]", s.series);

  const res = await fetch(`${EIA_BASE}/v2/petroleum/pri/gnd/data/?${params}`);
  if (!res.ok) throw new Error(`EIA API returned HTTP ${res.status}`);
  const json = await res.json();
  const rows = json?.response?.data;
  if (!Array.isArray(rows)) throw new Error(json?.error || "Unexpected EIA response");

  // series -> { period -> price }
  const bySeries = {};
  for (const r of rows) {
    const v = parseFloat(r.value);
    if (!Number.isFinite(v)) continue;
    (bySeries[r.series] ??= {})[r.period] = v;
  }

  // "This week" = the latest week EIA has published a U.S. average for.
  const usPeriods = Object.keys(bySeries[US.series] || {}).sort();
  const week = usPeriods.at(-1);
  if (!week) throw new Error("No U.S. average in EIA response");
  const at = (s) => bySeries[s]?.[week] ?? null;

  return {
    week,
    usAverage: at(US.series),
    california: at(CA.series),
    cities: CITIES.map(({ series, ...c }) => ({ ...c, price: at(series) })),
    source: "U.S. Energy Information Administration, Weekly Retail Gasoline Prices (regular, all formulations)",
  };
}

async function handleApi(res) {
  if (!API_KEY) return send(res, 500, { error: "EIA_API_KEY environment variable is not set on the server." });
  try {
    if (!cache || Date.now() - cache.at > CACHE_MS) cache = { at: Date.now(), body: await fetchPrices() };
    send(res, 200, cache.body);
  } catch (err) {
    console.error(err);
    send(res, 502, { error: `Could not load prices from EIA: ${err.message}` });
  }
}

function send(res, status, obj) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(obj));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/prices") return handleApi(res);
  if (url.pathname === "/" || url.pathname === "/index.html") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    return fs.createReadStream(path.join(__dirname, "public", "index.html")).pipe(res);
  }
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`Gas price map on http://localhost:${PORT}`);
  if (!API_KEY) console.warn("Warning: EIA_API_KEY is not set; /api/prices will return an error.");
});
