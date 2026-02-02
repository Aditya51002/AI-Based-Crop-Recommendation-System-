/**
 * Disease Detection Model
 * MongoDB schema for disease detection records
 */

const mongoose = require('mongoose');

const diseaseDetectionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    cropType: {
        type: String,
        default: null
    },
    detection: {
        diseaseName: {
            type: String,
            required: true
        },
        confidence: {
            type: Number,
            required: true,
            min: 0,
            max: 1
        },
        severity: {
            type: String,
            required: true,
            enum: ['low', 'medium', 'high', 'critical']
        },
        treatment: [String],
        prevention: [String]
    },
    location: {
        latitude: Number,
        longitude: Number
    },
    processed: {
        type: Boolean,
        default: false
    },
    processingTime: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for efficient querying
diseaseDetectionSchema.index({ userId: 1, createdAt: -1 });
diseaseDetectionSchema.index({ 'detection.diseaseName': 1 });

module.exports = mongoose.model('DiseaseDetection', diseaseDetectionSchema);