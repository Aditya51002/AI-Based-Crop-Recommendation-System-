/**
 * Location Service
 * Handles geolocation and location-based features
 */

class LocationService {
    constructor() {
        this.currentLocation = null;
        this.watchId = null;
    }

    // Check if geolocation is supported
    isSupported() {
        return 'geolocation' in navigator;
    }

    // Get current position
    async getCurrentPosition(options = {}) {
        return new Promise((resolve, reject) => {
            if (!this.isSupported()) {
                reject(new Error('Geolocation is not supported'));
                return;
            }

            const defaultOptions = {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.currentLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: position.timestamp
                    };
                    resolve(this.currentLocation);
                },
                (error) => {
                    let errorMessage;
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Location access denied by user';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Location information is unavailable';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'Location request timed out';
                            break;
                        default:
                            errorMessage = 'An unknown error occurred';
                            break;
                    }
                    reject(new Error(errorMessage));
                },
                { ...defaultOptions, ...options }
            );
        });
    }

    // Watch position changes
    watchPosition(callback, options = {}) {
        if (!this.isSupported()) {
            throw new Error('Geolocation is not supported');
        }

        const defaultOptions = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 30000
        };

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.currentLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                };
                callback(this.currentLocation);
            },
            (error) => {
                callback(null, error);
            },
            { ...defaultOptions, ...options }
        );

        return this.watchId;
    }

    // Stop watching position
    clearWatch() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }

    // Get cached location
    getCachedLocation() {
        return this.currentLocation;
    }

    // Calculate distance between two coordinates
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the Earth in km
        const dLat = this.degToRad(lat2 - lat1);
        const dLon = this.degToRad(lon2 - lon1);
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.degToRad(lat1)) * Math.cos(this.degToRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in km
        return distance;
    }

    // Convert degrees to radians
    degToRad(deg) {
        return deg * (Math.PI / 180);
    }

    // Format location for display
    formatLocation(lat, lon, precision = 4) {
        return `${lat.toFixed(precision)}, ${lon.toFixed(precision)}`;
    }

    // Request location permission
    async requestPermission() {
        try {
            const position = await this.getCurrentPosition();
            return { success: true, location: position };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// Create and export singleton instance
window.locationService = new LocationService();