import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { uploadFile, getPublicUrl, deleteFile } from '@/lib/supabase'

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { id } = params
    const formData = await request.formData()
    const content = formData.get('content')
    const image = formData.get('image')
    const isPinned = formData.get('isPinned') === 'true'
    const removeImage = formData.get('removeImage') === 'true'

    // Get existing announcement
    const existingAnnouncement = await prisma.announcement.findUnique({
      where: { id }
    })

    if (!existingAnnouncement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      )
    }

    let mediaUrl = existingAnnouncement.mediaUrl

    // Handle image removal
    if (removeImage && mediaUrl) {
      const fileName = mediaUrl.split('/').pop()
      await deleteFile(fileName, 'announcements')
      mediaUrl = null
    }

    // Handle new image upload
    if (image && image.size > 0) {
      // Delete old image if exists
      if (mediaUrl) {
        const fileName = mediaUrl.split('/').pop()
        await deleteFile(fileName, 'announcements')
      }
      
      const fileName = `announcement-${Date.now()}-${image.name}`
      const uploadResult = await uploadFile(image, fileName, 'announcements')
      if (uploadResult.success) {
        mediaUrl = getPublicUrl(uploadResult.fileName, 'announcements')
      }
    }

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id },
      data: {
        content: content?.trim() || existingAnnouncement.content,
        mediaUrl,
        isPinned
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

    return NextResponse.json(updatedAnnouncement)
  } catch (error) {
    console.error('Error updating announcement:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { id } = params

    // Get announcement to delete associated image
    const announcement = await prisma.announcement.findUnique({
      where: { id }
    })

    if (!announcement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      )
    }

    // Delete associated image if exists
    if (announcement.mediaUrl) {
      const fileName = announcement.mediaUrl.split('/').pop()
      await deleteFile(fileName, 'announcements')
    }

    // Delete announcement
    await prisma.announcement.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting announcement:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
