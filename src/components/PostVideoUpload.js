'use client'

import { useState, useRef, useImperativeHandle, forwardRef } from 'react'
import { Video, Upload, X, Check, Play, Pause } from 'lucide-react'
import { compressVideo, getVideoMetadata, initializeFFmpeg, checkFFmpegSupport } from '@/lib/videoCompression'

const PostVideoUpload = forwardRef(({ onVideoReady, onError, disabled = false }, ref) => {
  const [isUploading, setIsUploading] = useState(false)
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressionProgress, setCompressionProgress] = useState(0)
  const [preview, setPreview] = useState(null)
  const [compressedVideoFile, setCompressedVideoFile] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [metadata, setMetadata] = useState(null)

  const fileInputRef = useRef(null)
  const videoRef = useRef(null)

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    // Upload the compressed video when post is submitted
    async uploadVideo() {
      if (!compressedVideoFile) {
        throw new Error('No video ready for upload')
      }
      return await handleUpload(compressedVideoFile)
    },
    
    // Check if video is ready for upload
    hasVideo() {
      return !!compressedVideoFile
    },
    
    // Reset the component
    reset() {
      if (preview?.url) {
        URL.revokeObjectURL(preview.url)
      }
      setPreview(null)
      setCompressedVideoFile(null)
      setIsUploading(false)
      setIsCompressing(false)
      setCompressionProgress(0)
      setMetadata(null)
      setIsPlaying(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      if (onVideoReady) {
        onVideoReady(false)
      }
    }
  }))

  const handleFileSelect = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Reset previous state
    if (preview?.url) {
      URL.revokeObjectURL(preview.url)
    }
    setPreview(null)
    setCompressedVideoFile(null)
    setMetadata(null)
    setIsPlaying(false)
    
    // Video validation
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      const error = 'Video file size must be less than 100MB'
      if (onError) onError(error)
      return
    }

    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
    if (!allowedTypes.includes(file.type)) {
      const error = 'Please select a valid video file (MP4, MOV, AVI, WebM)'
      if (onError) onError(error)
      return
    }

    try {
      // Get video metadata
      const videoMetadata = await getVideoMetadata(file)
      setMetadata(videoMetadata)

      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setPreview({
        file,
        url: previewUrl,
        type: 'video'
      })

      // Auto-compress the video
      await handleCompress(file)
    } catch (error) {
      console.error('Error processing video:', error)
      if (onError) onError(`Error processing video: ${error.message}`)
    }
  }

  const handleCompress = async (file) => {
    if (!file) return

    // Check FFmpeg support
    const ffmpegSupport = checkFFmpegSupport()
    if (!ffmpegSupport.isSupported) {
      const missingFeatures = ffmpegSupport.missingFeatures.join(', ')
      const error = `Video compression not supported. Missing browser features: ${missingFeatures}. Please ensure your browser supports SharedArrayBuffer, WebAssembly, and Web Workers.`
      console.warn(error)
      if (onError) onError(error)
      return
    }

    setIsCompressing(true)
    setCompressionProgress(0)

    try {
      console.log('Starting video compression...')
      
      // Initialize FFmpeg
      await initializeFFmpeg()
      
      const compressedFile = await compressVideo(file, {
        onProgress: (progress) => {
          console.log(`Compression progress: ${progress}%`)
          setCompressionProgress(progress)
        }
      })

      console.log('Video compression completed:', {
        originalSize: file.size,
        compressedSize: compressedFile.size,
        compressionRatio: ((file.size - compressedFile.size) / file.size * 100).toFixed(1) + '%'
      })

      // Store compressed video
      setCompressedVideoFile(compressedFile)
      
      // Update preview with compressed video
      if (preview?.url) {
        URL.revokeObjectURL(preview.url)
      }
      const compressedPreviewUrl = URL.createObjectURL(compressedFile)
      setPreview({
        file: compressedFile,
        url: compressedPreviewUrl,
        type: 'video'
      })

      // Notify parent that video is ready
      if (onVideoReady) {
        onVideoReady(true)
      }

    } catch (error) {
      console.error('Compression error:', error)
      let errorMessage = 'Failed to compress video'
      
      if (error.message.includes('SharedArrayBuffer')) {
        errorMessage = 'Video compression requires modern browser features. Please try a different browser or check if your browser supports SharedArrayBuffer.'
      } else if (error.message.includes('WASM')) {
        errorMessage = 'Video compression requires WebAssembly support. Please use a modern browser.'
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Video compression timed out. The file might be too large or complex.'
      } else if (error.message) {
        errorMessage = `Compression failed: ${error.message}`
      }
      
      if (onError) onError(errorMessage)
    } finally {
      setIsCompressing(false)
      setCompressionProgress(0)
    }
  }

  const handleUpload = async (videoFile) => {
    if (!videoFile) {
      throw new Error('No video file to upload')
    }

    setIsUploading(true)

    try {
      console.log('Uploading video...', {
        name: videoFile.name,
        size: videoFile.size,
        type: videoFile.type
      })

      const formData = new FormData()
      formData.append('video', videoFile)

      const response = await fetch('/api/posts/upload-video', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || 'Upload failed'
        } catch {
          errorMessage = `Upload failed: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('Video uploaded successfully:', data)

      return data.url
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  const removeVideo = () => {
    if (preview?.url) {
      URL.revokeObjectURL(preview.url)
    }
    setPreview(null)
    setCompressedVideoFile(null)
    setMetadata(null)
    setIsPlaying(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (onVideoReady) {
      onVideoReady(false)
    }
  }

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      {!preview ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || isCompressing || isUploading}
          />
          <Video className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            Select a video file to upload
          </p>
          <p className="text-xs text-gray-500 mt-1">
            MP4, MOV, AVI, WebM up to 100MB
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isCompressing || isUploading}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Choose Video
          </button>
        </div>
      ) : (
        <div className="relative">
          <video
            ref={videoRef}
            src={preview.url}
            className="w-full max-w-md rounded-lg border"
            preload="metadata"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />
          
          {/* Play/Pause Overlay */}
          <button
            type="button"
            onClick={togglePlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity rounded-lg"
          >
            {isPlaying ? (
              <Pause className="h-12 w-12 text-white" />
            ) : (
              <Play className="h-12 w-12 text-white" />
            )}
          </button>

          {/* Video Info */}
          {metadata && (
            <div className="mt-2 text-sm text-gray-600">
              <p>Duration: {formatDuration(metadata.duration)}</p>
              <p>Size: {formatFileSize(preview.file.size)}</p>
              <p>Resolution: {metadata.width}×{metadata.height}</p>
            </div>
          )}

          {/* Compression Progress */}
          {isCompressing && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                <span>Compressing video...</span>
                <span>{compressionProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${compressionProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Ready State */}
          {compressedVideoFile && !isCompressing && !isUploading && (
            <div className="mt-3 flex items-center space-x-2 text-sm text-green-600">
              <Check className="h-4 w-4" />
              <span>Video ready for upload!</span>
            </div>
          )}

          {/* Uploading State */}
          {isUploading && (
            <div className="mt-3 flex items-center space-x-2 text-sm text-blue-600">
              <Upload className="h-4 w-4 animate-bounce" />
              <span>Uploading video...</span>
            </div>
          )}

          {/* Remove Button */}
          <button
            type="button"
            onClick={removeVideo}
            disabled={isCompressing || isUploading}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
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
