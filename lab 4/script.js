/***** CONFIG *****/
const OWM_API_KEY = "8a7b49ba213a1c072ac4841884e60e22"; // your key
const OWM_URL = "https://api.openweathermap.org/data/2.5/weather";

/***** DOM HOOKS (match your index.html ids) *****/
const btnTroy   = document.getElementById("useTroyBtn");
const btnGeo    = document.getElementById("geoBtn");               // wired next step
const btnAgain  = document.getElementById("refreshActivityBtn");   // wired in later step
const elWeather = document.getElementById("weatherBody");
const elUpdated = document.getElementById("weatherUpdated");
const elHdrs    = document.getElementById("weatherHeaders");
const elAct     = document.getElementById("activityBody");

/***** HELPERS *****/
const fmt = {
  tempF: t => `${Math.round(t)}°F`,
  title: s => s ? s.replace(/\b\w/g, c => c.toUpperCase()) : '',
};

/** Fade helper: swaps innerHTML with a wrapper that animates in */
function setHTMLWithFade(el, html) {
  el.innerHTML = `<div class="fade-in">${html}</div>`;
}

/** Formatting helpers for activity */
const TYPE_EMOJI = {
  education:"📚", recreational:"⛺", social:"🫶", diy:"🛠️", charity:"🤝",
  music:"🎵", cooking:"🍳", relaxation:"🧘", busywork:"🧩"
};
const dollars = p => (p === 0 ? "Free" : p <= .2 ? "$" : p <= .5 ? "$$" : "$$$");
const people  = n => "👤".repeat(Math.max(1, Number(n||1)));


/***** ACTIVITY (Bored API via AppBrewery) *****/
const ACTIVITY_BASES = [
  "https://bored-api.appbrewery.com",   // primary
  "https://www.boredapi.com"            // fallback
];
let lastActivityPath = "/random"; // remember last weather-based filter

function mapWeatherToActivity(main, tempF) {
  const t = Number(tempF);
  const c = (main || "").toLowerCase();
  if (c.includes("rain") || c.includes("snow") || c.includes("thunder")) return "/filter?type=education";   // indoor
  if (t >= 72 && (c.includes("clear") || c.includes("cloud"))) return "/filter?type=recreational";          // outdoor-ish
  if (t <= 40) return "/filter?type=busywork";                                                                // cold day
  return "/random";
}

function normalizeActivity(payload) {
  // /random => object; /filter?... (AppBrewery) => array
  if (Array.isArray(payload)) {
    if (payload.length === 0) throw new Error("No activities found for this filter");
    return payload[Math.floor(Math.random() * payload.length)];
  }
  return payload;
}

// tiny helper: fetch with timeout
async function fetchWithTimeout(url, opts = {}, ms = 8000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

// CORS-resilient JSON fetch: direct -> AllOrigins -> r.jina.ai
async function fetchJSONWithCorsFallback(url) {
  // 1) try direct (works for boredapi.com on most networks)
  try {
    const r1 = await fetchWithTimeout(url, { mode: "cors" });
    if (r1.ok) return await r1.json();
    // if we got a response but it's an HTTP error, throw to try proxies
    throw new Error(`HTTP ${r1.status}`);
  } catch (e1) {
    // 2) AllOrigins proxy (raw)
    try {
      const proxied = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const r2 = await fetchWithTimeout(proxied);
      if (!r2.ok) throw new Error(`Proxy HTTP ${r2.status}`);
      // AllOrigins returns JSON body directly
      return await r2.json();
    } catch (e2) {
      // 3) r.jina.ai read-only CORS proxy (returns text, we parse)
      try {
        // note: jina route takes http:// or https://, but safest is http:// for boredapi
        const jinaURL = `https://r.jina.ai/http://${url.replace(/^https?:\/\//, "")}`;
        const r3 = await fetchWithTimeout(jinaURL);
        if (!r3.ok) throw new Error(`Jina HTTP ${r3.status}`);
        const txt = await r3.text();
        return JSON.parse(txt);
      } catch (e3) {
        // rethrow the last error so UI shows a useful message
        throw e3;
      }
    }
  }
}

async function fetchActivityWithFallback(path = "/random") {
  let lastError;
  for (const base of ACTIVITY_BASES) {
    try {
      // Official boredapi.com uses /api/activity for random; filters via query params.
      const url = base.includes("boredapi.com")
        ? (path === "/random" ? `${base}/api/activity`
                              : `${base}/api/activity${path.replace("/filter","")}`)
        : `${base}${path}`;

      const data = await fetchJSONWithCorsFallback(url);
      return normalizeActivity(data);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error("Activity fetch failed");
}

// simple text escape so we can keep using innerHTML safely
function escapeHTML(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderActivity(a) {
  const typeKey = String(a.type || "any").toLowerCase();
  const emoji = TYPE_EMOJI[typeKey] || "🎯";

  const priceVal = Math.min(1, Math.max(0, Number(a.price ?? 0)));
  const pricePct = Math.round(priceVal * 100);
  const participants = Math.max(1, Number(a.participants ?? 1));
  const link = a.link ? `<a href="${a.link}" target="_blank" rel="noopener">Learn more</a>` : "";

  setHTMLWithFade(elAct, `
    <div class="activity-title">
      <span class="activity-emoji">${emoji}</span>${escapeHTML(a.activity)}
    </div>
    <div class="activity-meta">
      <span class="pill pill-gray">Type: ${fmt.title(typeKey)}</span>
      <span class="pill pill-gray">Participants: ${people(participants)}</span>
      <span class="pill pill-green">${dollars(priceVal)}</span>
    </div>

    <div class="mt-3">
      <div class="price-meter" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pricePct}">
        <span style="width:${pricePct}%"></span>
      </div>
      <div class="text-secondary small mt-1">Cost-level: ${pricePct}%</div>
    </div>

    ${link ? `<div class="mt-3">${link}</div>` : ""}
  `);

  btnAgain.disabled = false;
}

async function fetchWeatherByCoords(lat, lon) {
  const url = new URL(OWM_URL);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("appid", OWM_API_KEY);
  url.searchParams.set("units", "imperial");

  setHTMLWithFade(elWeather, `<p class="muted">Loading weather for your location <span class="spin">⭮</span></p>`);

  const res = await fetch(url, { mode: "cors" });
  const headers = Object.fromEntries(res.headers.entries());

  if (!res.ok) {
    let detail = "";
    try { const j = await res.json(); detail = j.message || ""; } catch {}
    throw new Error(`Weather error ${res.status}${detail ? ": " + detail : ""}`);
  }

  const data = await res.json();
  const { main, tempValue } = renderWeather(data, headers);

  // keep weather-reactive background
  document.body.dataset.wx = (main || "").toLowerCase();

  // activity based on your local weather
  try {
    lastActivityPath = mapWeatherToActivity(main, tempValue);
    const activity = await fetchActivityWithFallback(lastActivityPath);
    renderActivity(activity);
  } catch (e) {
    elAct.innerHTML = `<div class="alert alert-warning mb-0">Activity unavailable: ${e.message || "network error"}.</div>`;
    btnAgain.disabled = false;
    console.error("Activity fetch failed:", e);
  }
}

/***** WEATHER: fetch + render (Troy only for now) *****/
async function fetchWeatherTroy() {
  // --- weather ---
  const url = new URL(OWM_URL);
  url.searchParams.set("q", "Troy,NY,US");
  url.searchParams.set("appid", OWM_API_KEY);
  url.searchParams.set("units", "imperial");

  setHTMLWithFade(elWeather, `<p class="muted">Loading weather <span class="spin">⭮</span></p>`);

  const res = await fetch(url, { mode: "cors" });
  const headers = Object.fromEntries(res.headers.entries());

  if (!res.ok) {
    let detail = "";
    try { const j = await res.json(); detail = j.message || ""; } catch {}
    throw new Error(`Weather error ${res.status}${detail ? ": " + detail : ""}`);
  }

  const data = await res.json();
  const { main, tempValue } = renderWeather(data, headers);
  document.body.dataset.wx = (main || "").toLowerCase();
  console.log("[wx tag]", document.body.dataset.wx);

  // --- activity ---
  try {
    lastActivityPath = mapWeatherToActivity(main, tempValue);
    const activity = await fetchActivityWithFallback(lastActivityPath);
    renderActivity(activity);
  } catch (e) {
    elAct.innerHTML = `<div class="alert alert-warning mb-0">Activity unavailable: ${e.message || "network error"}. Try again.</div>`;
    btnAgain.disabled = false;
    console.error("Activity fetch failed:", e);
  }
}

function renderWeather(data, headers) {
  const name = `${data.name}, ${data.sys?.country ?? ""}`.trim();
  const main = data.weather?.[0]?.main || "";
  const desc = fmt.title(data.weather?.[0]?.description || "");
  const temp = fmt.tempF(data.main?.temp);
  const feels = fmt.tempF(data.main?.feels_like);
  const humidity = data.main?.humidity ?? "-";
  const icon = data.weather?.[0]?.icon
    ? `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`
    : "";

  setHTMLWithFade(elWeather, `
    <div class="d-flex align-items-center gap-3">
      ${icon ? `<img class="weather-icon" alt="weather icon" src="${icon}" />` : ""}
      <div>
        <div class="h4 m-0">${name}</div>
        <div class="muted">${desc}</div>
      </div>
    </div>
    <div class="mt-3 d-flex flex-wrap gap-3 align-items-center">
      <span class="badge text-bg-primary badge-pill">${temp}</span>
      <span class="badge text-bg-secondary badge-pill">Feels like ${feels}</span>
      <span class="badge text-bg-success badge-pill">Humidity ${humidity}%</span>
    </div>
  `);


  // show a few response headers (metadata)
  const keep = ["date","content-type","server","content-length","cf-cache-status","x-cache"];
  elUpdated.textContent = new Date().toLocaleTimeString();

  return { main, tempValue: Number(data.main?.temp ?? 0) };
}

/***** EVENTS *****/
btnTroy.addEventListener("click", async () => {
  try {
    await fetchWeatherTroy();
  } catch (err) {
    console.error(err);
    elWeather.innerHTML = `<div class="alert alert-danger mb-0">${err.message}</div>`;
  }
});

/***** INITIAL STATE *****/
// Keep idle until user clicks “Use Troy, NY” (your prof may prefer manual action)
console.log("Ready. Click 'Use Troy, NY' to fetch weather.");

/***** AUTO-LOAD ON PAGE OPEN *****/
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await fetchWeatherTroy();        // load Troy immediately
  } catch (err) {
    console.error(err);
    elWeather.innerHTML = `<div class="alert alert-danger mb-0">${err.message}</div>`;
  }
});

btnAgain.addEventListener("click", async () => {
  try {
    btnAgain.disabled = true;
    const activity = await fetchActivityWithFallback(lastActivityPath || "/random");
    renderActivity(activity);
  } catch (e) {
    elAct.innerHTML = `<div class="alert alert-danger mb-0">Still couldn’t get an activity. Please try again.</div>`;
  } finally {
    btnAgain.disabled = false;
  }
});

btnGeo.addEventListener("click", async () => {
  if (!navigator.geolocation) {
    elWeather.innerHTML = `<div class="alert alert-danger mb-0">Geolocation not supported by your browser.</div>`;
    return;
  }

  // simple UI state
  const prevHTML = elWeather.innerHTML;
  setHTMLWithFade(elWeather, `<p class="muted">Requesting your location… <span class="spin">⭮</span></p>`);

  const onSuccess = async pos => {
    const { latitude, longitude } = pos.coords;
    try {
      await fetchWeatherByCoords(latitude, longitude);
    } catch (err) {
      console.error(err);
      elWeather.innerHTML = `<div class="alert alert-danger mb-0">${err.message}</div>`;
    }
  };

  const onError = err => {
    console.error(err);
    elWeather.innerHTML = prevHTML;
    elAct.innerHTML = `<div class="alert alert-warning mb-0">Couldn’t get your location (${err.code}): ${err.message}</div>`;
  };

  navigator.geolocation.getCurrentPosition(onSuccess, onError, {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  });
});
