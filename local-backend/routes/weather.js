const express = require('express');
const router = express.Router();

// put api key
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || '';

router.get('/', (req, res) => {
    const location = req.query.location || 'Your location';
    const weather = {
        success: true,
        location,
        temperature: 28,
        humidity: 62,
        windSpeed: 8,
        condition: 'Partly Cloudy',
        forecast: [
            { day: 'Tomorrow', temperature: 29, condition: 'Sunny' },
            { day: 'Day 2', temperature: 27, condition: 'Light Rain' },
            { day: 'Day 3', temperature: 26, condition: 'Cloudy' }
        ]
    };
    res.json(weather);
});

module.exports = router;
