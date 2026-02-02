package com.agrismart.data

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.location.LocationManager
import android.provider.MediaStore
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.google.gson.Gson
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class WebAppBridge @Inject constructor(
    private val activity: Activity,
    private val webView: WebView
) {
    private val gson = Gson()
    private val locationManager = activity.getSystemService(Activity.LOCATION_SERVICE) as LocationManager
    
    companion object {
        private const val REQUEST_CAMERA = 100
        private const val REQUEST_LOCATION = 101
    }

    @JavascriptInterface
    fun receiveData(jsonData: String) {
        try {
            val data = JsonParser.parseString(jsonData).asJsonObject
            val type = data.get("type")?.asString
            
            when (type) {
                "sync_user_data" -> handleUserDataSync(data)
                "request_location" -> requestLocation()
                "take_photo" -> takePhoto()
                "show_notification" -> showNotification(data)
                "share" -> shareContent(data)
                "ping" -> sendToWeb("pong", JsonObject())
                else -> {
                    // Handle unknown message types
                    sendToWeb("unknown_message", data)
                }
            }
        } catch (e: Exception) {
            sendToWeb("error", JsonObject().apply {
                addProperty("message", "Failed to process message: ${e.message}")
            })
        }
    }

    private fun handleUserDataSync(data: JsonObject) {
        // Save user data to Android shared preferences or database
        val userData = data.getAsJsonObject("data")
        // TODO: Implement actual data storage
        
        // Send confirmation back to web
        sendToWeb("user_data_synced", JsonObject().apply {
            addProperty("success", true)
            addProperty("timestamp", System.currentTimeMillis())
        })
    }

    private fun requestLocation() {
        if (ContextCompat.checkSelfPermission(activity, Manifest.permission.ACCESS_FINE_LOCATION) 
            == PackageManager.PERMISSION_GRANTED) {
            
            try {
                val location = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
                if (location != null) {
                    val locationData = JsonObject().apply {
                        addProperty("latitude", location.latitude)
                        addProperty("longitude", location.longitude)
                        addProperty("accuracy", location.accuracy.toDouble())
                        addProperty("timestamp", location.time)
                    }
                    sendToWeb("location_received", locationData)
                } else {
                    sendToWeb("location_error", JsonObject().apply {
                        addProperty("error", "Location not available")
                    })
                }
            } catch (e: SecurityException) {
                requestLocationPermission()
            }
        } else {
            requestLocationPermission()
        }
    }

    private fun requestLocationPermission() {
        ActivityCompat.requestPermissions(
            activity,
            arrayOf(Manifest.permission.ACCESS_FINE_LOCATION),
            REQUEST_LOCATION
        )
    }

    private fun takePhoto() {
        if (ContextCompat.checkSelfPermission(activity, Manifest.permission.CAMERA) 
            == PackageManager.PERMISSION_GRANTED) {
            
            val intent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
            if (intent.resolveActivity(activity.packageManager) != null) {
                activity.startActivityForResult(intent, REQUEST_CAMERA)
            } else {
                sendToWeb("photo_error", JsonObject().apply {
                    addProperty("error", "Camera not available")
                })
            }
        } else {
            requestCameraPermission()
        }
    }

    private fun requestCameraPermission() {
        ActivityCompat.requestPermissions(
            activity,
            arrayOf(Manifest.permission.CAMERA),
            REQUEST_CAMERA
        )
    }

    private fun showNotification(data: JsonObject) {
        val title = data.get("title")?.asString ?: "AgriSmart"
        val message = data.get("message")?.asString ?: ""
        
        // TODO: Implement Android notification
        // NotificationManager.notify(...)
        
        sendToWeb("notification_shown", JsonObject().apply {
            addProperty("success", true)
        })
    }

    private fun shareContent(data: JsonObject) {
        val shareData = data.getAsJsonObject("data")
        val text = shareData.get("text")?.asString ?: ""
        val url = shareData.get("url")?.asString ?: ""
        
        val shareIntent = Intent().apply {
            action = Intent.ACTION_SEND
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, "$text $url".trim())
        }
        
        val chooser = Intent.createChooser(shareIntent, "Share via AgriSmart")
        activity.startActivity(chooser)
        
        sendToWeb("content_shared", JsonObject().apply {
            addProperty("success", true)
        })
    }

    @JavascriptInterface
    fun sendToWeb(type: String, data: JsonObject) {
        val message = JsonObject().apply {
            addProperty("type", type)
            add("data", data)
            addProperty("timestamp", System.currentTimeMillis())
        }
        
        activity.runOnUiThread {
            webView.evaluateJavascript(
                "window.receiveDataFromMobile(${gson.toJson(message)});",
                null
            )
        }
    }

    // Handle activity results
    fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        when (requestCode) {
            REQUEST_CAMERA -> {
                if (resultCode == Activity.RESULT_OK) {
                    val imageBitmap = data?.extras?.get("data") as? android.graphics.Bitmap
                    if (imageBitmap != null) {
                        // Convert bitmap to base64
                        val photoData = JsonObject().apply {
                            addProperty("success", true)
                            // TODO: Convert bitmap to base64 string
                            addProperty("data", "data:image/jpeg;base64,...")
                            addProperty("timestamp", System.currentTimeMillis())
                        }
                        sendToWeb("photo_captured", photoData)
                    } else {
                        sendToWeb("photo_error", JsonObject().apply {
                            addProperty("error", "Failed to capture photo")
                        })
                    }
                } else {
                    sendToWeb("photo_cancelled", JsonObject())
                }
            }
        }
    }

    // Handle permission results
    fun onRequestPermissionsResult(requestCode: Int, permissions: Array<String>, grantResults: IntArray) {
        when (requestCode) {
            REQUEST_LOCATION -> {
                if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    requestLocation()
                } else {
                    sendToWeb("location_permission_denied", JsonObject())
                }
            }
            REQUEST_CAMERA -> {
                if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    takePhoto()
                } else {
                    sendToWeb("camera_permission_denied", JsonObject())
                }
            }
        }
    }
}