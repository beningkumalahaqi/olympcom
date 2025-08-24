'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Announcement from '@/components/Announcement'
import AnnouncementForm from '@/components/AnnouncementForm'
import { Megaphone, Pin } from 'lucide-react'

export default function AnnouncementsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (status === 'authenticated') {
      fetchAnnouncements()
    }
  }, [status, router])

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/announcements')
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data)
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAnnouncement = async (formData) => {
    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const newAnnouncement = await response.json()
        setAnnouncements(prev => [newAnnouncement, ...prev.filter(a => a.id !== newAnnouncement.id)])
      }
    } catch (error) {
      console.error('Error creating announcement:', error)
    }
  }

  const handleEditAnnouncement = async (id, updates) => {
    try {
      const formData = new FormData()
      Object.keys(updates).forEach(key => {
        formData.append(key, updates[key])
      })

      const response = await fetch(`/api/announcements/${id}`, {
        method: 'PUT',
        body: formData
      })

      if (response.ok) {
        const updatedAnnouncement = await response.json()
        setAnnouncements(prev => 
          prev.map(announcement => 
            announcement.id === id ? updatedAnnouncement : announcement
          )
        )
      }
    } catch (error) {
      console.error('Error editing announcement:', error)
    }
  }

  const handleDeleteAnnouncement = async (id) => {
    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setAnnouncements(prev => prev.filter(announcement => announcement.id !== id))
      }
    } catch (error) {
      console.error('Error deleting announcement:', error)
    }
  }

  const handlePinAnnouncement = async (id, isPinned) => {
    try {
      const formData = new FormData()
      formData.append('isPinned', isPinned)

      const response = await fetch(`/api/announcements/${id}`, {
        method: 'PUT',
        body: formData
      })

      if (response.ok) {
        const updatedAnnouncement = await response.json()
        setAnnouncements(prev => 
          prev.map(announcement => 
            announcement.id === id ? updatedAnnouncement : announcement
          ).sort((a, b) => {
            // Sort by pinned status first, then by creation date
            if (a.isPinned !== b.isPinned) {
              return b.isPinned - a.isPinned
            }
            return new Date(b.createdAt) - new Date(a.createdAt)
          })
        )
      }
    } catch (error) {
      console.error('Error pinning announcement:', error)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const pinnedAnnouncements = announcements.filter(a => a.isPinned)
  const regularAnnouncements = announcements.filter(a => !a.isPinned)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Megaphone className="w-8 h-8 text-indigo-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
          </div>
          <p className="text-gray-600">
            Stay updated with the latest news and information
          </p>
        </div>

        {/* Admin Form */}
        <AnnouncementForm onSubmit={handleCreateAnnouncement} />

        {/* Announcements List */}
        <div>
          {announcements.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements yet</h3>
              <p className="text-gray-500">
                {session?.user?.role === 'ADMIN' 
                  ? 'Create the first announcement to get started!'
                  : 'Check back later for updates from the admin.'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Pinned Announcements */}
              {pinnedAnnouncements.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center mb-4">
                    <Pin className="w-5 h-5 text-yellow-600 mr-2" />
                    <h2 className="text-lg font-semibold text-gray-900">Pinned Announcements</h2>
                  </div>
                  {pinnedAnnouncements.map(announcement => (
                    <Announcement
                      key={announcement.id}
                      announcement={announcement}
                      onEdit={handleEditAnnouncement}
                      onDelete={handleDeleteAnnouncement}
                      onPin={handlePinAnnouncement}
                    />
                  ))}
                </div>
              )}

              {/* Regular Announcements */}
              {regularAnnouncements.length > 0 && (
                <div>
                  {pinnedAnnouncements.length > 0 && (
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Announcements</h2>
                  )}
                  {regularAnnouncements.map(announcement => (
                    <Announcement
                      key={announcement.id}
                      announcement={announcement}
                      onEdit={handleEditAnnouncement}
                      onDelete={handleDeleteAnnouncement}
                      onPin={handlePinAnnouncement}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
