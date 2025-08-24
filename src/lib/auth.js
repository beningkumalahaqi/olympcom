import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './db'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          profilePic: user.profilePic,
          bio: user.bio
        }
      }
    })
  ],
  callbacks: {
    session: ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: token.role,
          profilePic: token.profilePic,
          bio: token.bio
        }
      }
    },
    jwt: ({ token, user, trigger, session }) => {
      if (user) {
        // Initial sign in
        const u = user
        return {
          ...token,
          id: u.id,
          role: u.role,
          profilePic: u.profilePic,
          bio: u.bio
        }
      }
      
      // Handle session updates (when update() is called)
      if (trigger === 'update' && session?.user) {
        return {
          ...token,
          ...session.user,
          id: token.id, // Keep the original ID
          role: token.role // Keep the original role
        }
      }
      
      return token
    }
  },
  pages: {
    signIn: '/auth/login',
    signUp: '/auth/register'
  },
  session: {
    strategy: 'jwt'
  }
}
