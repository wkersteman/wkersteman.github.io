// Paaspop 2026 opening time in Europe/Amsterdam (CEST, UTC+2).
const targetDate = new Date("2026-04-03T15:00:00+02:00");

const daysEl = document.getElementById("days");
const hoursEl = document.getElementById("hours");
const minutesEl = document.getElementById("minutes");
const secondsEl = document.getElementById("seconds");
const statusEl = document.getElementById("status");
const daysBadge = document.getElementById("days-badge");
const daysBadgeValue = document.getElementById("days-badge-value");
const daysBadgeCaption = document.getElementById("days-badge-caption");
const weatherStatusEl = document.getElementById("weather-status");
const weatherCardsEl = document.getElementById("weather-cards");
let intervalId = null;

function padTime(value) {
  return String(value).padStart(2, "0");
}

function renderTime(days, hours, minutes, seconds) {
  daysEl.textContent = padTime(days);
  hoursEl.textContent = padTime(hours);
  minutesEl.textContent = padTime(minutes);
  secondsEl.textContent = padTime(seconds);
}

function calculateRemainingTime() {
  const now = new Date();
  const totalMs = targetDate.getTime() - now.getTime();

  if (totalMs <= 0) {
    return { totalMs: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const totalSeconds = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { totalMs, days, hours, minutes, seconds };
}

function updateDaysBadge(days, totalMs) {
  if (totalMs <= 0) {
    daysBadge.classList.add("days-badge--live");
    daysBadgeValue.textContent = "LIVE";
    daysBadgeCaption.textContent = "Paaspop";
    return;
  }

  daysBadge.classList.remove("days-badge--live");
  daysBadgeValue.textContent = String(days);

  if (days > 1) {
    daysBadgeCaption.textContent = "dagen te gaan";
  } else if (days === 1) {
    daysBadgeCaption.textContent = "dag te gaan";
  } else {
    daysBadgeCaption.textContent = "tot de start";
  }
}

function tick() {
  const remaining = calculateRemainingTime();
  renderTime(remaining.days, remaining.hours, remaining.minutes, remaining.seconds);
  updateDaysBadge(remaining.days, remaining.totalMs);

  if (remaining.totalMs <= 0) {
    statusEl.textContent = "Paaspop is begonnen!";
    clearInterval(intervalId);
  } else {
    statusEl.textContent = "Nog even wachten...";
  }
}

tick();
intervalId = setInterval(tick, 1000);

function weatherCodeToDutchLabel(code) {
  const map = {
    0: "Helder",
    1: "Overwegend helder",
    2: "Licht bewolkt",
    3: "Bewolkt",
    45: "Mist",
    48: "Aanzettende rijpnevel",
    51: "Lichte motregen",
    53: "Motregen",
    55: "Dichte motregen",
    56: "Lichte ijzel",
    57: "Ijzel",
    61: "Lichte regen",
    63: "Regen",
    65: "Zware regen",
    66: "Lichte ijzelregen",
    67: "Ijzelregen",
    71: "Lichte sneeuw",
    73: "Sneeuw",
    75: "Zware sneeuw",
    77: "Sneeuwkorrels",
    80: "Lichte buien",
    81: "Buien",
    82: "Zware buien",
    85: "Lichte sneeuwbuien",
    86: "Sneeuwbuien",
    95: "Onweer",
    96: "Onweer met hagel",
    99: "Zwaar onweer met hagel"
  };

  return map[code] ?? "Onbekend";
}

function weatherCodeToIcon(code) {
  if (code === 0 || code === 1) {
    return "☀️";
  }
  if (code === 2 || code === 3) {
    return "⛅";
  }
  if (code === 45 || code === 48) {
    return "🌫️";
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return "🌧️";
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return "❄️";
  }
  if (code === 95 || code === 96 || code === 99) {
    return "⛈️";
  }

  return "🌤️";
}

function formatForecastDate(dateString) {
  const date = new Date(`${dateString}T12:00:00+02:00`);
  return date.toLocaleDateString("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short"
  });
}

function createWeatherCard(dayData) {
  const card = document.createElement("article");
  card.className = "weather-card";

  const tempText = `${Math.round(dayData.tempMax)}° / ${Math.round(dayData.tempMin)}°`;
  const weatherLabel = weatherCodeToDutchLabel(dayData.weatherCode);
  const weatherIcon = weatherCodeToIcon(dayData.weatherCode);
  card.innerHTML = `
    <p class="weather-card__date">${formatForecastDate(dayData.date)}</p>
    <p class="weather-card__type-wrap">
      <span class="weather-card__icon" aria-hidden="true">${weatherIcon}</span>
      <span class="weather-card__type">${weatherLabel}</span>
    </p>
    <p class="weather-card__row"><span>Temperatuur</span><strong>${tempText}</strong></p>
    <p class="weather-card__row"><span>Kans op regen</span><strong>${dayData.rainChance}%</strong></p>
    <p class="weather-card__row"><span>Wind</span><strong>${Math.round(dayData.windSpeed)} km/u</strong></p>
  `;

  return card;
}

async function loadWeatherForecast() {
  if (!weatherStatusEl || !weatherCardsEl) {
    return;
  }

  const lat = 51.62;
  const lon = 5.43;
  const startDate = "2026-04-03";
  const endDate = "2026-04-05";

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set(
    "daily",
    "weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max"
  );
  url.searchParams.set("timezone", "Europe/Amsterdam");
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);

  try {
    weatherStatusEl.textContent = "Weersverwachting ophalen...";
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error("Forecast request failed");
    }

    const data = await response.json();
    const daily = data.daily;

    if (
      !daily ||
      !daily.time ||
      !daily.weathercode ||
      !daily.temperature_2m_max ||
      !daily.temperature_2m_min ||
      !daily.precipitation_probability_max ||
      !daily.windspeed_10m_max
    ) {
      throw new Error("Missing forecast fields");
    }

    weatherCardsEl.innerHTML = "";

    for (let i = 0; i < daily.time.length; i += 1) {
      const card = createWeatherCard({
        date: daily.time[i],
        weatherCode: daily.weathercode[i],
        tempMax: daily.temperature_2m_max[i],
        tempMin: daily.temperature_2m_min[i],
        rainChance: daily.precipitation_probability_max[i],
        windSpeed: daily.windspeed_10m_max[i]
      });
      weatherCardsEl.appendChild(card);
    }

    weatherStatusEl.textContent = "Live verwachting voor Schijndel (bron: Open-Meteo).";
  } catch (error) {
    weatherStatusEl.textContent =
      "Weer kon niet geladen worden. Probeer later opnieuw of open via lokale server.";
    weatherCardsEl.innerHTML = "";
  }
}

loadWeatherForecast();
