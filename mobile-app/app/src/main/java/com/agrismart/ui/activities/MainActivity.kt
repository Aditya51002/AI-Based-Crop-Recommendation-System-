package com.agrismart.ui.activities

import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.navigation.NavController
import androidx.navigation.fragment.NavHostFragment
import androidx.navigation.ui.setupWithNavController
import com.agrismart.R
import com.agrismart.data.WebAppBridge
import com.google.android.material.bottomnavigation.BottomNavigationView
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : AppCompatActivity() {
    private lateinit var navController: NavController
    private lateinit var webView: WebView
    private lateinit var webAppBridge: WebAppBridge

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        setupNavigation()
        setupWebView()
        setupWebAppBridge()
    }
    
    private fun setupNavigation() {
        val navHostFragment = supportFragmentManager
            .findFragmentById(R.id.nav_host_fragment) as NavHostFragment
        navController = navHostFragment.navController
        
        val bottomNav = findViewById<BottomNavigationView>(R.id.bottom_navigation)
        bottomNav.setupWithNavController(navController)
    }
    
    private fun setupWebView() {
        webView = findViewById(R.id.web_view)
        
        webView.settings.apply {
            javaScriptEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            domStorageEnabled = true
            allowFileAccessFromFileURLs = true
            allowUniversalAccessFromFileURLs = true
        }
        
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // Inject mobile bridge when page loads
                webView.evaluateJavascript("window.AgriSmartMobile = Android;", null)
                webView.evaluateJavascript("window.receiveDataFromMobile({type: 'mobile_ready', timestamp: Date.now()});", null)
            }
        }
        
        // Load the web app
        webView.loadUrl("file:///android_asset/web-app/index.html")
    }
    
    private fun setupWebAppBridge() {
        webAppBridge = WebAppBridge(this, webView)
        webView.addJavascriptInterface(webAppBridge, "Android")
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
