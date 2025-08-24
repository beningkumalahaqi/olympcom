import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { invalidateCache, CACHE_TAGS, getUserCacheTag } from '@/lib/cache-server'

// GET - Get specific user details (admin only)
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = params

    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update user details (admin only)
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = params
    const body = await request.json()
    const { email, name, bio, profilePic, role, password } = body

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent admin from changing their own role if they are the only admin
    if (existingUser.role === 'ADMIN' && role === 'USER' && existingUser.id === session.user.id) {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' }
      })
      
      if (adminCount <= 1) {
        return NextResponse.json({ 
          error: 'Cannot change role: You are the only admin. Please promote another user to admin first.' 
        }, { status: 400 })
      }
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: { 
          email: email,
          id: { not: userId }
        }
      })

      if (emailExists) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
      }
    }

    // Prepare update data
    const updateData = {}
    
    if (email) updateData.email = email
    if (name) updateData.name = name
    if (bio !== undefined) updateData.bio = bio // Allow empty string
    if (profilePic !== undefined) updateData.profilePic = profilePic
    if (role) updateData.role = role

    // Hash password if provided
    if (password && password.trim()) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    // Invalidate users cache and specific user cache after successful update
    invalidateCache([CACHE_TAGS.USERS, getUserCacheTag(userId)])
  }
}

// DELETE - Delete user (admin only)
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = params

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent admin from deleting themselves if they are the only admin
    if (existingUser.role === 'ADMIN' && existingUser.id === session.user.id) {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' }
      })
      
      if (adminCount <= 1) {
        return NextResponse.json({ 
          error: 'Cannot delete: You are the only admin. Please promote another user to admin first.' 
        }, { status: 400 })
      }
    }

    // Delete user and all related data
    await prisma.$transaction([
      // Delete user's reactions
      prisma.reaction.deleteMany({
        where: { userId: userId }
      }),
      // Delete user's comments
      prisma.comment.deleteMany({
        where: { authorId: userId }
      }),
      // Delete user's posts (and their reactions/comments will cascade)
      prisma.post.deleteMany({
        where: { authorId: userId }
      }),
      // Finally delete the user
      prisma.user.delete({
        where: { id: userId }
      })
    ])

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    // Invalidate users cache and specific user cache after successful deletion
    invalidateCache([CACHE_TAGS.USERS, getUserCacheTag(userId), CACHE_TAGS.POSTS])
  }
}
