import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Client for public operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client for admin operations (file uploads)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export const uploadFile = async (file, bucket, path) => {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, file, {
      upsert: true // Allow overwriting existing files
    })
  
  if (error) {
    throw error
  }
  
  return data
}

export const getPublicUrl = (bucket, path) => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  
  return data.publicUrl
}

// Upload and process profile picture
export const uploadProfilePicture = async (fileBuffer, userId) => {
  try {
    // Process image with Sharp for profile picture
    // 1. Resize to 400x400 (1:1 aspect ratio)
    // 2. Compress with quality 80
    // 3. Convert to WebP for better compression
    const processedImageBuffer = await sharp(fileBuffer)
      .resize(400, 400, {
        fit: 'cover', // This ensures 1:1 cropping
        position: 'center'
      })
      .webp({ quality: 80 })
      .toBuffer()

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${userId}-${timestamp}.webp`
    const path = `profiles/${filename}`

    // Upload to Supabase storage
    const { data, error } = await supabaseAdmin.storage
      .from('avatars')
      .upload(path, processedImageBuffer, {
        contentType: 'image/webp',
        upsert: true
      })

    if (error) {
      throw error
    }

    // Get public URL
    const publicUrl = getPublicUrl('avatars', path)
    
    return {
      path: data.path,
      url: publicUrl
    }
  } catch (error) {
    console.error('Error uploading profile picture:', error)
    throw error
  }
}

// Upload and process post image
export const uploadPostImage = async (fileBuffer, userId, postId) => {
  try {
    // Process image with Sharp for post image
    // 1. Resize to max width 1200px (maintaining aspect ratio)
    // 2. Compress with quality 85
    // 3. Convert to WebP for better compression
    const processedImageBuffer = await sharp(fileBuffer)
      .resize(1200, null, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 85 })
      .toBuffer()

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${userId}-${postId || timestamp}.webp`
    const path = `posts/${filename}`

    // Upload to Supabase storage
    const { data, error } = await supabaseAdmin.storage
      .from('images')
      .upload(path, processedImageBuffer, {
        contentType: 'image/webp',
        upsert: true
      })

    if (error) {
      throw error
    }

    // Get public URL
    const publicUrl = getPublicUrl('images', path)
    
    return {
      path: data.path,
      url: publicUrl
    }
  } catch (error) {
    console.error('Error uploading post image:', error)
    throw error
  }
}

// Delete file from Supabase storage
export const deleteFile = async (bucket, path) => {
  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .remove([path])
  
  if (error) {
    throw error
  }
}

// List files in a bucket
export const listFiles = async (bucket, path = '') => {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .list(path)
  
  if (error) {
    throw error
  }
  
  return data
}
