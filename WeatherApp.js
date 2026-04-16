// Initialize Icons
lucide.createIcons();

// DOM Elements
const form = document.getElementById('search-form');
const input = document.getElementById('city-input');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const weatherContent = document.getElementById('weather-content');
const errorMessage = document.getElementById('error-message');

// Weather Mapping (WMO codes to descriptions and Lucide icons)
function getWeatherInfo(code, isDay = 1) {
    const map = {
        0: { desc: 'Clear sky', icon: isDay ? 'sun' : 'moon' },
        1: { desc: 'Mainly clear', icon: isDay ? 'cloud-sun' : 'cloud-moon' },
        2: { desc: 'Partly cloudy', icon: 'cloud' },
        3: { desc: 'Overcast', icon: 'cloud' },
        45: { desc: 'Fog', icon: 'cloud-fog' },
        48: { desc: 'Depositing rime fog', icon: 'cloud-fog' },
        51: { desc: 'Light drizzle', icon: 'cloud-drizzle' },
        53: { desc: 'Moderate drizzle', icon: 'cloud-drizzle' },
        55: { desc: 'Dense drizzle', icon: 'cloud-drizzle' },
        61: { desc: 'Light rain', icon: 'cloud-rain' },
        63: { desc: 'Moderate rain', icon: 'cloud-rain' },
        65: { desc: 'Heavy rain', icon: 'cloud-rain' },
        71: { desc: 'Light snow', icon: 'snowflake' },
        73: { desc: 'Moderate snow', icon: 'snowflake' },
        75: { desc: 'Heavy snow', icon: 'snowflake' },
        77: { desc: 'Snow grains', icon: 'snowflake' },
        80: { desc: 'Slight rain showers', icon: 'cloud-rain' },
        81: { desc: 'Moderate rain showers', icon: 'cloud-rain' },
        82: { desc: 'Violent rain showers', icon: 'cloud-rain' },
        85: { desc: 'Slight snow showers', icon: 'snowflake' },
        86: { desc: 'Heavy snow showers', icon: 'snowflake' },
        95: { desc: 'Thunderstorm', icon: 'cloud-lightning' },
        96: { desc: 'Thunderstorm & slight hail', icon: 'cloud-lightning' },
        99: { desc: 'Thunderstorm & heavy hail', icon: 'cloud-lightning' }
    };
    return map[code] || { desc: 'Unknown', icon: 'cloud' };
}

// Helper: Format Date
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// Fetch Location & Weather
async function fetchWeather(city) {
    showLoading();

    try {
        // 1. Get Coordinates using Open-Meteo Geocoding API
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('City not found');
        }

        const location = geoData.results[0];
        
        // 2. Get Weather using Open-Meteo Forecast API
        const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
        );
        const weatherData = await weatherRes.json();

        updateUI(location, weatherData);
    } catch (error) {
        showError(error.message === 'City not found' ? 'City not found. Please check your spelling.' : 'Unable to connect to weather service.');
    }
}

// Update the User Interface
function updateUI(location, weather) {
    // Update Text Data
    document.getElementById('city-name').textContent = location.name;
    document.getElementById('country-name').textContent = location.country || '';
    document.getElementById('current-temp').textContent = Math.round(weather.current.temperature_2m);
    document.getElementById('feels-like').textContent = Math.round(weather.current.apparent_temperature);
    document.getElementById('humidity').textContent = `${weather.current.relative_humidity_2m}%`;
    document.getElementById('wind-speed').textContent = `${weather.current.wind_speed_10m} km/h`;

    // Update Current Weather Icon & Description
    const currentInfo = getWeatherInfo(weather.current.weather_code, weather.current.is_day);
    document.getElementById('weather-desc').textContent = currentInfo.desc;
    document.getElementById('weather-icon-container').innerHTML = `<i data-lucide="${currentInfo.icon}" class="w-16 h-16 drop-shadow-lg"></i>`;

    // Update Forecast
    const forecastContainer = document.getElementById('forecast-container');
    forecastContainer.innerHTML = ''; // Clear previous

    // Loop through next 5 days
    for (let i = 1; i <= 5; i++) {
        if(!weather.daily.time[i]) break;

        const dateStr = weather.daily.time[i];
        const maxTemp = Math.round(weather.daily.temperature_2m_max[i]);
        const minTemp = Math.round(weather.daily.temperature_2m_min[i]);
        const code = weather.daily.weather_code[i];
        const info = getWeatherInfo(code, 1); // assume day for forecast icon

        const itemHTML = `
            <div class="glass rounded-xl p-3 flex items-center justify-between hover:bg-white/10 transition-colors">
                <div class="flex items-center gap-4 w-1/2">
                    <i data-lucide="${info.icon}" class="w-6 h-6 text-gray-300"></i>
                    <span class="text-sm font-medium text-gray-200">${formatDate(dateStr)}</span>
                </div>
                <div class="flex items-center justify-end gap-3 w-1/2">
                    <span class="text-xs text-gray-400 capitalize hidden sm:block">${info.desc}</span>
                    <div class="text-sm font-medium w-16 text-right">
                        <span class="text-white">${maxTemp}°</span>
                        <span class="text-gray-500 ml-1">${minTemp}°</span>
                    </div>
                </div>
            </div>
        `;
        forecastContainer.insertAdjacentHTML('beforeend', itemHTML);
    }

    // Re-initialize icons for dynamically added content
    lucide.createIcons();
    showContent();
}

// UI State Managers
function showLoading() {
    errorState.classList.add('hidden');
    weatherContent.classList.add('hidden');
    weatherContent.classList.remove('opacity-100');
    loadingState.classList.remove('hidden');
    loadingState.classList.add('flex');
}

function showError(msg) {
    loadingState.classList.add('hidden');
    loadingState.classList.remove('flex');
    weatherContent.classList.add('hidden');
    weatherContent.classList.remove('opacity-100');
    errorMessage.textContent = msg;
    errorState.classList.remove('hidden');
    errorState.classList.add('flex');
}

function showContent() {
    loadingState.classList.add('hidden');
    loadingState.classList.remove('flex');
    errorState.classList.add('hidden');
    errorState.classList.remove('flex');
    weatherContent.classList.remove('hidden');
    
    // Trigger fade in
    setTimeout(() => {
        weatherContent.classList.add('opacity-100');
    }, 50);
}

// Event Listeners
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const city = input.value.trim();
    if (city) {
        fetchWeather(city);
        input.blur(); // dismiss mobile keyboard
    }
});

// Initial Load (Default to Karachi based on context)
fetchWeather('Karachi');