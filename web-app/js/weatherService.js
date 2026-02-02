/**
 * Weather Service
 * Handles weather data and forecasts
 */

class WeatherService {
    // Get current weather for location
    async getCurrentWeather(latitude, longitude) {
        try {
            const response = await window.apiService.get('/weather/current', {
                lat: latitude,
                lon: longitude
            });
            return { success: true, data: response.weather };
        } catch (error) {
            console.error('Get current weather error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get weather forecast
    async getWeatherForecast(latitude, longitude, days = 7) {
        try {
            const response = await window.apiService.get('/weather/forecast', {
                lat: latitude,
                lon: longitude,
                days: days
            });
            return { success: true, data: response.forecast };
        } catch (error) {
            console.error('Get weather forecast error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get weather alerts
    async getWeatherAlerts(latitude, longitude) {
        try {
            const response = await window.apiService.get('/weather/alerts', {
                lat: latitude,
                lon: longitude
            });
            return { success: true, data: response.alerts };
        } catch (error) {
            console.error('Get weather alerts error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get agricultural weather advisory
    async getAgriAdvisory(latitude, longitude, cropType = null) {
        try {
            const params = {
                lat: latitude,
                lon: longitude
            };
            if (cropType) {
                params.crop = cropType;
            }

            const response = await window.apiService.get('/weather/advisory', params);
            return { success: true, data: response.advisory };
        } catch (error) {
            console.error('Get agri advisory error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get historical weather data
    async getHistoricalWeather(latitude, longitude, startDate, endDate) {
        try {
            const response = await window.apiService.get('/weather/historical', {
                lat: latitude,
                lon: longitude,
                start_date: startDate,
                end_date: endDate
            });
            return { success: true, data: response.historical };
        } catch (error) {
            console.error('Get historical weather error:', error);
            return { success: false, error: error.message };
        }
    }

    // Subscribe to weather notifications
    async subscribeToAlerts(alertSettings) {
        try {
            const response = await window.apiService.post('/weather/subscribe', alertSettings);
            return { success: true, data: response };
        } catch (error) {
            console.error('Subscribe to alerts error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Create and export singleton instance
window.weatherService = new WeatherService();