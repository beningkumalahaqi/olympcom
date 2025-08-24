export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Maintenance Icon */}
        <div className="mb-8">
          <div className="relative">
            <div className="bg-yellow-100 rounded-full p-6 mx-auto w-24 h-24 flex items-center justify-center">
              <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.95-.833-2.72 0L3.094 16.5C2.324 18.333 3.286 20 4.826 20z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🎭 OlympCom
        </h1>
        
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Under Maintenance
        </h2>

        {/* Message */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-lg font-medium text-gray-700">
              Temporary Downtime
            </span>
          </div>
          
          <p className="text-gray-600 mb-4">
            We&apos;re currently performing scheduled maintenance to improve your experience. 
            All services are temporarily unavailable.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>What&apos;s happening:</strong><br />
              • Database optimization<br />
              • Security updates<br />
              • Performance improvements
            </p>
          </div>
        </div>

        {/* Expected Time */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <h3 className="font-semibold text-yellow-800 mb-2">Expected Duration</h3>
          <p className="text-yellow-700 text-sm">
            Maintenance is expected to complete within the next few hours. 
            We appreciate your patience!
          </p>
        </div>

        {/* Status Updates */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">
            For real-time updates, check our status page or social media
          </p>
          
          <div className="flex justify-center space-x-4">
            <div className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm">
              Status: Maintenance Mode
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-xs text-gray-400">
          <p>© 2025 OlympCom. We&apos;ll be back soon!</p>
        </div>
      </div>
    </div>
  )
}
