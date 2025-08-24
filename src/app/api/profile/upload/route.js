import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { uploadProfilePicture } from '@/lib/supabase'

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
    const file = formData.get('profilePic')

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

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      )
    }

    try {
      // Convert file to buffer
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Upload and process image with Supabase
      const uploadResult = await uploadProfilePicture(buffer, session.user.id)

      // Update user's profile picture in database
      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: { profilePic: uploadResult.url },
        select: {
          id: true,
          email: true,
          name: true,
          bio: true,
          profilePic: true,
          role: true
        }
      })

      return NextResponse.json({
        message: 'Profile picture uploaded successfully',
        profilePic: uploadResult.url,
        user: updatedUser
      })

    } catch (imageError) {
      console.error('Error processing/uploading image:', imageError)
      return NextResponse.json(
        { error: 'Error processing image. Please try with a different image.' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error uploading profile picture:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
