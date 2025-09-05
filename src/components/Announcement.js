'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { formatDistanceToNow } from 'date-fns'
import { Pin, PinOff, Edit2, Trash2, Save, X, MoreHorizontal } from 'lucide-react'
import Image from 'next/image'
import AvatarImage from './AvatarImage'
import OptimizedVideo from './OptimizedVideo'

export default function Announcement({ announcement, onEdit, onDelete, onPin }) {
  const { data: session } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(announcement.content)
  const [showMenu, setShowMenu] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const menuRef = useRef(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Update edit content when announcement changes
  useEffect(() => {
    setEditContent(announcement.content)
  }, [announcement.content])

  const handleEdit = async () => {
    if (!editContent.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onEdit(announcement.id, { content: editContent.trim() })
      setIsEditing(false)
    } catch (error) {
      console.error('Error editing announcement:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      await onDelete(announcement.id)
    }
  }

  const handlePin = async () => {
    await onPin(announcement.id, !announcement.isPinned)
  }

  const isAdmin = session?.user?.role === 'ADMIN'

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 mb-6 ${announcement.isPinned ? 'border-l-4 border-yellow-400' : ''}`}>
      {/* Pinned Badge */}
      {announcement.isPinned && (
        <div className="flex items-center mb-3 text-yellow-600">
          <Pin className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">Pinned Announcement</span>
        </div>
      )}

      {/* Announcement Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <AvatarImage
            src={announcement.author.profilePic}
            alt={announcement.author.name}
            width={40}
            height={40}
            className="rounded-full"
          />
          <div className="ml-3">
            <div className="flex items-center">
              <h4 className="font-semibold text-gray-900">{announcement.author.name}</h4>
              <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                Admin
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
              {announcement.updatedAt !== announcement.createdAt && (
                <span className="text-xs text-gray-400 ml-1">(edited)</span>
              )}
            </p>
          </div>
        </div>

        {/* Admin Menu */}
        {isAdmin && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <MoreHorizontal className="w-5 h-5 text-gray-500" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border">
                <button
                  onClick={() => {
                    setIsEditing(true)
                    setShowMenu(false)
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    handlePin()
                    setShowMenu(false)
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {announcement.isPinned ? (
                    <>
                      <PinOff className="w-4 h-4 mr-2" />
                      Unpin
                    </>
                  ) : (
                    <>
                      <Pin className="w-4 h-4 mr-2" />
                      Pin
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    handleDelete()
                    setShowMenu(false)
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Announcement Content */}
      <div className="mb-4">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none text-black focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={4}
              maxLength={2000}
            />
            <div className="flex space-x-2">
              <button
                onClick={handleEdit}
                disabled={!editContent.trim() || isSubmitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center"
              >
                <Save className="w-4 h-4 mr-1" />
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false)
                  setEditContent(announcement.content)
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
            <p className="text-gray-800 whitespace-pre-wrap text-lg">{announcement.content}</p>
            {announcement.mediaUrl && (
              <div className="mt-4">
                {(announcement.mediaType === 'video' || announcement.mediaUrl.includes('/videos/')) ? (
                  <OptimizedVideo
                    src={announcement.mediaUrl}
                    controls
                    className="rounded-lg max-w-full h-auto"
                    style={{ maxHeight: '400px', width: '100%' }}
                    preload="metadata"
                    playsInline
                    muted={false}
                    onError={(e) => {
                      console.error('Video load error:', e);
                      console.error('Video src:', announcement.mediaUrl);
                      console.error('Media type:', announcement.mediaType);
                    }}
                    onLoadStart={() => console.log('Video load started for:', announcement.mediaUrl)}
                    onCanPlay={() => console.log('Video can play')}
                  >
                    <source src={announcement.mediaUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </OptimizedVideo>
                ) : (
                  <Image
                    src={announcement.mediaUrl}
                    alt="Announcement media"
                    width={600}
                    height={400}
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
    </div>
  )
}
