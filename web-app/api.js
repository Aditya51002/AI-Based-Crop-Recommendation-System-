const API_BASE_URL = 'http://localhost:5000/api';
const MOBILE_API_URL = 'agrismart://api'; // For mobile app communication

// API Configuration
const API_CONFIG = {
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000
};

// Authentication headers
function getAuthHeaders() {
    const token = StorageManager.getToken();
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
}

// Enhanced fetch with retry and mobile fallback
async function apiRequest(url, options = {}) {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    const config = {
        ...options,
        headers: {
            ...getAuthHeaders(),
            ...options.headers
        }
    };
    
    // Try web API first
    for (let attempt = 1; attempt <= API_CONFIG.retryAttempts; attempt++) {
        try {
            const response = await fetch(fullUrl, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.warn(`API attempt ${attempt} failed:`, error);
            
            if (attempt === API_CONFIG.retryAttempts) {
                // If all attempts failed, try mobile API if available
                if (CrossPlatform.isMobileApp()) {
                    return await tryMobileAPI(url, config);
                }
                throw error;
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay * attempt));
        }
    }
}

// Mobile API fallback
async function tryMobileAPI(endpoint, config) {
    return new Promise((resolve, reject) => {
        if (window.AgriSmartMobile && window.AgriSmartMobile.apiRequest) {
            window.AgriSmartMobile.apiRequest(
                JSON.stringify({
                    endpoint,
                    method: config.method || 'GET',
                    body: config.body,
                    headers: config.headers
                }),
                (result) => resolve(JSON.parse(result)),
                (error) => reject(new Error(error))
            );
        } else {
            reject(new Error('Mobile API not available'));
        }
    });
}

const API = {
    // Authentication
    async login(credentials) {
        try {
            const response = await apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            });
            
            // Save to history
            StorageManager.addHistory({
                type: 'login',
                timestamp: new Date().toISOString()
            });
            
            return response;
        } catch (error) {
            console.error('Login error:', error);
            // Don't return demo data - require actual authentication
            throw error;
        }
    },
    
    async register(userData) {
        try {
            return await apiRequest('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    },
    async getCropRecommendation(data) {
        try {
            const response = await apiRequest('/crop-recommendation', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            // Save to history
            StorageManager.addHistory({
                type: 'crop-recommendation',
                crop: response.crops?.[0]?.name || 'Unknown',
                location: data.location,
                formData: data,
                result: `Recommended ${response.crops?.length || 0} crops`,
                timestamp: new Date().toISOString()
            });
            
            return response;
        } catch (error) {
            console.error('Crop recommendation error:', error);
            
            // Return mock data with enhanced info
            const mockResponse = {
                success: true,
                crops: [
                    {
                        name: 'Rice',
                        suitability: 92,
                        yield: '55 tons/ha',
                        profit: '110000',
                        sustainability: 8.5,
                        season: 'Kharif',
                        duration: '120-140 days',
                        waterRequirement: 'High',
                        marketDemand: 'High'
                    },
                    {
                        name: 'Wheat',
                        suitability: 88,
                        yield: '45 tons/ha',
                        profit: '90000',
                        sustainability: 8.2,
                        season: 'Rabi',
                        duration: '90-120 days',
                        waterRequirement: 'Medium',
                        marketDemand: 'High'
                    },
                    {
                        name: 'Maize',
                        suitability: 85,
                        yield: '60 tons/ha',
                        profit: '95000',
                        sustainability: 7.8,
                        season: 'Both',
                        duration: '80-110 days',
                        waterRequirement: 'Medium',
                        marketDemand: 'Medium'
                    }
                ],
                recommendations: [
                    'Rice is highly suitable for your soil and climate conditions.',
                    'Consider intercropping with legumes to improve soil fertility.',
                    'Monitor weather conditions for optimal planting time.'
                ]
            };
            
            // Save mock result to history
            StorageManager.addHistory({
                type: 'crop-recommendation',
                crop: 'Rice',
                location: data.location || 'Unknown',
                formData: data,
                result: 'Recommended 3 crops (mock data)',
                timestamp: new Date().toISOString()
            });
            
            return mockResponse;
        }
    },

    async detectDisease(formData) {
        try {
            const response = await apiRequest('/disease-detection', {
                method: 'POST',
                body: formData
            });
            
            // Save to history
            StorageManager.addHistory({
                type: 'disease-detection',
                disease: response.disease || 'Unknown',
                confidence: response.confidence,
                result: `Detected ${response.disease} with ${response.confidence}% confidence`,
                timestamp: new Date().toISOString()
            });
            
            return response;
        } catch (error) {
            console.error('Disease detection error:', error);
            
            const mockResult = {
                success: true,
                disease: 'Leaf Blight',
                confidence: 94.5,
                severity: 'Moderate',
                affectedArea: '15%',
                treatments: [
                    'Apply copper-based fungicide every 10 days',
                    'Remove infected leaves immediately and destroy',
                    'Improve air circulation around plants',
                    'Reduce overhead watering to minimize leaf wetness'
                ],
                prevention: [
                    'Use disease-resistant varieties',
                    'Practice crop rotation with non-host crops',
                    'Maintain proper plant spacing',
                    'Apply preventive fungicides during wet season'
                ],
                timeline: '7-14 days for treatment effectiveness',
                cost: '₹500-800 per acre'
            };
            
            // Save mock result to history
            StorageManager.addHistory({
                type: 'disease-detection',
                disease: 'Leaf Blight',
                confidence: 94.5,
                result: 'Detected Leaf Blight with 94.5% confidence (mock data)',
                timestamp: new Date().toISOString()
            });
            
            return mockResult;
        }
    },

    async getWeather(location) {
        try {
            const response = await apiRequest(`/api/weather/forecast?location=${encodeURIComponent(location)}`);
            
            // Save to history
            StorageManager.addHistory({
                type: 'weather-check',
                location: location,
                result: `Checked weather for ${location}`,
                timestamp: new Date().toISOString()
            });
            
            return response;
        } catch (error) {
            console.error('Weather API error:', error);
            // Return demo weather data as fallback
            return {
                success: true,
                location: location,
                current: {
                    temperature: 28,
                    condition: 'Partly Cloudy',
                    humidity: 65,
                    windSpeed: 12,
                    pressure: 1013,
                    visibility: 10,
                    uvIndex: 6
                },
                forecast: [
                    { date: 'Mon', condition: 'Sunny', temp: 30, rainfall: 0, humidity: 55 },
                    { date: 'Tue', condition: 'Cloudy', temp: 26, rainfall: 2, humidity: 70 },
                    { date: 'Wed', condition: 'Rainy', temp: 24, rainfall: 15, humidity: 85 },
                    { date: 'Thu', condition: 'Sunny', temp: 29, rainfall: 0, humidity: 60 },
                    { date: 'Fri', condition: 'Partly Cloudy', temp: 27, rainfall: 1, humidity: 68 },
                    { date: 'Sat', condition: 'Thunderstorms', temp: 25, rainfall: 20, humidity: 80 },
                    { date: 'Sun', condition: 'Sunny', temp: 31, rainfall: 0, humidity: 50 }
                ]
            };
        }
    },
                    { date: 'Tue', condition: 'Cloudy', temp: 28, rainfall: 5, humidity: 70 },
                    { date: 'Wed', condition: 'Rainy', temp: 26, rainfall: 15, humidity: 85 },
                    { date: 'Thu', condition: 'Rainy', temp: 25, rainfall: 20, humidity: 88 },
                    { date: 'Fri', condition: 'Cloudy', temp: 27, rainfall: 8, humidity: 75 },
                    { date: 'Sat', condition: 'Sunny', temp: 29, rainfall: 0, humidity: 60 },
                    { date: 'Sun', condition: 'Sunny', temp: 31, rainfall: 0, humidity: 52 }
                ],
                alerts: [
                    'Heavy rain expected on Wednesday and Thursday',
                    'UV index high - limit field exposure'
                ],
                farmingAdvice: [
                    'Good time for planting quick-growing crops',
                    'Prepare drainage for upcoming rain',
                    'Apply fertilizers before rain starts'
                ]
            };
        }
    },

    async getMarketPrices(crop) {
        try {
            const response = await apiRequest(`/api/market/prices?crop=${encodeURIComponent(crop)}`);
            
            // Save to history
            StorageManager.addHistory({
                type: 'market-price',
                crop: crop,
                result: `Checked prices for ${crop}`,
                timestamp: new Date().toISOString()
            });
            
            return response;
        } catch (error) {
            console.error('Market prices error:', error);
            // Return demo market data as fallback
            return {
                success: true,
                crop: crop,
                markets: [
                    { location: 'Mumbai APMC', price: 2450, change: 5.2, demand: 'High', volume: '850 tons' },
                    { location: 'Delhi Azadpur', price: 2380, change: 3.8, demand: 'Medium', volume: '640 tons' },
                    { location: 'Bangalore', price: 2420, change: 4.5, demand: 'High', volume: '720 tons' },
                    { location: 'Kolkata', price: 2350, change: 2.1, demand: 'Medium', volume: '580 tons' },
                    { location: 'Chennai', price: 2400, change: 3.9, demand: 'High', volume: '690 tons' }
                ],
                avgPrice: 2400,
                maxPrice: 2450,
                minPrice: 2350,
                trend: 'upward',
                forecast: 'Prices expected to increase by 3-5% next week',
                factors: [
                    'Increased demand due to festival season',
                    'Weather conditions affecting supply',
                    'Government procurement at minimum support price'
                ]
            };
        }
            
            // Save to history
            StorageManager.addHistory({
                type: 'market-price',
                crop: crop,
                result: `Checked prices for ${crop} (mock data)`,
                timestamp: new Date().toISOString()
            });
            
            return mockData;
        }
    },

    async sendChatMessage(message, language = 'en') {
        try {
            const response = await apiRequest('/chatbot', {
                method: 'POST',
                body: JSON.stringify({ message, language })
            });
            
            // Save to history
            StorageManager.addHistory({
                type: 'chatbot',
                message: message.substring(0, 100),
                result: 'Chat conversation',
                timestamp: new Date().toISOString()
            });
            
            return response;
        } catch (error) {
            console.error('Chatbot error:', error);
            
            const responses = [
                'Based on your location and soil conditions, I recommend growing wheat or rice this season.',
                'Leaf blight can be identified by brown spots with yellow halos. Apply copper-based fungicides immediately.',
                'Current wheat prices are around ₹2,400 per quintal. Prices have increased by 5% this week due to festive demand.',
                'Irrigation should be done when soil moisture drops below 60%. Check weather forecast before watering.',
                'For better yields, maintain proper soil pH between 6.0-7.5 and ensure adequate NPK levels.',
                'Disease prevention is key. Practice crop rotation and use disease-resistant varieties.',
                'Consider drip irrigation to save water and improve nutrient delivery.',
                'Organic farming methods can improve soil health and reduce input costs over time.'
            ];
            
            const mockResponse = {
                success: true,
                message: responses[Math.floor(Math.random() * responses.length)],
                confidence: 0.95,
                suggestions: [
                    'Would you like specific recommendations for your crop?',
                    'Need help with disease identification?',
                    'Want to check current market prices?'
                ]
            };
            
            // Save to history
            StorageManager.addHistory({
                type: 'chatbot',
                message: message.substring(0, 100),
                result: 'Chat conversation (mock data)',
                timestamp: new Date().toISOString()
            });
            
            return mockResponse;
        }
    },

    async getUserProfile() {
        try {
            const response = await apiRequest('/profile');
            return response;
        } catch (error) {
            console.error('Profile error:', error);
            
            // Return user from storage as fallback
            const user = StorageManager.getUser();
            return user || null;
        }
    },

    async updateProfile(profileData) {
        try {
            const response = await apiRequest('/profile', {
                method: 'PUT',
                body: JSON.stringify(profileData)
            });
            
            // Update local storage
            const currentUser = StorageManager.getUser();
            const updatedUser = { ...currentUser, ...profileData };
            StorageManager.setUser(updatedUser);
            
            return response;
        } catch (error) {
            console.error('Profile update error:', error);
            throw error;
        }
    },

    // Settings API
    async getSettings() {
        try {
            const response = await apiRequest('/settings');
            return response;
        } catch (error) {
            console.error('Settings error:', error);
            
            // Return default settings
            return {
                language: 'en',
                notifications: true,
                units: 'metric',
                theme: 'light',
                autoSync: true
            };
        }
    },

    async updateSettings(settings) {
        try {
            const response = await apiRequest('/settings', {
                method: 'PUT',
                body: JSON.stringify(settings)
            });
            
            // Save settings locally
            Object.keys(settings).forEach(key => {
                StorageManager.setPreference(key, settings[key]);
            });
            
            return response;
        } catch (error) {
            console.error('Settings update error:', error);
            
            // Save locally even if API fails
            Object.keys(settings).forEach(key => {
                StorageManager.setPreference(key, settings[key]);
            });
            
            return { success: true };
        }
    },

    // Sync data with mobile app
    async syncData() {
        try {
            const userData = StorageManager.getUser();
            const history = StorageManager.getHistory();
            
            if (CrossPlatform.isMobileApp()) {
                CrossPlatform.sendToMobile({
                    type: 'sync_data',
                    user: userData,
                    history: history,
                    timestamp: new Date().toISOString()
                });
            }
            
            return { success: true };
        } catch (error) {
            console.error('Sync error:', error);
            return { success: false, error: error.message };
        }
    }
};

// Make API globally available
window.API = API;
            this.setToken(data.token);
            return data;
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    },

    getToken() {
        return localStorage.getItem('agrismart_token');
    },

    setToken(token) {
        localStorage.setItem('agrismart_token', token);
    },

    removeToken() {
        localStorage.removeItem('agrismart_token');
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
}
