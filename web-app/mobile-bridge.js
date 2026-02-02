/**
 * AgriSmart Mobile Bridge
 * Handles communication between web app and mobile app
 */

// ============================================
// MOBILE APP INTEGRATION
// ============================================

const MobileBridge = {
    // Check if running inside mobile app
    isMobileApp: () => {
        return window.AgriSmartMobile !== undefined || 
               window.webkit?.messageHandlers?.AgriSmartMobile !== undefined ||
               window.ReactNativeWebView !== undefined;
    },

    // Send data to mobile app
    sendToMobile: (data) => {
        try {
            if (window.AgriSmartMobile) {
                // Android WebView interface
                window.AgriSmartMobile.receiveData(JSON.stringify(data));
            } else if (window.webkit?.messageHandlers?.AgriSmartMobile) {
                // iOS WebKit interface
                window.webkit.messageHandlers.AgriSmartMobile.postMessage(data);
            } else if (window.ReactNativeWebView) {
                // React Native WebView
                window.ReactNativeWebView.postMessage(JSON.stringify(data));
            } else {
                console.log('Mobile app interface not available, data:', data);
            }
        } catch (error) {
            console.error('Error sending data to mobile app:', error);
        }
    },

    // Receive data from mobile app
    receiveFromMobile: (callback) => {
        window.mobileDataCallback = callback;
    },

    // Sync user data with mobile app
    syncUserData: () => {
        const userData = StorageManager.getUser();
        const history = StorageManager.getHistory();
        const preferences = StorageManager.getAllPreferences();
        
        MobileBridge.sendToMobile({
            type: 'sync_user_data',
            data: {
                user: userData,
                history: history,
                preferences: preferences,
                timestamp: new Date().toISOString()
            }
        });
    },

    // Request location from mobile app
    requestLocation: () => {
        return new Promise((resolve, reject) => {
            if (MobileBridge.isMobileApp()) {
                window.locationCallback = (location) => {
                    resolve(location);
                };
                
                MobileBridge.sendToMobile({
                    type: 'request_location'
                });
                
                // Timeout after 10 seconds
                setTimeout(() => {
                    reject(new Error('Location request timeout'));
                }, 10000);
            } else {
                // Fallback to web geolocation
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            resolve({
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude,
                                accuracy: position.coords.accuracy
                            });
                        },
                        (error) => reject(error)
                    );
                } else {
                    reject(new Error('Geolocation not supported'));
                }
            }
        });
    },

    // Take photo using mobile camera
    takePhoto: () => {
        return new Promise((resolve, reject) => {
            if (MobileBridge.isMobileApp()) {
                window.photoCallback = (photo) => {
                    resolve(photo);
                };
                
                MobileBridge.sendToMobile({
                    type: 'take_photo'
                });
                
                // Timeout after 30 seconds
                setTimeout(() => {
                    reject(new Error('Photo capture timeout'));
                }, 30000);
            } else {
                // Fallback to file input
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.capture = 'camera';
                
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            resolve({
                                data: e.target.result,
                                type: file.type,
                                name: file.name
                            });
                        };
                        reader.readAsDataURL(file);
                    } else {
                        reject(new Error('No photo selected'));
                    }
                };
                
                input.click();
            }
        });
    },

    // Show native notification
    showNotification: (title, message, data = {}) => {
        if (MobileBridge.isMobileApp()) {
            MobileBridge.sendToMobile({
                type: 'show_notification',
                title: title,
                message: message,
                data: data
            });
        } else {
            // Fallback to web notification
            if (Notification.permission === 'granted') {
                new Notification(title, { body: message });
            } else {
                console.log('Notification:', title, message);
            }
        }
    },

    // Share content
    share: (data) => {
        if (MobileBridge.isMobileApp()) {
            MobileBridge.sendToMobile({
                type: 'share',
                data: data
            });
        } else {
            // Fallback to web share API
            if (navigator.share) {
                navigator.share(data);
            } else {
                // Fallback to copying to clipboard
                navigator.clipboard.writeText(data.text || data.url || JSON.stringify(data));
                alert('Content copied to clipboard');
            }
        }
    }
};

// ============================================
// MOBILE APP CALLBACKS
// ============================================

// Handle data received from mobile app
window.receiveDataFromMobile = function(data) {
    try {
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        
        switch(parsedData.type) {
            case 'location_received':
                if (window.locationCallback) {
                    window.locationCallback(parsedData.data);
                    delete window.locationCallback;
                }
                break;
                
            case 'photo_captured':
                if (window.photoCallback) {
                    window.photoCallback(parsedData.data);
                    delete window.photoCallback;
                }
                break;
                
            case 'user_data_sync':
                // Update local storage with mobile data
                if (parsedData.data.user) {
                    StorageManager.setUser(parsedData.data.user);
                }
                if (parsedData.data.history) {
                    localStorage.setItem('agrismart_history', JSON.stringify(parsedData.data.history));
                }
                break;
                
            default:
                if (window.mobileDataCallback) {
                    window.mobileDataCallback(parsedData);
                }
        }
    } catch (error) {
        console.error('Error processing mobile data:', error);
    }
};

// ============================================
// AUTO-INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize mobile bridge if in mobile app
    if (MobileBridge.isMobileApp()) {
        console.log('Mobile app detected, initializing bridge...');
        
        // Add mobile app specific styles
        document.body.classList.add('mobile-app');
        
        // Sync data on load
        setTimeout(() => {
            MobileBridge.syncUserData();
        }, 1000);
        
        // Send ready signal to mobile app
        MobileBridge.sendToMobile({
            type: 'web_ready',
            timestamp: new Date().toISOString()
        });
    }
});

// Make bridge globally available
window.MobileBridge = MobileBridge;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileBridge;
}