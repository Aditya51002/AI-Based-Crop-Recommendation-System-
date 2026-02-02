package com.agrismart.ui.activities

import android.Manifest
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.agrismart.R
import com.agrismart.ui.viewmodels.DiseaseViewModel
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class DiseaseDetectionActivity : AppCompatActivity() {
    private val diseaseViewModel: DiseaseViewModel by viewModels()
    private lateinit var imageView: ImageView
    private lateinit var resultText: TextView
    
    private val pickImage = registerForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        uri?.let {
            imageView.setImageURI(it)
            diseaseViewModel.detectDisease(it)
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_disease_detection)
        
        imageView = findViewById(R.id.disease_image_view)
        resultText = findViewById(R.id.disease_result_text)
        val selectImageButton = findViewById<Button>(R.id.select_image_button)
        
        selectImageButton.setOnClickListener {
            checkPermissionAndPickImage()
        }
        
        observeResults()
    }
    
    private fun checkPermissionAndPickImage() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE)
            != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,
                arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE), 100)
        } else {
            pickImage.launch("image/*")
        }
    }
    
    private fun observeResults() {
        diseaseViewModel.detectionResult.observe(this) { result ->
            resultText.text = "Disease: ${result.diseaseName}\nConfidence: ${result.confidence}%\nTreatment: ${result.treatment}"
        }
    }
}
