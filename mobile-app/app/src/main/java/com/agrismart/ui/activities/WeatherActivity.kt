package com.agrismart.ui.activities

import android.os.Bundle
import android.widget.TextView
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.agrismart.R
import com.agrismart.ui.adapters.WeatherAdapter
import com.agrismart.ui.viewmodels.WeatherViewModel
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class WeatherActivity : AppCompatActivity() {
    private val weatherViewModel: WeatherViewModel by viewModels()
    private lateinit var weatherAdapter: WeatherAdapter
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_weather)
        
        setupRecyclerView()
        observeWeatherData()
        weatherViewModel.fetchWeather()
    }
    
    private fun setupRecyclerView() {
        val recyclerView = findViewById<RecyclerView>(R.id.weather_forecast_recycler_view)
        weatherAdapter = WeatherAdapter()
        recyclerView.apply {
            adapter = weatherAdapter
            layoutManager = LinearLayoutManager(this@WeatherActivity)
        }
    }
    
    private fun observeWeatherData() {
        weatherViewModel.currentWeather.observe(this) { weather ->
            findViewById<TextView>(R.id.temperature_text).text = "${weather.temperature}°C"
            findViewById<TextView>(R.id.condition_text).text = weather.condition
            findViewById<TextView>(R.id.humidity_text).text = "Humidity: ${weather.humidity}%"
        }
        
        weatherViewModel.forecast.observe(this) { forecast ->
            weatherAdapter.submitList(forecast)
        }
    }
}
