'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Camera, Upload, X, Check } from 'lucide-react'
import imageCompression from 'browser-image-compression'

export default function ProfilePictureUpload({ currentImage, onUpload, onError }) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [imageLoadError, setImageLoadError] = useState(false)
  const fileInputRef = useRef(null)

  const handleImageLoad = () => {
    setImageLoadError(false)
  }

  const handleImageError = () => {
    console.error('Failed to load image:', showPreview ? preview?.url : currentImage)
    setImageLoadError(true)
  }

  const handleFileSelect = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      onError('File size must be less than 10MB')
      return
    }

    try {
      // Client-side compression before upload
      const options = {
        maxSizeMB: 2, // Max 2MB
        maxWidthOrHeight: 800,
        useWebWorker: true,
      }

      const compressedFile = await imageCompression(file, options)
      
      // Create preview
      const previewUrl = URL.createObjectURL(compressedFile)
      setPreview({ file: compressedFile, url: previewUrl })
      setShowPreview(true)
    } catch (error) {
      console.error('Error compressing image:', error)
      onError('Error processing image. Please try again.')
    }
  }

  const handleUpload = async () => {
    if (!preview) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('profilePic', preview.file)

      const response = await fetch('/api/profile/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      onUpload(data.profilePic, data.user)
      setShowPreview(false)
      setPreview(null)
      setImageLoadError(false)
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Upload error:', error)
      onError(error.message || 'Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    if (preview) {
      URL.revokeObjectURL(preview.url)
    }
    setPreview(null)
    setShowPreview(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      {/* Current/Preview Image */}
      <div className="flex items-center space-x-6">
        <div className="shrink-0">
          <div className="relative">
            <Image
              src={imageLoadError ? '/default-avatar.svg' : (showPreview ? preview?.url : (currentImage || '/default-avatar.svg'))}
              alt="Profile picture"
              className="h-20 w-20 object-cover rounded-full border-2 border-gray-200"
              width={80}
              height={80}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            {showPreview && !imageLoadError && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">Preview</span>
              </div>
            )}
            {imageLoadError && (
              <div className="absolute inset-0 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-xs font-medium">Error</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Picture
          </label>
          
          {!showPreview ? (
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Camera className="h-4 w-4 mr-2" />
                Upload Photo
              </button>
              <span className="text-sm text-gray-500">
                JPG, PNG, or GIF up to 10MB
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleUpload}
                disabled={isUploading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Confirm Upload
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isUploading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <p className="mt-2 text-xs text-gray-500">
            Images will be automatically cropped to 1:1 ratio and compressed for optimal performance.
          </p>
        </div>
      </div>
    </div>
  )
}
