/**
 * Chatbot Routes
 * AI chatbot for agricultural assistance
 */

const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbot.controller');
const { optionalAuth } = require('../middleware/auth.middleware');
const { validationRules } = require('../utils/validators');

// Send message to chatbot
router.post('/', optionalAuth, validationRules.chatbot, chatbotController.sendMessage);

// Get chat history (requires auth for user-specific history)
router.get('/history', optionalAuth, chatbotController.getHistory);

// Clear chat history
router.delete('/history', optionalAuth, chatbotController.clearHistory);

// Get suggested questions
router.get('/suggestions', chatbotController.getSuggestions);

module.exports = router;
