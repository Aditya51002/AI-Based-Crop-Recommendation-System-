/**
 * History Model
 * Tracks user activities and recommendations
 */

const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: [
            'login',
            'crop-recommendation',
            'disease-detection',
            'weather-check',
            'market-price',
            'chatbot',
            'profile-update',
            'settings-update'
        ],
        index: true
    },
    data: {
        // Flexible schema for different activity types
        crop: String,
        disease: String,
        location: String,
        confidence: Number,
        message: String,
        formData: mongoose.Schema.Types.Mixed,
        result: mongoose.Schema.Types.Mixed
    },
    metadata: {
        ip: String,
        userAgent: String,
        platform: String
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Compound index for user history queries
historySchema.index({ userId: 1, createdAt: -1 });
historySchema.index({ userId: 1, type: 1, createdAt: -1 });

// Static method to get user history
historySchema.statics.getUserHistory = async function(userId, options = {}) {
    const { type, limit = 50, skip = 0 } = options;
    
    const query = { userId };
    if (type) query.type = type;
    
    return this.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
};

// Static method to add history entry
historySchema.statics.addEntry = async function(userId, type, data, metadata = {}) {
    return this.create({
        userId,
        type,
        data,
        metadata
    });
};

const History = mongoose.model('History', historySchema);

module.exports = History;
