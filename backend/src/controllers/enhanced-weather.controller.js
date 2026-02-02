/**
 * Enhanced Weather Controller
 * Handles weather data retrieval and alerts with full frontend integration
 */

const WeatherData = require('../models/WeatherData');
const { AppError } = require('../middleware/errorHandler');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Get current weather
 * GET /api/weather/current
 */
exports.getCurrentWeather = async (req, res, next) => {
    try {
        const { latitude, longitude } = req.query;
        const userId = req.user.id;
        
        if (!latitude || !longitude) {
            return errorResponse(res, 'Latitude and longitude are required', 400);
        }
        
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        
        if (isNaN(lat) || isNaN(lon)) {
            return errorResponse(res, 'Invalid latitude or longitude values', 400);
        }
        
        // Check cache first
        const cachedWeather = await getCachedWeather(lat, lon, 'current');
        if (cachedWeather) {
            return successResponse(res, {
                weather: cachedWeather.data,
                source: 'cache'
            }, 'Current weather retrieved successfully');
        }
        
        // Generate mock weather data for immediate frontend testing
        const weatherData = await generateMockCurrentWeather(lat, lon);
        
        // Cache the weather data
        await cacheWeatherData(lat, lon, 'current', weatherData, userId);
        
        logger.info(`Current weather retrieved for location: ${lat}, ${lon}`);
        
        return successResponse(res, {
            weather: weatherData,
            source: 'api'
        }, 'Current weather retrieved successfully');
        
    } catch (error) {
        logger.error('Get current weather error:', error);
        next(error);
    }
};

/**
 * Get weather forecast
 * GET /api/weather/forecast
 */
exports.getWeatherForecast = async (req, res, next) => {
    try {
        const { latitude, longitude, days = 5 } = req.query;
        const userId = req.user.id;
        
        if (!latitude || !longitude) {
            return errorResponse(res, 'Latitude and longitude are required', 400);
        }
        
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        const forecastDays = parseInt(days);
        
        if (isNaN(lat) || isNaN(lon)) {
            return errorResponse(res, 'Invalid latitude or longitude values', 400);
        }
        
        if (forecastDays < 1 || forecastDays > 14) {
            return errorResponse(res, 'Forecast days must be between 1 and 14', 400);
        }
        
        // Check cache first
        const cachedForecast = await getCachedWeather(lat, lon, 'forecast');
        if (cachedForecast && cachedForecast.data.forecast.length >= forecastDays) {
            const forecast = {
                ...cachedForecast.data,
                forecast: cachedForecast.data.forecast.slice(0, forecastDays)
            };
            
            return successResponse(res, {
                forecast,
                source: 'cache'
            }, 'Weather forecast retrieved successfully');
        }
        
        // Generate mock forecast data
        const forecastData = await generateMockForecast(lat, lon, forecastDays);
        
        // Cache the forecast data
        await cacheWeatherData(lat, lon, 'forecast', forecastData, userId);
        
        logger.info(`Weather forecast retrieved for location: ${lat}, ${lon} (${forecastDays} days)`);
        
        return successResponse(res, {
            forecast: forecastData,
            source: 'api'
        }, 'Weather forecast retrieved successfully');
        
    } catch (error) {
        logger.error('Get weather forecast error:', error);
        next(error);
    }
};

/**
 * Get weather alerts
 * GET /api/weather/alerts
 */
exports.getWeatherAlerts = async (req, res, next) => {
    try {
        const { latitude, longitude } = req.query;
        const userId = req.user.id;
        
        if (!latitude || !longitude) {
            return errorResponse(res, 'Latitude and longitude are required', 400);
        }
        
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        
        // Generate mock alerts based on weather conditions
        const alerts = await generateMockWeatherAlerts(lat, lon);
        
        logger.info(`Weather alerts retrieved for location: ${lat}, ${lon}`);
        
        return successResponse(res, {
            alerts,
            count: alerts.length
        }, 'Weather alerts retrieved successfully');
        
    } catch (error) {
        logger.error('Get weather alerts error:', error);
        next(error);
    }
};

/**
 * Get agricultural weather advice
 * GET /api/weather/advice
 */
exports.getWeatherAdvice = async (req, res, next) => {
    try {
        const { latitude, longitude, cropType } = req.query;
        const userId = req.user.id;
        
        if (!latitude || !longitude) {
            return errorResponse(res, 'Latitude and longitude are required', 400);
        }
        
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);
        
        // Get current weather for advice generation
        const currentWeather = await generateMockCurrentWeather(lat, lon);
        const forecast = await generateMockForecast(lat, lon, 7);
        
        // Generate agricultural advice based on weather
        const advice = generateAgriculturalAdvice(currentWeather, forecast, cropType);
        
        logger.info(`Weather advice generated for location: ${lat}, ${lon}, crop: ${cropType}`);
        
        return successResponse(res, {
            advice,
            basedOn: {
                currentWeather: currentWeather.condition,
                temperature: currentWeather.temperature,
                humidity: currentWeather.humidity,
                cropType: cropType || 'general'
            }
        }, 'Weather advice generated successfully');
        
    } catch (error) {
        logger.error('Get weather advice error:', error);
        next(error);
    }
};

/**
 * Get weather history
 * GET /api/weather/history
 */
exports.getWeatherHistory = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { latitude, longitude, days = 7 } = req.query;
        
        const limit = Math.min(parseInt(days), 30); // Limit to 30 days
        
        let query = { userId, type: 'current' };
        
        if (latitude && longitude) {
            const lat = parseFloat(latitude);
            const lon = parseFloat(longitude);
            
            // Find weather data within 1km radius
            query['location.coordinates'] = {
                $geoWithin: {
                    $centerSphere: [[lon, lat], 1 / 6378.1] // 1km radius
                }
            };
        }
        
        // Demo mode check
        const isDemoMode = !require('mongoose').connection.readyState;
        
        if (isDemoMode) {
            const mockHistory = [];
            for (let i = 0; i < limit; i++) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                
                mockHistory.push({
                    date: date.toISOString().split('T')[0],
                    temperature: {
                        min: Math.round(20 + Math.random() * 10),
                        max: Math.round(30 + Math.random() * 10),
                        avg: Math.round(25 + Math.random() * 8)
                    },
                    humidity: Math.round(60 + Math.random() * 30),
                    rainfall: Math.round(Math.random() * 20),
                    windSpeed: Math.round(5 + Math.random() * 15),
                    condition: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)]
                });
            }
            
            return successResponse(res, {
                history: mockHistory,
                summary: {
                    avgTemperature: Math.round(mockHistory.reduce((sum, day) => sum + day.temperature.avg, 0) / mockHistory.length),
                    totalRainfall: mockHistory.reduce((sum, day) => sum + day.rainfall, 0),
                    avgHumidity: Math.round(mockHistory.reduce((sum, day) => sum + day.humidity, 0) / mockHistory.length)
                }
            }, 'Weather history retrieved (Demo Mode)');
        }
        
        const history = await WeatherData.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('data.temperature data.humidity data.rainfall data.windSpeed data.condition createdAt');
        
        const formattedHistory = history.map(record => ({
            date: record.createdAt.toISOString().split('T')[0],
            temperature: record.data.temperature,
            humidity: record.data.humidity,
            rainfall: record.data.rainfall || 0,
            windSpeed: record.data.windSpeed,
            condition: record.data.condition
        }));
        
        return successResponse(res, {
            history: formattedHistory,
            summary: calculateWeatherSummary(formattedHistory)
        }, 'Weather history retrieved successfully');
        
    } catch (error) {
        logger.error('Get weather history error:', error);
        next(error);
    }
};

/**
 * Subscribe to weather alerts
 * POST /api/weather/alerts/subscribe
 */
exports.subscribeToAlerts = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { latitude, longitude, alertTypes } = req.body;
        
        if (!latitude || !longitude || !alertTypes || !Array.isArray(alertTypes)) {
            return errorResponse(res, 'Latitude, longitude, and alert types are required', 400);
        }
        
        // For demo, just return success
        logger.info(`User ${userId} subscribed to weather alerts at ${latitude}, ${longitude}`);
        
        return successResponse(res, {
            message: 'Successfully subscribed to weather alerts',
            alertTypes,
            location: { latitude, longitude }
        }, 'Alert subscription successful');
        
    } catch (error) {
        logger.error('Subscribe to alerts error:', error);
        next(error);
    }
};

/**
 * Get cached weather data
 */
async function getCachedWeather(lat, lon, type) {
    try {
        const isDemoMode = !require('mongoose').connection.readyState;
        if (isDemoMode) return null;
        
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        const cached = await WeatherData.findOne({
            type,
            'location.coordinates': {
                $geoWithin: {
                    $centerSphere: [[lon, lat], 10 / 6378.1] // 10km radius
                }
            },
            createdAt: { $gte: oneHourAgo }
        }).sort({ createdAt: -1 });
        
        return cached;
    } catch (error) {
        logger.warn('Cache lookup failed:', error);
        return null;
    }
}

/**
 * Cache weather data
 */
async function cacheWeatherData(lat, lon, type, data, userId) {
    try {
        const isDemoMode = !require('mongoose').connection.readyState;
        if (isDemoMode) return;
        
        const weatherRecord = new WeatherData({
            userId,
            type,
            location: {
                type: 'Point',
                coordinates: [lon, lat]
            },
            data,
            expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours TTL
        });
        
        await weatherRecord.save();
    } catch (error) {
        logger.warn('Failed to cache weather data:', error);
    }
}

/**
 * Generate mock current weather data
 */
async function generateMockCurrentWeather(lat, lon) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Heavy Rain', 'Thunderstorm'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    
    // Generate realistic temperature based on season and location
    const now = new Date();
    const month = now.getMonth();
    let baseTemp = 25; // Base temperature in Celsius
    
    // Adjust for season (Northern Hemisphere bias)
    if (month >= 3 && month <= 5) baseTemp += 5; // Spring
    else if (month >= 6 && month <= 8) baseTemp += 12; // Summer
    else if (month >= 9 && month <= 11) baseTemp += 3; // Fall
    else baseTemp -= 5; // Winter
    
    const temperature = baseTemp + (Math.random() * 10 - 5);
    const humidity = condition.includes('Rain') ? 70 + Math.random() * 25 : 40 + Math.random() * 40;
    
    return {
        location: {
            latitude: lat,
            longitude: lon,
            name: `Location ${lat.toFixed(2)}, ${lon.toFixed(2)}`
        },
        temperature: Math.round(temperature),
        feelsLike: Math.round(temperature + (Math.random() * 6 - 3)),
        humidity: Math.round(humidity),
        pressure: Math.round(1013 + (Math.random() * 20 - 10)),
        windSpeed: Math.round(Math.random() * 25),
        windDirection: Math.round(Math.random() * 360),
        visibility: Math.round(8 + Math.random() * 7),
        uvIndex: Math.round(Math.random() * 11),
        condition,
        cloudCover: Math.round(Math.random() * 100),
        dewPoint: Math.round(temperature - 10 - Math.random() * 10),
        rainfall: condition.includes('Rain') ? Math.round(Math.random() * 20) : 0,
        sunrise: new Date(now.setHours(6, 0, 0, 0)).toISOString(),
        sunset: new Date(now.setHours(18, 30, 0, 0)).toISOString(),
        timestamp: new Date().toISOString()
    };
}

/**
 * Generate mock weather forecast
 */
async function generateMockForecast(lat, lon, days) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const forecast = [];
    const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Heavy Rain', 'Thunderstorm'];
    
    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        const maxTemp = 25 + Math.random() * 10;
        const minTemp = maxTemp - 5 - Math.random() * 8;
        
        forecast.push({
            date: date.toISOString().split('T')[0],
            day: date.toLocaleDateString('en', { weekday: 'long' }),
            temperature: {
                max: Math.round(maxTemp),
                min: Math.round(minTemp)
            },
            condition,
            humidity: Math.round(40 + Math.random() * 50),
            windSpeed: Math.round(Math.random() * 20),
            rainfall: condition.includes('Rain') ? Math.round(Math.random() * 15) : 0,
            uvIndex: Math.round(Math.random() * 10),
            sunrise: '06:00',
            sunset: '18:30'
        });
    }
    
    return {
        location: {
            latitude: lat,
            longitude: lon
        },
        forecast
    };
}

/**
 * Generate mock weather alerts
 */
async function generateMockWeatherAlerts(lat, lon) {
    const alerts = [];
    
    // Randomly generate alerts based on current conditions
    const alertTypes = [
        {
            type: 'Heavy Rain',
            severity: 'Moderate',
            message: 'Heavy rainfall expected in the next 24 hours. Ensure proper drainage in fields.',
            priority: 'medium',
            validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        },
        {
            type: 'High Temperature',
            severity: 'Minor',
            message: 'Temperatures may reach 40°C. Increase irrigation frequency and provide shade for livestock.',
            priority: 'low',
            validUntil: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
        },
        {
            type: 'Strong Winds',
            severity: 'Severe',
            message: 'Wind speeds up to 60 km/h expected. Secure loose structures and delay pesticide spraying.',
            priority: 'high',
            validUntil: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
        }
    ];
    
    // Randomly select 0-2 alerts
    const numAlerts = Math.floor(Math.random() * 3);
    for (let i = 0; i < numAlerts; i++) {
        alerts.push({
            ...alertTypes[i],
            id: `alert-${Date.now()}-${i}`,
            issuedAt: new Date().toISOString(),
            location: { latitude: lat, longitude: lon }
        });
    }
    
    return alerts;
}

/**
 * Generate agricultural advice based on weather
 */
function generateAgriculturalAdvice(currentWeather, forecast, cropType) {
    const advice = [];
    
    // Temperature-based advice
    if (currentWeather.temperature > 35) {
        advice.push({
            category: 'Irrigation',
            priority: 'high',
            message: 'High temperatures detected. Increase watering frequency and consider providing shade for sensitive crops.',
            icon: '🌡️'
        });
    } else if (currentWeather.temperature < 10) {
        advice.push({
            category: 'Frost Protection',
            priority: 'high',
            message: 'Low temperatures may cause frost damage. Cover sensitive plants and harvest ready crops.',
            icon: '❄️'
        });
    }
    
    // Rainfall-based advice
    const upcomingRain = forecast.forecast.slice(0, 3).some(day => day.rainfall > 5);
    if (upcomingRain) {
        advice.push({
            category: 'Field Management',
            priority: 'medium',
            message: 'Rain expected in the next 3 days. Postpone irrigation and ensure proper field drainage.',
            icon: '🌧️'
        });
    } else if (forecast.forecast.slice(0, 7).every(day => day.rainfall === 0)) {
        advice.push({
            category: 'Drought Management',
            priority: 'medium',
            message: 'No rain expected for the next week. Plan irrigation schedule and consider mulching to retain soil moisture.',
            icon: '☀️'
        });
    }
    
    // Humidity-based advice
    if (currentWeather.humidity > 80) {
        advice.push({
            category: 'Disease Prevention',
            priority: 'medium',
            message: 'High humidity increases disease risk. Improve air circulation and monitor for fungal infections.',
            icon: '🍄'
        });
    }
    
    // Wind-based advice
    if (currentWeather.windSpeed > 25) {
        advice.push({
            category: 'Spray Schedule',
            priority: 'high',
            message: 'Strong winds detected. Avoid pesticide/fertilizer spraying until wind speed decreases.',
            icon: '💨'
        });
    }
    
    // Crop-specific advice
    if (cropType) {
        const cropAdvice = getCropSpecificAdvice(cropType, currentWeather, forecast);
        advice.push(...cropAdvice);
    }
    
    // General advice if no specific conditions
    if (advice.length === 0) {
        advice.push({
            category: 'General',
            priority: 'low',
            message: 'Weather conditions are favorable for most agricultural activities. Continue with regular farm operations.',
            icon: '✅'
        });
    }
    
    return advice;
}

/**
 * Get crop-specific weather advice
 */
function getCropSpecificAdvice(cropType, current, forecast) {
    const advice = [];
    
    switch (cropType.toLowerCase()) {
        case 'rice':
            if (current.temperature > 30 && current.humidity < 50) {
                advice.push({
                    category: 'Rice Management',
                    priority: 'medium',
                    message: 'Hot and dry conditions may stress rice plants. Maintain water levels in paddies.',
                    icon: '🌾'
                });
            }
            break;
            
        case 'tomato':
            if (current.humidity > 70 && current.temperature > 25) {
                advice.push({
                    category: 'Tomato Care',
                    priority: 'medium',
                    message: 'High humidity and temperature favor blight disease. Monitor plants closely and ensure good ventilation.',
                    icon: '🍅'
                });
            }
            break;
            
        case 'wheat':
            if (current.temperature > 25 && forecast.forecast.some(day => day.temperature.max > 30)) {
                advice.push({
                    category: 'Wheat Management',
                    priority: 'medium',
                    message: 'Rising temperatures may accelerate wheat maturity. Plan for early harvest if grain filling is complete.',
                    icon: '🌾'
                });
            }
            break;
    }
    
    return advice;
}

/**
 * Calculate weather summary
 */
function calculateWeatherSummary(history) {
    if (history.length === 0) return {};
    
    const avgTemp = history.reduce((sum, day) => sum + day.temperature.max, 0) / history.length;
    const totalRainfall = history.reduce((sum, day) => sum + day.rainfall, 0);
    const avgHumidity = history.reduce((sum, day) => sum + day.humidity, 0) / history.length;
    
    return {
        avgTemperature: Math.round(avgTemp),
        totalRainfall: Math.round(totalRainfall),
        avgHumidity: Math.round(avgHumidity),
        rainyDays: history.filter(day => day.rainfall > 0).length
    };
}

module.exports = exports;