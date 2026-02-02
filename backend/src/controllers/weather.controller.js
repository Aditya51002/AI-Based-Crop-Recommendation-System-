/**
 * Weather Controller
 * Weather data and forecasts
 */

const History = require('../models/History');
const { AppError } = require('../middleware/errorHandler');
const { successResponse } = require('../utils/response');
const logger = require('../utils/logger');

// Simulated weather data (in production, integrate with OpenWeatherMap, AccuWeather, etc.)
const generateWeatherData = (location) => {
    const conditions = ['Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Heavy Rain', 'Thunderstorm', 'Foggy'];
    const icons = ['☀️', '⛅', '☁️', '🌧️', '⛈️', '🌩️', '🌫️'];
    const randomIndex = Math.floor(Math.random() * conditions.length);
    
    return {
        location: location || 'New Delhi, India',
        temperature: Math.round(20 + Math.random() * 15),
        feelsLike: Math.round(18 + Math.random() * 18),
        humidity: Math.round(40 + Math.random() * 40),
        windSpeed: Math.round(5 + Math.random() * 20),
        windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
        pressure: Math.round(1010 + Math.random() * 20),
        visibility: Math.round(5 + Math.random() * 10),
        uvIndex: Math.round(1 + Math.random() * 10),
        condition: conditions[randomIndex],
        icon: icons[randomIndex],
        sunrise: '06:15',
        sunset: '18:45',
        lastUpdated: new Date().toISOString()
    };
};

const generateForecast = (location, days = 7) => {
    const forecast = [];
    const conditions = ['Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Heavy Rain'];
    const icons = ['☀️', '⛅', '☁️', '🌧️', '⛈️'];
    
    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const randomIndex = Math.floor(Math.random() * conditions.length);
        
        forecast.push({
            date: date.toISOString().split('T')[0],
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            tempHigh: Math.round(25 + Math.random() * 15),
            tempLow: Math.round(15 + Math.random() * 10),
            condition: conditions[randomIndex],
            icon: icons[randomIndex],
            humidity: Math.round(40 + Math.random() * 40),
            precipitation: Math.round(Math.random() * 100),
            windSpeed: Math.round(5 + Math.random() * 15)
        });
    }
    
    return forecast;
};

const generateAlerts = (location) => {
    const alerts = [
        {
            id: 'alert-1',
            type: 'warning',
            title: 'Heavy Rainfall Expected',
            description: 'Heavy rainfall expected in the next 24-48 hours. Take necessary precautions for crops.',
            severity: 'moderate',
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            icon: '🌧️'
        },
        {
            id: 'alert-2',
            type: 'advisory',
            title: 'High Temperature Advisory',
            description: 'Temperatures may exceed 35°C. Ensure adequate irrigation for sensitive crops.',
            severity: 'low',
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            icon: '🌡️'
        }
    ];
    
    // Randomly return 0-2 alerts
    return alerts.slice(0, Math.floor(Math.random() * 3));
};

/**
 * Get current weather
 * GET /api/weather
 */
exports.getCurrentWeather = async (req, res, next) => {
    try {
        const { location, lat, lon } = req.query;
        
        // Generate weather data
        const weather = generateWeatherData(location);
        
        // Add coordinates if provided
        if (lat && lon) {
            weather.coordinates = {
                latitude: parseFloat(lat),
                longitude: parseFloat(lon)
            };
        }
        
        // Log to history if user is authenticated
        if (req.user) {
            await History.addEntry(req.user._id, 'weather-check', {
                location: weather.location,
                temperature: weather.temperature,
                condition: weather.condition
            });
        }
        
        logger.info(`Weather fetched for: ${weather.location}`);
        
        return successResponse(res, {
            current: weather,
            agricultural: {
                irrigationAdvice: weather.humidity < 50 ? 'Consider irrigation today' : 'Soil moisture adequate',
                sprayingCondition: weather.windSpeed < 15 ? 'Good for spraying' : 'Avoid spraying - high winds',
                harvestCondition: weather.condition === 'Clear' ? 'Ideal for harvesting' : 'Monitor conditions'
            }
        }, 'Weather data retrieved');
        
    } catch (error) {
        next(error);
    }
};

/**
 * Get weather forecast
 * GET /api/weather/forecast
 */
exports.getForecast = async (req, res, next) => {
    try {
        const { location, days = 7 } = req.query;
        
        const forecast = generateForecast(location, Math.min(parseInt(days), 14));
        
        return successResponse(res, {
            location: location || 'New Delhi, India',
            forecast,
            summary: {
                avgHighTemp: Math.round(forecast.reduce((sum, d) => sum + d.tempHigh, 0) / forecast.length),
                avgLowTemp: Math.round(forecast.reduce((sum, d) => sum + d.tempLow, 0) / forecast.length),
                rainyDays: forecast.filter(d => d.condition.includes('Rain')).length,
                recommendations: [
                    'Plan field activities around clear weather days',
                    'Prepare drainage systems before rainy days',
                    'Schedule pesticide application during calm conditions'
                ]
            }
        }, 'Forecast retrieved');
        
    } catch (error) {
        next(error);
    }
};

/**
 * Get historical weather data
 * GET /api/weather/history
 */
exports.getHistorical = async (req, res, next) => {
    try {
        const { location, startDate, endDate } = req.query;
        
        // Generate historical data
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        const days = Math.ceil((end - start) / (24 * 60 * 60 * 1000));
        
        const historical = [];
        for (let i = 0; i < Math.min(days, 30); i++) {
            const date = new Date(start);
            date.setDate(date.getDate() + i);
            
            historical.push({
                date: date.toISOString().split('T')[0],
                tempHigh: Math.round(25 + Math.random() * 15),
                tempLow: Math.round(15 + Math.random() * 10),
                rainfall: Math.round(Math.random() * 50),
                humidity: Math.round(50 + Math.random() * 30)
            });
        }
        
        return successResponse(res, {
            location: location || 'New Delhi, India',
            period: {
                start: start.toISOString().split('T')[0],
                end: end.toISOString().split('T')[0]
            },
            data: historical,
            statistics: {
                totalRainfall: historical.reduce((sum, d) => sum + d.rainfall, 0),
                avgTemperature: Math.round(historical.reduce((sum, d) => sum + (d.tempHigh + d.tempLow) / 2, 0) / historical.length),
                maxTemp: Math.max(...historical.map(d => d.tempHigh)),
                minTemp: Math.min(...historical.map(d => d.tempLow))
            }
        }, 'Historical data retrieved');
        
    } catch (error) {
        next(error);
    }
};

/**
 * Get weather alerts
 * GET /api/weather/alerts
 */
exports.getAlerts = async (req, res, next) => {
    try {
        const { location } = req.query;
        
        const alerts = generateAlerts(location);
        
        return successResponse(res, {
            location: location || 'New Delhi, India',
            alerts,
            hasActiveAlerts: alerts.length > 0
        }, 'Alerts retrieved');
        
    } catch (error) {
        next(error);
    }
};
