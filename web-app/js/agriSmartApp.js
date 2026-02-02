/**
 * AgriSmart Frontend Integration
 * Main file that connects HTML pages to backend APIs
 */

class AgriSmartApp {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.user = null;
        this.init();
    }

    // Get current page name
    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        return filename.replace('.html', '');
    }

    // Initialize the application
    async init() {
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeApp());
            } else {
                this.initializeApp();
            }
        } catch (error) {
            console.error('App initialization error:', error);
        }
    }

    // Initialize application after DOM is ready
    async initializeApp() {
        try {
            // Initialize authentication
            window.authService.initializePage();
            this.user = window.authService.getCurrentUser();

            // Page-specific initialization
            await this.initializePage();

            console.log(`AgriSmart App initialized for page: ${this.currentPage}`);
        } catch (error) {
            console.error('App initialization error:', error);
            window.notificationService.error('Failed to initialize application');
        }
    }

    // Initialize specific page functionality
    async initializePage() {
        switch (this.currentPage) {
            case 'index':
                this.initializeHomePage();
                break;
            case 'login':
                this.initializeLoginPage();
                break;
            case 'register':
                this.initializeRegisterPage();
                break;
            case 'dashboard':
                this.initializeDashboardPage();
                break;
            case 'crop-recommendation':
                this.initializeCropRecommendationPage();
                break;
            case 'disease-detection':
                this.initializeDiseaseDetectionPage();
                break;
            case 'weather':
                this.initializeWeatherPage();
                break;
            case 'market-price':
                this.initializeMarketPricePage();
                break;
            case 'chatbot':
                this.initializeChatbotPage();
                break;
            case 'history':
                this.initializeHistoryPage();
                break;
            case 'profile':
                this.initializeProfilePage();
                break;
            case 'settings':
                this.initializeSettingsPage();
                break;
            default:
                console.log('No specific initialization for page:', this.currentPage);
        }
    }

    // Initialize Home Page
    initializeHomePage() {
        // No authentication required for home page
        console.log('Home page initialized');
    }

    // Initialize Login Page
    initializeLoginPage() {
        // If already logged in, redirect to dashboard
        if (window.authService.isAuthenticated()) {
            window.location.href = 'dashboard.html';
            return;
        }

        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin();
            });
        }

        // Google Auth button
        const googleAuthBtn = document.getElementById('google-auth');
        if (googleAuthBtn) {
            googleAuthBtn.addEventListener('click', () => {
                window.notificationService.info('Google authentication coming soon!');
            });
        }

        // Phone OTP functionality
        const phoneAuthBtn = document.getElementById('phone-auth');
        if (phoneAuthBtn) {
            phoneAuthBtn.addEventListener('click', () => {
                this.showOTPModal();
            });
        }

        // OTP form submission
        const otpForm = document.getElementById('otp-form');
        if (otpForm) {
            otpForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleOTPVerification();
            });
        }
    }

    // Handle login form submission
    async handleLogin() {
        const form = document.getElementById('login-form');
        const formData = new FormData(form);
        
        const credentials = {
            phone: formData.get('phone'),
            password: formData.get('password')
        };

        // Validate form
        const validation = window.uiHelper.validateForm(form);
        if (!validation.isValid) {
            validation.errors.forEach(error => {
                window.notificationService.error(error);
            });
            return;
        }

        const submitBtn = form.querySelector('button[type=\"submit\"]');
        const loading = window.uiHelper.showLoading(submitBtn, 'Logging in...');

        try {
            const result = await window.authService.login(credentials);
            
            if (result.success) {
                window.notificationService.success('Login successful! Redirecting...');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                window.notificationService.error(result.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            window.notificationService.error('Login failed. Please try again.');
        } finally {
            loading.restore();
        }
    }

    // Show OTP modal
    showOTPModal() {
        const modal = document.getElementById('otp-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    // Handle OTP verification
    async handleOTPVerification() {
        const otpInput = document.getElementById('otp');
        const otp = otpInput.value;

        if (!otp || otp.length !== 6) {
            window.notificationService.error('Please enter a valid 6-digit OTP');
            return;
        }

        const submitBtn = document.querySelector('#otp-form button[type=\"submit\"]');
        const loading = window.uiHelper.showLoading(submitBtn, 'Verifying...');

        try {
            const result = await window.authService.verifyOTP({ otp: otp });
            
            if (result.success) {
                window.notificationService.success('OTP verified successfully!');
                document.getElementById('otp-modal').style.display = 'none';
                if (window.authService.isAuthenticated()) {
                    window.location.href = 'dashboard.html';
                }
            } else {
                window.notificationService.error(result.error || 'OTP verification failed');
            }
        } catch (error) {
            console.error('OTP verification error:', error);
            window.notificationService.error('OTP verification failed. Please try again.');
        } finally {
            loading.restore();
        }
    }

    // Initialize Register Page
    initializeRegisterPage() {
        // If already logged in, redirect to dashboard
        if (window.authService.isAuthenticated()) {
            window.location.href = 'dashboard.html';
            return;
        }

        // Implementation for register page would go here
        console.log('Register page initialized');
    }

    // Initialize Dashboard Page
    async initializeDashboardPage() {
        // Require authentication
        if (!window.authService.requireAuth()) return;

        try {
            // Load dashboard data
            await this.loadDashboardData();
        } catch (error) {
            console.error('Dashboard initialization error:', error);
            window.notificationService.error('Failed to load dashboard data');
        }
    }

    // Load dashboard data
    async loadDashboardData() {
        try {
            // Get user location for weather data
            const location = await window.locationService.requestPermission();
            
            if (location.success) {
                // Load weather data
                const weatherResult = await window.weatherService.getCurrentWeather(
                    location.location.latitude,
                    location.location.longitude
                );
                
                if (weatherResult.success) {
                    this.updateWeatherWidget(weatherResult.data);
                }
            }

            // Load user stats
            const statsResult = await window.profileService.getUserStats();
            if (statsResult.success) {
                this.updateStatsCards(statsResult.data);
            }

            // Load recent activity
            const activityResult = await window.profileService.getActivityHistory(5);
            if (activityResult.success) {
                this.updateRecentActivity(activityResult.data);
            }

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    // Update weather widget
    updateWeatherWidget(weatherData) {
        // Update weather display elements
        const tempElement = document.querySelector('.weather-temp');
        const descElement = document.querySelector('.weather-desc');
        const iconElement = document.querySelector('.weather-icon');

        if (tempElement && weatherData.temperature) {
            tempElement.textContent = `${weatherData.temperature}°C`;
        }

        if (descElement && weatherData.description) {
            descElement.textContent = weatherData.description;
        }

        // Update weather icons based on conditions
        if (iconElement && weatherData.description) {
            const weatherIcons = {
                'clear sky': '☀️',
                'few clouds': '🌤️',
                'scattered clouds': '⛅',
                'broken clouds': '☁️',
                'shower rain': '🌧️',
                'rain': '🌧️',
                'thunderstorm': '⛈️',
                'snow': '❄️',
                'mist': '🌫️'
            };
            
            const description = weatherData.description.toLowerCase();
            const icon = weatherIcons[description] || '🌤️';
            iconElement.textContent = icon;
        }
    }

    // Update stats cards
    updateStatsCards(statsData) {
        // Update various stat cards with data from backend
        const statElements = {
            'total-recommendations': statsData.totalRecommendations || 0,
            'diseases-detected': statsData.diseasesDetected || 0,
            'weather-checks': statsData.weatherChecks || 0,
            'market-searches': statsData.marketSearches || 0
        };

        Object.entries(statElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    // Update recent activity
    updateRecentActivity(activityData) {
        const activityContainer = document.querySelector('.activity-list');
        if (!activityContainer || !activityData) return;

        activityContainer.innerHTML = activityData.map(activity => `
            <div class=\"activity-item\">
                <div class=\"activity-icon\">${this.getActivityIcon(activity.type)}</div>
                <div class=\"activity-content\">
                    <strong>${activity.title}</strong>
                    <p>${activity.description}</p>
                </div>
                <div class=\"activity-time\">${window.uiHelper.formatRelativeTime(activity.createdAt)}</div>
            </div>
        `).join('');
    }

    // Get activity icon based on type
    getActivityIcon(type) {
        const icons = {
            'crop_recommendation': '🌾',
            'disease_detection': '🔬',
            'weather_check': '🌤️',
            'market_search': '💰',
            'chat': '💬'
        };
        return icons[type] || '📝';
    }

    // Initialize Crop Recommendation Page
    async initializeCropRecommendationPage() {
        // Require authentication
        if (!window.authService.requireAuth()) return;

        const form = document.querySelector('.recommendation-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleCropRecommendation();
            });
        }

        // Auto-fill location if available
        this.autoFillLocation();
    }

    // Handle crop recommendation form
    async handleCropRecommendation() {
        const form = document.querySelector('.recommendation-form');
        const formData = new FormData(form);
        
        // Validate form
        const validation = window.uiHelper.validateForm(form);
        if (!validation.isValid) {
            validation.errors.forEach(error => {
                window.notificationService.error(error);
            });
            return;
        }

        const recommendationData = {
            soil_data: {
                ph: parseFloat(formData.get('ph')),
                nitrogen: parseFloat(formData.get('nitrogen')),
                phosphorus: parseFloat(formData.get('phosphorus')),
                potassium: parseFloat(formData.get('potassium')),
                moisture: parseFloat(formData.get('moisture'))
            },
            location: {
                latitude: parseFloat(formData.get('latitude')),
                longitude: parseFloat(formData.get('longitude'))
            },
            season: formData.get('season'),
            previous_crop: formData.get('previous_crop') || null
        };

        const submitBtn = form.querySelector('button[type=\"submit\"]');
        const loading = window.uiHelper.showLoading(submitBtn, 'Getting recommendations...');

        try {
            const result = await window.cropService.getCropRecommendation(recommendationData);
            
            if (result.success) {
                this.displayCropRecommendations(result.data.recommendations);
                window.notificationService.success('Crop recommendations generated successfully!');
                
                // Save recommendation to history
                await window.cropService.saveRecommendation(result.data);
            } else {
                window.notificationService.error(result.error || 'Failed to get recommendations');
            }
        } catch (error) {
            console.error('Crop recommendation error:', error);
            window.notificationService.error('Failed to get recommendations. Please try again.');
        } finally {
            loading.restore();
        }
    }

    // Display crop recommendations
    displayCropRecommendations(recommendations) {
        const resultsContainer = document.querySelector('.recommendation-results');
        if (!resultsContainer) return;

        resultsContainer.innerHTML = `
            <h3>🌾 Recommended Crops for Your Farm</h3>
            <div class=\"crop-recommendations\">
                ${recommendations.map((crop, index) => `
                    <div class=\"crop-card\" style=\"animation-delay: ${index * 0.1}s;\">
                        <div class=\"crop-rank\">#${index + 1}</div>
                        <h4>${crop.crop_name}</h4>
                        <div class=\"crop-score\">
                            <span>Suitability: ${(crop.suitability_score * 100).toFixed(0)}%</span>
                        </div>
                        <div class=\"crop-details\">
                            <p><strong>Expected Yield:</strong> ${crop.predicted_yield} tons/hectare</p>
                            <p><strong>Profit Margin:</strong> ${window.uiHelper.formatCurrency(crop.profit_margin)}</p>
                            <p><strong>Market Price:</strong> ${window.uiHelper.formatCurrency(crop.market_price)}/quintal</p>
                            <p><strong>Sustainability Score:</strong> ${crop.sustainability_score}/100</p>
                        </div>
                        <div class=\"crop-tips\">
                            <strong>Growing Tips:</strong>
                            <ul>
                                ${crop.growing_tips.map(tip => `<li>${tip}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Scroll to results
        window.uiHelper.scrollToElement(resultsContainer, 100);
    }

    // Auto-fill location
    async autoFillLocation() {
        try {
            const location = await window.locationService.getCurrentPosition();
            
            const latInput = document.querySelector('input[name=\"latitude\"]');
            const lonInput = document.querySelector('input[name=\"longitude\"]');
            
            if (latInput && lonInput) {
                latInput.value = location.latitude.toFixed(6);
                lonInput.value = location.longitude.toFixed(6);
            }
        } catch (error) {
            console.log('Could not auto-fill location:', error.message);
        }
    }

    // Initialize Disease Detection Page
    async initializeDiseaseDetectionPage() {
        // Require authentication
        if (!window.authService.requireAuth()) return;

        this.initializeImageUpload();
    }

    // Initialize image upload functionality
    initializeImageUpload() {
        const uploadArea = document.querySelector('.upload-area');
        const fileInput = document.querySelector('input[type=\"file\"]');
        const detectBtn = document.querySelector('.detect-btn');

        if (!uploadArea || !fileInput || !detectBtn) return;

        // Drag and drop functionality
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleImageSelect(files[0]);
            }
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleImageSelect(e.target.files[0]);
            }
        });

        // Detect button click
        detectBtn.addEventListener('click', () => {
            this.handleDiseaseDetection();
        });
    }

    // Handle image selection
    handleImageSelect(file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            window.notificationService.error('Please select a valid image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            window.notificationService.error('Image file must be less than 5MB');
            return;
        }

        // Store selected file
        this.selectedImage = file;

        // Show image preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.querySelector('.image-preview');
            if (preview) {
                preview.innerHTML = `
                    <img src=\"${e.target.result}\" alt=\"Selected image\" style=\"max-width: 100%; max-height: 300px; border-radius: 0.5rem;\">
                `;
            }
        };
        reader.readAsDataURL(file);

        // Enable detect button
        const detectBtn = document.querySelector('.detect-btn');
        if (detectBtn) {
            detectBtn.disabled = false;
        }

        window.notificationService.success('Image uploaded successfully. Click \"Detect Disease\" to analyze.');
    }

    // Handle disease detection
    async handleDiseaseDetection() {
        if (!this.selectedImage) {
            window.notificationService.error('Please select an image first');
            return;
        }

        const detectBtn = document.querySelector('.detect-btn');
        const loading = window.uiHelper.showLoading(detectBtn, 'Analyzing image...');

        try {
            const result = await window.diseaseService.detectDisease(this.selectedImage);
            
            if (result.success) {
                this.displayDiseaseResults(result.data.detection);
                window.notificationService.success('Disease detection completed!');
                
                // Save detection to history
                await window.diseaseService.saveDetectionResult(result.data);
            } else {
                window.notificationService.error(result.error || 'Disease detection failed');
            }
        } catch (error) {
            console.error('Disease detection error:', error);
            window.notificationService.error('Disease detection failed. Please try again.');
        } finally {
            loading.restore();
        }
    }

    // Display disease detection results
    displayDiseaseResults(detection) {
        const resultsContainer = document.querySelector('.detection-results');
        if (!resultsContainer) return;

        const confidenceColor = detection.confidence > 0.8 ? '#22c55e' : 
                               detection.confidence > 0.6 ? '#f59e0b' : '#ef4444';

        resultsContainer.innerHTML = `
            <h3>🔬 Disease Detection Results</h3>
            <div class=\"detection-card\">
                <div class=\"detection-header\">
                    <h4>${detection.disease_name}</h4>
                    <div class=\"confidence-badge\" style=\"background-color: ${confidenceColor};\">
                        ${(detection.confidence * 100).toFixed(1)}% Confidence
                    </div>
                </div>
                
                <div class=\"severity-indicator\">
                    <strong>Severity Level:</strong> 
                    <span class=\"severity ${detection.severity}\">${detection.severity.toUpperCase()}</span>
                </div>

                <div class=\"treatment-section\">
                    <h5>🔧 Treatment Recommendations:</h5>
                    <ul class=\"treatment-list\">
                        ${detection.treatment.map(treatment => `<li>${treatment}</li>`).join('')}
                    </ul>
                </div>

                <div class=\"prevention-section\">
                    <h5>🛡️ Prevention Tips:</h5>
                    <ul class=\"prevention-list\">
                        ${detection.prevention.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;

        // Scroll to results
        window.uiHelper.scrollToElement(resultsContainer, 100);
    }

    // Initialize other pages (placeholder implementations)
    async initializeWeatherPage() {
        if (!window.authService.requireAuth()) return;
        console.log('Weather page initialized');
        // Weather page implementation...
    }

    async initializeMarketPricePage() {
        if (!window.authService.requireAuth()) return;
        console.log('Market price page initialized');
        // Market price page implementation...
    }

    async initializeChatbotPage() {
        if (!window.authService.requireAuth()) return;
        console.log('Chatbot page initialized');
        // Chatbot page implementation...
    }

    async initializeHistoryPage() {
        if (!window.authService.requireAuth()) return;
        console.log('History page initialized');
        // History page implementation...
    }

    async initializeProfilePage() {
        if (!window.authService.requireAuth()) return;
        console.log('Profile page initialized');
        // Profile page implementation...
    }

    async initializeSettingsPage() {
        if (!window.authService.requireAuth()) return;
        console.log('Settings page initialized');
        // Settings page implementation...
    }
}

// Initialize the application
window.agriSmartApp = new AgriSmartApp();