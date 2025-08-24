'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { SettingsIcon, UsersIcon, MailIcon, Plus, Trash, Edit, AlertTriangle } from 'lucide-react'
import AvatarImage from '@/components/AvatarImage'
import EditUserModal from '@/components/EditUserModal'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [allowlist, setAllowlist] = useState([])
  const [users, setUsers] = useState([])
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/feed')
      return
    }
    fetchData()
  }, [session, status, router])

  const fetchData = async () => {
    try {
      const [allowlistRes, usersRes] = await Promise.all([
        fetch('/api/admin/allowlist'),
        fetch('/api/admin/users')
      ])
      
      if (allowlistRes.ok) {
        const allowlistData = await allowlistRes.json()
        setAllowlist(allowlistData)
      }
      
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const addToAllowlist = async (e) => {
    e.preventDefault()
    if (!newEmail.trim()) return

    try {
      const response = await fetch('/api/admin/allowlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail.trim() })
      })

      if (response.ok) {
        setNewEmail('')
        setMessage('Email added to allowlist successfully!')
        fetchData()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to add email')
      }
    } catch (error) {
      setError('An error occurred')
    }
  }

  const removeFromAllowlist = async (id) => {
    try {
      const response = await fetch(`/api/admin/allowlist/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessage('Email removed from allowlist')
        fetchData()
      } else {
        setError('Failed to remove email')
      }
    } catch (error) {
      setError('An error occurred')
    }
  }

  const handleEditUser = async (user) => {
    setEditingUser(user)
    setShowEditModal(true)
  }

  const handleUserUpdated = (updatedUser) => {
    setUsers(users.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ))
    setMessage('User updated successfully!')
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone and will delete all their posts, comments, and reactions.')) {
      return
    }

    setDeletingUserId(userId)
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId))
        setMessage('User deleted successfully')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete user')
      }
    } catch (error) {
      setError('An error occurred while deleting user')
    } finally {
      setDeletingUserId(null)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <SettingsIcon className="w-8 h-8 text-indigo-600 mr-3" />
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        </div>
        <p className="text-gray-400">
          Manage users, allowlist, and moderate content
        </p>
      </div>

      {message && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Allowlist Management */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <MailIcon className="w-5 h-5 text-indigo-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Email Allowlist</h2>
          </div>

          <form onSubmit={addToAllowlist} className="mb-4">
            <div className="flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Add email to allowlist"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm text-black"
                required
              />
              <button
                type="submit"
                className="inline-flex items-center px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {allowlist.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-700">{item.email}</span>
                <button
                  onClick={() => removeFromAllowlist(item.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Users Management */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <UsersIcon className="w-5 h-5 text-indigo-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Registered Users</h2>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center flex-1">
                  <AvatarImage
                    src={user.profilePic}
                    alt={user.name}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full mr-3"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full mr-3 ${
                    user.role === 'ADMIN' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="text-indigo-600 hover:text-indigo-800 p-1"
                    title="Edit user"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {user.id === session?.user?.id ? (
                    <button
                      disabled
                      className="text-gray-400 p-1 cursor-not-allowed"
                      title="You cannot delete your own admin account"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={deletingUserId === user.id}
                      className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50"
                      title="Delete user"
                    >
                      {deletingUserId === user.id ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-3 text-xs text-gray-500 bg-blue-50 p-3 rounded-md">
            <strong>Note:</strong> You cannot delete your own admin account or change your role if you&apos;re the only admin. 
            To prevent system lockout, promote another user to admin first.
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <p className="text-2xl font-bold text-indigo-600">{users.length}</p>
          <p className="text-sm text-gray-600">Total Users</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <p className="text-2xl font-bold text-green-600">{users.filter(u => u.role === 'USER').length}</p>
          <p className="text-sm text-gray-600">Members</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <p className="text-2xl font-bold text-purple-600">{users.filter(u => u.role === 'ADMIN').length}</p>
          <p className="text-sm text-gray-600">Admins</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md text-center">
          <p className="text-2xl font-bold text-blue-600">{allowlist.length}</p>
          <p className="text-sm text-gray-600">Allowlisted</p>
        </div>
      </div>

      {/* Edit User Modal */}
      <EditUserModal
        user={editingUser}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingUser(null)
        }}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  )
}
