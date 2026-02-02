const express = require('express');
const router = express.Router();

router.post('/detect', (req, res) => {
    const result = {
        success: true,
        disease: 'Leaf Blight',
        confidence: 87,
        actions: ['Remove affected leaves', 'Apply recommended fungicide', 'Improve air circulation']
    };
    res.json(result);
});

module.exports = router;
