// API Keys 
const WEATHER_API_KEY = '8a7b49ba213a1c072ac4841884e60e22';
const NASA_API_KEY = 'Gq9l8yscRIuqQ0IvqfXMWkwYkWdMWXcyR1kdESew';

// Default location
const DEFAULT_LOCATION = { city: 'Troy', state: 'NY', country: 'US' };

// API URLs
const NASA_URL = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    setGreeting();
    fetchWeatherData(); // Fetch default Troy, NY weather
    fetchNASAData();
    
    // Add event listener for geolocation button
    const locationBtn = document.getElementById('use-location-btn');
    if (locationBtn) {
        locationBtn.addEventListener('click', useGeolocation);
    }
});

// Set time-based greeting
function setGreeting() {
    const hour = new Date().getHours();
    let greeting = '';
    
    if (hour < 12) {
        greeting = '🌅 Good Morning, Troy!';
    } else if (hour < 18) {
        greeting = '☀️ Good Afternoon, Troy!';
    } else {
        greeting = '🌙 Good Evening, Troy!';
    }
    
    document.getElementById('greeting').textContent = greeting;
}

// Use Geolocation API
function useGeolocation() {
    const btn = document.getElementById('use-location-btn');
    
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }
    
    // Disable button while fetching
    btn.disabled = true;
    btn.textContent = '📍 Getting location...';
    
    navigator.geolocation.getCurrentPosition(
        // Success callback
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            fetchWeatherByCoords(lat, lon);
            btn.textContent = '✅ Using Your Location';
        },
        // Error callback
        (error) => {
            console.error('Geolocation error:', error);
            let errorMsg = 'Unable to get your location. ';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg += 'Permission denied. Please allow location access.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg += 'Location information unavailable.';
                    break;
                case error.TIMEOUT:
                    errorMsg += 'Location request timed out.';
                    break;
                default:
                    errorMsg += 'An unknown error occurred.';
            }
            
            alert(errorMsg);
            btn.disabled = false;
            btn.textContent = '📍 Use My Location';
            
            // Fall back to Troy, NY
            fetchWeatherData();
        }
    );
}

// Fetch Weather Data by Coordinates (for geolocation)
async function fetchWeatherByCoords(lat, lon) {
    const WEATHER_URL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=imperial`;
    
    const loadingEl = document.getElementById('weather-loading');
    const errorEl = document.getElementById('weather-error');
    const contentEl = document.getElementById('weather-content');
    
    try {
        loadingEl.style.display = 'block';
        contentEl.style.display = 'none';
        errorEl.style.display = 'none';
        
        const response = await fetch(WEATHER_URL);
        
        if (!response.ok) {
            throw new Error(`Weather API Error: ${response.status}`);
        }
        
        const data = await response.json();
        displayWeatherData(data);
        
        // Update location title
        document.getElementById('location-title').textContent = `Current Weather in ${data.name}`;
        
        loadingEl.style.display = 'none';
        contentEl.style.display = 'block';
        
    } catch (error) {
        console.error('Error fetching weather data:', error);
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
        errorEl.textContent = `Unable to load weather data. ${error.message}`;
    }
}

// Fetch Weather Data (default Troy, NY)
async function fetchWeatherData() {
    const WEATHER_URL = `https://api.openweathermap.org/data/2.5/weather?q=Troy,NY,US&appid=${WEATHER_API_KEY}&units=imperial`;
    
    const loadingEl = document.getElementById('weather-loading');
    const errorEl = document.getElementById('weather-error');
    const contentEl = document.getElementById('weather-content');
    
    try {
        const response = await fetch(WEATHER_URL);
        
        if (!response.ok) {
            throw new Error(`Weather API Error: ${response.status}`);
        }
        
        const data = await response.json();
        displayWeatherData(data);
        
        loadingEl.style.display = 'none';
        contentEl.style.display = 'block';
        
    } catch (error) {
        console.error('Error fetching weather data:', error);
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
        errorEl.textContent = `Unable to load weather data. ${error.message}. The API key may still be activating (wait 10-30 minutes).`;
    }
}

// Display Weather Data
function displayWeatherData(data) {
    // Main weather info
    document.getElementById('temp').textContent = Math.round(data.main.temp);
    document.getElementById('weather-description').textContent = data.weather[0].description;
    document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    document.getElementById('weather-icon').alt = data.weather[0].description;
    
    // Weather details
    document.getElementById('feels-like').textContent = `${Math.round(data.main.feels_like)}°F`;
    document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    document.getElementById('wind-speed').textContent = `${Math.round(data.wind.speed)} mph`;
    document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
    document.getElementById('visibility').textContent = `${(data.visibility / 1609).toFixed(1)} mi`;
    document.getElementById('cloudiness').textContent = `${data.clouds.all}%`;
    
    // Sunrise and sunset
    document.getElementById('sunrise').textContent = formatTime(data.sys.sunrise, data.timezone);
    document.getElementById('sunset').textContent = formatTime(data.sys.sunset, data.timezone);
}

// Format Unix timestamp to readable time
function formatTime(timestamp, timezone) {
    const date = new Date((timestamp + timezone) * 1000);
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return `${displayHours}:${minutes} ${ampm}`;
}

// Fetch NASA APOD Data
async function fetchNASAData() {
    const loadingEl = document.getElementById('apod-loading');
    const errorEl = document.getElementById('apod-error');
    const contentEl = document.getElementById('apod-content');
    
    try {
        const response = await fetch(NASA_URL);
        
        if (!response.ok) {
            throw new Error(`NASA API Error: ${response.status}`);
        }
        
        const data = await response.json();
        displayNASAData(data);
        
        loadingEl.style.display = 'none';
        contentEl.style.display = 'block';
        
    } catch (error) {
        console.error('Error fetching NASA data:', error);
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
        errorEl.textContent = `Unable to load NASA data. ${error.message}`;
    }
}

// Display NASA APOD Data
function displayNASAData(data) {
    document.getElementById('apod-title').textContent = data.title;
    document.getElementById('apod-date').textContent = `Date: ${data.date}`;
    document.getElementById('apod-explanation').textContent = data.explanation;
    
    // Handle image or video
    if (data.media_type === 'image') {
        document.getElementById('apod-image').src = data.url;
        document.getElementById('apod-image').alt = data.title;
    } else {
        // If it's a video, show the thumbnail
        document.getElementById('apod-image').src = data.thumbnail_url || data.url;
    }
    
    // Copyright info
    if (data.copyright) {
        document.getElementById('apod-copyright').textContent = `© ${data.copyright}`;
    }
}