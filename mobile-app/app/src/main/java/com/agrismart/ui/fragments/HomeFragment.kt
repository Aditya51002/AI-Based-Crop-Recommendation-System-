package com.agrismart.ui.fragments

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.agrismart.R
import com.agrismart.ui.adapters.CropAdapter
import com.agrismart.ui.viewmodels.CropViewModel
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class HomeFragment : Fragment() {
    private val cropViewModel: CropViewModel by viewModels()
    private lateinit var cropAdapter: CropAdapter
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_home, container, false)
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupRecyclerView(view)
        observeData()
    }
    
    private fun setupRecyclerView(view: View) {
        val recyclerView = view.findViewById<RecyclerView>(R.id.home_recycler_view)
        cropAdapter = CropAdapter()
        recyclerView.apply {
            adapter = cropAdapter
            layoutManager = LinearLayoutManager(requireContext())
        }
    }
    
    private fun observeData() {
        cropViewModel.recommendations.observe(viewLifecycleOwner) { crops ->
            cropAdapter.submitList(crops)
        }
    }
}
