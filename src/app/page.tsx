import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/app-shell'
import { GoalCard } from '@/components/goal-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getCurrentFiscalPeriod, getQuarterLabel } from '@/lib/fiscal'
import { formatMetric } from '@/lib/goals'
import { demoCompanyObjectives, demoTeamGoals, demoOrgSettings } from '@/lib/demo-data'
import { GuestBanner } from '@/components/guest-banner'
import { GuestGoalDisplay } from '@/components/guest-goal-display'
import { ShareToSlack } from '@/components/share-to-slack'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  // For guests or users without org, use demo data
  let fiscalStartMonth = demoOrgSettings.fiscal_year_start_month
  let checkinCadence = demoOrgSettings.checkin_cadence_days
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allGoals: any[] = [...demoCompanyObjectives, ...demoTeamGoals]
  let isGuest = !user
  let hasOrg = false
  let hasSlackWebhook = false

  if (user) {
    // Get user's organization - use try/catch to handle RLS errors gracefully
    try {
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (membership?.organization_id) {
        hasOrg = true
        const orgId = membership.organization_id

        // Get org settings
        const { data: orgSettings } = await supabase
          .from('org_settings')
          .select('*')
          .eq('organization_id', orgId)
          .maybeSingle()

        if (orgSettings) {
          fiscalStartMonth = orgSettings.fiscal_year_start_month
          checkinCadence = orgSettings.checkin_cadence_days
          hasSlackWebhook = !!orgSettings.slack_webhook_url
        }

        // Get goals for this organization
        const period = getCurrentFiscalPeriod(fiscalStartMonth)
        const { data: orgGoals } = await supabase
          .from('goals')
          .select(`
            *,
            updates (*)
          `)
          .eq('organization_id', orgId)
          .eq('year', period.year)
          .eq('quarter', period.quarter)
          .order('created_at', { ascending: false })

        allGoals = orgGoals ?? []
      }
    } catch {
      // If any query fails, fall back to demo data
      console.error('Failed to fetch org data, using demo data')
    }
  }

  // Treat users without an org like guests (show demo data)
  isGuest = !user || !hasOrg

  const currentPeriod = getCurrentFiscalPeriod(fiscalStartMonth)

  // Separate goals by type
  const companyObjectives = allGoals?.filter(g => g.goal_type === 'company') ?? []
  const myGoals = isGuest
    ? allGoals?.filter(g => g.goal_type === 'team' || g.goal_type === 'individual') ?? []
    : allGoals?.filter(
        g => (g.goal_type === 'team' || g.goal_type === 'individual') && g.owner_id === user?.id
      ) ?? []

  const hasCompanyObjectives = companyObjectives.length > 0
  const hasMyGoals = myGoals.length > 0

  return (
    <AppShell isGuest={isGuest}>
      <div className="space-y-8">
        {isGuest && <GuestBanner />}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-muted-foreground">{getQuarterLabel(currentPeriod.year, currentPeriod.quarter)}</p>
          </div>
          <div className="flex items-center gap-3">
            {!isGuest && <ShareToSlack hasWebhook={hasSlackWebhook} />}
            <Link href="/goals/new">
              <Button>New Goal</Button>
            </Link>
          </div>
        </div>

        {/* Company Objectives Section */}
        <section>
          <h2 className="text-lg font-medium mb-4">Company Objectives</h2>
          {!hasCompanyObjectives ? (
            <div className="text-center py-8 bg-card rounded-lg border">
              <p className="text-muted-foreground">No company objectives for this quarter yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {companyObjectives.map((objective) => {
                const hasMetrics = objective.metric_target !== null

                // Count goals that ladder up to this objective
                const childGoals = allGoals?.filter(g => g.parent_goal_id === objective.id) ?? []
                const childCount = childGoals.length

                return (
                  <Link key={objective.id} href={`/goals/${objective.id}`}>
                    <Card className="hover:shadow-lg transition-all cursor-pointer h-full border-0 bg-secondary/50">
                      <CardContent className="p-5">
                        <div className="flex flex-col items-center text-center gap-3">
                          {/* Icon */}
                          <div className="w-16 h-16 rounded-full bg-background/50 flex items-center justify-center">
                            {objective.icon?.startsWith('http') ? (
                              <img src={objective.icon} alt="" className="w-10 h-10 object-cover rounded" />
                            ) : (
                              <span className="text-3xl">{objective.icon || '🎯'}</span>
                            )}
                          </div>

                          {/* Title */}
                          <h3 className="font-semibold text-foreground line-clamp-2 leading-tight">
                            {objective.title}
                          </h3>

                          {/* Description or supporting goals count */}
                          <p className="text-sm text-muted-foreground">
                            {childCount} supporting goal{childCount !== 1 ? 's' : ''}
                          </p>

                          {/* Only show metrics if they exist */}
                          {hasMetrics && (
                            <div className="text-xs text-muted-foreground">
                              {formatMetric(objective.metric_current)} / {formatMetric(objective.metric_target)}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* My Goals Section */}
        <section>
          <h2 className="text-lg font-medium mb-4">My Goals</h2>
          {!hasMyGoals ? (
            <div className="text-center py-8 bg-card rounded-lg border">
              <p className="text-muted-foreground">You haven&apos;t set any goals for this quarter yet.</p>
              <Link href="/goals/new">
                <Button className="mt-4" variant="outline">Create Goal</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Group goals by parent objective */}
              {companyObjectives.map((objective) => {
                const childGoals = myGoals.filter(g => g.parent_goal_id === objective.id)
                if (childGoals.length === 0) return null

                return (
                  <div key={objective.id}>
                    <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                      {objective.icon?.startsWith('http') ? (
                        <img src={objective.icon} alt="" className="w-5 h-5 object-cover rounded" />
                      ) : (
                        <span className="text-lg">{objective.icon || '🎯'}</span>
                      )}
                      {objective.title}
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                      {childGoals.map((goal) => (
                        <GoalCard
                          key={goal.id}
                          goal={goal}
                          updates={goal.updates}
                          checkinCadenceDays={checkinCadence}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Show goals without parent (legacy or orphaned) */}
              {myGoals.filter(g => !g.parent_goal_id).length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-3">Other goals</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    {myGoals.filter(g => !g.parent_goal_id).map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        updates={goal.updates}
                        checkinCadenceDays={checkinCadence}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Show guest's custom goal from localStorage */}
              {isGuest && (
                <GuestGoalDisplay
                  companyObjectives={companyObjectives.map(obj => ({
                    id: obj.id,
                    title: obj.title,
                    icon: obj.icon,
                  }))}
                />
              )}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}
