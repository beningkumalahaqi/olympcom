'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Camera, X, Pin } from 'lucide-react'
import Image from 'next/image'
import AvatarImage from './AvatarImage'

export default function AnnouncementForm({ onSubmit }) {
  const { data: session } = useSession()
  const [content, setContent] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isPinned, setIsPinned] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef(null)

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('content', content.trim())
      formData.append('isPinned', isPinned)
      if (image) {
        formData.append('image', image)
      }

      await onSubmit(formData)
      
      // Reset form
      setContent('')
      setImage(null)
      setImagePreview(null)
      setIsPinned(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error creating announcement:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-start space-x-3">
        <AvatarImage
          src={session.user.profilePic}
          alt={session.user.name}
          width={48}
          height={48}
          className="rounded-full"
        />
        
        <form onSubmit={handleSubmit} className="flex-1">
          <div className="space-y-4">
            {/* Content Input */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write an announcement..."
              className="w-full p-4 border border-gray-300 rounded-lg resize-none text-black focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={4}
              maxLength={2000}
              required
            />

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  width={400}
                  height={300}
                  className="rounded-lg max-w-full h-auto"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-gray-800 bg-opacity-75 text-white rounded-full p-1 hover:bg-opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Form Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Image Upload Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-sm">Add Image</span>
                </button>

                {/* Pin Checkbox */}
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <Pin className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-gray-700">Pin this announcement</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!content.trim() || isSubmitting}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting ? 'Publishing...' : 'Publish Announcement'}
              </button>
            </div>

            {/* Character Count */}
            <div className="text-right">
              <span className={`text-xs ${content.length > 1800 ? 'text-red-500' : 'text-gray-500'}`}>
                {content.length}/2000
              </span>
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </form>
      </div>
    </div>
  )
}
