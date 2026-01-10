import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/app-shell'
import { GoalCard } from '@/components/goal-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getCurrentFiscalPeriod, getQuarterLabel } from '@/lib/fiscal'
import { calculateProgress, getGoalStatus, getStatusLabel, formatMetric } from '@/lib/goals'
import { demoCompanyObjectives, demoTeamGoals, demoOrgSettings } from '@/lib/demo-data'
import { GuestBanner } from '@/components/guest-banner'
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

  const circumference = 2 * Math.PI * 45

  return (
    <AppShell isGuest={isGuest}>
      <div className="space-y-8">
        {isGuest && <GuestBanner />}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-muted-foreground">{getQuarterLabel(currentPeriod.year, currentPeriod.quarter)}</p>
          </div>
          <Link href="/goals/new">
            <Button>New Goal</Button>
          </Link>
        </div>

        {/* Company Objectives Section */}
        <section>
          <h2 className="text-lg font-medium mb-4">Company Objectives</h2>
          {!hasCompanyObjectives ? (
            <div className="text-center py-8 bg-card rounded-lg border">
              <p className="text-muted-foreground">No company objectives for this quarter yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {companyObjectives.map((objective) => {
                const progress = calculateProgress(objective.metric_current, objective.metric_target)
                const status = getGoalStatus(objective.metric_current, objective.metric_target)
                const strokeDashoffset = circumference - (progress / 100) * circumference

                // Count goals that ladder up to this objective
                const childGoals = allGoals?.filter(g => g.parent_goal_id === objective.id) ?? []
                const childCount = childGoals.length

                const statusTextColors = {
                  on_track: 'text-status-on-track',
                  at_risk: 'text-status-at-risk',
                  behind: 'text-status-behind',
                }

                const progressColors = {
                  on_track: 'stroke-status-on-track',
                  at_risk: 'stroke-status-at-risk',
                  behind: 'stroke-status-behind',
                }

                const bgColors = {
                  on_track: 'bg-status-on-track/15',
                  at_risk: 'bg-status-at-risk/15',
                  behind: 'bg-status-behind/15',
                }

                return (
                  <Link key={objective.id} href={`/goals/${objective.id}`}>
                    <Card className={`hover:shadow-lg transition-all cursor-pointer h-full border-0 ${bgColors[status]}`}>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-5">
                          {/* Large circular progress with icon */}
                          <div className="relative flex-shrink-0">
                            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                              <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="6"
                                className="text-white/60"
                              />
                              <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                strokeWidth="6"
                                strokeLinecap="round"
                                className={progressColors[status]}
                                style={{
                                  strokeDasharray: circumference,
                                  strokeDashoffset: strokeDashoffset,
                                  transition: 'stroke-dashoffset 0.5s ease',
                                }}
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              {objective.icon?.startsWith('http') ? (
                                <img src={objective.icon} alt="" className="w-14 h-14 object-cover rounded" />
                              ) : (
                                <span className="text-4xl">{objective.icon || '🎯'}</span>
                              )}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground text-lg mb-2 line-clamp-2">
                              {objective.title}
                            </h3>

                            <div className="flex items-baseline gap-2 mb-2">
                              <span className={`text-3xl font-bold ${statusTextColors[status]}`}>
                                {progress}%
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {getStatusLabel(status)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                              <div className="text-muted-foreground">
                                <span className="font-medium text-foreground">{formatMetric(objective.metric_current)}</span>
                                <span className="opacity-60"> / {formatMetric(objective.metric_target)}</span>
                              </div>
                              <span className="text-muted-foreground">
                                {childCount} goal{childCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
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
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}
