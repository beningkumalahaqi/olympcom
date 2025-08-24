'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Send, Image as ImageIcon } from 'lucide-react'
import PostImageUpload from './PostImageUpload'

export default function CreatePost({ onPostCreated }) {
  const { data: session } = useSession()
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const imageUploadRef = useRef(null)

  const handleImageUpload = (url) => {
    setImageUrl(url)
    setError('')
  }

  const handleImageError = (errorMessage) => {
    setError(errorMessage)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    setError('')
    
    try {
      const postData = {
        content: content.trim(),
        mediaUrl: imageUrl
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData)
      })

      if (response.ok) {
        setContent('')
        setImageUrl(null)
        // Reset the image upload component
        if (imageUploadRef.current) {
          imageUploadRef.current.reset()
        }
        onPostCreated()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create post')
      }
    } catch (error) {
      console.error('Error creating post:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!session) return null

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full p-3 border border-gray-300 rounded-lg resize-none text-black focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            rows={3}
            disabled={isSubmitting}
          />
          
          {/* Image Upload Component */}
          <PostImageUpload 
            ref={imageUploadRef}
            onImageUpload={handleImageUpload}
            onError={handleImageError}
            disabled={isSubmitting}
          />
          
          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Posting...' : 'Post'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
