/**
 * Recommendation Model
 * MongoDB schema for crop recommendations
 */

const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    soilData: {
        ph: {
            type: Number,
            required: true,
            min: 0,
            max: 14
        },
        nitrogen: {
            type: Number,
            required: true,
            min: 0
        },
        phosphorus: {
            type: Number,
            required: true,
            min: 0
        },
        potassium: {
            type: Number,
            required: true,
            min: 0
        },
        moisture: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        }
    },
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
        }
    },
    season: {
        type: String,
        required: true,
        enum: ['kharif', 'rabi', 'summer', 'year-round']
    },
    previousCrop: {
        type: String,
        default: null
    },
    recommendations: [{
        cropName: {
            type: String,
            required: true
        },
        suitabilityScore: {
            type: Number,
            required: true,
            min: 0,
            max: 1
        },
        predictedYield: {
            type: Number,
            required: true,
            min: 0
        },
        profitMargin: {
            type: Number,
            required: true
        },
        sustainabilityScore: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },
        marketPrice: {
            type: Number,
            required: true,
            min: 0
        },
        growingTips: [String]
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient querying
recommendationSchema.index({ userId: 1, createdAt: -1 });
recommendationSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

module.exports = mongoose.model('Recommendation', recommendationSchema);