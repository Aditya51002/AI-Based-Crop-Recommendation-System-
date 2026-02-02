package com.agrismart.ui.fragments

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.agrismart.R
import com.agrismart.ui.adapters.ChatAdapter
import com.agrismart.ui.viewmodels.ChatViewModel
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class ChatbotFragment : Fragment() {
    private val chatViewModel: ChatViewModel by viewModels()
    private lateinit var chatAdapter: ChatAdapter
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_chatbot, container, false)
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupRecyclerView(view)
        setupInput(view)
        observeMessages()
    }
    
    private fun setupRecyclerView(view: View) {
        val recyclerView = view.findViewById<RecyclerView>(R.id.chat_recycler_view)
        chatAdapter = ChatAdapter()
        recyclerView.apply {
            adapter = chatAdapter
            layoutManager = LinearLayoutManager(requireContext())
        }
    }
    
    private fun setupInput(view: View) {
        val inputField = view.findViewById<EditText>(R.id.chat_input_field)
        val sendButton = view.findViewById<Button>(R.id.send_button)
        
        sendButton.setOnClickListener {
            val message = inputField.text.toString()
            if (message.isNotEmpty()) {
                chatViewModel.sendMessage(message)
                inputField.text.clear()
            }
        }
    }
    
    private fun observeMessages() {
        chatViewModel.messages.observe(viewLifecycleOwner) { messages ->
            chatAdapter.submitList(messages)
        }
    }
}
