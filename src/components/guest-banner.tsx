'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function GuestBanner() {
  return (
    <div className="rounded-lg bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 p-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <h2 className="font-semibold text-lg">Welcome to Goal Tracker!</h2>
          <p className="text-muted-foreground text-sm">
            You&apos;re viewing demo data. Sign up to create your own goals and invite your team.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/login">
            <Button size="sm">
              Get Started Free
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
