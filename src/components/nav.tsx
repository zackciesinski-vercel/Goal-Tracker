'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Dashboard', guestAllowed: true },
  { href: '/goals/new', label: 'New Goal', guestAllowed: true },
  { href: '/settings/team', label: 'Team', guestAllowed: false },
  { href: '/settings', label: 'Settings', guestAllowed: false },
  { href: '/settings/appearance', label: 'Appearance', guestAllowed: false },
]

interface NavProps {
  isGuest?: boolean
}

export function Nav({ isGuest = false }: NavProps) {
  const pathname = usePathname()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const visibleNavItems = isGuest
    ? navItems.filter(item => item.guestAllowed)
    : navItems

  return (
    <header className="border-b bg-card">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-semibold text-lg">
            Goal Tracker
          </Link>
          <nav className="flex items-center gap-1">
            {visibleNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-3 py-2 text-sm rounded-md transition-colors',
                  pathname === item.href
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        {isGuest ? (
          <div className="flex gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/login">
              <Button size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        ) : (
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sign Out
          </Button>
        )}
      </div>
    </header>
  )
}
