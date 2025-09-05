import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { uploadProfilePicture } from '@/lib/supabase'
import { invalidateCache, CACHE_TAGS, getUserCacheTag } from '@/lib/cache-server'

export async function POST(request, { params }) {
  const { userId } = params
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
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

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
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

      // Upload and process image with Supabase (using target user's ID)
      const uploadResult = await uploadProfilePicture(buffer, userId)

      // Update target user's profile picture in database
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { profilePic: uploadResult.url },
        select: {
          id: true,
          email: true,
          name: true,
          bio: true,
          profilePic: true,
          role: true,
          createdAt: true,
          updatedAt: true
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
  } finally {
    // Invalidate profile and user cache after successful upload
    invalidateCache([CACHE_TAGS.PROFILE, CACHE_TAGS.USERS, getUserCacheTag(userId)])
  }
}
