package com.agrismart.ui.activities

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.agrismart.R
import com.agrismart.data.models.SoilData
import com.agrismart.ui.adapters.CropAdapter
import com.agrismart.ui.viewmodels.CropViewModel
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class CropRecommendationActivity : AppCompatActivity() {
    private val cropViewModel: CropViewModel by viewModels()
    private lateinit var cropAdapter: CropAdapter
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_crop_recommendation)
        
        setupRecyclerView()
        setupInputs()
        observeRecommendations()
    }
    
    private fun setupRecyclerView() {
        val recyclerView = findViewById<RecyclerView>(R.id.recommendations_recycler_view)
        cropAdapter = CropAdapter()
        recyclerView.apply {
            adapter = cropAdapter
            layoutManager = LinearLayoutManager(this@CropRecommendationActivity)
        }
    }
    
    private fun setupInputs() {
        val phInput = findViewById<EditText>(R.id.ph_input)
        val nitrogenInput = findViewById<EditText>(R.id.nitrogen_input)
        val phosphorusInput = findViewById<EditText>(R.id.phosphorus_input)
        val potassiumInput = findViewById<EditText>(R.id.potassium_input)
        val getRecommendationButton = findViewById<Button>(R.id.get_recommendation_button)
        
        getRecommendationButton.setOnClickListener {
            val soilData = SoilData(
                ph = phInput.text.toString().toDoubleOrNull() ?: 0.0,
                nitrogen = nitrogenInput.text.toString().toDoubleOrNull() ?: 0.0,
                phosphorus = phosphorusInput.text.toString().toDoubleOrNull() ?: 0.0,
                potassium = potassiumInput.text.toString().toDoubleOrNull() ?: 0.0
            )
            cropViewModel.getCropRecommendations(soilData)
        }
    }
    
    private fun observeRecommendations() {
        cropViewModel.recommendations.observe(this) { crops ->
            cropAdapter.submitList(crops)
        }
    }
}
