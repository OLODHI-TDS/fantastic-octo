import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

// Edge-compatible auth config (no Prisma, just JWT verification)
const { auth } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      // This won't be called in middleware, just needed for config
      authorize: () => null,
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
})

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // API routes that should be public
  const publicApiRoutes = ['/api/auth']
  const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route))

  // Allow public routes and public API routes
  if (isPublicRoute || isPublicApiRoute) {
    // Redirect logged-in users away from auth pages
    if (isLoggedIn && isPublicRoute) {
      return Response.redirect(new URL('/', req.nextUrl.origin))
    }
    return
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn) {
    const loginUrl = new URL('/login', req.nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return Response.redirect(loginUrl)
  }
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
