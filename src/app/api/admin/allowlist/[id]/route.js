import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { invalidateCache, CACHE_TAGS } from '@/lib/cache-server'

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    const allowlistEntry = await prisma.allowlist.findUnique({
      where: { id }
    })

    if (!allowlistEntry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      )
    }

    await prisma.allowlist.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Entry removed successfully' })
  } catch (error) {
    console.error('Error removing from allowlist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    // Invalidate allowlist cache after successful deletion
    invalidateCache([CACHE_TAGS.ALLOWLIST])
  }
}
