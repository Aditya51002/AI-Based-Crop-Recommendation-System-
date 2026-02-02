/**
 * AgriSmart System Interconnection Manager
 * Manages all connections between web app, mobile app, and external services
 */

class SystemInterconnection {
    constructor() {
        this.initialized = false;
        this.connections = new Map();
        this.eventListeners = new Map();
        
        this.init();
    }

    async init() {
        try {
            console.log('Initializing AgriSmart System Interconnection...');
            
            // Initialize platform detection
            this.detectPlatform();
            
            // Initialize storage sync
            this.initStorageSync();
            
            // Initialize API connectivity
            this.initApiConnectivity();
            
            // Initialize cross-platform messaging
            this.initCrossPlatformMessaging();
            
            // Initialize data synchronization
            this.initDataSync();
            
            // Initialize offline support
            this.initOfflineSupport();
            
            this.initialized = true;
            this.emit('system:ready');
            
            console.log('AgriSmart System Interconnection initialized successfully');
        } catch (error) {
            console.error('Failed to initialize system interconnection:', error);
            this.emit('system:error', error);
        }
    }

    detectPlatform() {
        this.platform = {
            isWeb: !window.AgriSmartMobile && !window.ReactNativeWebView,
            isAndroid: !!(window.AgriSmartMobile || navigator.userAgent.includes('Android')),
            isiOS: !!(window.webkit?.messageHandlers || navigator.userAgent.includes('iOS')),
            isMobile: MobileBridge.isMobileApp(),
            isOnline: navigator.onLine
        };
        
        console.log('Platform detected:', this.platform);
    }

    initStorageSync() {
        // Sync data between different storage mechanisms
        this.storageSync = {
            // Sync user data across platforms
            syncUserData: () => {
                const userData = StorageManager.getUser();
                if (userData && this.platform.isMobile) {
                    MobileBridge.syncUserData();
                }
                return userData;
            },

            // Sync history data
            syncHistory: () => {
                const history = StorageManager.getHistory();
                if (this.platform.isMobile) {
                    MobileBridge.sendToMobile({
                        type: 'sync_history',
                        data: history
                    });
                }
                return history;
            },

            // Sync preferences
            syncPreferences: () => {
                const preferences = StorageManager.getAllPreferences();
                if (this.platform.isMobile) {
                    MobileBridge.sendToMobile({
                        type: 'sync_preferences',
                        data: preferences
                    });
                }
                return preferences;
            }
        };
    }

    initApiConnectivity() {
        this.apiManager = {
            // Test API connectivity
            testConnectivity: async () => {
                try {
                    const response = await fetch(AppConfig.api.baseUrl + '/health', {
                        method: 'GET',
                        timeout: 5000
                    });
                    return response.ok;
                } catch (error) {
                    console.warn('API connectivity test failed:', error);
                    return false;
                }
            },

            // Get connection status
            getStatus: () => {
                return {
                    online: this.platform.isOnline,
                    apiReachable: this.connections.get('api') || false,
                    mobileConnected: this.platform.isMobile && this.connections.get('mobile') || false
                };
            }
        };
    }

    initCrossPlatformMessaging() {
        // Web to Mobile messaging
        this.messaging = {
            sendToMobile: (type, data) => {
                if (this.platform.isMobile) {
                    MobileBridge.sendToMobile({ type, data, timestamp: Date.now() });
                }
            },

            sendToWeb: (type, data) => {
                // For mobile app to send data to web components
                window.dispatchEvent(new CustomEvent('mobile:message', {
                    detail: { type, data, timestamp: Date.now() }
                }));
            },

            // Subscribe to cross-platform messages
            subscribe: (type, callback) => {
                const listeners = this.eventListeners.get(type) || [];
                listeners.push(callback);
                this.eventListeners.set(type, listeners);
            },

            // Unsubscribe from messages
            unsubscribe: (type, callback) => {
                const listeners = this.eventListeners.get(type) || [];
                const index = listeners.indexOf(callback);
                if (index > -1) {
                    listeners.splice(index, 1);
                    this.eventListeners.set(type, listeners);
                }
            }
        };

        // Listen for mobile messages
        window.addEventListener('mobile:message', (event) => {
            this.handleCrossPlatformMessage(event.detail);
        });
    }

    initDataSync() {
        this.dataSync = {
            // Auto-sync interval
            interval: null,

            start: () => {
                if (this.dataSync.interval) return;

                this.dataSync.interval = setInterval(() => {
                    this.performDataSync();
                }, AppConfig.storage.syncInterval);

                console.log('Data sync started');
            },

            stop: () => {
                if (this.dataSync.interval) {
                    clearInterval(this.dataSync.interval);
                    this.dataSync.interval = null;
                    console.log('Data sync stopped');
                }
            },

            // Manual sync
            syncNow: () => {
                return this.performDataSync();
            }
        };

        // Start auto-sync if enabled
        if (AppConfig.features.backgroundSync) {
            this.dataSync.start();
        }
    }

    async performDataSync() {
        try {
            console.log('Performing data sync...');
            
            // Sync user data
            this.storageSync.syncUserData();
            
            // Sync history
            this.storageSync.syncHistory();
            
            // Sync preferences
            this.storageSync.syncPreferences();
            
            // Sync with API if online
            if (this.platform.isOnline) {
                await this.syncWithApi();
            }
            
            this.emit('sync:complete');
        } catch (error) {
            console.error('Data sync failed:', error);
            this.emit('sync:error', error);
        }
    }

    async syncWithApi() {
        try {
            const user = StorageManager.getUser();
            if (!user) return;

            // Sync user profile
            const profile = await API.getUserProfile();
            if (profile) {
                StorageManager.setUser({ ...user, ...profile });
            }

            // Sync preferences
            const settings = await API.getSettings();
            if (settings) {
                Object.keys(settings).forEach(key => {
                    StorageManager.setPreference(key, settings[key]);
                });
            }

            this.connections.set('api', true);
        } catch (error) {
            this.connections.set('api', false);
            console.error('API sync failed:', error);
        }
    }

    initOfflineSupport() {
        // Handle online/offline events
        window.addEventListener('online', () => {
            this.platform.isOnline = true;
            this.emit('connection:online');
            Notifications.show('Back online! Syncing data...', 'success');
            this.dataSync.syncNow();
        });

        window.addEventListener('offline', () => {
            this.platform.isOnline = false;
            this.emit('connection:offline');
            Notifications.show('You are offline. Data will sync when connection is restored.', 'warning');
        });
    }

    handleCrossPlatformMessage(message) {
        const { type, data } = message;
        
        // Emit to subscribed listeners
        const listeners = this.eventListeners.get(type) || [];
        listeners.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Error in message listener:', error);
            }
        });

        // Handle specific message types
        switch (type) {
            case 'mobile:ready':
                this.connections.set('mobile', true);
                this.emit('mobile:connected');
                break;
                
            case 'mobile:data_sync':
                this.handleMobileDataSync(data);
                break;
                
            case 'mobile:location_update':
                this.handleLocationUpdate(data);
                break;
                
            case 'mobile:photo_captured':
                this.handlePhotoCaptured(data);
                break;
        }
    }

    handleMobileDataSync(data) {
        if (data.user) {
            StorageManager.setUser(data.user);
        }
        if (data.history) {
            localStorage.setItem('agrismart_history', JSON.stringify(data.history));
        }
        if (data.preferences) {
            Object.keys(data.preferences).forEach(key => {
                StorageManager.setPreference(key, data.preferences[key]);
            });
        }
        
        this.emit('data:synced', data);
    }

    handleLocationUpdate(location) {
        // Update user location
        const user = StorageManager.getUser();
        if (user) {
            user.currentLocation = location;
            StorageManager.setUser(user);
        }
        
        this.emit('location:updated', location);
    }

    handlePhotoCaptured(photo) {
        this.emit('photo:captured', photo);
    }

    // Event system
    emit(event, data = null) {
        window.dispatchEvent(new CustomEvent(`agrismart:${event}`, {
            detail: data
        }));
    }

    on(event, callback) {
        window.addEventListener(`agrismart:${event}`, (e) => {
            callback(e.detail);
        });
    }

    off(event, callback) {
        window.removeEventListener(`agrismart:${event}`, callback);
    }

    // Public API
    getConnections() {
        return Object.fromEntries(this.connections);
    }

    getPlatform() {
        return this.platform;
    }

    getStatus() {
        return {
            initialized: this.initialized,
            platform: this.platform,
            connections: this.getConnections(),
            syncEnabled: this.dataSync.interval !== null
        };
    }

    // Force reconnection
    async reconnect() {
        console.log('Forcing reconnection...');
        
        // Reset connection status
        this.connections.clear();
        
        // Test API connectivity
        const apiConnected = await this.apiManager.testConnectivity();
        this.connections.set('api', apiConnected);
        
        // Test mobile connectivity
        if (this.platform.isMobile) {
            try {
                MobileBridge.sendToMobile({ type: 'ping' });
                this.connections.set('mobile', true);
            } catch (error) {
                this.connections.set('mobile', false);
            }
        }
        
        // Perform data sync
        await this.dataSync.syncNow();
        
        this.emit('reconnection:complete');
    }
}

// Initialize system interconnection
const systemInterconnection = new SystemInterconnection();

// Make globally available
window.SystemInterconnection = systemInterconnection;

// Auto-start when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (!systemInterconnection.initialized) {
        systemInterconnection.init();
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SystemInterconnection;
}