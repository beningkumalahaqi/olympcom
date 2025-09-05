// Video compression utility using FFmpeg.js
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL, fetchFile } from '@ffmpeg/util'

let ffmpegInstance = null

export const initializeFFmpeg = async () => {
  if (ffmpegInstance && ffmpegInstance.loaded) {
    return ffmpegInstance
  }

  ffmpegInstance = new FFmpeg()
  
  try {
    // Check if SharedArrayBuffer is available (required for FFmpeg.js)
    if (typeof SharedArrayBuffer === 'undefined') {
      throw new Error('SharedArrayBuffer is not available. FFmpeg.js requires Cross-Origin-Embedder-Policy headers.')
    }

    console.log('Loading FFmpeg...')
    // Load FFmpeg
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
    await ffmpegInstance.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    })
    
    console.log('FFmpeg loaded successfully')
    return ffmpegInstance
  } catch (error) {
    console.error('Failed to load FFmpeg:', error)
    throw error
  }
}

export const compressVideo = async (file, options = {}) => {
  const {
    maxSizeMB = 10,     // Force maximum to 10MB
    quality = 28,       // CRF value (lower = better quality, 18-28 recommended)
    maxWidth = 1280,
    maxHeight = 720,
    fps = 30
  } = options

  try {
    console.log('Starting video compression with options:', options)
    console.log('Input file:', { name: file.name, size: file.size, type: file.type })

    // Check if the file is already small enough
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB <= maxSizeMB) {
      console.log(`File is already small enough (${fileSizeMB.toFixed(2)}MB), skipping compression`)
      return file
    }

    console.log(`File is ${fileSizeMB.toFixed(2)}MB, compressing to max ${maxSizeMB}MB`)

    // Initialize FFmpeg (will throw error if SharedArrayBuffer not available)
    const ffmpeg = await initializeFFmpeg()
    
    // Create input filename
    const inputName = 'input.mp4'
    const outputName = 'output.mp4'
    
    console.log('Writing input file to FFmpeg filesystem...')
    // Write input file to FFmpeg virtual filesystem
    await ffmpeg.writeFile(inputName, await fetchFile(file))
    
    console.log('Starting FFmpeg compression...')
    // Compress video with high-quality settings
    const ffmpegArgs = [
      '-i', inputName,
      '-c:v', 'libx264',           // H.264 video codec
      '-crf', quality.toString(),   // Quality level (18-28 for high quality)
      '-preset', 'medium',          // Encoding speed vs compression efficiency
      '-c:a', 'aac',               // AAC audio codec
      '-b:a', '128k',              // Audio bitrate
      '-movflags', '+faststart',    // Optimize for web streaming
      '-vf', `scale='min(${maxWidth},iw)':'min(${maxHeight},ih)':force_original_aspect_ratio=decrease`,
      '-r', fps.toString(),         // Frame rate
      '-y',                        // Overwrite output
      outputName
    ]
    
    console.log('Running FFmpeg with args:', ffmpegArgs)
    // Run FFmpeg compression
    await ffmpeg.exec(ffmpegArgs)
    
    console.log('FFmpeg compression completed, reading output file...')
    // Read compressed video
    const compressedData = await ffmpeg.readFile(outputName)
    
    if (!compressedData || compressedData.length === 0) {
      throw new Error('FFmpeg produced empty output')
    }

    console.log('Creating blob from compressed data...', { dataSize: compressedData.length })
    const compressedBlob = new Blob([compressedData.buffer], { type: 'video/mp4' })
    
    if (!compressedBlob || compressedBlob.size === 0) {
      throw new Error('Failed to create blob from compressed data')
    }

    // Check if compressed size meets requirements
    const compressedSizeMB = compressedBlob.size / (1024 * 1024)
    console.log(`Compressed video size: ${compressedSizeMB.toFixed(2)}MB`)
    
    if (compressedSizeMB > maxSizeMB) {
      // If still too large, try with higher compression to force it under the limit
      console.warn(`Compressed video is ${compressedSizeMB.toFixed(2)}MB, applying aggressive compression to reach ${maxSizeMB}MB limit...`)
      
      // Clean up previous attempt
      await ffmpeg.deleteFile(outputName)
      
      // Calculate more aggressive settings to force under the limit
      const targetBitrate = Math.floor((maxSizeMB * 8 * 1024) / (file.duration || 60)) // Estimate bitrate
      const aggressiveArgs = [
        '-i', inputName,
        '-c:v', 'libx264',
        '-crf', '32',                // Higher CRF for smaller file
        '-preset', 'slow',           // Better compression
        '-maxrate', `${targetBitrate}k`,
        '-bufsize', `${targetBitrate * 2}k`,
        '-c:a', 'aac',
        '-b:a', '64k',               // Lower audio bitrate
        '-movflags', '+faststart',
        '-vf', `scale='min(${Math.floor(maxWidth * 0.7)},iw)':'min(${Math.floor(maxHeight * 0.7)},ih)':force_original_aspect_ratio=decrease`,
        '-r', '24',                  // Lower frame rate
        '-y',
        outputName
      ]
      
      await ffmpeg.exec(aggressiveArgs)
      const recompressedData = await ffmpeg.readFile(outputName)
      const recompressedBlob = new Blob([recompressedData.buffer], { type: 'video/mp4' })
      
      const finalSizeMB = recompressedBlob.size / (1024 * 1024)
      console.log(`Final compressed size: ${finalSizeMB.toFixed(2)}MB`)
      
      // Clean up
      await ffmpeg.deleteFile(inputName)
      await ffmpeg.deleteFile(outputName)
      
      return recompressedBlob
    }
    
    console.log(`Video compressed successfully: ${compressedSizeMB.toFixed(2)}MB`)
    
    // Clean up
    await ffmpeg.deleteFile(inputName)
    await ffmpeg.deleteFile(outputName)
    
    return compressedBlob

  } catch (error) {
    console.error('Video compression failed:', error)
    throw error
  }
}

export const getVideoMetadata = async (file) => {
  try {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src)
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          aspectRatio: video.videoWidth / video.videoHeight
        })
      }
      
      video.onerror = () => {
        URL.revokeObjectURL(video.src)
        reject(new Error('Failed to load video metadata'))
      }
      
      video.src = URL.createObjectURL(file)
    })
  } catch (error) {
    console.error('Failed to get video metadata:', error)
    throw error
  }
}
