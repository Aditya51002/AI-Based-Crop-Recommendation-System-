/**
 * AgriSmart System Configuration
 * Centralized configuration for web and mobile app interconnection
 */

const AppConfig = {
    // Application Information
    app: {
        name: 'AgriSmart',
        version: '1.0.0',
        environment: 'development', // development, staging, production
        description: 'AI-Based Crop Recommendation System'
    },

    // API Configuration
    api: {
        baseUrl: 'http://localhost:5000/api',
        timeout: 10000,
        retryAttempts: 3,
        retryDelay: 1000,
        endpoints: {
            auth: {
                login: '/auth/login',
                register: '/auth/register',
                logout: '/auth/logout',
                refresh: '/auth/refresh'
            },
            crops: {
                recommendation: '/crop-recommendation',
                list: '/crops',
                details: '/crops/:id'
            },
            diseases: {
                detection: '/disease-detection',
                list: '/diseases',
                details: '/diseases/:id'
            },
            weather: {
                current: '/weather',
                forecast: '/weather/forecast',
                alerts: '/weather/alerts'
            },
            market: {
                prices: '/market-prices',
                trends: '/market-trends',
                alerts: '/market-alerts'
            },
            chatbot: {
                message: '/chatbot',
                history: '/chatbot/history'
            },
            user: {
                profile: '/profile',
                preferences: '/preferences',
                history: '/history'
            }
        }
    },

    // Database/Storage Configuration
    storage: {
        keys: {
            user: 'agrismart_user',
            token: 'agrismart_token',
            preferences: 'agrismart_prefs',
            history: 'agrismart_history',
            cache: 'agrismart_cache'
        },
        maxHistoryItems: 100,
        cacheExpiration: 24 * 60 * 60 * 1000, // 24 hours
        syncInterval: 5 * 60 * 1000 // 5 minutes
    },

    // Feature Flags
    features: {
        offlineMode: true,
        backgroundSync: true,
        pushNotifications: true,
        voiceInput: true,
        cameraIntegration: true,
        locationServices: true,
        multilingual: true,
        analytics: true,
        crossPlatformSync: true
    },

    // UI Configuration
    ui: {
        theme: {
            primary: '#2c5f2d',
            secondary: '#4CAF50',
            success: '#28a745',
            warning: '#ffc107',
            error: '#dc3545',
            info: '#17a2b8'
        },
        navigation: [
            { name: 'Home', href: 'index.html', icon: '🏠' },
            { name: 'Dashboard', href: 'dashboard.html', icon: '📊', requiresAuth: true },
            { name: 'Crop Recommendation', href: 'crop-recommendation.html', icon: '🌾' },
            { name: 'Disease Detection', href: 'disease-detection.html', icon: '🔬' },
            { name: 'Weather', href: 'weather.html', icon: '🌤️' },
            { name: 'Market Prices', href: 'market-price.html', icon: '💰' },
            { name: 'Chatbot', href: 'chatbot.html', icon: '🤖' },
            { name: 'History', href: 'history.html', icon: '📋', requiresAuth: true },
            { name: 'Settings', href: 'settings.html', icon: '⚙️', requiresAuth: true },
            { name: 'Profile', href: 'profile.html', icon: '👤', requiresAuth: true }
        ],
        defaultLanguage: 'en',
        supportedLanguages: [
            { code: 'en', name: 'English' },
            { code: 'hi', name: 'हिंदी' },
            { code: 'te', name: 'తెలుగు' },
            { code: 'ta', name: 'தமிழ்' },
            { code: 'mr', name: 'मराठी' },
            { code: 'gu', name: 'ગુજરાતી' },
            { code: 'kn', name: 'ಕನ್ನಡ' },
            { code: 'bn', name: 'বাংলা' }
        ]
    },

    // Mobile App Configuration
    mobile: {
        packageName: 'com.agrismart.app',
        versionCode: 1,
        deepLinking: {
            scheme: 'agrismart',
            host: 'app'
        },
        webViewSettings: {
            allowFileAccess: true,
            allowContentAccess: true,
            allowFileAccessFromFileURLs: true,
            allowUniversalAccessFromFileURLs: true,
            domStorageEnabled: true,
            javaScriptEnabled: true
        }
    },

    // Analytics Configuration
    analytics: {
        enabled: true,
        events: [
            'page_view',
            'user_action',
            'api_call',
            'error',
            'performance'
        ],
        userProperties: [
            'user_id',
            'location',
            'farm_size',
            'crop_types',
            'experience_level'
        ]
    },

    // Notification Configuration
    notifications: {
        enabled: true,
        types: {
            weather: { title: 'Weather Alert', icon: '🌦️' },
            market: { title: 'Market Update', icon: '💹' },
            disease: { title: 'Disease Alert', icon: '⚠️' },
            general: { title: 'AgriSmart', icon: '🌾' }
        },
        defaultDuration: 5000
    },

    // Location Services
    location: {
        enabled: true,
        accuracy: 100, // meters
        timeout: 10000, // milliseconds
        maxAge: 300000, // 5 minutes
        enableHighAccuracy: true
    },

    // Validation Rules
    validation: {
        phone: {
            pattern: /^[+]?[1-9]\d{1,14}$/,
            message: 'Invalid phone number format'
        },
        email: {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Invalid email format'
        },
        password: {
            minLength: 8,
            pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            message: 'Password must be at least 8 characters with uppercase, lowercase, and number'
        },
        farmSize: {
            min: 0.1,
            max: 10000,
            message: 'Farm size must be between 0.1 and 10000 acres'
        }
    },

    // Error Messages
    messages: {
        network: {
            offline: 'You are offline. Some features may not work.',
            timeout: 'Request timed out. Please try again.',
            error: 'Network error. Please check your connection.'
        },
        auth: {
            loginRequired: 'Please log in to access this feature.',
            invalidCredentials: 'Invalid phone number or password.',
            sessionExpired: 'Your session has expired. Please log in again.'
        },
        validation: {
            required: 'This field is required.',
            invalidFormat: 'Please enter a valid value.',
            fileTooLarge: 'File size is too large. Maximum size is 5MB.'
        },
        success: {
            login: 'Login successful!',
            logout: 'Logged out successfully.',
            saved: 'Changes saved successfully.',
            uploaded: 'File uploaded successfully.'
        }
    },

    // Default Settings
    defaults: {
        user: {
            language: 'en',
            units: 'metric',
            notifications: true,
            location: true,
            theme: 'light'
        },
        form: {
            soilType: 'loamy',
            irrigationType: 'drip',
            farmingType: 'conventional'
        }
    }
};

// Environment-specific overrides
if (AppConfig.app.environment === 'production') {
    AppConfig.api.baseUrl = 'https://api.agrismart.com';
    AppConfig.analytics.enabled = true;
} else if (AppConfig.app.environment === 'staging') {
    AppConfig.api.baseUrl = 'https://staging-api.agrismart.com';
}

// Platform-specific configurations
const PlatformConfig = {
    // Web-specific configuration
    web: {
        serviceWorker: {
            enabled: true,
            scope: '/',
            cacheName: 'agrismart-cache-v1'
        },
        pwa: {
            installPrompt: true,
            standalone: true
        }
    },

    // Android-specific configuration
    android: {
        permissions: [
            'android.permission.CAMERA',
            'android.permission.ACCESS_FINE_LOCATION',
            'android.permission.ACCESS_COARSE_LOCATION',
            'android.permission.READ_EXTERNAL_STORAGE',
            'android.permission.WRITE_EXTERNAL_STORAGE',
            'android.permission.INTERNET',
            'android.permission.ACCESS_NETWORK_STATE'
        ],
        features: {
            camera: true,
            gps: true,
            storage: true,
            biometric: true
        }
    },

    // iOS-specific configuration
    ios: {
        permissions: [
            'NSCameraUsageDescription',
            'NSLocationWhenInUseUsageDescription',
            'NSPhotoLibraryUsageDescription'
        ],
        features: {
            camera: true,
            gps: true,
            storage: true,
            faceId: true
        }
    }
};

// Utility functions for configuration
const ConfigUtils = {
    // Get API endpoint URL
    getApiUrl: (endpoint) => {
        const parts = endpoint.split('.');
        let url = AppConfig.api.endpoints;
        
        for (const part of parts) {
            url = url[part];
            if (!url) return null;
        }
        
        return AppConfig.api.baseUrl + url;
    },

    // Check if feature is enabled
    isFeatureEnabled: (feature) => {
        return AppConfig.features[feature] === true;
    },

    // Get theme color
    getThemeColor: (colorName) => {
        return AppConfig.ui.theme[colorName];
    },

    // Get navigation items for current user
    getNavigationItems: (isAuthenticated = false) => {
        return AppConfig.ui.navigation.filter(item => 
            !item.requiresAuth || isAuthenticated
        );
    },

    // Get validation rule
    getValidationRule: (field) => {
        return AppConfig.validation[field];
    },

    // Get message
    getMessage: (category, key) => {
        return AppConfig.messages[category]?.[key] || 'Unknown error';
    }
};

// Make configuration globally available
window.AppConfig = AppConfig;
window.PlatformConfig = PlatformConfig;
window.ConfigUtils = ConfigUtils;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AppConfig,
        PlatformConfig,
        ConfigUtils
    };
}