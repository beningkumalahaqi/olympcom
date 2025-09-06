'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { formatDistanceToNow } from 'date-fns'
import { Send } from 'lucide-react'
import { useChat } from '../hooks/useChat'
import AvatarImage from './AvatarImage'

export default function Chat({ chatId, participants = [] }) {
  const { data: session } = useSession()
  const { messages, loading, error, sending, connected, sendMessage } = useChat(chatId)
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

    await sendMessage(messageText)
    setMessageText('')
    inputRef.current?.focus()
  }

  const isMyMessage = (message) => {
    return message.userId === session?.user?.id
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
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
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-500">
              {connected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-xs lg:max-w-md ${isMyMessage(message) ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 ${isMyMessage(message) ? 'ml-2' : 'mr-2'}`}>
                  <AvatarImage
                    src={message.userAvatar}
                    alt={message.userName}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                </div>

                {/* Message Bubble */}
                <div className="flex flex-col">
                  <div
                    className={`px-3 py-2 rounded-lg ${
                      isMyMessage(message)
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                    }`}
                  >
                    {!isMyMessage(message) && (
                      <p className="text-xs font-medium mb-1 opacity-75">
                        {message.userName}
                      </p>
                    )}
                    <p className="text-sm">{message.text}</p>
                  </div>
                  
                  {/* Timestamp */}
                  <p className={`text-xs text-gray-500 mt-1 ${isMyMessage(message) ? 'text-right' : 'text-left'}`}>
                    {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                  </p>
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
          {/* Emoji Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Choose emoji"
            >
              <Smile className="w-5 h-5" />
            </button>
            
            {showEmojiPicker && (
              <>
                {/* Mobile/Desktop overlay to close picker when clicking outside */}
                <div 
                  className="fixed inset-0 z-10"
                  onClick={() => setShowEmojiPicker(false)}
                />
                
                {/* Emoji Picker */}
                <div className="absolute bottom-full left-0 mb-2 z-20 bg-white border rounded-lg shadow-lg max-w-xs sm:max-w-sm">
                  {/* Header */}
                  <div className="p-2 border-b bg-gray-50 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Choose an emoji</span>
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(false)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded"
                        aria-label="Close emoji picker"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  
                  {/* Emoji Grid */}
                  <div className="p-3">
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-1">
                      {[
                        '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
                        '�', '😇', '🙂', '🙃', '😉', '😌', '�😍', '�',
                        '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
                        '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
                        '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
                        '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
                        '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
                        '😰', '😥', '😓', '🤗', '�🤔', '🤭', '🤫', '🤥',
                        '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
                        '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
                        '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑',
                        '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻',
                        '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸',
                        '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '👋',
                        '🤚', '🖐', '✋', '�', '👌', '🤌', '🤏', '✌️',
                        '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕',
                        '👇', '☝️', '�👍', '👎', '👊', '✊', '🤛', '🤜',
                        '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅',
                        '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
                        '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
                        '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️',
                        '✡️', '🔯', '🕎', '☯️', '☦️', '�', '⛎', '♈',
                        '�🔥', '💯', '💢', '💥', '💫', '💦', '💨', '🕳',
                        '💣', '💬', '👁‍🗨', '🗨', '🗯', '💭', '💤', '🎉',
                        '🎊', '🎈', '🎁', '🎀', '🥳', '🎂', '🍰', '🧁'
                      ].map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleEmojiClick(emoji)}
                          className="p-2 hover:bg-gray-100 rounded-md text-lg sm:text-xl transition-colors active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                          title={emoji}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Footer with frequently used emojis */}
                  <div className="p-2 border-t bg-gray-50 rounded-b-lg">
                    <div className="text-xs text-gray-500 mb-1">Frequently used:</div>
                    <div className="flex space-x-1 overflow-x-auto">
                      {['😀', '😂', '😍', '🤔', '�', '❤️', '�', '�', '🎉'].map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleEmojiClick(emoji)}
                          className="p-1 hover:bg-gray-200 rounded text-lg flex-shrink-0 transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            maxLength={1000}
            disabled={sending}
          />

          {/* Send Button */}
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
