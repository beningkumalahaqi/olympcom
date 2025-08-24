import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { invalidateCache, CACHE_TAGS, createCachedFunction, CACHE_DURATIONS } from '@/lib/cache-server'

// Create cached function for fetching admin users
const getCachedAdminUsers = createCachedFunction(
  async () => {
    return await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        profilePic: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            comments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  },
  [CACHE_TAGS.USERS],
  CACHE_DURATIONS.SHORT,
  ['admin', 'users', 'all']
)

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const users = await getCachedAdminUsers()
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
