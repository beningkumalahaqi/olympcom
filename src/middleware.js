import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if user is authenticated for protected routes
        const { pathname } = req.nextUrl
        
        // Admin routes require admin role
        if (pathname.startsWith('/admin')) {
          return token?.role === 'ADMIN'
        }
        
        // Feed and profile routes require authentication
        if (pathname.startsWith('/feed') || pathname.startsWith('/profile')) {
          return !!token
        }
        
        return true
      }
    }
  }
)

export const config = {
  matcher: ['/feed/:path*', '/profile/:path*', '/admin/:path*']
}
