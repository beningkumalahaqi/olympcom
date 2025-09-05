'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import CreatePost from '@/components/CreatePost'
import Post from '@/components/Post'
import { MessageSquare } from 'lucide-react'

export default function Feed() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/login')
      return
    }
    fetchPosts()
  }, [session, status, router])

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts')
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReaction = async (postId, type) => {
    if (!session?.user?.id) return

    // Find the post to update
    const postIndex = posts.findIndex(p => p.id === postId)
    if (postIndex === -1) return

    const post = posts[postIndex]
    const existingReaction = post.reactions?.find(r => 
      r.userId === session.user.id && r.type === type
    )

    // Optimistic update - immediately update the UI
    setPosts(prevPosts => {
      const newPosts = [...prevPosts]
      const targetPost = { ...newPosts[postIndex] }
      
      if (existingReaction) {
        // Remove reaction optimistically
        targetPost.reactions = targetPost.reactions.filter(r => 
          !(r.userId === session.user.id && r.type === type)
        )
      } else {
        // Add reaction optimistically
        const newReaction = {
          id: `temp-${Date.now()}`, // Temporary ID
          userId: session.user.id,
          type: type,
          user: {
            id: session.user.id,
            name: session.user.name,
            profilePic: session.user.profilePic,
            role: session.user.role
          },
          createdAt: new Date().toISOString()
        }
        targetPost.reactions = [...(targetPost.reactions || []), newReaction]
      }
      
      newPosts[postIndex] = targetPost
      return newPosts
    })

    // Background server update
    try {
      const response = await fetch(`/api/posts/${postId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type })
      })

      if (!response.ok) {
        // Revert optimistic update on error
        console.error('Reaction failed, reverting...')
        setPosts(prevPosts => {
          const newPosts = [...prevPosts]
          const targetPost = { ...newPosts[postIndex] }
          
          if (existingReaction) {
            // Re-add the reaction that failed to remove
            targetPost.reactions = [...(targetPost.reactions || []), existingReaction]
          } else {
            // Remove the reaction that failed to add
            targetPost.reactions = targetPost.reactions.filter(r => 
              !(r.userId === session.user.id && r.type === type)
            )
          }
          
          newPosts[postIndex] = targetPost
          return newPosts
        })
        
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Error handling reaction:', errorData.error)
      } else {
        // Optionally refresh with server data to sync any discrepancies
        // For now, we trust the optimistic update worked
        console.log('Reaction updated successfully')
      }
    } catch (error) {
      console.error('Error handling reaction:', error)
      
      // Revert optimistic update on network error
      setPosts(prevPosts => {
        const newPosts = [...prevPosts]
        const targetPost = { ...newPosts[postIndex] }
        
        if (existingReaction) {
          // Re-add the reaction that failed to remove
          targetPost.reactions = [...(targetPost.reactions || []), existingReaction]
        } else {
          // Remove the reaction that failed to add
          targetPost.reactions = targetPost.reactions.filter(r => 
            !(r.userId === session.user.id && r.type === type)
          )
        }
        
        newPosts[postIndex] = targetPost
        return newPosts
      })
    }
  }

  const handleComment = async (postId, content) => {
    if (!session?.user?.id || !content.trim()) return

    // Find the post to update
    const postIndex = posts.findIndex(p => p.id === postId)
    if (postIndex === -1) return

    // Create optimistic comment
    const optimisticComment = {
      id: `temp-${Date.now()}`, // Temporary ID
      content: content.trim(),
      authorId: session.user.id,
      author: {
        id: session.user.id,
        name: session.user.name,
        profilePic: session.user.profilePic
      },
      createdAt: new Date().toISOString()
    }

    // Optimistic update - immediately add comment to UI
    setPosts(prevPosts => {
      const newPosts = [...prevPosts]
      const targetPost = { ...newPosts[postIndex] }
      targetPost.comments = [...(targetPost.comments || []), optimisticComment]
      newPosts[postIndex] = targetPost
      return newPosts
    })

    // Background server update
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content })
      })

      if (response.ok) {
        // Get the real comment from server response
        const newComment = await response.json()
        
        // Replace optimistic comment with real comment
        setPosts(prevPosts => {
          const newPosts = [...prevPosts]
          const targetPost = { ...newPosts[postIndex] }
          targetPost.comments = targetPost.comments.map(comment => 
            comment.id === optimisticComment.id ? newComment : comment
          )
          newPosts[postIndex] = targetPost
          return newPosts
        })
      } else {
        // Remove optimistic comment on error
        console.error('Comment failed, removing optimistic comment...')
        setPosts(prevPosts => {
          const newPosts = [...prevPosts]
          const targetPost = { ...newPosts[postIndex] }
          targetPost.comments = targetPost.comments.filter(comment => 
            comment.id !== optimisticComment.id
          )
          newPosts[postIndex] = targetPost
          return newPosts
        })
        
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Error adding comment:', errorData.error)
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      
      // Remove optimistic comment on network error
      setPosts(prevPosts => {
        const newPosts = [...prevPosts]
        const targetPost = { ...newPosts[postIndex] }
        targetPost.comments = targetPost.comments.filter(comment => 
          comment.id !== optimisticComment.id
        )
        newPosts[postIndex] = targetPost
        return newPosts
      })
    }
  }

  const handleEditPost = async (postId, content) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content })
      })

      if (response.ok) {
        // Refresh posts to get updated post
        fetchPosts()
      }
    } catch (error) {
      console.error('Error editing post:', error)
    }
  }

  const handleDeletePost = async (postId) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Refresh posts to remove deleted post
        fetchPosts()
      }
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  if (status === 'loading') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8 text-indigo-600 mr-3" />
          <h1 className="text-3xl font-bold text-white">Feed</h1>
        </div>
        <p className="text-gray-400">
          Share what&apos;s on your mind with the Olympus community
        </p>
      </div>

      <CreatePost onPostCreated={fetchPosts} />

      {loading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 shadow-md animate-pulse">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full mr-3"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
              <div className="flex space-x-4">
                <div className="h-8 bg-gray-200 rounded w-16"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <Post
              key={post.id}
              post={post}
              onReaction={handleReaction}
              onComment={handleComment}
              onEdit={handleEditPost}
              onDelete={handleDeletePost}
            />
          ))}
          
          {posts.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-600">
                Be the first to share something with the community!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
