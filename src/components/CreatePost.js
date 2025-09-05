'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { Send, Image as ImageIcon, Video } from 'lucide-react'
import PostImageUpload from './PostImageUpload'
import PostVideoUpload from './PostVideoUpload'

export default function CreatePost({ onPostCreated }) {
  const { data: session } = useSession()
  const [content, setContent] = useState('')
  const [mediaUrl, setMediaUrl] = useState(null)
  const [mediaType, setMediaType] = useState(null) // 'image' or 'video'
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('image') // 'image' or 'video'
  const imageUploadRef = useRef(null)
  const videoUploadRef = useRef(null)

  const handleImageUpload = (url) => {
    setMediaUrl(url)
    setMediaType('image')
    setError('')
    // Clear video if image is uploaded
    if (videoUploadRef.current) {
      videoUploadRef.current.reset()
    }
  }

  const handleVideoUpload = (url) => {
    setMediaUrl(url)
    setMediaType('video')
    setError('')
    // Clear image if video is uploaded
    if (imageUploadRef.current) {
      imageUploadRef.current.reset()
    }
  }

  const handleMediaError = (errorMessage) => {
    setError(errorMessage)
  }

    const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!content.trim() && !mediaUrl) {
      setError('Please enter some content or add media')
      return
    }

    if (!session?.user?.id) {
      setError('You must be logged in to create a post')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content.trim(),
          mediaUrl,
          mediaType,
          userId: session.user.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create post')
      }

      const newPost = await response.json()
      
      // Reset form
      setContent('')
      setMediaUrl(null)
      setMediaType(null)
      if (imageUploadRef.current) {
        imageUploadRef.current.reset()
      }
      if (videoUploadRef.current) {
        videoUploadRef.current.reset()
      }
      
      // Notify parent component
      if (onPostCreated) {
        onPostCreated(newPost)
      }
    } catch (error) {
      console.error('Error creating post:', error)
      setError(error.message)
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
            placeholder="What's happening in the Olympic world?"
            className="w-full p-3 border border-gray-300 rounded-lg resize-none text-black focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            rows={3}
            disabled={isSubmitting}
          />

          {/* Media Upload Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                type="button"
                onClick={() => setActiveTab('image')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'image'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ImageIcon className="w-4 h-4 inline-block mr-2" />
                Image
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('video')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'video'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Video className="w-4 h-4 inline-block mr-2" />
                Video
              </button>
            </nav>
          </div>

          {/* Media Upload Components */}
          <div className="mt-4">
            {activeTab === 'image' && (
              <PostImageUpload
                ref={imageUploadRef}
                onImageUpload={handleImageUpload}
                onError={handleMediaError}
                disabled={isSubmitting}
              />
            )}
            {activeTab === 'video' && (
              <PostVideoUpload
                ref={videoUploadRef}
                onVideoUpload={handleVideoUpload}
                onError={handleMediaError}
                disabled={isSubmitting}
              />
            )}
          </div>

          {/* Media Preview */}
          {mediaUrl && (
            <div className="mt-4">
              <div className="relative inline-block">
                {mediaType === 'image' ? (
                  <Image
                    src={mediaUrl}
                    alt="Upload preview"
                    width={300}
                    height={192}
                    className="max-w-xs max-h-48 object-cover rounded-lg border"
                    style={{ maxWidth: '300px', maxHeight: '192px' }}
                  />
                ) : (
                  <video
                    src={mediaUrl}
                    controls
                    className="max-w-xs max-h-48 rounded-lg border"
                    preload="metadata"
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMediaUrl(null)
                    setMediaType(null)
                    if (imageUploadRef.current) {
                      imageUploadRef.current.reset()
                    }
                    if (videoUploadRef.current) {
                      videoUploadRef.current.reset()
                    }
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                  disabled={isSubmitting}
                >
                  ×
                </button>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {mediaType && (
                <span className="capitalize">{mediaType} attached</span>
              )}
            </div>
            <button
              type="submit"
              disabled={(!content.trim() && !mediaUrl) || isSubmitting}
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
