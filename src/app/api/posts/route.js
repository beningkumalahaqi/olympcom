import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { uploadFile, getPublicUrl } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const posts = await prisma.post.findMany({
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
                name: true,
                profilePic: true,
                role: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { content, mediaUrl } = await request.json()

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

    const post = await prisma.post.create({
      data: {
        content: content.trim(),
        mediaUrl: mediaUrl || null,
        authorId: session.user.id
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
          }
        },
        reactions: true
      }
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
