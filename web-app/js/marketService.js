/**
 * Market Price Service
 * Handles market price data and trends
 */

class MarketService {
    // Get current market prices
    async getCurrentPrices(crop = null, market = null) {
        try {
            const params = {};
            if (crop) params.crop = crop;
            if (market) params.market = market;

            const response = await window.apiService.get('/market/prices', params);
            return { success: true, data: response.prices };
        } catch (error) {
            console.error('Get current prices error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get price trends
    async getPriceTrends(crop, days = 30) {
        try {
            const response = await window.apiService.get('/market/trends', {
                crop: crop,
                days: days
            });
            return { success: true, data: response.trends };
        } catch (error) {
            console.error('Get price trends error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get market list
    async getMarketList(state = null) {
        try {
            const params = {};
            if (state) params.state = state;

            const response = await window.apiService.get('/market/list', params);
            return { success: true, data: response.markets };
        } catch (error) {
            console.error('Get market list error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get price alerts
    async getPriceAlerts() {
        try {
            const response = await window.apiService.get('/market/alerts');
            return { success: true, data: response.alerts };
        } catch (error) {
            console.error('Get price alerts error:', error);
            return { success: false, error: error.message };
        }
    }

    // Set price alert
    async setPriceAlert(alertData) {
        try {
            const response = await window.apiService.post('/market/alerts', alertData);
            return { success: true, data: response };
        } catch (error) {
            console.error('Set price alert error:', error);
            return { success: false, error: error.message };
        }
    }

    // Delete price alert
    async deletePriceAlert(alertId) {
        try {
            const response = await window.apiService.delete(`/market/alerts/${alertId}`);
            return { success: true, data: response };
        } catch (error) {
            console.error('Delete price alert error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get crop demand forecast
    async getDemandForecast(crop) {
        try {
            const response = await window.apiService.get('/market/demand', { crop: crop });
            return { success: true, data: response.forecast };
        } catch (error) {
            console.error('Get demand forecast error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get profit calculator
    async calculateProfit(cropData) {
        try {
            const response = await window.apiService.post('/market/calculate-profit', cropData);
            return { success: true, data: response.calculation };
        } catch (error) {
            console.error('Calculate profit error:', error);
            return { success: false, error: error.message };
        }
    }

    // Get best selling locations
    async getBestSellingLocations(crop) {
        try {
            const response = await window.apiService.get('/market/best-locations', { crop: crop });
            return { success: true, data: response.locations };
        } catch (error) {
            console.error('Get best selling locations error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Create and export singleton instance
window.marketService = new MarketService();