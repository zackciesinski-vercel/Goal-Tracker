import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/app-shell'
import { GoalForm } from './goal-form'
import { getCurrentFiscalPeriod, getAvailablePeriods } from '@/lib/fiscal'

export default async function NewGoalPage() {
  const supabase = await createClient()

  // Get org settings
  const { data: settings } = await supabase
    .from('org_settings')
    .select('*')
    .single()

  const fiscalStartMonth = settings?.fiscal_year_start_month ?? 2
  const availablePeriods = getAvailablePeriods(fiscalStartMonth)
  const currentPeriod = getCurrentFiscalPeriod(fiscalStartMonth)

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  // Check if user is admin
  let isAdmin = false
  if (user?.id) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.role === 'admin'
  }

  // Get company objectives for the current period (to link goals to)
  const { data: companyObjectives } = await supabase
    .from('goals')
    .select('id, title, metric_name, year, quarter')
    .eq('goal_type', 'company')
    .order('created_at', { ascending: false })

  return (
    <AppShell>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold mb-6">Create Goal</h1>
        <GoalForm
          availablePeriods={availablePeriods}
          fiscalStartMonth={fiscalStartMonth}
          isAdmin={isAdmin}
          companyObjectives={companyObjectives ?? []}
        />
      </div>
    </AppShell>
  )
}
