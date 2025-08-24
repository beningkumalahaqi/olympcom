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

    const announcements = await prisma.announcement.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePic: true,
            role: true
          }
        }
      },
      orderBy: [
        { isPinned: 'desc' }, // Pinned announcements first
        { createdAt: 'desc' }  // Then by creation date
      ]
    })

    return NextResponse.json(announcements)
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const content = formData.get('content')
    const image = formData.get('image')
    const isPinned = formData.get('isPinned') === 'true'

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    let mediaUrl = null
    if (image && image.size > 0) {
      const fileName = `announcement-${Date.now()}-${image.name}`
      const uploadResult = await uploadFile(image, fileName, 'announcements')
      if (uploadResult.success) {
        mediaUrl = getPublicUrl(uploadResult.fileName, 'announcements')
      }
    }

    const announcement = await prisma.announcement.create({
      data: {
        content: content.trim(),
        mediaUrl,
        isPinned,
        authorId: session.user.id
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profilePic: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json(announcement, { status: 201 })
  } catch (error) {
    console.error('Error creating announcement:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
