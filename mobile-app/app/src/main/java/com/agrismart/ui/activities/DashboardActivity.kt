package com.agrismart.ui.activities

import android.os.Bundle
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.agrismart.R
import com.agrismart.ui.adapters.CropAdapter
import com.agrismart.ui.viewmodels.CropViewModel
import com.google.android.material.card.MaterialCardView
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class DashboardActivity : AppCompatActivity() {
    private val cropViewModel: CropViewModel by viewModels()
    private lateinit var cropAdapter: CropAdapter
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_dashboard)
        
        setupRecyclerView()
        observeData()
        setupQuickActions()
    }
    
    private fun setupRecyclerView() {
        val recyclerView = findViewById<RecyclerView>(R.id.crops_recycler_view)
        cropAdapter = CropAdapter()
        recyclerView.apply {
            adapter = cropAdapter
            layoutManager = GridLayoutManager(this@DashboardActivity, 2)
        }
    }
    
    private fun observeData() {
        cropViewModel.recommendations.observe(this) { crops ->
            cropAdapter.submitList(crops)
        }
    }
    
    private fun setupQuickActions() {
        findViewById<MaterialCardView>(R.id.card_crop_recommendation).setOnClickListener {
            startActivity(android.content.Intent(this, CropRecommendationActivity::class.java))
        }
        
        findViewById<MaterialCardView>(R.id.card_disease_detection).setOnClickListener {
            startActivity(android.content.Intent(this, DiseaseDetectionActivity::class.java))
        }
        
        findViewById<MaterialCardView>(R.id.card_weather).setOnClickListener {
            startActivity(android.content.Intent(this, WeatherActivity::class.java))
        }
        
        findViewById<MaterialCardView>(R.id.card_market).setOnClickListener {
            startActivity(android.content.Intent(this, MarketPriceActivity::class.java))
        }
    }
}
