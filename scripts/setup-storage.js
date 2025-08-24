import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Client for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function setupStorageBuckets() {
  try {
    console.log('Setting up Supabase storage buckets...')

    // Create avatars bucket for profile pictures
    const { data: avatarsBucket, error: avatarsError } = await supabaseAdmin.storage
      .createBucket('avatars', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        fileSizeLimit: 10485760, // 10MB
      })

    if (avatarsError && !avatarsError.message.includes('already exists')) {
      console.error('Error creating avatars bucket:', avatarsError)
    } else {
      console.log('✓ Avatars bucket created/exists')
    }

    // Create images bucket for post images
    const { data: imagesBucket, error: imagesError } = await supabaseAdmin.storage
      .createBucket('images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        fileSizeLimit: 20971520, // 20MB
      })

    if (imagesError && !imagesError.message.includes('already exists')) {
      console.error('Error creating images bucket:', imagesError)
    } else {
      console.log('✓ Images bucket created/exists')
    }

    console.log('Storage setup complete!')
  } catch (error) {
    console.error('Error setting up storage:', error)
  }
}

setupStorageBuckets()
