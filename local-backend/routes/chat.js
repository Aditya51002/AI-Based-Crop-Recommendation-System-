const express = require('express');
const router = express.Router();

function chatResponse(message = '') {
    return {
        success: true,
        reply: `Thanks for your message: ${message || 'How can I help with your crops today?'}`,
        tips: [
            'Check soil moisture before irrigation.',
            'Rotate crops to improve soil health.',
            'Monitor local weather for optimal sowing times.'
        ]
    };
}

// Primary endpoint
router.post('/chat', (req, res) => {
    const { message } = req.body || {};
    res.json(chatResponse(message));
});

// Compatibility endpoints for existing frontend paths
router.post('/chat/message', (req, res) => {
    const { message } = req.body || {};
    res.json(chatResponse(message));
});

router.get('/chat/history', (req, res) => {
    res.json({ success: true, history: [] });
});

router.delete('/chat/history', (req, res) => {
    res.json({ success: true, message: 'History cleared (mock)' });
});

router.get('/chat/languages', (req, res) => {
    res.json({ success: true, languages: ['en', 'hi'] });
});

router.get('/chat/faq', (req, res) => {
    res.json({ success: true, faqs: [] });
});

router.get('/chat/faq/categories', (req, res) => {
    res.json({ success: true, categories: ['general'] });
});

router.post('/chat/feedback', (req, res) => {
    res.json({ success: true, message: 'Feedback received (mock)' });
});

module.exports = router;
