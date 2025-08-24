'use client'

import { useState, useEffect } from 'react'
import MemberCard from '@/components/MemberCard'
import { Users, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

export default function Directory() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortOrder, setSortOrder] = useState('newest') // 'newest' or 'oldest'

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const sortUsers = (usersToSort, order) => {
    return [...usersToSort].sort((a, b) => {
      const dateA = new Date(a.createdAt)
      const dateB = new Date(b.createdAt)
      
      if (order === 'newest') {
        return dateB - dateA // Newest first
      } else {
        return dateA - dateB // Oldest first
      }
    })
  }

  const handleSortChange = (newSortOrder) => {
    setSortOrder(newSortOrder)
  }

  // Sort users whenever sortOrder or users change
  const sortedUsers = sortUsers(users, sortOrder)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-indigo-600 mr-3" />
          <h1 className="text-4xl font-bold text-white">Members Directory</h1>
        </div>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-6">
          Meet all the amazing members of the Olympus community
        </p>
        
        {/* Sort Controls */}
        {!loading && users.length > 0 && (
          <div className="flex items-center justify-center space-x-4">
            <span className="text-gray-300 text-sm">Sort by:</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleSortChange('newest')}
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  sortOrder === 'newest'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <ArrowDown className="w-4 h-4 mr-1" />
                Newest First
              </button>
              <button
                onClick={() => handleSortChange('oldest')}
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  sortOrder === 'oldest'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <ArrowUp className="w-4 h-4 mr-1" />
                Oldest First
              </button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedUsers.map((user) => (
            <MemberCard key={user.id} user={user} />
          ))}
        </div>
      )}

      {!loading && users.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No members yet</h3>
          <p className="text-gray-600">
            Be the first to join the Olympus community!
          </p>
        </div>
      )}
    </div>
  )
}
