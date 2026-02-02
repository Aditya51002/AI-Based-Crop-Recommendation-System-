const express = require('express');
const router = express.Router();

router.post('/recommend', (req, res) => {
    const crops = [
        { name: 'Rice', suitability: 92, profit: 110000, duration: '120-140 days' },
        { name: 'Wheat', suitability: 88, profit: 90000, duration: '90-120 days' },
        { name: 'Maize', suitability: 85, profit: 95000, duration: '80-110 days' }
    ];
    res.json({ success: true, crops, recommendations: ['Use certified seeds', 'Monitor weather before sowing'] });
});

module.exports = router;
