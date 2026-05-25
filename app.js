async function getWeather() {
  const input = document.getElementById('location').value.trim();
  const results = document.getElementById('results');
  
  results.innerHTML = `<p class="text-center py-8 text-cyan-400">Fetching track conditions...</p>`;
  results.classList.remove('hidden');

  try {
    let lat, lon, placeName = "Current Location";

    if (!input) {
      // Use current GPS location
      const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
      lat = pos.coords.latitude;
      lon = pos.coords.longitude;
    } else {
      // Try to find location
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(input)}&count=3`);
      const geoData = await geoRes.json();

      if (geoData.results && geoData.results.length > 0) {
        lat = geoData.results[0].latitude;
        lon = geoData.results[0].longitude;
        placeName = geoData.results[0].name;
        if (geoData.results[0].admin1) placeName += ", " + geoData.results[0].admin1;
      } else {
        throw new Error("Location not found");
      }
    }

    // Get weather data
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,pressure_msl,wind_speed_10m,wind_direction_10m`
    );
    const data = await weatherRes.json();

    const tempC = data.current.temperature_2m;
    const humidity = data.current.relative_humidity_2m;
    const pressureHpa = data.current.pressure_msl;
    const windSpeed = data.current.wind_speed_10m;

    const da = calculateDensityAltitude(tempC, pressureHpa, humidity);
    const grains = calculateGrainsOfWater(tempC, humidity);

    results.innerHTML = `
      <div class="card rounded-3xl p-8 border border-cyan-400">
        <h2 class="text-3xl font-bold text-cyan-300">${placeName}</h2>
        
        <div class="mt-8 text-center">
          <p class="text-sm uppercase tracking-widest text-gray-400">DENSITY ALTITUDE</p>
          <p class="text-7xl font-bold text-white mt-2">${da.toFixed(0)} <span class="text-4xl">ft</span></p>
        </div>

        <div class="grid grid-cols-2 gap-6 mt-10 text-center">
          <div>
            <p class="text-xs text-gray-400">GRAINS OF WATER</p>
            <p class="text-4xl font-bold">${grains.toFixed(0)}</p>
          </div>
          <div>
            <p class="text-xs text-gray-400">TEMPERATURE</p>
            <p class="text-4xl font-bold">${tempC}°C</p>
          </div>
        </div>

        <div class="mt-8 text-center text-sm text-gray-300">
          Wind: ${windSpeed} km/h • Humidity: ${humidity}%
        </div>
      </div>
    `;

  } catch (e) {
    console.error(e);
    results.innerHTML = `
      <div class="card rounded-3xl p-8 border border-red-500 text-center">
        <p class="text-red-400 text-xl">Failed to fetch data</p>
        <p class="text-sm mt-4">Try these tips:</p>
        <ul class="text-left text-sm mt-3 space-y-1">
          <li>• Use city + state (e.g. "Gainesville, FL")</li>
          <li>• Try just the city name</li>
          <li>• Leave blank to use your current GPS location</li>
        </ul>
        <button onclick="getWeather()" class="mt-6 bg-red-600 hover:bg-red-700 px-8 py-3 rounded-xl">
          Try Again
        </button>
      </div>
    `;
  }
}

// Accurate calculations (same as before)
function calculateDensityAltitude(tempC, pressureHpa, humidity) {
  const tempK = tempC + 273.15;
  const pressurePa = pressureHpa * 100;
  const svp = 610.94 * Math.exp(17.625 * tempC / (tempC + 243.04));
  const vp = (humidity / 100) * svp;
  const virtualTempK = tempK * (1 + 0.000425 * vp);
  const daMeters = 145442.16 * (1 - Math.pow((pressurePa * (288.15 / virtualTempK) / 101325), 0.190284));
  return daMeters / 0.3048; // to feet
}

function calculateGrainsOfWater(tempC, humidity) {
  const svp = 610.94 * Math.exp(17.625 * tempC / (tempC + 243.04));
  const vp = (humidity / 100) * svp;
  return (vp * 0.622 / (1013.25 - vp)) * 7000;
}

// Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}
