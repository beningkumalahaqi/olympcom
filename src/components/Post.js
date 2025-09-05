'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { formatDistanceToNow } from 'date-fns'
import { Heart, MessageCircle, Laugh, ThumbsUp, Star, MoreHorizontal, Edit2, Trash2, Save, X } from 'lucide-react'
import Image from 'next/image'
import AvatarImage from './AvatarImage'
import OptimizedVideo from './OptimizedVideo'

const reactionTypes = [
  { type: 'like', icon: ThumbsUp, label: '👍' },
  { type: 'love', icon: Heart, label: '❤️' },
  { type: 'laugh', icon: Laugh, label: '😂' },
  { type: 'star', icon: Star, label: '⭐' }
]

export default function Post({ post, onReaction, onComment, onEdit, onDelete }) {
  const { data: session } = useSession()
  const [showComments, setShowComments] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditingPost, setIsEditingPost] = useState(false)
  const [editPostContent, setEditPostContent] = useState(post.content)
  const [showPostMenu, setShowPostMenu] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editCommentContent, setEditCommentContent] = useState('')
  const [reactingToType, setReactingToType] = useState(null) // Track which reaction is being processed
  const menuRef = useRef(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowPostMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Update edit content when post changes
  useEffect(() => {
    setEditPostContent(post.content)
  }, [post.content])

  const handleReaction = async (type) => {
    if (!session) return
    setReactingToType(type) // Show loading state for this reaction
    await onReaction(post.id, type)
    setReactingToType(null) // Clear loading state
  }

  const toggleReactions = () => {
    setShowReactions(!showReactions)
    if (!showReactions) {
      setShowComments(false) // Close comments when opening reactions
    }
  }

  const toggleComments = () => {
    setShowComments(!showComments)
    if (!showComments) {
      setShowReactions(false) // Close reactions when opening comments
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim() || isSubmitting) return
    
    setIsSubmitting(true)
    await onComment(post.id, commentText)
    setCommentText('')
    setIsSubmitting(false)
  }

  const handleEditPost = async () => {
    if (!editPostContent.trim()) return
    setIsSubmitting(true)
    await onEdit(post.id, editPostContent)
    setIsEditingPost(false)
    setIsSubmitting(false)
    setShowPostMenu(false)
  }

  const handleDeletePost = async () => {
    if (confirm('Are you sure you want to delete this post?')) {
      await onDelete(post.id)
    }
    setShowPostMenu(false)
  }

  const handleEditComment = async (commentId) => {
    if (!editCommentContent.trim()) return
    
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editCommentContent }),
      })

      if (response.ok) {
        // Refresh the page to show updated comment
        window.location.reload()
      }
    } catch (error) {
      console.error('Error editing comment:', error)
    }
    
    setEditingCommentId(null)
    setEditCommentContent('')
  }

  const handleDeleteComment = async (commentId) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      try {
        const response = await fetch(`/api/comments/${commentId}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          // Refresh the page to show updated comments
          window.location.reload()
        }
      } catch (error) {
        console.error('Error deleting comment:', error)
      }
    }
  }

  const canEditOrDelete = (authorId) => {
    return session?.user?.id === authorId || session?.user?.role === 'ADMIN'
  }

  const getUserReaction = (type) => {
    return post.reactions?.find(r => r.userId === session?.user?.id && r.type === type)
  }

  const getReactionCount = (type) => {
    return post.reactions?.filter(r => r.type === type).length || 0
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* Post Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <AvatarImage
            src={post.author.profilePic}
            alt={post.author.name}
            width={40}
            height={40}
            className="rounded-full"
          />
          <div className="ml-3">
            <h4 className="font-semibold text-gray-900">{post.author.name}</h4>
            <p className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              {post.updatedAt !== post.createdAt && (
                <span className="text-xs text-gray-400 ml-1">(edited)</span>
              )}
            </p>
          </div>
        </div>
        
        {/* Post Menu */}
        {session && canEditOrDelete(post.authorId) && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowPostMenu(!showPostMenu)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <MoreHorizontal className="w-5 h-5 text-gray-500" />
            </button>
            
            {showPostMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                <button
                  onClick={() => {
                    setIsEditingPost(true)
                    setEditPostContent(post.content)
                    setShowPostMenu(false)
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center text-black"
                >
                  <Edit2 className="w-4 h-4 mr-2 text-black" />
                  Edit Post
                </button>
                <button
                  onClick={handleDeletePost}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Content */}
      <div className="mb-4">
        {isEditingPost ? (
          <div className="space-y-3">
            <textarea
              value={editPostContent}
              onChange={(e) => setEditPostContent(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black"
              rows={4}
              maxLength={2000}
            />
            <div className="flex space-x-2">
              <button
                onClick={handleEditPost}
                disabled={!editPostContent.trim() || isSubmitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center"
              >
                <Save className="w-4 h-4 mr-1" />
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsEditingPost(false)
                  setEditPostContent(post.content)
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 flex items-center"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
            {post.mediaUrl && (
              <div className="mt-3">
                {(post.mediaType === 'video' || post.mediaUrl.includes('/videos/')) ? (
                  <OptimizedVideo
                    src={post.mediaUrl}
                    controls
                    className="rounded-lg max-w-full h-auto"
                    style={{ maxHeight: '400px', width: '100%' }}
                    preload="metadata"
                    playsInline
                    muted={false}
                    onError={(e) => {
                      console.error('Video load error:', e);
                      console.error('Video src:', post.mediaUrl);
                      console.error('Media type:', post.mediaType);
                    }}
                    onLoadStart={() => console.log('Video load started for:', post.mediaUrl)}
                    onCanPlay={() => console.log('Video can play')}
                  >
                    <source src={post.mediaUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </OptimizedVideo>
                ) : (
                  <Image
                    src={post.mediaUrl}
                    alt="Post media"
                    width={500}
                    height={300}
                    className="rounded-lg max-w-full h-auto"
                    priority={false}
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Reactions */}
      {session && (
        <div className="py-3 border-t border-gray-100">
          {/* Total reactions count (clickable) */}
          {post.reactions && post.reactions.length > 0 && (
            <div className="mb-2">
              <button
                onClick={toggleReactions}
                className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
              >
                {post.reactions.length} {post.reactions.length === 1 ? 'reaction' : 'reactions'}
              </button>
            </div>
          )}
          
          {/* Reaction buttons */}
          <div className="flex items-center space-x-4">
            {reactionTypes.map(({ type, icon: Icon, label }) => {
              const hasReacted = getUserReaction(type)
              const count = getReactionCount(type)
              const isProcessing = reactingToType === type
              
              return (
                <button
                  key={type}
                  onClick={() => handleReaction(type)}
                  disabled={isProcessing}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-all duration-200 ${
                    hasReacted
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'hover:bg-gray-100 text-gray-600'
                  } ${isProcessing ? 'opacity-75 scale-95' : 'hover:scale-105'} disabled:cursor-not-allowed`}
                >
                  <span className={`text-base ${isProcessing ? 'animate-pulse' : ''}`}>
                    {label}
                  </span>
                  {count > 0 && (
                    <span className={`font-medium ${isProcessing ? 'animate-pulse' : ''}`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
            
            <button
              onClick={toggleComments}
              className="flex items-center space-x-1 px-3 py-1 rounded-full text-sm hover:bg-gray-100 text-gray-600"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{post.comments?.length || 0}</span>
            </button>
          </div>
        </div>
      )}

      {/* Reactions Detail Section */}
      {showReactions && post.reactions && post.reactions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Reactions ({post.reactions.length})
          </h4>
          
          {/* Group reactions by type */}
          {(() => {
            const groupedReactions = post.reactions.reduce((acc, reaction) => {
              if (!acc[reaction.type]) {
                acc[reaction.type] = []
              }
              acc[reaction.type].push(reaction)
              return acc
            }, {})

            const reactionEmojis = {
              like: '👍',
              love: '❤️',
              laugh: '😂',
              star: '⭐'
            }

            return (
              <div className="space-y-4">
                {Object.entries(groupedReactions).map(([reactionType, reactionUsers]) => (
                  <div key={reactionType} className="space-y-2">
                    {/* Reaction Type Header */}
                    <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
                      <span className="text-lg">{reactionEmojis[reactionType]}</span>
                      <span className="capitalize">{reactionType}</span>
                      <span className="text-gray-500">({reactionUsers.length})</span>
                    </div>
                    
                    {/* Users who reacted */}
                    <div className="space-y-2 ml-6">
                      {reactionUsers.map((reaction) => (
                        <div
                          key={`${reaction.userId}-${reaction.type}`}
                          className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg"
                        >
                          <AvatarImage
                            src={reaction.user.profilePic}
                            alt={reaction.user.name}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {reaction.user.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              reacted with {reactionEmojis[reaction.type]}
                            </p>
                          </div>
                          {reaction.user.role === 'ADMIN' && (
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                              Admin
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      )}

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          {/* Comment Form */}
          {session && (
            <form onSubmit={handleComment} className="mb-4">
              <div className="flex space-x-3">
                <AvatarImage
                  src={session.user.profilePic}
                  alt={session.user.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <div className="flex-1">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full p-2 border border-gray-300 rounded-lg resize-none text-black focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows={2}
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim() || isSubmitting}
                    className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Posting...' : 'Comment'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Comments List */}
          <div className="space-y-3">
            {post.comments?.map((comment) => {
              const isOptimistic = comment.id.startsWith('temp-')
              
              return (
                <div 
                  key={comment.id} 
                  className={`flex space-x-3 ${isOptimistic ? 'opacity-75 animate-pulse' : ''}`}
                >
                  <AvatarImage
                    src={comment.author.profilePic}
                    alt={comment.author.name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <div className="flex-1">
                    {editingCommentId === comment.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editCommentContent}
                        onChange={(e) => setEditCommentContent(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black"
                        rows={2}
                        maxLength={1000}
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditComment(comment.id)}
                          disabled={!editCommentContent.trim()}
                          className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                        >
                          <Save className="w-3 h-3 mr-1" />
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingCommentId(null)
                            setEditCommentContent('')
                          }}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 flex items-center"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <h5 className="font-semibold text-sm text-gray-900">
                            {comment.author.name}
                          </h5>
                          {session && canEditOrDelete(comment.authorId) && (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => {
                                  setEditingCommentId(comment.id)
                                  setEditCommentContent(comment.content)
                                }}
                                className="p-1 rounded hover:bg-gray-200 text-black"
                                title="Edit comment"
                              >
                                <Edit2 className="w-3 h-3 text-black" />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="p-1 rounded hover:bg-gray-200"
                                title="Delete comment"
                              >
                                <Trash2 className="w-3 h-3 text-red-500" />
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-800 mt-1">{comment.content}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        {comment.updatedAt !== comment.createdAt && (
                          <span className="text-xs text-gray-400 ml-1">(edited)</span>
                        )}
                      </p>
                    </>
                  )}
                </div>
              </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
