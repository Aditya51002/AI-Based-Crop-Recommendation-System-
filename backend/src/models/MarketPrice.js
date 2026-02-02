/**
 * Market Price Model
 * MongoDB schema for market price data
 */

const mongoose = require('mongoose');

const marketPriceSchema = new mongoose.Schema({
    crop: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    variety: {
        type: String,
        trim: true
    },
    market: {
        name: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        district: {
            type: String,
            required: true
        },
        location: {
            latitude: Number,
            longitude: Number
        }
    },
    prices: {
        minimum: {
            type: Number,
            required: true,
            min: 0
        },
        maximum: {
            type: Number,
            required: true,
            min: 0
        },
        modal: {
            type: Number,
            required: true,
            min: 0
        }
    },
    unit: {
        type: String,
        default: 'quintal'
    },
    date: {
        type: Date,
        required: true
    },
    source: {
        type: String,
        default: 'agmarknet'
    },
    trend: {
        type: String,
        enum: ['increasing', 'decreasing', 'stable'],
        default: 'stable'
    },
    volume: {
        type: Number,
        min: 0
    }
}, {
    timestamps: true
});

// Compound indexes for efficient querying
marketPriceSchema.index({ crop: 1, date: -1 });
marketPriceSchema.index({ 'market.name': 1, crop: 1, date: -1 });
marketPriceSchema.index({ 'market.state': 1, crop: 1, date: -1 });
marketPriceSchema.index({ date: -1 });

// Validate that maximum price is greater than or equal to minimum
marketPriceSchema.pre('save', function(next) {
    if (this.prices.maximum < this.prices.minimum) {
        next(new Error('Maximum price cannot be less than minimum price'));
    }
    if (this.prices.modal < this.prices.minimum || this.prices.modal > this.prices.maximum) {
        next(new Error('Modal price must be between minimum and maximum prices'));
    }
    next();
});

module.exports = mongoose.model('MarketPrice', marketPriceSchema);