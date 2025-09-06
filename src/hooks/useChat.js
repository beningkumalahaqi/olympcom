import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'

export function useChat(chatId) {
  const { data: session } = useSession()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)
  const [connected, setConnected] = useState(false)
  const eventSourceRef = useRef(null)
  const lastMessageCountRef = useRef(0)

  // Set up Server-Sent Events for real-time updates
  useEffect(() => {
    if (!chatId || !session) {
      setLoading(false)
      return
    }

    // Initial fetch to get existing messages
    const fetchInitialMessages = async () => {
      try {
        const response = await fetch(`/api/chat/${chatId}/messages`)
        if (response.ok) {
          const messageList = await response.json()
          setMessages(messageList)
          lastMessageCountRef.current = messageList.length
        }
        setLoading(false)
      } catch (err) {
        console.error('Error fetching initial messages:', err)
        setError(err.message)
        setLoading(false)
      }
    }

    fetchInitialMessages()

    // Set up SSE connection for real-time updates
    const eventSource = new EventSource(`/api/chat/${chatId}/stream`)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setConnected(true)
      setError(null)
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'messages') {
          // Only update if we actually have new messages
          if (data.count > lastMessageCountRef.current) {
            // Merge with existing optimistic messages, removing duplicates
            setMessages(prev => {
              const optimisticMessages = prev.filter(msg => msg.isOptimistic && msg.status !== 'failed')
              const newMessages = data.messages.filter(msg => 
                !optimisticMessages.find(opt => 
                  opt.text === msg.text && 
                  opt.userId === msg.userId && 
                  Math.abs(new Date(opt.timestamp) - new Date(msg.timestamp)) < 5000 // 5 second window
                )
              )
              
              // Keep failed optimistic messages, replace successful ones with real messages
              const filteredOptimistic = optimisticMessages.filter(msg => msg.status === 'failed')
              
              return [...newMessages, ...filteredOptimistic]
            })
            lastMessageCountRef.current = data.count
          }
        } else if (data.type === 'error') {
          setError(data.error)
        }
      } catch (err) {
        console.error('Error parsing SSE data:', err)
      }
    }

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err)
      setConnected(false)
      setError('Connection lost. Trying to reconnect...')
      
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
          fetchInitialMessages()
        }
      }, 5000)
    }

    // Cleanup function
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      setConnected(false)
    }
  }, [chatId, session])

  // Send a message with optimistic UI
  const sendMessage = useCallback(async (text, type = 'text') => {
    if (!session?.user || !chatId || !text.trim()) {
      return
    }

    // Create optimistic message
    const optimisticMessage = {
      id: `temp-${Date.now()}`, // Temporary ID
      text: text.trim(),
      userId: session.user.id,
      userName: session.user.name || session.user.email,
      userAvatar: session.user.profilePic || null,
      timestamp: new Date(),
      type,
      status: 'sending', // Optimistic status
      isOptimistic: true
    }

    // Add optimistic message to UI immediately
    setMessages(prev => [...prev, optimisticMessage])

    setSending(true)
    try {
      const response = await fetch(`/api/chat/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text.trim(),
          type
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const result = await response.json()
      
      // Update optimistic message with real message data
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id 
          ? { ...result.message, status: 'sent', isOptimistic: false }
          : msg
      ))
      
    } catch (err) {
      console.error('Error sending message:', err)
      setError(err.message)
      
      // Mark optimistic message as failed
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id 
          ? { ...msg, status: 'failed' }
          : msg
      ))
    } finally {
      setSending(false)
    }
  }, [session, chatId])

  // Remove a message (for retry functionality)
  const removeMessage = useCallback((messageId) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId))
  }, [])

  // Mark message as read (placeholder)
  const markAsRead = useCallback(async (messageId) => {
    // Implementation for read receipts
  }, [])

  return {
    messages,
    loading,
    error,
    sending,
    connected,
    sendMessage,
    removeMessage,
    markAsRead
  }
}
