import Image from 'next/image'
import AvatarImage from './AvatarImage'

export default function MemberCard({ user }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex flex-col items-center">
        <AvatarImage
          src={user.profilePic}
          alt={user.name}
          width={96}
          height={96}
          className="rounded-full mb-4"
        />
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
          {user.name}
        </h3>
        
        {user.bio && (
          <p className="text-sm text-gray-600 text-center line-clamp-3">
            {user.bio}
          </p>
        )}
        
        <div className="mt-3 flex items-center text-xs text-gray-500">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            user.role === 'ADMIN' 
              ? 'bg-purple-100 text-purple-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {user.role === 'ADMIN' ? '👑 Admin' : '👤 Member'}
          </span>
        </div>
      </div>
    </div>
  )
}
