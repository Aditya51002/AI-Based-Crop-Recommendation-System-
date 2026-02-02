/**
 * Chat History Model
 * MongoDB schema for chatbot conversations
 */

const mongoose = require('mongoose');

const chatHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sessionId: {
        type: String,
        required: true
    },
    messages: [{
        role: {
            type: String,
            required: true,
            enum: ['user', 'assistant']
        },
        content: {
            type: String,
            required: true
        },
        language: {
            type: String,
            default: 'en'
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        metadata: {
            confidence: Number,
            intent: String,
            entities: mongoose.Schema.Types.Mixed
        }
    }],
    context: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    language: {
        type: String,
        default: 'en'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for efficient querying
chatHistorySchema.index({ userId: 1, sessionId: 1 });
chatHistorySchema.index({ userId: 1, createdAt: -1 });
chatHistorySchema.index({ sessionId: 1 });

module.exports = mongoose.model('ChatHistory', chatHistorySchema);