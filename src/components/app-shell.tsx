import { Nav } from './nav'

interface AppShellProps {
  children: React.ReactNode
  isGuest?: boolean
}

export function AppShell({ children, isGuest = false }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <Nav isGuest={isGuest} />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
