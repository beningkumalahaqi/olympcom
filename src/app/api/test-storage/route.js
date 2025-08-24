import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase, getPublicUrl } from '@/lib/supabase'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Test listing files in avatars bucket
    const { data: avatars, error: avatarsError } = await supabase.storage
      .from('avatars')
      .list('profiles', {
        limit: 10,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (avatarsError) {
      console.error('Error listing avatars:', avatarsError)
    }

    // Test listing files in images bucket  
    const { data: images, error: imagesError } = await supabase.storage
      .from('images')
      .list('posts', {
        limit: 10,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (imagesError) {
      console.error('Error listing images:', imagesError)
    }

    // Also list files in root of avatars bucket
    const { data: avatarsRoot, error: avatarsRootError } = await supabase.storage
      .from('avatars')
      .list('', {
        limit: 10,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    // Also list files in root of images bucket
    const { data: imagesRoot, error: imagesRootError } = await supabase.storage
      .from('images')
      .list('', {
        limit: 10,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    // Generate public URLs for testing
    const avatarUrls = avatars?.map(file => ({
      name: file.name,
      url: getPublicUrl('avatars', `profiles/${file.name}`)
    })) || []

    const imageUrls = images?.map(file => ({
      name: file.name,
      url: getPublicUrl('images', `posts/${file.name}`)
    })) || []

    // Generate URLs for root files
    const avatarRootUrls = avatarsRoot?.map(file => ({
      name: file.name,
      url: getPublicUrl('avatars', file.name)
    })) || []

    const imageRootUrls = imagesRoot?.map(file => ({
      name: file.name,
      url: getPublicUrl('images', file.name)
    })) || []

    return NextResponse.json({
      avatars: avatarUrls,
      images: imageUrls,
      avatarsRoot: avatarRootUrls,
      imagesRoot: imageRootUrls,
      avatarsError,
      imagesError,
      avatarsRootError,
      imagesRootError
    })

  } catch (error) {
    console.error('Error testing storage:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
