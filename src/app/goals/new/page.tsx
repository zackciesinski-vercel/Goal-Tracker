import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/app-shell'
import { GoalForm } from './goal-form'
import { getCurrentFiscalPeriod, getAvailablePeriods } from '@/lib/fiscal'
import { getServerOrg } from '@/lib/org-server'
import { demoCompanyObjectives, demoOrgSettings } from '@/lib/demo-data'

export default async function NewGoalPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  const isGuest = !user

  // Default values for guests
  let fiscalStartMonth = demoOrgSettings.fiscal_year_start_month
  let isAdmin = false
  let organizationId: string | null = null
  let companyObjectives: { id: string; title: string; metric_name: string; year: number; quarter: number }[] = []

  if (!isGuest) {
    // Get user's organization
    const { organization, membership } = await getServerOrg(supabase)

    if (organization) {
      organizationId = organization.id

      // Get org settings
      const { data: settings } = await supabase
        .from('org_settings')
        .select('*')
        .eq('organization_id', organization.id)
        .single()

      fiscalStartMonth = settings?.fiscal_year_start_month ?? 1

      // Check if user is admin (owner or admin role in the org)
      isAdmin = membership?.role === 'owner' || membership?.role === 'admin'

      // Get company objectives for the current period (to link goals to)
      const { data: orgObjectives } = await supabase
        .from('goals')
        .select('id, title, metric_name, year, quarter')
        .eq('organization_id', organization.id)
        .eq('goal_type', 'company')
        .order('created_at', { ascending: false })

      companyObjectives = orgObjectives ?? []
    }
  } else {
    // Use demo objectives for guests
    companyObjectives = demoCompanyObjectives.map(obj => ({
      id: obj.id,
      title: obj.title,
      metric_name: obj.metric_name,
      year: obj.year,
      quarter: obj.quarter,
    }))
  }

  const availablePeriods = getAvailablePeriods(fiscalStartMonth)

  return (
    <AppShell isGuest={isGuest}>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold mb-6">Create Goal</h1>
        <GoalForm
          availablePeriods={availablePeriods}
          fiscalStartMonth={fiscalStartMonth}
          isAdmin={isAdmin}
          companyObjectives={companyObjectives}
          organizationId={organizationId}
          isGuest={isGuest}
        />
      </div>
    </AppShell>
  )
}
