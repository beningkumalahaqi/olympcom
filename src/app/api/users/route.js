import { NextResponse } from 'next/server'
import { prisma, withDatabaseRetry } from '@/lib/db'
import { invalidateCache, CACHE_TAGS, createCachedFunction, CACHE_DURATIONS } from '@/lib/cache-server'

// Create cached function for fetching users
const getCachedUsers = createCachedFunction(
  async () => {
    return await withDatabaseRetry(async () => {
      return await prisma.user.findMany({
        where: {
          role: {
            not: 'ADMIN'
          }
        },
        select: {
          id: true,
          name: true,
          bio: true,
          profilePic: true,
          role: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    })
  },
  [CACHE_TAGS.USERS],
  CACHE_DURATIONS.LONG,
  ['users', 'all']
)

export async function GET() {
  try {
    const users = await getCachedUsers()
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    
    // Return more specific error information
    if (error.code === 'P2024') {
      return NextResponse.json(
        { error: 'Database connection timeout. Please try again.' },
        { status: 503 }
      )
    }
    
    if (error.message?.includes('prepared statement')) {
      return NextResponse.json(
        { error: 'Database connection issue. Please refresh and try again.' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
