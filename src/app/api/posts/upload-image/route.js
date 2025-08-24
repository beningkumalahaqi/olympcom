import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadPostImage } from '@/lib/supabase'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('image')
    const postId = formData.get('postId') // Optional, for existing posts

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (max 20MB for posts)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 20MB' },
        { status: 400 }
      )
    }

    try {
      // Convert file to buffer
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Upload and process image with Supabase
      const uploadResult = await uploadPostImage(buffer, session.user.id, postId)

      return NextResponse.json({
        message: 'Image uploaded successfully',
        imageUrl: uploadResult.url,
        imagePath: uploadResult.path
      })

    } catch (imageError) {
      console.error('Error processing/uploading image:', imageError)
      return NextResponse.json(
        { error: 'Error processing image. Please try with a different image.' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
