import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import type { NextAuthConfig } from 'next-auth'

// Base config shared between Edge and Node.js
const authConfig: NextAuthConfig = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        // Dynamic import to avoid Edge runtime issues
        const { default: prisma } = await import('@/lib/db/prisma')

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnLogin = nextUrl.pathname.startsWith('/login')
      const isOnRegister = nextUrl.pathname.startsWith('/register')
      const isOnAuthApi = nextUrl.pathname.startsWith('/api/auth')

      if (isOnAuthApi) {
        return true
      }

      if (isOnLogin || isOnRegister) {
        if (isLoggedIn) {
          return Response.redirect(new URL('/', nextUrl))
        }
        return true
      }

      if (isLoggedIn) {
        return true
      }

      return false // Redirect to login
    },
  },
}

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig)
export { authConfig }
