/**
 * Authentication Routes
 * Login, Register, OTP verification, Token refresh
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validationRules } = require('../utils/validators');
const { protect } = require('../middleware/auth.middleware');

// Public routes
router.post('/login', validationRules.login, authController.login);
router.post('/register', validationRules.register, authController.register);
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp', validationRules.verifyOtp, authController.verifyOtp);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Protected routes
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);

module.exports = router;
