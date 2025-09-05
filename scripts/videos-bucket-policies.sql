-- RLS policies for the videos bucket
-- Run these SQL commands in your Supabase SQL editor

-- Policy to allow authenticated users to upload videos
INSERT INTO storage.policies (name, bucket_id, operation, check_expr, definition)
VALUES (
  'Allow authenticated uploads to videos bucket',
  'videos',
  'INSERT',
  'auth.role() = ''authenticated''',
  'auth.role() = ''authenticated'''
);

-- Policy to allow public read access to videos
INSERT INTO storage.policies (name, bucket_id, operation, check_expr, definition)
VALUES (
  'Allow public access to videos bucket',
  'videos',
  'SELECT',
  'true',
  'true'
);

-- Policy to allow users to update their own videos (optional)
INSERT INTO storage.policies (name, bucket_id, operation, check_expr, definition)
VALUES (
  'Allow users to update their own videos',
  'videos',
  'UPDATE',
  'auth.role() = ''authenticated''',
  'auth.role() = ''authenticated'''
);

-- Policy to allow users to delete their own videos (optional)
INSERT INTO storage.policies (name, bucket_id, operation, check_expr, definition)
VALUES (
  'Allow users to delete their own videos',
  'videos',
  'DELETE',
  'auth.role() = ''authenticated''',
  'auth.role() = ''authenticated'''
);
