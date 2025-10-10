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

/***** WEATHER: fetch + render (Troy only for now) *****/
async function fetchWeatherTroy() {
  // Build URL like: /weather?q=Troy,NY,US&appid=KEY&units=imperial
  const url = new URL(OWM_URL);
  url.searchParams.set("q", "Troy,NY,US");
  url.searchParams.set("appid", OWM_API_KEY);
  url.searchParams.set("units", "imperial");

  elWeather.innerHTML = `<p class="muted">Loading weather <span class="spin">⭮</span></p>`;

  const res = await fetch(url);
  const headers = Object.fromEntries(res.headers.entries());

  if (!res.ok) {
    // Surface helpful message (401 usually means key issue)
    let detail = "";
    try { const j = await res.json(); detail = j.message || ""; } catch {}
    throw new Error(`Weather error ${res.status}${detail ? ": " + detail : ""}`);
  }

  const data = await res.json();
  renderWeather(data, headers);
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

  // For next step we’ll map weather → activity; leave activity panel as-is for now
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
