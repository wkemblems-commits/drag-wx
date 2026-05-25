async function getWeather() {
  const location = document.getElementById('location').value.trim() || "current";
  const results = document.getElementById('results');
  
  results.innerHTML = `<p class="text-center py-8">Fetching track conditions...</p>`;
  results.classList.remove('hidden');

  try {
    let lat, lon, placeName = location;

    if (location === "current") {
      const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
      lat = pos.coords.latitude;
      lon = pos.coords.longitude;
    } else {
      const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`);
      const geoData = await geo.json();
      lat = geoData.results[0].latitude;
      lon = geoData.results[0].longitude;
      placeName = geoData.results[0].name;
    }

    const weather = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,pressure_msl,wind_speed_10m,wind_direction_10m`
    );
    const data = await weather.json();

    const tempC = data.current.temperature_2m;
    const humidity = data.current.relative_humidity_2m;
    const pressure = data.current.pressure_msl;
    const windSpeed = data.current.wind_speed_10m;

    const da = calculateDA(tempC, pressure, humidity);

    results.innerHTML = `
      <div class="card rounded-3xl p-8 border border-cyan-400">
        <h2 class="text-3xl font-bold text-cyan-300">${placeName}</h2>
        <div class="mt-8 text-center">
          <p class="text-sm uppercase tracking-widest text-gray-400">Density Altitude</p>
          <p class="text-7xl font-bold text-white mt-2">${da.toFixed(0)} <span class="text-3xl">ft</span></p>
        </div>
        <div class="grid grid-cols-3 gap-4 mt-10 text-center">
          <div><p class="text-xs text-gray-400">TEMP</p><p class="text-2xl">${tempC}°C</p></div>
          <div><p class="text-xs text-gray-400">HUMIDITY</p><p class="text-2xl">${humidity}%</p></div>
          <div><p class="text-xs text-gray-400">WIND</p><p class="text-2xl">${windSpeed} km/h</p></div>
        </div>
      </div>
    `;
  } catch(e) {
    results.innerHTML = `<p class="text-red-400 text-center py-8">Error fetching data. Check internet.</p>`;
  }
}

function calculateDA(tempC, pressureHpa, humidity) {
  const tempF = tempC * 1.8 + 32;
  const altPressure = (29.92 - pressureHpa / 33.8639) * 1000;
  return altPressure + 118.8 * (tempF - 59) - (humidity * 0.37);
}

// Register Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

