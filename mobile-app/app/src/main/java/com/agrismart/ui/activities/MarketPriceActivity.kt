package com.agrismart.ui.activities

import android.os.Bundle
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.agrismart.R
import com.agrismart.ui.adapters.MarketAdapter
import com.agrismart.ui.viewmodels.MarketViewModel
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MarketPriceActivity : AppCompatActivity() {
    private val marketViewModel: MarketViewModel by viewModels()
    private lateinit var marketAdapter: MarketAdapter
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_market_price)
        
        setupRecyclerView()
        observeMarketData()
        marketViewModel.fetchMarketPrices()
    }
    
    private fun setupRecyclerView() {
        val recyclerView = findViewById<RecyclerView>(R.id.market_recycler_view)
        marketAdapter = MarketAdapter()
        recyclerView.apply {
            adapter = marketAdapter
            layoutManager = LinearLayoutManager(this@MarketPriceActivity)
        }
    }
    
    private fun observeMarketData() {
        marketViewModel.marketPrices.observe(this) { prices ->
            marketAdapter.submitList(prices)
        }
    }
}
