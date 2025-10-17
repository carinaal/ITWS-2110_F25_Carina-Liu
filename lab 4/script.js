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

async function fetchActivityWithFallback(path = "/random") {
  // Try each base; on network/CORS failure, fall through; on HTTP error, throw
  let lastError;
  for (const base of ACTIVITY_BASES) {
    try {
      // For boredapi.com the equivalent random is /api/activity and the filter is identical
      const url = base.includes("boredapi.com")
        ? (path === "/random" ? `${base}/api/activity` : `${base}/api/activity${path.replace("/filter","")}`)
        : `${base}${path}`;

      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) throw new Error(`Activity error ${res.status}`);
      const data = await res.json();
      return normalizeActivity(data);
    } catch (e) {
      lastError = e;
      // continue to next base
    }
  }
  throw lastError || new Error("Activity fetch failed");
}

function renderActivity(a) {
  const price = a.price === 0 ? "Free" : a.price <= 0.2 ? "$" : a.price <= 0.5 ? "$$" : "$$$";
  elAct.innerHTML = `
    <div class="d-flex align-items-start gap-2">
      <div>
        <div class="h5 mb-1">${a.activity}</div>
        <div class="text-secondary">Type: ${a.type} • Participants: ${a.participants} • ${price}</div>
        ${a.link ? `<a href="${a.link}" target="_blank" rel="noopener">Learn more</a>` : ""}
      </div>
    </div>
  `;
  btnAgain.disabled = false;
}


/***** WEATHER: fetch + render (Troy only for now) *****/
async function fetchWeatherTroy() {
  // --- weather ---
  const url = new URL(OWM_URL);
  url.searchParams.set("q", "Troy,NY,US");
  url.searchParams.set("appid", OWM_API_KEY);
  url.searchParams.set("units", "imperial");

  elWeather.innerHTML = `<p class="muted">Loading weather <span class="spin">⭮</span></p>`;

  const res = await fetch(url, { mode: "cors" });
  const headers = Object.fromEntries(res.headers.entries());

  if (!res.ok) {
    let detail = "";
    try { const j = await res.json(); detail = j.message || ""; } catch {}
    throw new Error(`Weather error ${res.status}${detail ? ": " + detail : ""}`);
  }

  const data = await res.json();
  const { main, tempValue } = renderWeather(data, headers);

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

function normalizeActivity(payload) {
  // /random => object; /filter?... => array of activities
  if (Array.isArray(payload)) {
    if (payload.length === 0) throw new Error("No activities found for this filter");
    return payload[Math.floor(Math.random() * payload.length)];
  }
  return payload;
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

  elWeather.innerHTML = `
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
  `;

  // show a few response headers (metadata)
  const keep = ["date","content-type","server","content-length","cf-cache-status","x-cache"];
  elHdrs.innerHTML = keep
    .filter(k => headers[k])
    .map(k => `<code class="me-2">${k}: ${headers[k]}</code>`)
    .join("") || `<span class="muted">No notable headers available.</span>`;

  elUpdated.textContent = new Date().toLocaleTimeString();

  return { main, tempValue: data.main?.temp ?? 0 };
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