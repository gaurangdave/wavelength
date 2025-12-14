'use client'

import { useState, useEffect } from 'react'
import { supabase, type Database } from '@/lib/supabase'

type Message = Database['public']['Tables']['messages']['Row']

const ITEMS_PER_PAGE = 10

export default function HelloSupaPage() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
  const offset = (currentPage - 1) * ITEMS_PER_PAGE

  // Fetch messages with pagination
  const fetchMessages = async (page: number = 1) => {
    setLoading(true)
    setError(null)
    
    try {
      const startIndex = (page - 1) * ITEMS_PER_PAGE
      
      // Get total count
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })

      // Get paginated messages
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .range(startIndex, startIndex + ITEMS_PER_PAGE - 1)

      if (error) throw error

      setMessages(data || [])
      setTotalCount(count || 0)
    } catch (err) {
      console.error('Error fetching messages:', err)
      setError('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  // Save message to database
  const saveMessage = async () => {
    if (!message.trim()) {
      setError('Please enter a message')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{ content: message.trim() }])

      if (error) throw error

      setMessage('')
      // Refresh the first page to show the new message
      setCurrentPage(1)
      await fetchMessages(1)
    } catch (err) {
      console.error('Error saving message:', err)
      setError('Failed to save message')
    } finally {
      setSaving(false)
    }
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchMessages(page)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  // Load messages on component mount
  useEffect(() => {
    fetchMessages(1)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">HelloSupa</h1>
          <p className="text-gray-600">Share your thoughts and see what others are saying</p>
        </div>

        {/* Message Input Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="space-y-4">
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Your Message
              </label>
              <textarea
                id="message"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="What's on your mind?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={saving}
              />
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {message.length}/500 characters
              </span>
              <button
                onClick={saveMessage}
                disabled={saving || !message.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                {saving && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                <span>{saving ? 'Saving...' : 'Save Message'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Messages Section */}
        <div className="bg-white rounded-lg shadow-md">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold text-gray-900 mb-2 sm:mb-0">
                All Messages ({totalCount})
              </h2>
              {!loading && (
                <button
                  onClick={() => fetchMessages(currentPage)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Refresh
                </button>
              )}
            </div>
          </div>

          {/* Messages Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">📝</div>
                <p className="text-gray-500">No messages yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <p className="text-gray-800 mb-2">{msg.content}</p>
                    <div className="text-sm text-gray-500">
                      {formatDate(msg.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between">
                <div className="text-sm text-gray-700 mb-4 sm:mb-0">
                  Showing {offset + 1} to {Math.min(offset + ITEMS_PER_PAGE, totalCount)} of {totalCount} messages
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const pageNum = i + 1
                      const isActive = pageNum === currentPage
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          disabled={loading}
                          className={`px-3 py-1 rounded text-sm ${
                            isActive
                              ? 'bg-blue-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          } disabled:cursor-not-allowed`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                    
                    {totalPages > 5 && (
                      <>
                        <span className="px-2 text-gray-500">...</span>
                        <button
                          onClick={() => handlePageChange(totalPages)}
                          disabled={currentPage === totalPages || loading}
                          className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:cursor-not-allowed text-sm"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}