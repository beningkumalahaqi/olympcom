'use client'

import { useState, useRef, useImperativeHandle, forwardRef } from 'react'
import Image from 'next/image'
import { Image as ImageIcon, Upload, X, Check } from 'lucide-react'
import imageCompression from 'browser-image-compression'

const PostImageUpload = forwardRef(({ onImageUpload, onError, disabled = false }, ref) => {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [uploadedImage, setUploadedImage] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileSelect = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError('Please select an image file')
      return
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      onError('File size must be less than 20MB')
      return
    }

    try {
      // Client-side compression before upload
      const options = {
        maxSizeMB: 5, // Max 5MB
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      }

      const compressedFile = await imageCompression(file, options)
      
      // Create preview
      const previewUrl = URL.createObjectURL(compressedFile)
      setPreview({ file: compressedFile, url: previewUrl })
      
      // Auto-upload after selection
      await handleUpload(compressedFile)
    } catch (error) {
      console.error('Error compressing image:', error)
      onError('Error processing image. Please try again.')
    }
  }

  const handleUpload = async (file) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/posts/upload-image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setUploadedImage({
        url: data.imageUrl,
        path: data.imagePath
      })
      
      // Call parent callback with image URL
      onImageUpload(data.imageUrl)
      
    } catch (error) {
      console.error('Upload error:', error)
      onError(error.message || 'Failed to upload image')
      handleRemove()
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    if (preview) {
      URL.revokeObjectURL(preview.url)
    }
    setPreview(null)
    setUploadedImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onImageUpload(null) // Clear image from parent
  }

  const triggerFileInput = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click()
    }
  }

  // Expose reset function to parent component
  useImperativeHandle(ref, () => ({
    reset: handleRemove
  }))

  return (
    <div className="space-y-3">
      {/* Upload Button */}
      {!uploadedImage && !preview && (
        <button
          type="button"
          onClick={triggerFileInput}
          disabled={disabled || isUploading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          Add Image
        </button>
      )}

      {/* Image Preview/Uploaded */}
      {(preview || uploadedImage) && (
        <div className="relative inline-block">
          <div className="relative max-w-full max-h-60 overflow-hidden rounded-lg border border-gray-200">
            <Image
              src={uploadedImage ? uploadedImage.url : preview?.url}
              alt="Post image"
              width={400}
              height={240}
              className="w-auto h-auto max-h-60 object-contain"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
          
          {/* Loading overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <span className="text-sm">Uploading...</span>
              </div>
            </div>
          )}
          
          {/* Remove button */}
          {uploadedImage && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled || isUploading}
              className="absolute top-2 right-2 inline-flex items-center justify-center w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        className="hidden"
      />
      
      {/* Help text */}
      <p className="text-xs text-gray-500">
        JPG, PNG, or GIF up to 20MB. Images will be automatically compressed and optimized.
      </p>
    </div>
  )
})

PostImageUpload.displayName = 'PostImageUpload'

export default PostImageUpload
