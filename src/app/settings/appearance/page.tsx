import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/app-shell'
import { ThemeSettings } from './theme-settings'
import { redirect } from 'next/navigation'

export default async function AppearancePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.id) {
    redirect('/login')
  }

  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-semibold">Appearance</h1>
          <p className="text-muted-foreground">Customize how Goal Tracker looks for you</p>
        </div>

        <ThemeSettings initialPreferences={preferences} />
      </div>
    </AppShell>
  )
}
