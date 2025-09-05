import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { invalidateCache, CACHE_TAGS, getUserCacheTag } from '@/lib/cache-server'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if admin is requesting another user's profile
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    let targetUserId = session.user.id
    
    // If userId is provided and user is admin, allow access to any profile
    if (userId && session.user.role === 'ADMIN') {
      targetUserId = userId
    } else if (userId && session.user.role !== 'ADMIN') {
      // Regular users can only access their own profile
      return NextResponse.json(
        { error: 'Forbidden: You can only access your own profile' },
        { status: 403 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        profilePic: true,
        role: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, bio, profilePic, userId } = body

    let targetUserId = session.user.id
    
    // If userId is provided and user is admin, allow editing any profile
    if (userId && session.user.role === 'ADMIN') {
      targetUserId = userId
    } else if (userId && session.user.role !== 'ADMIN') {
      // Regular users can only edit their own profile
      return NextResponse.json(
        { error: 'Forbidden: You can only edit your own profile' },
        { status: 403 }
      )
    }

    // Validate input
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    if (bio && bio.length > 500) {
      return NextResponse.json(
        { error: 'Bio must be 500 characters or less' },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        name: name.trim(),
        bio: bio ? bio.trim() : null,
        profilePic: profilePic || null
      },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        profilePic: true,
        role: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    // Invalidate profile cache and user cache after successful update
    invalidateCache([CACHE_TAGS.PROFILE, CACHE_TAGS.USERS, getUserCacheTag(targetUserId)])
  }
}
