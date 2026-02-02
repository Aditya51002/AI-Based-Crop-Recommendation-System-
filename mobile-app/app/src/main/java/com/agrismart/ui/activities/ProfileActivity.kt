package com.agrismart.ui.activities

import android.os.Bundle
import android.widget.TextView
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import com.agrismart.R
import com.agrismart.ui.viewmodels.UserViewModel
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class ProfileActivity : AppCompatActivity() {
    private val userViewModel: UserViewModel by viewModels()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_profile)
        
        observeUserData()
    }
    
    private fun observeUserData() {
        userViewModel.currentUser.observe(this) { user ->
            findViewById<TextView>(R.id.user_name_text).text = user.name
            findViewById<TextView>(R.id.user_email_text).text = user.email
            findViewById<TextView>(R.id.user_location_text).text = user.location
        }
    }
}
