document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    // Initialize swipe navigation
    SwipeNavigation.init();
});

function initializeApp() {
    const currentPage = window.location.pathname.split('/').pop();
    
    // Initialize common functionality
    initCommonFeatures();
    
    // Load user data and update navigation
    loadUserData();
    
    // Initialize page-specific functionality
    if (currentPage === 'crop-recommendation.html') {
        initCropRecommendation();
    } else if (currentPage === 'disease-detection.html') {
        initDiseaseDetection();
    } else if (currentPage === 'weather.html') {
        initWeather();
    } else if (currentPage === 'market-price.html') {
        initMarketPrices();
    } else if (currentPage === 'chatbot.html') {
        initChatbot();
    } else if (currentPage === 'profile.html') {
        initProfile();
    } else if (currentPage === 'dashboard.html') {
        initDashboard();
    } else if (currentPage === 'history.html') {
        initHistory();
    } else if (currentPage === 'settings.html') {
        initSettings();
    } else if (currentPage === 'login.html') {
        initLogin();
    }
    
    // Track page visit
    Analytics.trackAction('page_visit', { page: currentPage });
}

function initCommonFeatures() {
    // Update navigation for all pages
    Navigation.updateNavigation();
    
    // Setup mobile app integration
    if (CrossPlatform.isMobileApp()) {
        document.body.classList.add('mobile-app');
        CrossPlatform.syncWithMobile();
    }
    
    // Setup offline indicators
    setupOfflineIndicators();
    
    // If site-dashboard-theme is present, enable lightweight parallax background
    if (document.body.classList.contains('site-dashboard-theme')) {
        initDashboardBgParallax();
    }
    
    // Check for page data
    const pageData = Navigation.getPageData();
    if (pageData) {
        handlePageData(pageData);
    }
}

// Lightweight dashboard background parallax (mouse-based, low impact)
function initDashboardBgParallax() {
    try {
        const bg = document.querySelector('.dashboard-bg');
        if (!bg) return;
        const orbs = bg.querySelectorAll('.orb');
        let w = window.innerWidth, h = window.innerHeight;
        window.addEventListener('resize', () => { w = window.innerWidth; h = window.innerHeight; });

        document.addEventListener('pointermove', (e) => {
            const x = (e.clientX / w - 0.5) * 2; // -1..1
            const y = (e.clientY / h - 0.5) * 2;
            bg.style.transform = `translate3d(${x * 8}px, ${y * 6}px, 0)`;
            orbs.forEach((orb, i) => {
                const depth = (i + 1) * 6;
                orb.style.transform = `translate3d(${ -x * depth }px, ${ -y * depth }px, 0)`;
            });
        }, { passive: true });
    } catch (e) {
        console.warn('Error initializing dashboard background parallax', e);
    }
}

// Global utility functions for debugging/emergency use
window.AgriSmartDebug = {
    clearAllData: function() {
        console.log('🚨 Clearing all AgriSmart data...');
        StorageManager.logout();
        console.log('✅ All data cleared. Reloading page...');
        window.location.reload();
    },
    
    showStoredData: function() {
        console.log('📦 Current stored data:');
        console.log('User:', StorageManager.getUser());
        console.log('Token:', StorageManager.getToken() ? 'Present' : 'None');
        console.log('Preferences:', JSON.parse(localStorage.getItem('agrismart_prefs') || '{}'));
    }
};

function loadUserData() {
    let userData = StorageManager.getUser();

    if (userData) {
        updateUserInterface(userData);
        // Auto-sync with mobile if available
        if (CrossPlatform.isMobileApp()) {
            CrossPlatform.syncWithMobile();
        }
    } else {
        // If not on login page and no user data, redirect to login
        const currentPage = window.location.pathname.split('/').pop();
        const publicPages = ['login.html', 'login', 'index.html', 'index', ''];
        if (!publicPages.includes(currentPage)) {
            window.location.href = 'login.html';
        }
    }
}

function updateUserInterface(user) {
    // Update profile links and user name displays
    const profileLinks = document.querySelectorAll('.profile-info, .user-name');
    profileLinks.forEach(link => {
        link.textContent = user.name || user.phone || 'User';
    });
    
    // Update user avatar if present
    const avatars = document.querySelectorAll('.user-avatar');
    avatars.forEach(avatar => {
        avatar.src = user.avatar || 'https://via.placeholder.com/40/4CAF50/FFFFFF?text=U';
        avatar.alt = user.name || 'User';
    });
    
    // Update welcome messages
    const welcomeMessages = document.querySelectorAll('.welcome-user');
    welcomeMessages.forEach(msg => {
        msg.textContent = `Welcome, ${user.name || user.phone}!`;
    });
    
    // Update location-based content if available
    if (user.location) {
        const locationElements = document.querySelectorAll('.user-location');
        locationElements.forEach(el => {
            el.textContent = user.location;
        });
    }
}

function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading...</p></div>';
    }
}

function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '';
    }
}

function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
}

function initCropRecommendation() {
    const form = document.getElementById('crop-form');
    if (form) {
        form.addEventListener('submit', handleCropRecommendation);
    }
}

async function handleCropRecommendation(e) {
    e.preventDefault();
    showLoading('crop-results');
    
    const formData = {
        nitrogen: document.getElementById('nitrogen').value,
        phosphorus: document.getElementById('phosphorus').value,
        potassium: document.getElementById('potassium').value,
        ph: document.getElementById('ph').value,
        rainfall: document.getElementById('rainfall').value,
        temperature: document.getElementById('temperature').value,
        humidity: document.getElementById('humidity').value,
        location: document.getElementById('location').value
    };

    try {
        const recommendations = await API.getCropRecommendation(formData);
        displayCropRecommendations(recommendations);
    } catch (error) {
        showAlert('Error getting recommendations. Please try again.', 'error');
        hideLoading('crop-results');
    }
}

function displayCropRecommendations(data) {
    const resultsDiv = document.getElementById('crop-results');
    resultsDiv.innerHTML = `
        <div class="result-card">
            <h3>Recommended Crops</h3>
            <div class="crop-list">
                ${data.crops.map(crop => `
                    <div class="crop-item">
                        <h4>${crop.name}</h4>
                        <p>Suitability: ${crop.suitability}%</p>
                        <p>Expected Yield: ${crop.yield} kg/acre</p>
                        <p>Profit Margin: ₹${crop.profit}</p>
                        <p>Sustainability Score: ${crop.sustainability}/10</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function initDiseaseDetection() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('disease-image');
    
    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleDiseaseImage);
    }
}

async function handleDiseaseImage(e) {
    const file = e.target.files[0];
    if (!file) return;

    showLoading('disease-results');
    
    const formData = new FormData();
    formData.append('image', file);

    try {
        const result = await API.detectDisease(formData);
        displayDiseaseResults(result);
    } catch (error) {
        showAlert('Error detecting disease. Please try again.', 'error');
        hideLoading('disease-results');
    }
}

function displayDiseaseResults(data) {
    const resultsDiv = document.getElementById('disease-results');
    resultsDiv.innerHTML = `
        <div class="result-card">
            <h3>Detection Results</h3>
            <p><strong>Disease:</strong> ${data.disease}</p>
            <p><strong>Confidence:</strong> ${data.confidence}%</p>
            <p><strong>Severity:</strong> ${data.severity}</p>
            <h4>Treatment Recommendations:</h4>
            <ul>
                ${data.treatments.map(treatment => `<li>${treatment}</li>`).join('')}
            </ul>
            <h4>Prevention Tips:</h4>
            <ul>
                ${data.prevention.map(tip => `<li>${tip}</li>`).join('')}
            </ul>
        </div>
    `;
}

function initWeather() {
    const locationInput = document.getElementById('weather-location');
    const searchBtn = document.getElementById('search-weather');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const location = locationInput?.value || 'Default';
            fetchWeatherData(location);
        });
    }
    
    // Check if user is authenticated before fetching data
    const userData = StorageManager.getUser();
    if (userData) {
        fetchWeatherData('Default');
    } else {
        // Show demo weather data if not logged in
        showDemoWeatherData();
    }
}

async function fetchWeatherData(location) {
    showLoading('weather-display');
    
    try {
        const weatherData = await API.getWeather(location);
        displayWeather(weatherData);
    } catch (error) {
        console.error('Weather fetch error:', error);
        showDemoWeatherData();
    }
}

function showDemoWeatherData() {
    const demoData = {
        location: 'Demo Location',
        current: {
            temperature: 28,
            condition: 'Partly Cloudy',
            humidity: 65,
            windSpeed: 12
        },
        forecast: [
            { date: 'Mon', condition: 'Sunny', temp: 30, rainfall: 0 },
            { date: 'Tue', condition: 'Cloudy', temp: 26, rainfall: 2 },
            { date: 'Wed', condition: 'Rainy', temp: 24, rainfall: 15 },
            { date: 'Thu', condition: 'Sunny', temp: 29, rainfall: 0 },
            { date: 'Fri', condition: 'Partly Cloudy', temp: 27, rainfall: 1 },
            { date: 'Sat', condition: 'Thunderstorms', temp: 25, rainfall: 20 },
            { date: 'Sun', condition: 'Sunny', temp: 31, rainfall: 0 }
        ]
    };
    displayWeather(demoData);
}

function displayWeather(data) {
    const weatherDiv = document.getElementById('weather-display');
    weatherDiv.innerHTML = `
        <div class="weather-current">
            <h3>${data.location}</h3>
            <p class="temp">${data.current.temperature}°C</p>
            <p>${data.current.condition}</p>
            <p>Humidity: ${data.current.humidity}%</p>
            <p>Wind: ${data.current.windSpeed} km/h</p>
        </div>
        <div class="weather-forecast">
            <h3>7-Day Forecast</h3>
            <div class="forecast-grid">
                ${data.forecast.map(day => `
                    <div class="weather-card">
                        <p><strong>${day.date}</strong></p>
                        <p>${day.condition}</p>
                        <p>${day.temp}°C</p>
                        <p>Rain: ${day.rainfall}mm</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function initMarketPrices() {
    const cropSelect = document.getElementById('crop-select');
    const searchBtn = document.getElementById('search-prices');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const crop = cropSelect?.value || 'wheat';
            fetchMarketPrices(crop);
        });
    }
    
    // Check if user is authenticated before fetching data
    const userData = StorageManager.getUser();
    if (userData) {
        fetchMarketPrices('wheat');
    } else {
        // Show demo market data if not logged in
        showDemoMarketData();
    }
}

async function fetchMarketPrices(crop) {
    showLoading('price-display');
    
    try {
        const priceData = await API.getMarketPrices(crop);
        displayMarketPrices(priceData);
    } catch (error) {
        console.error('Market price fetch error:', error);
        showDemoMarketData(crop);
    }
}

function showDemoMarketData(crop = 'wheat') {
    const demoData = {
        crop: crop,
        markets: [
            { location: 'Mumbai APMC', price: 2450, change: 5.2, demand: 'High' },
            { location: 'Delhi Azadpur', price: 2380, change: 3.8, demand: 'Medium' },
            { location: 'Bangalore', price: 2420, change: 4.5, demand: 'High' },
            { location: 'Kolkata', price: 2350, change: 2.1, demand: 'Medium' },
            { location: 'Chennai', price: 2400, change: 3.9, demand: 'High' }
        ],
        avgPrice: 2400,
        trend: 'upward'
    };
    displayMarketPrices(demoData);
}

function displayMarketPrices(data) {
    const priceDiv = document.getElementById('price-display');
    priceDiv.innerHTML = `
        <h3>Market Prices for ${data.crop}</h3>
        <table class="price-table">
            <thead>
                <tr>
                    <th>Market</th>
                    <th>Price (₹/kg)</th>
                    <th>Change</th>
                    <th>Demand</th>
                </tr>
            </thead>
            <tbody>
                ${data.markets.map(market => `
                    <tr>
                        <td>${market.location}</td>
                        <td>₹${market.price}</td>
                        <td>${market.change > 0 ? '+' : ''}${market.change}%</td>
                        <td>${market.demand}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <div class="price-chart">
            <h4>Price Trend (Last 30 Days)</h4>
            <p>Average Price: ₹${data.avgPrice}</p>
            <p>Highest: ₹${data.maxPrice} | Lowest: ₹${data.minPrice}</p>
        </div>
    `;
}

function initChatbot() {
    const sendBtn = document.getElementById('send-message');
    const messageInput = document.getElementById('message-input');
    const voiceBtn = document.getElementById('voice-input');
    
    if (sendBtn) {
        sendBtn.addEventListener('click', () => sendMessage());
    }
    
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
    
    if (voiceBtn) {
        voiceBtn.addEventListener('click', startVoiceInput);
    }
}

async function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    addMessageToChat(message, 'user');
    input.value = '';
    
    try {
        const response = await API.sendChatMessage(message);
        addMessageToChat(response.message, 'bot');
    } catch (error) {
        addMessageToChat('Sorry, I could not process your request.', 'bot');
    }
}

function addMessageToChat(text, sender) {
    const messagesDiv = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.textContent = text;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function startVoiceInput() {
    if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.lang = 'en-US';
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            document.getElementById('message-input').value = transcript;
        };
        recognition.start();
    } else {
        showAlert('Voice input not supported in this browser', 'error');
    }
}

function initProfile() {
    loadProfileData();
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

function loadProfileData() {
    const userData = localStorage.getItem('agrismart_user');
    if (userData) {
        const user = JSON.parse(userData);
        displayProfileData(user);
    }
}

function displayProfileData(user) {
    const profileDiv = document.getElementById('profile-data');
    if (profileDiv) {
        profileDiv.innerHTML = `
            <div class="profile-section">
                <h3>Profile Information</h3>
                <p><strong>Name:</strong> ${user.name}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Location:</strong> ${user.location}</p>
                <p><strong>Farm Size:</strong> ${user.farmSize} acres</p>
            </div>
        `;
    }
}

function handleLogout() {
    StorageManager.removeUser();
    StorageManager.removeToken();
    Analytics.trackAction('logout');
    window.location.href = 'index.html';
}

// ============================================
// PAGE-SPECIFIC INITIALIZATION FUNCTIONS
// ============================================

function initDashboard() {
    if (!Navigation.requireAuth()) return;
    
    loadDashboardStats();
    loadRecentActivity();
    setupQuickActions();
}

function initHistory() {
    if (!Navigation.requireAuth()) return;
    
    loadHistoryData();
    setupHistoryFilters();
}

function initSettings() {
    if (!Navigation.requireAuth()) return;
    
    loadUserSettings();
    setupSettingsHandlers();
}

function initLogin() {
    // If already logged in, redirect to dashboard
    const user = StorageManager.getUser();
    if (user) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    setupLoginForm();
}

// ============================================
// COMMON UTILITY FUNCTIONS
// ============================================

function setupOfflineIndicators() {
    // Show offline indicator when offline
    window.addEventListener('offline', () => {
        Notifications.show('You are offline. Some features may not work.', 'warning');
    });
    
    window.addEventListener('online', () => {
        Notifications.show('You are back online!', 'success');
    });
}

function handlePageData(data) {
    // Handle data passed between pages
    if (data.type === 'crop_recommendation_result') {
        // Auto-fill form with previous data
        if (data.formData) {
            Object.keys(data.formData).forEach(key => {
                const element = document.getElementById(key);
                if (element) element.value = data.formData[key];
            });
        }
    }
}

function loadDashboardStats() {
    const history = StorageManager.getHistory();
    
    // Calculate statistics
    const stats = {
        totalRecommendations: history.filter(h => h.type === 'crop-recommendation').length,
        diseaseDetections: history.filter(h => h.type === 'disease-detection').length,
        weatherChecks: history.filter(h => h.type === 'weather-check').length,
        marketQueries: history.filter(h => h.type === 'market-price').length
    };
    
    // Update dashboard stats
    updateDashboardUI(stats);
}

function updateDashboardUI(stats) {
    const statElements = {
        'total-crops': stats.totalRecommendations,
        'disease-checks': stats.diseaseDetections,
        'weather-queries': stats.weatherChecks,
        'market-checks': stats.marketQueries
    };
    
    Object.keys(statElements).forEach(key => {
        const element = document.querySelector(`#${key} .stat-value`);
        if (element) element.textContent = statElements[key];
    });
}

function loadRecentActivity() {
    const history = StorageManager.getHistory();
    const recentActivity = history.slice(-5).reverse();
    
    const activityContainer = document.getElementById('recent-activity');
    if (activityContainer) {
        if (recentActivity.length === 0) {
            activityContainer.innerHTML = '<p>No recent activity</p>';
            return;
        }
        
        const activityHTML = recentActivity.map(activity => `
            <div class="activity-item" onclick="Navigation.goToPageWithData('history.html', {filter: '${activity.type}'})">
                <div class="activity-icon">${getActivityIcon(activity.type)}</div>
                <div class="activity-details">
                    <h5>${formatActivityTitle(activity)}</h5>
                    <small>${DateUtils.timeAgo(activity.timestamp)}</small>
                </div>
            </div>
        `).join('');
        
        activityContainer.innerHTML = activityHTML;
    }
}

function getActivityIcon(type) {
    const icons = {
        'crop-recommendation': '🌾',
        'disease-detection': '🔬',
        'weather-check': '🌤️',
        'market-price': '💰',
        'chatbot': '💬'
    };
    return icons[type] || '📊';
}

function formatActivityTitle(activity) {
    switch(activity.type) {
        case 'crop-recommendation':
            return `Crop Recommendation - ${activity.crop || 'Unknown'}`;
        case 'disease-detection':
            return `Disease Detection - ${activity.disease || 'Analyzed'}`;
        case 'weather-check':
            return `Weather Check - ${activity.location || 'Local'}`;
        case 'market-price':
            return `Market Price - ${activity.crop || 'Commodity'}`;
        case 'chatbot':
            return 'Chatbot Consultation';
        default:
            return 'Activity';
    }
}

function setupQuickActions() {
    // Add click handlers for quick action cards
    const quickActions = document.querySelectorAll('.feature-card[onclick], .quick-action');
    quickActions.forEach(action => {
        action.addEventListener('click', function(e) {
            const href = this.getAttribute('href') || this.dataset.href;
            if (href) {
                Analytics.trackAction('quick_action_click', {action: href});
            }
        });
    });
}

function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;
    
    FormUtils.autoSave('login-form', 'login');
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const loginData = {
            phone: formData.get('phone'),
            password: formData.get('password'),
            remember: formData.get('remember-me') === 'on'
        };
        
        try {
            showLoading('login-btn', 'Logging in...');
            
            // Simulate login API call
            const response = await API.login(loginData);
            
            if (response.success) {
                StorageManager.setUser(response.user);
                StorageManager.setToken(response.token);
                Analytics.trackAction('login', {method: 'phone'});
                
                FormUtils.clearSaved('login');
                Notifications.show('Login successful!', 'success');
                
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                throw new Error(response.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            Notifications.show(error.message || 'Login failed. Please try again.', 'error');
        } finally {
            hideLoading('login-btn');
            document.querySelector('#login-form button[type="submit"]').textContent = 'Login';
        }
    });
}

// ============================================
// SETTINGS FUNCTIONALITY
// ============================================

function loadUserSettings() {
    // Load swipe navigation settings
    const swipeEnabled = StorageManager.getPreference('swipeNavigation', true);
    const swipeLoop = StorageManager.getPreference('swipeLoop', false);
    
    const swipeToggle = document.getElementById('swipe-navigation-toggle');
    const loopToggle = document.getElementById('swipe-loop-toggle');
    
    if (swipeToggle) {
        swipeToggle.checked = swipeEnabled;
    }
    if (loopToggle) {
        loopToggle.checked = swipeLoop;
    }
}

function setupSettingsHandlers() {
    // Swipe navigation toggle
    const swipeToggle = document.getElementById('swipe-navigation-toggle');
    if (swipeToggle) {
        swipeToggle.addEventListener('change', function() {
            SwipeNavigation.setEnabled(this.checked);
            Notifications.show(
                `Swipe navigation ${this.checked ? 'enabled' : 'disabled'}`, 
                'success'
            );
        });
    }
    
    // Swipe loop toggle
    const loopToggle = document.getElementById('swipe-loop-toggle');
    if (loopToggle) {
        loopToggle.addEventListener('change', function() {
            SwipeNavigation.setLoopEnabled(this.checked);
            Notifications.show(
                `Swipe loop ${this.checked ? 'enabled' : 'disabled'}`, 
                'success'
            );
        });
    }
    
    // Settings section navigation
    const sectionButtons = document.querySelectorAll('.settings-menu button');
    const sections = document.querySelectorAll('.settings-section');
    
    sectionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');
            
            // Remove active class from all buttons and sections
            sectionButtons.forEach(btn => btn.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            // Add active class to clicked button and target section
            this.classList.add('active');
            const targetElement = document.getElementById(targetSection);
            if (targetElement) {
                targetElement.classList.add('active');
            }
        });
    });
}

// ============================================
// SWIPE NAVIGATION FUNCTIONALITY
// ============================================

const SwipeNavigation = {
    // Define page navigation order
    pageOrder: [
        'index.html',
        'dashboard.html',
        'crop-recommendation.html',
        'disease-detection.html',
        'weather.html',
        'market-price.html',
        'chatbot.html',
        'history.html',
        'profile.html',
        'settings.html'
    ],

    // Touch event variables
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    minSwipeDistance: 30, // Reduced minimum distance for easier triggering
    maxVerticalDistance: 150, // Increased vertical tolerance
    
    // Initialize swipe navigation
    init() {
        console.log('🔍 Swipe Navigation Init Check:');
        console.log('- Touch device:', this.isTouchDevice());
        console.log('- Swipe enabled:', this.isSwipeEnabled());
        console.log('- Force enable:', this.forceEnable);
        
        // Always initialize for now to test
        this.addEventListeners();
        console.log('🟢 Swipe navigation initialized (forced for testing)');
    },
    
    // Check if device supports touch
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },
    
    // Check if swipe is enabled in settings
    isSwipeEnabled() {
        return StorageManager.getPreference('swipeNavigation', true);
    },
    
    // Add touch and mouse event listeners
    addEventListeners() {
        // Store bound functions for proper removal
        this.boundTouchStart = this.handleTouchStart.bind(this);
        this.boundTouchMove = this.handleTouchMove.bind(this);
        this.boundTouchEnd = this.handleTouchEnd.bind(this);
        this.boundMouseStart = this.handleMouseStart.bind(this);
        this.boundMouseMove = this.handleMouseMove.bind(this);
        this.boundMouseEnd = this.handleMouseEnd.bind(this);

        // touchmove must NOT be passive so we can preventDefault when horizontal swipe detected
        document.addEventListener('touchstart', this.boundTouchStart, { passive: true });
        document.addEventListener('touchmove', this.boundTouchMove, { passive: false });
        document.addEventListener('touchend', this.boundTouchEnd, { passive: true });

        // Also support mouse events for desktop testing
        document.addEventListener('mousedown', this.boundMouseStart);
        document.addEventListener('mousemove', this.boundMouseMove);
        document.addEventListener('mouseup', this.boundMouseEnd);

        this.eventsAdded = true;
    },
    
    // Handle touch start
    handleTouchStart(e) {
        console.log('👆 Touch start detected');
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.startX = touch.clientX;
            this.startY = touch.clientY;
            this.endX = this.startX;
            this.endY = this.startY;
            this.swipeHandled = false;
            console.log('Start position:', this.startX, this.startY);
        }
    },
    
    // Handle touch move - track movement and optionally trigger swipe immediately
    handleTouchMove(e) {
        if (!e.touches || e.touches.length !== 1) return;
        const touch = e.touches[0];
        this.endX = touch.clientX;
        this.endY = touch.clientY;

        const deltaX = this.endX - this.startX;
        const deltaY = this.endY - this.startY;

        // If horizontal swipe detected and not yet handled, trigger navigation and prevent scrolling
        if (!this.swipeHandled && Math.abs(deltaX) >= this.minSwipeDistance && Math.abs(deltaY) <= this.maxVerticalDistance) {
            this.swipeHandled = true;
            // Prevent the browser from handling horizontal scroll/back gestures
            try { e.preventDefault(); } catch (err) {}
            console.log('🌀 Touch move triggered swipe:', deltaX, deltaY);
            if (deltaX > 0) {
                this.navigateToPreviousPage();
            } else {
                this.navigateToNextPage();
            }
        }
    },
    
    // Handle touch end
    handleTouchEnd(e) {
        console.log('🤏 Touch end detected');
        if (e.changedTouches.length === 1) {
            const touch = e.changedTouches[0];
            this.endX = touch.clientX;
            this.endY = touch.clientY;
            console.log('End position:', this.endX, this.endY);
            this.processSwipe();
        }
    },
    
    // Handle mouse start (for desktop testing)
    handleMouseStart(e) {
        console.log('🖱️ Mouse down detected');
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.isMouseDown = true;
        this.endX = this.startX;
        this.endY = this.startY;
        this.swipeHandled = false;
        console.log('Start position:', this.startX, this.startY);
    },
    
    // Handle mouse move (desktop testing)
    handleMouseMove(e) {
        if (!this.isMouseDown) return;
        this.endX = e.clientX;
        this.endY = e.clientY;

        const deltaX = this.endX - this.startX;
        const deltaY = this.endY - this.startY;

        if (!this.swipeHandled && Math.abs(deltaX) >= this.minSwipeDistance && Math.abs(deltaY) <= this.maxVerticalDistance) {
            this.swipeHandled = true;
            console.log('🌀 Mouse move triggered swipe:', deltaX, deltaY);
            if (deltaX > 0) {
                this.navigateToPreviousPage();
            } else {
                this.navigateToNextPage();
            }
        }
    },
    
    // Handle mouse end (for desktop testing)
    handleMouseEnd(e) {
        console.log('🖱️ Mouse up detected');
        if (this.isMouseDown) {
            this.endX = e.clientX;
            this.endY = e.clientY;
            console.log('End position:', this.endX, this.endY);
            this.processSwipe();
            this.isMouseDown = false;
        }
    },
    
    // Process the swipe gesture
    processSwipe() {
        const deltaX = this.endX - this.startX;
        const deltaY = this.endY - this.startY;
        
        console.log('🔄 Processing swipe:');
        console.log('- Delta X:', deltaX);
        console.log('- Delta Y:', deltaY);
        console.log('- Min distance:', this.minSwipeDistance);
        console.log('- Max vertical:', this.maxVerticalDistance);
        
        // Check if it's a valid horizontal swipe
        if (Math.abs(deltaX) >= this.minSwipeDistance && Math.abs(deltaY) <= this.maxVerticalDistance) {
            console.log('✅ Valid swipe detected!');
            if (deltaX > 0) {
                // Swipe right - go to previous page
                console.log('➡️ Swipe right - going to previous page');
                this.navigateToPreviousPage();
            } else {
                // Swipe left - go to next page
                console.log('⬅️ Swipe left - going to next page');
                this.navigateToNextPage();
            }
        } else {
            console.log('❌ Invalid swipe - not enough distance or too vertical');
        }
    },
    
    // Get current page index
    getCurrentPageIndex() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        return this.pageOrder.indexOf(currentPage);
    },
    
    // Navigate to previous page
    navigateToPreviousPage() {
        const currentIndex = this.getCurrentPageIndex();
        if (currentIndex > 0) {
            const previousPage = this.pageOrder[currentIndex - 1];
            this.navigateToPage(previousPage, 'Previous');
        } else {
            // If at first page, optionally loop to last page
            if (StorageManager.getPreference('swipeLoop', false)) {
                const lastPage = this.pageOrder[this.pageOrder.length - 1];
                this.navigateToPage(lastPage, 'Last');
            } else {
                this.showNavigationFeedback('Already at first page');
            }
        }
    },
    
    // Navigate to next page
    navigateToNextPage() {
        const currentIndex = this.getCurrentPageIndex();
        if (currentIndex < this.pageOrder.length - 1 && currentIndex !== -1) {
            const nextPage = this.pageOrder[currentIndex + 1];
            this.navigateToPage(nextPage, 'Next');
        } else {
            // If at last page, optionally loop to first page
            if (StorageManager.getPreference('swipeLoop', false)) {
                const firstPage = this.pageOrder[0];
                this.navigateToPage(firstPage, 'First');
            } else {
                this.showNavigationFeedback('Already at last page');
            }
        }
    },
    
    // Check if navigation requires authentication
    requiresAuth(page) {
        const authRequiredPages = ['dashboard.html', 'history.html', 'settings.html', 'profile.html'];
        return authRequiredPages.includes(page);
    },
    
    // Navigate to a specific page
    navigateToPage(page, direction) {
        // Check authentication if required
        if (this.requiresAuth(page)) {
            const user = StorageManager.getUser();
            if (!user) {
                this.showNavigationFeedback('Login required');
                return;
            }
        }
        
        // Show navigation feedback
        this.showNavigationFeedback(`${direction} page`);
        
        // Add transition effect
        document.body.style.transition = 'opacity 0.3s ease';
        document.body.style.opacity = '0.7';
        
        // Navigate after brief delay for visual feedback
        setTimeout(() => {
            window.location.href = page;
        }, 150);
    },
    
    // Show brief navigation feedback
    showNavigationFeedback(message) {
        // Remove existing feedback
        const existingFeedback = document.getElementById('swipe-feedback');
        if (existingFeedback) {
            existingFeedback.remove();
        }
        
        // Create feedback element
        const feedback = document.createElement('div');
        feedback.id = 'swipe-feedback';
        feedback.textContent = message;
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(76, 175, 80, 0.9);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            z-index: 9999;
            transition: opacity 0.3s ease;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(feedback);
        
        // Fade out and remove
        setTimeout(() => {
            feedback.style.opacity = '0';
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.parentNode.removeChild(feedback);
                }
            }, 300);
        }, 1500);
    },
    
    // Enable/disable swipe navigation
    setEnabled(enabled) {
        StorageManager.setPreference('swipeNavigation', enabled);
        if (enabled && !this.eventsAdded) {
            this.addEventListeners();
            this.eventsAdded = true;
        } else if (!enabled && this.eventsAdded) {
            this.removeEventListeners();
            this.eventsAdded = false;
        }
        console.log(`🔄 Swipe navigation ${enabled ? 'enabled' : 'disabled'}`);
    },
    
    // Remove event listeners
    removeEventListeners() {
        document.removeEventListener('touchstart', this.boundTouchStart);
        document.removeEventListener('touchmove', this.boundTouchMove);
        document.removeEventListener('touchend', this.boundTouchEnd);
        document.removeEventListener('mousedown', this.boundMouseStart);
        document.removeEventListener('mousemove', this.boundMouseMove);
        document.removeEventListener('mouseup', this.boundMouseEnd);
    },
    
    // Toggle loop navigation
    setLoopEnabled(enabled) {
        StorageManager.setPreference('swipeLoop', enabled);
        console.log(`🔄 Swipe loop ${enabled ? 'enabled' : 'disabled'}`);
    }
};
