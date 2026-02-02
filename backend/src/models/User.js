/**
 * User Model
 * MongoDB schema for user authentication and profile
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        trim: true,
        match: [/^[+]?[0-9\s-]{10,15}$/, 'Please enter a valid phone number']
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false
    },
    avatar: {
        type: String,
        default: null
    },
    location: {
        type: String,
        trim: true
    },
    coordinates: {
        latitude: Number,
        longitude: Number
    },
    farmDetails: {
        area: { type: Number, default: 0 },
        unit: { type: String, default: 'hectares' },
        soilType: String,
        irrigationType: String,
        crops: [String]
    },
    preferences: {
        language: { type: String, default: 'en' },
        notifications: { type: Boolean, default: true },
        units: { type: String, default: 'metric' },
        theme: { type: String, default: 'light' }
    },
    otp: {
        code: String,
        expiresAt: Date,
        verified: { type: Boolean, default: false }
    },
    refreshToken: {
        type: String,
        select: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries (phone index is already created by unique: true)
userSchema.index({ email: 1 });
userSchema.index({ location: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate OTP
userSchema.methods.generateOTP = function() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.otp = {
        code: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        verified: false
    };
    return otp;
};

// Verify OTP
userSchema.methods.verifyOTP = function(code) {
    if (!this.otp || !this.otp.code) return false;
    if (this.otp.expiresAt < new Date()) return false;
    if (this.otp.code !== code) return false;
    
    this.otp.verified = true;
    return true;
};

// Get public profile (exclude sensitive data)
userSchema.methods.toPublicJSON = function() {
    return {
        id: this._id,
        name: this.name,
        phone: this.phone,
        email: this.email,
        avatar: this.avatar,
        location: this.location,
        farmDetails: this.farmDetails,
        preferences: this.preferences,
        createdAt: this.createdAt
    };
};

const User = mongoose.model('User', userSchema);

module.exports = User;
