import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { uploadPostImage, deleteFile } from '@/lib/supabase'

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { postId } = await params
    const { content, mediaUrl, removeImage } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Content must be 2000 characters or less' },
        { status: 400 }
      )
    }

    // Get the existing post
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      include: { author: true }
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check permissions: user can edit their own posts, admin can edit any post
    if (existingPost.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    // Handle image deletion if requested
    let finalMediaUrl = existingPost.mediaUrl
    
    if (removeImage && existingPost.mediaUrl) {
      // Extract file path from URL and delete from storage
      try {
        const urlPath = new URL(existingPost.mediaUrl).pathname
        const filePath = urlPath.replace('/storage/v1/object/public/images/', '')
        await deleteFile('images', filePath)
        finalMediaUrl = null
      } catch (error) {
        console.error('Error deleting old image:', error)
        // Continue with update even if image deletion fails
      }
    } else if (mediaUrl && mediaUrl !== existingPost.mediaUrl) {
      // New image provided, delete old one if exists
      if (existingPost.mediaUrl) {
        try {
          const urlPath = new URL(existingPost.mediaUrl).pathname
          const filePath = urlPath.replace('/storage/v1/object/public/images/', '')
          await deleteFile('images', filePath)
        } catch (error) {
          console.error('Error deleting old image:', error)
        }
      }
      finalMediaUrl = mediaUrl
    }

    // Update the post
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        content: content.trim(),
        mediaUrl: finalMediaUrl,
        updatedAt: new Date()
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePic: true
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                profilePic: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedPost)
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { postId } = await params

    // Get the existing post
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      include: { author: true }
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check permissions: user can delete their own posts, admin can delete any post
    if (existingPost.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    // Delete associated image if exists
    if (existingPost.mediaUrl) {
      try {
        const urlPath = new URL(existingPost.mediaUrl).pathname
        const filePath = urlPath.replace('/storage/v1/object/public/images/', '')
        await deleteFile('images', filePath)
      } catch (error) {
        console.error('Error deleting image:', error)
        // Continue with post deletion even if image deletion fails
      }
    }

    // Delete the post (this will cascade delete comments and reactions)
    await prisma.post.delete({
      where: { id: postId }
    })

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
