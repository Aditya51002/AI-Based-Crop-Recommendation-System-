/**
 * Weather Data Model
 * MongoDB schema for weather data caching
 */

const mongoose = require('mongoose');

const weatherDataSchema = new mongoose.Schema({
    location: {
        latitude: {
            type: Number,
            required: true,
            min: -90,
            max: 90
        },
        longitude: {
            type: Number,
            required: true,
            min: -180,
            max: 180
        },
        name: String
    },
    current: {
        temperature: Number,
        humidity: Number,
        pressure: Number,
        windSpeed: Number,
        windDirection: Number,
        rainfall: Number,
        description: String,
        icon: String,
        uvIndex: Number,
        visibility: Number
    },
    forecast: [{
        date: Date,
        temperature: {
            min: Number,
            max: Number,
            avg: Number
        },
        humidity: Number,
        rainfall: Number,
        windSpeed: Number,
        description: String,
        icon: String
    }],
    alerts: [{
        type: {
            type: String,
            enum: ['warning', 'watch', 'advisory']
        },
        severity: {
            type: String,
            enum: ['minor', 'moderate', 'severe', 'extreme']
        },
        title: String,
        description: String,
        startTime: Date,
        endTime: Date
    }],
    source: {
        type: String,
        default: 'openweather'
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 3600000) // 1 hour expiry
    }
}, {
    timestamps: true
});

// Index for efficient querying and TTL
weatherDataSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });
weatherDataSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('WeatherData', weatherDataSchema);