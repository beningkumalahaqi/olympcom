import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadPostVideo } from '@/lib/supabase'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Processing video upload request...')

    const formData = await request.formData()
    const videoFile = formData.get('video')

    console.log('Video file received:', {
      name: videoFile?.name,
      size: videoFile?.size,
      type: videoFile?.type
    })

    if (!videoFile) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!videoFile.type.startsWith('video/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a video file.' },
        { status: 400 }
      )
    }

    // Validate file size (max 100MB for compressed video)
    if (videoFile.size > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Video file too large. Maximum size is 100MB.' },
        { status: 400 }
      )
    }

    console.log('Converting video to buffer...')
    // Convert file to buffer
    const arrayBuffer = await videoFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log('Uploading video to Supabase...')
    // Upload video to Supabase
    const result = await uploadPostVideo(buffer, videoFile.name)

    console.log('Video upload successful:', result)

    return NextResponse.json({
      url: result.url,
      path: result.path,
      size: videoFile.size,
      type: videoFile.type
    })

  } catch (error) {
    console.error('Error uploading video:', error)
    
    // Return more specific error information
    let errorMessage = 'Failed to upload video. Please try again.'
    
    if (error.message?.includes('Bucket not found') || error.message?.includes('bucket')) {
      errorMessage = 'Video storage bucket not found. Please run "npm run setup:buckets" to create required storage buckets.'
    } else if (error.message?.includes('storage')) {
      errorMessage = 'Storage error. Please check your Supabase configuration.'
    } else if (error.message?.includes('network')) {
      errorMessage = 'Network error. Please check your connection and try again.'
    } else if (error.code) {
      errorMessage = `Database error (${error.code}). Please try again.`
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error.message },
      { status: 500 }
    )
  }
}
