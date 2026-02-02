const express = require('express');
const router = express.Router();

router.get('/prices', (req, res) => {
    const prices = [
        { crop: 'Rice', unit: 'quintal', price: 3200 },
        { crop: 'Wheat', unit: 'quintal', price: 2800 },
        { crop: 'Maize', unit: 'quintal', price: 2500 }
    ];
    res.json({ success: true, prices });
});

module.exports = router;
