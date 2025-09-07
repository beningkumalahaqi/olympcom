'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { formatDistanceToNow } from 'date-fns'
import { Send, Clock, Check, X, RotateCcw } from 'lucide-react'
import { useChat } from '../hooks/useChat'
import AvatarImage from './AvatarImage'

export default function Chat({ chatId, participants = [] }) {
  const { data: session } = useSession()
  const { messages, loading, error, sending, connected, sendMessage, removeMessage } = useChat(chatId)
  const [messageText, setMessageText] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!messageText.trim() || sending) return

    const messageToSend = messageText
    setMessageText('') // Clear input immediately for better UX
    inputRef.current?.focus()
    
    await sendMessage(messageToSend)
  }

  const handleResendMessage = async (message) => {
    if (sending) return
    
    // Remove the failed message from the list first
    removeMessage(message.id)
    
    // Send the message again (will create new optimistic message)
    await sendMessage(message.text, message.type)
  }

  const isMyMessage = (message) => {
    return message.userId === session?.user?.id
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-600 text-center">
          <p>Error loading chat: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-blue-600 hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-lg border">
      {/* Chat Header */}
      <div className="p-4 border-b bg-gray-50 rounded-t-lg flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">
              {participants.length > 0 
                ? `Chat with ${participants.map(p => p.name).join(', ')}`
                : 'Global Chat'
              }
            </h3>
            <p className="text-sm text-gray-500">
              {messages.length} messages
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {/* Connection Status */}
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} 
                 title={connected ? 'Connected' : 'Disconnected'} />
            <span className="text-xs text-gray-500">
              {connected ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex ${isMyMessage(message) ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2 max-w-[70%]`}>
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <AvatarImage 
                    src={message.userAvatar} 
                    alt={message.userName}
                    className="w-8 h-8 rounded-full"
                  />
                </div>
                
                {/* Message Content */}
                <div className={`${isMyMessage(message) ? 'mr-2' : 'ml-2'}`}>
                  <div className={`rounded-lg p-3 ${
                    isMyMessage(message) 
                      ? `${message.status === 'sending' ? 'bg-blue-400' : message.status === 'failed' ? 'bg-red-400' : 'bg-blue-500'} text-white` 
                      : 'bg-gray-100 text-gray-900'
                  } ${message.status === 'sending' ? 'opacity-75' : 'opacity-100'} transition-opacity`}>
                    {!isMyMessage(message) && (
                      <p className="text-xs font-medium mb-1 opacity-75">
                        {message.userName}
                      </p>
                    )}
                    <p className="text-sm">{message.text}</p>
                  </div>
                  
                  {/* Timestamp and Status */}
                  <div className={`flex items-center mt-1 ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                    </p>
                    
                    {/* Status indicators for own messages */}
                    {isMyMessage(message) && (
                      <div className="ml-1 flex items-center">
                        {message.status === 'sending' && (
                          <Clock className="w-3 h-3 text-gray-400 animate-pulse" title="Sending..." />
                        )}
                        {message.status === 'sent' && (
                          <Check className="w-3 h-3 text-gray-400" title="Sent" />
                        )}
                        {message.status === 'failed' && (
                          <div className="flex items-center space-x-1">
                            <X className="w-3 h-3 text-red-500" title="Failed to send" />
                            <button
                              onClick={() => handleResendMessage(message)}
                              className="text-red-500 hover:text-red-700"
                              title="Retry sending"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t bg-gray-50 rounded-b-lg flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            maxLength={1000}
          />
          <button
            type="submit"
            disabled={!messageText.trim() || sending}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>

        {/* Character Count */}
        <div className="flex justify-between items-center mt-2">
          <div className="text-xs text-gray-500">
            Press Enter to send
          </div>
          <div className="text-xs text-gray-500">
            {messageText.length}/1000
          </div>
        </div>
      </div>
    </div>
  )
}
