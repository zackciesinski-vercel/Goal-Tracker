import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/app-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SettingsForm } from './settings-form'
import { LockQuarterForm } from './lock-quarter-form'
import { getCurrentFiscalPeriod, getQuarterLabel } from '@/lib/fiscal'
import { redirect } from 'next/navigation'
import { getServerOrg } from '@/lib/org-server'

export default async function SettingsPage() {
  const supabase = await createClient()

  // Get current user and check if admin
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.id) {
    redirect('/login')
  }

  // Get user's organization and membership
  const { organization, membership } = await getServerOrg(supabase)

  if (!organization) {
    redirect('/onboarding')
  }

  // Check if user is admin or owner
  const isAdmin = membership?.role === 'owner' || membership?.role === 'admin'
  if (!isAdmin) {
    redirect('/')
  }

  // Get org settings
  const { data: settings } = await supabase
    .from('org_settings')
    .select('*')
    .eq('organization_id', organization.id)
    .single()

  const fiscalStartMonth = settings?.fiscal_year_start_month ?? 1
  const checkinCadence = settings?.checkin_cadence_days ?? 7
  const currentPeriod = getCurrentFiscalPeriod(fiscalStartMonth)

  // Get unlocked goals in current quarter for this organization
  const { data: unlockedGoals } = await supabase
    .from('goals')
    .select('id, title')
    .eq('organization_id', organization.id)
    .eq('year', currentPeriod.year)
    .eq('quarter', currentPeriod.quarter)
    .eq('is_locked', false)

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-semibold">Settings</h1>

        <Card>
          <CardHeader>
            <CardTitle>Organization Settings</CardTitle>
            <CardDescription>
              Configure your fiscal year and check-in schedule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm
              settingsId={settings?.id}
              organizationId={organization.id}
              initialFiscalMonth={fiscalStartMonth}
              initialCadence={checkinCadence}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lock Quarter</CardTitle>
            <CardDescription>
              Lock all goals for {getQuarterLabel(currentPeriod.year, currentPeriod.quarter)} to prevent editing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {unlockedGoals && unlockedGoals.length > 0 ? (
              <LockQuarterForm
                organizationId={organization.id}
                year={currentPeriod.year}
                quarter={currentPeriod.quarter}
                unlockedCount={unlockedGoals.length}
              />
            ) : (
              <p className="text-sm text-gray-500">
                All goals for this quarter are already locked.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
