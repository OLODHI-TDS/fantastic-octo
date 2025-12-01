'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Environments', href: '/environments' },
  { name: 'Tests', href: '/tests' },
  { name: 'Results', href: '/results' },
  { name: 'Reports', href: '/reports' },
]

export function Navigation() {
  const pathname = usePathname()
  const { data: session } = useSession()

  // Hide navigation on auth pages
  if (pathname === '/login' || pathname === '/register') {
    return null
  }

  return (
    <nav className="bg-background border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-primary">
                SF API Test Bench
              </h1>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'inline-flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                    pathname === item.href
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {session?.user && (
              <div className="flex items-center gap-2 ml-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    {session.user.name || session.user.email}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  title="Sign out"
                  className="h-9 w-9"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
