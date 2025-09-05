'use client'

import { useState, useRef, useImperativeHandle, forwardRef } from 'react'
import { Video, Upload, X, Check, Play, Pause } from 'lucide-react'
import { compressVideo, getVideoMetadata, initializeFFmpeg } from '@/lib/videoCompression'

const PostVideoUpload = forwardRef(({ onVideoUpload, onError, disabled = false }, ref) => {
  const [isUploading, setIsUploading] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressionProgress, setCompressionProgress] = useState(0)
  const [preview, setPreview] = useState(null)
  const [uploadedVideo, setUploadedVideo] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)

  const handleFileSelect = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('video/')) {
      onError('Please select a video file')
      return
    }

    // Validate file size (max 500MB for input)
    if (file.size > 500 * 1024 * 1024) {
      onError('Video file must be less than 500MB')
      return
    }

    try {
      // Get video metadata first
      const metadata = await getVideoMetadata(file)
      
      // Check duration (max 5 minutes)
      if (metadata.duration > 300) {
        onError('Video must be less than 5 minutes long')
        return
      }

      // Create preview
      const previewUrl = URL.createObjectURL(file)
      setPreview({ 
        file, 
        url: previewUrl, 
        metadata,
        originalSize: (file.size / (1024 * 1024)).toFixed(2)
      })
      
      // Auto-compress and upload after selection
      await handleCompress(file)
    } catch (error) {
      console.error('Error processing video:', error)
      onError('Error processing video. Please try again.')
    }
  }

  const handleCompress = async (file) => {
    setIsCompressing(true)
    setCompressionProgress(0)
    
    try {
      console.log('Starting compression for file:', {
        name: file.name,
        size: file.size,
        type: file.type
      })

      // Initialize FFmpeg with progress tracking
      await initializeFFmpeg()
      
      // Simulate progress updates during compression
      const progressInterval = setInterval(() => {
        setCompressionProgress(prev => {
          if (prev >= 90) return prev
          return prev + Math.random() * 10
        })
      }, 500)

      // Compress video with quality settings - force to 10MB max
      const compressedVideo = await compressVideo(file, {
        maxSizeMB: 10,     // Force maximum to 10MB
        quality: 26,       // High quality (lower CRF = better quality)
        maxWidth: 1280,    // Max width
        maxHeight: 720,    // Max height
        fps: 30           // Max frame rate
      })

      clearInterval(progressInterval)
      setCompressionProgress(100)
      
      console.log('Compression completed. Compressed video:', {
        size: compressedVideo?.size,
        type: compressedVideo?.type,
        isFile: compressedVideo instanceof File,
        isBlob: compressedVideo instanceof Blob
      })

      // Validate compressed video
      if (!compressedVideo || (!(compressedVideo instanceof File) && !(compressedVideo instanceof Blob)) || compressedVideo.size === 0) {
        throw new Error('Video compression failed: Invalid compressed video')
      }

      // Create new file from compressed blob/file
      let compressedFile
      if (compressedVideo instanceof File) {
        compressedFile = compressedVideo
      } else {
        compressedFile = new File([compressedVideo], file.name.replace(/\.[^/.]+$/, '.mp4'), {
          type: 'video/mp4'
        })
      }
      
      console.log('Created compressed file:', {
        name: compressedFile.name,
        size: compressedFile.size,
        type: compressedFile.type
      })

      // Validate the file we just created
      if (!compressedFile || compressedFile.size === 0) {
        throw new Error('Failed to create valid compressed file')
      }
      
      // Update preview with compressed info
      setPreview(prev => ({
        ...prev,
        compressedFile,
        compressedSize: (compressedFile.size / (1024 * 1024)).toFixed(2)
      }))
      
      // Auto-upload the compressed video
      await handleUpload(compressedFile)
    } catch (error) {
      console.error('Error compressing video:', error)
      onError(`Error compressing video: ${error.message}`)
      setIsCompressing(false)
      setCompressionProgress(0)
    }
  }

  const handleUpload = async (compressedFile) => {
    setIsUploading(true)
    
    try {
      console.log('handleUpload called with:', {
        file: compressedFile,
        name: compressedFile?.name,
        size: compressedFile?.size,
        type: compressedFile?.type,
        isFile: compressedFile instanceof File
      })

      // Validate the compressed file
      if (!compressedFile) {
        throw new Error('No compressed video file provided')
      }

      if (!(compressedFile instanceof File)) {
        throw new Error('Invalid file object - not a File instance')
      }

      if (compressedFile.size === 0) {
        throw new Error('Compressed video file is empty (0 bytes)')
      }

      if (!compressedFile.type || !compressedFile.type.startsWith('video/')) {
        throw new Error(`Invalid file type: ${compressedFile.type}`)
      }

      console.log('File validation passed. Uploading video:', {
        name: compressedFile.name,
        size: compressedFile.size,
        type: compressedFile.type
      })

      const formData = new FormData()
      formData.append('video', compressedFile)

      const response = await fetch('/api/posts/upload-video', {
        method: 'POST',
        body: formData
      })

      console.log('Upload response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Upload error:', errorData)
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      console.log('Upload successful:', data)
      setUploadedVideo(data.url)
      onVideoUpload(data.url)
    } catch (error) {
      console.error('Error uploading video:', error)
      onError(error.message || 'Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
      setIsCompressing(false)
      setCompressionProgress(0)
    }
  }

  const removeVideo = () => {
    if (preview?.url) {
      URL.revokeObjectURL(preview.url)
    }
    setPreview(null)
    setUploadedVideo(null)
    setIsPlaying(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onVideoUpload(null)
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  // Expose reset method to parent
  useImperativeHandle(ref, () => ({
    reset: removeVideo
  }))

  return (
    <div className="space-y-3">
      {/* Upload Button */}
      {!preview && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/avi,video/mov"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Video className="h-4 w-4" />
            <span className="text-sm font-medium">Add Video</span>
          </button>
          <p className="text-xs text-gray-500 mt-1">
            Max 500MB, up to 5 minutes. Supports MP4, WebM, AVI, MOV
          </p>
        </div>
      )}

      {/* Video Preview */}
      {preview && (
        <div className="relative bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-200">
          {/* Video Player */}
          <div className="relative bg-black rounded-lg overflow-hidden mb-3">
            <video
              ref={videoRef}
              src={preview.url}
              className="w-full max-h-64 object-contain"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              controls={false}
            />
            
            {/* Play/Pause Overlay */}
            <div 
              className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause className="h-12 w-12 text-white" />
              ) : (
                <Play className="h-12 w-12 text-white" />
              )}
            </div>
          </div>

          {/* Video Info */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium">{Math.round(preview.metadata?.duration || 0)}s</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Resolution:</span>
              <span className="font-medium">
                {preview.metadata?.width}x{preview.metadata?.height}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Original Size:</span>
              <span className="font-medium">{preview.originalSize}MB</span>
            </div>
            {preview.compressedSize && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Compressed Size:</span>
                <span className="font-medium text-green-600">{preview.compressedSize}MB</span>
              </div>
            )}
          </div>

          {/* Compression Progress */}
          {isCompressing && (
            <div className="mt-3 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Compressing video...</span>
                <span className="font-medium">{Math.round(compressionProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${compressionProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="mt-3 flex items-center space-x-2 text-sm text-blue-600">
              <Upload className="h-4 w-4 animate-bounce" />
              <span>Uploading video...</span>
            </div>
          )}

          {/* Success State */}
          {uploadedVideo && (
            <div className="mt-3 flex items-center space-x-2 text-sm text-green-600">
              <Check className="h-4 w-4" />
              <span>Video uploaded successfully!</span>
            </div>
          )}

          {/* Remove Button */}
          <button
            type="button"
            onClick={removeVideo}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
})

PostVideoUpload.displayName = 'PostVideoUpload'

export default PostVideoUpload
