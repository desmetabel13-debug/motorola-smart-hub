
function updateClock() {
  const now = new Date();

  document.getElementById("clock").textContent =
    now.toLocaleTimeString("nl-BE");

  document.getElementById("date").textContent =
    now.toLocaleDateString("nl-BE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
}

updateClock();
setInterval(updateClock, 1000);


const audio = document.getElementById("audio");
const station = document.getElementById("station");
const status = document.getElementById("radioStatus");

const stations = {
  radio1: {
    name: "VRT Radio 1",
    url: "https://icecast.vrtcdn.be/radio1-high.mp3"
  },
  radio2: {
    name: "Radio 2 Antwerpen",
    url: "https://icecast.vrtcdn.be/ra2ant-high.mp3"
  },
  stubru: {
    name: "Studio Brussel",
    url: "https://icecast.vrtcdn.be/stubru-high.mp3"
  },
  mnm: {
    name: "MNM",
    url: "https://icecast.vrtcdn.be/mnm-high.mp3"
  },
  klara: {
    name: "Klara",
    url: "https://icecast.vrtcdn.be/klara-high.mp3"
  },
  qmusic: {
    name: "Qmusic",
    url: "https://streams.radio.dpgmedia.cloud/redirect/qmusic_be/mp3"
  },
  joe: {
    name: "JOE",
    url: "https://streams.radio.dpgmedia.cloud/redirect/joe_fm/mp3"
  },
  nostalgie: {
    name: "Nostalgie",
    url: "https://stream.rcs.revma.com/5gd04cwptg0uv"
  }
};

const volume = document.getElementById("volume");
const volumeValue = document.getElementById("volumeValue");
const favoriteButton = document.getElementById("favoriteButton");
const favoriteStatus = document.getElementById("favoriteStatus");

let favorite = localStorage.getItem("smartHubFavorite");

function updateFavorite() {
  const isFavorite = favorite === station.value;

  favoriteButton.textContent = isFavorite
    ? "★ FAVORIET"
    : "☆ FAVORIET";

  favoriteStatus.textContent = favorite
    ? "Favoriet: " + stations[favorite].name
    : "Nog geen favoriete zender";
}

function selectStation() {
  audio.pause();
  audio.removeAttribute("src");
  audio.load();

  document.getElementById("stationTitle").textContent =
    stations[station.value].name;

  status.textContent = "Klaar om af te spelen";
  updateFavorite();
}

station.addEventListener("change", selectStation);

document.getElementById("playButton").onclick = async () => {
  const selected = stations[station.value];

  if (audio.src !== selected.url) {
    audio.src = selected.url;
  }

  status.textContent = "Verbinding maken met " + selected.name + "...";

  try {
    await audio.play();
    status.textContent = "● LIVE · " + selected.name;
  } catch (error) {
    status.textContent = "Radio kon niet starten. Probeer opnieuw.";
  }
};

document.getElementById("stopButton").onclick = () => {
  audio.pause();
  status.textContent = "Radio gestopt";
};

volume.addEventListener("input", () => {
  audio.volume = Number(volume.value) / 100;
  volumeValue.textContent = volume.value + "%";
});

audio.volume = 0.7;

favoriteButton.onclick = () => {
  if (favorite === station.value) {
    favorite = null;
    localStorage.removeItem("smartHubFavorite");
  } else {
    favorite = station.value;
    localStorage.setItem("smartHubFavorite", favorite);
  }

  updateFavorite();
};

audio.addEventListener("error", () => {
  status.textContent = "Deze zender is momenteel niet bereikbaar.";
});

selectStation();

const cityInput = document.getElementById("cityInput");
const searchWeather = document.getElementById("searchWeather");

function weatherInfo(code) {
  if (code === 0) return ["☀️", "Zonnig"];
  if (code <= 2) return ["🌤️", "Gedeeltelijk bewolkt"];
  if (code === 3) return ["☁️", "Bewolkt"];
  if (code <= 48) return ["🌫️", "Mist"];
  if (code <= 67) return ["🌧️", "Regen"];
  if (code <= 77) return ["❄️", "Sneeuw"];
  if (code <= 82) return ["🌦️", "Regenbuien"];
  if (code <= 86) return ["🌨️", "Sneeuwbuien"];
  if (code >= 95) return ["⛈️", "Onweer"];
  return ["🌤️", "Wisselend weer"];
}

async function loadWeather() {
  const city = cityInput.value.trim();

  if (!city) {
    document.getElementById("weatherStatus").textContent =
      "Vul eerst een stad in.";
    return;
  }

  const status = document.getElementById("weatherStatus");
  status.textContent = "Weergegevens ophalen...";

  try {
    const geoResponse = await fetch(
      "https://geocoding-api.open-meteo.com/v1/search?name=" +
      encodeURIComponent(city) +
      "&count=1&language=nl&format=json"
    );

    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("Stad niet gevonden.");
    }

    const place = geoData.results[0];

    const url =
      "https://api.open-meteo.com/v1/forecast?" +
      "latitude=" + place.latitude +
      "&longitude=" + place.longitude +
      "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m" +
      "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
      "&timezone=auto&forecast_days=3";

    const response = await fetch(url);
    const data = await response.json();

    const current = data.current;
    const info = weatherInfo(current.weather_code);

    document.getElementById("weatherIcon").textContent = info[0];
    document.getElementById("temperature").textContent =
      Math.round(current.temperature_2m) + "°C";

    document.getElementById("weatherDescription").textContent =
      info[1];

    document.getElementById("cityName").textContent =
      place.name + (place.country ? ", " + place.country : "");

    document.getElementById("feelsLike").textContent =
      Math.round(current.apparent_temperature) + "°C";

    document.getElementById("windSpeed").textContent =
      Math.round(current.wind_speed_10m) + " km/u";

    document.getElementById("humidity").textContent =
      current.relative_humidity_2m + "%";

    const forecast = data.daily;

    document.getElementById("forecast").innerHTML =
      forecast.time.map((day, index) => {
        const dayInfo = weatherInfo(forecast.weather_code[index]);
        const date = new Date(day + "T12:00:00").toLocaleDateString(
          "nl-BE",
          { weekday: "long", day: "numeric" }
        );

        return date + ": " + dayInfo[0] + " " +
          Math.round(forecast.temperature_2m_min[index]) +
          "° / " +
          Math.round(forecast.temperature_2m_max[index]) + "°";
      }).join("<br>");

    status.textContent = "Weer bijgewerkt";

  } catch (error) {
    status.textContent = "Fout: " + error.message;
  }
}

searchWeather.addEventListener("click", loadWeather);

cityInput.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    loadWeather();
  }
});

loadWeather();
setInterval(loadWeather, 15 * 60 * 1000);

const utilityPanel = document.getElementById("utilityPanel");
const utilityContent = document.getElementById("utilityContent");
const utilityTitle = document.getElementById("utilityTitle");

let timerInterval = null;
let timerRemaining = 0;
let timerEnd = 0;
let stopwatchInterval = null;
let stopwatchStart = 0;
let stopwatchElapsed = 0;
let calendarMonth = new Date().getMonth();
let calendarYear = new Date().getFullYear();

function showTool(name) {
  utilityPanel.hidden = false;
  utilityTitle.textContent = name;

  if (name === "Timer") {
    renderTimer();
  } else if (name === "Stopwatch") {
    renderStopwatch();
  } else if (name === "Kalender") {
    renderCalendar();
  } else {
    utilityContent.innerHTML = "<p>Deze functie komt later beschikbaar.</p>";
  }

  utilityPanel.scrollIntoView({ behavior: "smooth" });
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return [h, m, s]
    .map(n => String(n).padStart(2, "0"))
    .join(":");
}

// TIMER

function renderTimer() {
  utilityContent.innerHTML = `
    <p class="utility-message">Stel je gewenste tijd in</p>
    <div class="utility-input">
      <input id="timerMinutes" type="number"
        min="0" max="999" value="5" aria-label="Minuten">
      <input id="timerSeconds" type="number"
        min="0" max="59" value="0" aria-label="Seconden">
    </div>
    <div class="utility-display" id="timerDisplay">00:05:00</div>
    <div class="utility-buttons">
      <button id="timerStart">▶ START</button>
      <button id="timerPause" class="secondary">Ⅱ PAUZE</button>
      <button id="timerReset" class="secondary">↻ RESET</button>
    </div>
    <p class="utility-message" id="timerStatus">Timer klaar</p>
  `;

  document.getElementById("timerStart").onclick = () => {
    if (timerInterval) return;

    if (timerRemaining <= 0) {
      const minutes = Number(document.getElementById("timerMinutes").value);
      const seconds = Number(document.getElementById("timerSeconds").value);

      if (!Number.isInteger(minutes) || !Number.isInteger(seconds) ||
          minutes < 0 || minutes > 999 || seconds < 0 || seconds > 59 ||
          minutes * 60 + seconds <= 0) {
        document.getElementById("timerStatus").textContent =
          "Vul een geldige tijd in.";
        return;
      }

      timerRemaining = minutes * 60 + seconds;
    }

    timerEnd = Date.now() + timerRemaining * 1000;

    document.getElementById("timerStatus").textContent =
      "Timer loopt...";

    timerInterval = setInterval(() => {
      timerRemaining = Math.max(
        0, Math.ceil((timerEnd - Date.now()) / 1000)
      );

      document.getElementById("timerDisplay").textContent =
        formatTime(timerRemaining);

      if (timerRemaining <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        document.getElementById("timerStatus").textContent =
          "⏰ De timer is afgelopen!";
      }
    }, 250);
  };

  document.getElementById("timerPause").onclick = () => {
    if (!timerInterval) return;

    timerRemaining = Math.max(
      0, Math.ceil((timerEnd - Date.now()) / 1000)
    );

    clearInterval(timerInterval);
    timerInterval = null;

    document.getElementById("timerDisplay").textContent =
      formatTime(timerRemaining);

    document.getElementById("timerStatus").textContent =
      "Timer gepauzeerd";
  };

  document.getElementById("timerReset").onclick = () => {
    clearInterval(timerInterval);
    timerInterval = null;
    timerRemaining = 0;

    document.getElementById("timerDisplay").textContent =
      "00:00:00";

    document.getElementById("timerStatus").textContent =
      "Timer gereset";
  };
}

// STOPWATCH

function renderStopwatch() {
  utilityContent.innerHTML = `
    <p class="utility-message">Stopwatch</p>
    <div class="utility-display" id="stopwatchDisplay">00:00:00</div>
    <div class="utility-buttons">
      <button id="watchStart">▶ START</button>
      <button id="watchPause" class="secondary">Ⅱ PAUZE</button>
      <button id="watchReset" class="secondary">↻ RESET</button>
    </div>
    <p class="utility-message" id="watchStatus">Klaar</p>
  `;

  function updateStopwatch() {
    const elapsed = stopwatchElapsed + (
      stopwatchStart ? Date.now() - stopwatchStart : 0
    );

    const totalSeconds = Math.floor(elapsed / 1000);

    document.getElementById("stopwatchDisplay").textContent =
      formatTime(totalSeconds);
  }

  document.getElementById("watchStart").onclick = () => {
    if (stopwatchInterval) return;

    stopwatchStart = Date.now();

    stopwatchInterval = setInterval(updateStopwatch, 200);

    document.getElementById("watchStatus").textContent =
      "Stopwatch loopt";
  };

  document.getElementById("watchPause").onclick = () => {
    if (!stopwatchInterval) return;

    stopwatchElapsed += Date.now() - stopwatchStart;
    stopwatchStart = 0;

    clearInterval(stopwatchInterval);
    stopwatchInterval = null;

    updateStopwatch();

    document.getElementById("watchStatus").textContent =
      "Gepauzeerd";
  };

  document.getElementById("watchReset").onclick = () => {
    clearInterval(stopwatchInterval);
    stopwatchInterval = null;
    stopwatchStart = 0;
    stopwatchElapsed = 0;

    updateStopwatch();

    document.getElementById("watchStatus").textContent =
      "Stopwatch gereset";
  };
}

// KALENDER

function renderCalendar() {
  const firstDay = new Date(calendarYear, calendarMonth, 1);
  const daysInMonth = new Date(
    calendarYear, calendarMonth + 1, 0
  ).getDate();

  const today = new Date();

  const monthName = firstDay.toLocaleDateString("nl-BE", {
    month: "long",
    year: "numeric"
  });

  let html = `
    <div class="calendar-navigation">
      <button id="previousMonth">◀</button>
      <strong>${monthName}</strong>
      <button id="nextMonth">▶</button>
    </div>
    <div class="calendar-grid">
  `;

  ["MA", "DI", "WO", "DO", "VR", "ZA", "ZO"].forEach(day => {
    html += `<div class="calendar-heading">${day}</div>`;
  });

  const offset = (firstDay.getDay() + 6) % 7;

  for (let i = 0; i < offset; i++) {
    html += "<div></div>";
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const isToday =
      day === today.getDate() &&
      calendarMonth === today.getMonth() &&
      calendarYear === today.getFullYear();

    html += `
      <div class="${isToday ? "today" : ""}">
        ${day}
      </div>
    `;
  }

  html += "</div>";
  html += `<p class="utility-message">
    Vandaag: ${today.toLocaleDateString("nl-BE")}
  </p>`;

  utilityContent.innerHTML = html;

  document.getElementById("previousMonth").onclick = () => {
    calendarMonth--;

    if (calendarMonth < 0) {
      calendarMonth = 11;
      calendarYear--;
    }

    renderCalendar();
  };

  document.getElementById("nextMonth").onclick = () => {
    calendarMonth++;

    if (calendarMonth > 11) {
      calendarMonth = 0;
      calendarYear++;
    }

    renderCalendar();
  };
}

// SLUITEN

document.getElementById("closeUtility").onclick = () => {
  utilityPanel.hidden = true;
};