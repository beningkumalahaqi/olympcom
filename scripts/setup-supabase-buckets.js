#!/usr/bin/env node

/**
 * Setup script to create necessary Supabase storage buckets
 * Run this script to ensure all required buckets exist in your Supabase project
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createBucket(bucketName, options = {}) {
  try {
    console.log(`📦 Creating bucket: ${bucketName}`)
    
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      ...options
    })

    if (error) {
      if (error.message.includes('already exists')) {
        console.log(`✅ Bucket '${bucketName}' already exists`)
        return true
      }
      throw error
    }

    console.log(`✅ Bucket '${bucketName}' created successfully`)
    return true
  } catch (error) {
    console.error(`❌ Failed to create bucket '${bucketName}':`, error.message)
    return false
  }
}

async function setBucketPolicy(bucketName, policy) {
  try {
    console.log(`🔒 Setting RLS policy for bucket: ${bucketName}`)
    
    // Note: You'll need to set up RLS policies in the Supabase dashboard
    // This is just a placeholder for policy configuration
    console.log(`ℹ️  Please set up RLS policies for '${bucketName}' in the Supabase dashboard`)
    console.log(`   - Allow authenticated users to INSERT`)
    console.log(`   - Allow public access to SELECT`)
    
    return true
  } catch (error) {
    console.error(`❌ Failed to set policy for bucket '${bucketName}':`, error.message)
    return false
  }
}

async function setupBuckets() {
  console.log('🚀 Setting up Supabase storage buckets for OlympCom...\n')

  const buckets = [
    {
      name: 'avatars',
      options: {}
    },
    {
      name: 'images', 
      options: {}
    },
    {
      name: 'videos',
      options: {}
    }
  ]

  let allSuccessful = true

  for (const bucket of buckets) {
    const success = await createBucket(bucket.name, bucket.options)
    if (success) {
      await setBucketPolicy(bucket.name)
    }
    allSuccessful = allSuccessful && success
    console.log() // Empty line for spacing
  }

  if (allSuccessful) {
    console.log('🎉 All buckets set up successfully!')
    console.log('\n📋 Next steps:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to Storage > Policies')
    console.log('3. Set up RLS policies for each bucket:')
    console.log('   - Allow authenticated users to upload files')
    console.log('   - Allow public read access to files')
    console.log('\n💡 Example policy for videos bucket:')
    console.log('   Policy name: "Allow authenticated uploads"')
    console.log('   Operation: INSERT')
    console.log('   Target roles: authenticated')
    console.log('   Policy: true')
    console.log('\n   Policy name: "Allow public access"')
    console.log('   Operation: SELECT')
    console.log('   Target roles: public')
    console.log('   Policy: true')
  } else {
    console.log('❌ Some buckets failed to create. Please check the errors above.')
    process.exit(1)
  }
}

// Run the setup
setupBuckets().catch(error => {
  console.error('❌ Setup failed:', error)
  process.exit(1)
})
