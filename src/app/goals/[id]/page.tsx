import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/app-shell'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  calculateProgress,
  getGoalStatus,
  getStatusLabel,
  formatMetric,
  isCheckinOverdue,
} from '@/lib/goals'
import { getQuarterLabel } from '@/lib/fiscal'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckinForm } from './checkin-form'

interface PageProps {
  params: Promise<{ id: string }>
}

const goalTypeLabels = {
  company: 'Company Objective',
  team: 'Team Goal',
  individual: 'Individual Goal',
}

export default async function GoalDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Get org settings
  const { data: settings } = await supabase
    .from('org_settings')
    .select('*')
    .single()

  const checkinCadence = settings?.checkin_cadence_days ?? 7

  // Get goal with updates and owner
  const { data: goal, error } = await supabase
    .from('goals')
    .select(`
      *,
      updates (*),
      owner:users (name, email)
    `)
    .eq('id', id)
    .single()

  if (error || !goal) {
    notFound()
  }

  // Get parent goal if exists
  let parentGoal = null
  if (goal.parent_goal_id) {
    const { data } = await supabase
      .from('goals')
      .select('id, title')
      .eq('id', goal.parent_goal_id)
      .single()
    parentGoal = data
  }

  // Get child goals if this is a company objective
  let childGoals: { id: string; title: string; owner: { name: string; email: string } | null }[] = []
  if (goal.goal_type === 'company') {
    const { data } = await supabase
      .from('goals')
      .select('id, title, owner:users (name, email)')
      .eq('parent_goal_id', goal.id)
    childGoals = data ?? []
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === goal.owner_id

  // Company objectives may not have metrics
  const hasMetrics = goal.metric_target !== null
  const progress = hasMetrics ? calculateProgress(goal.metric_current, goal.metric_target!) : null
  const status = hasMetrics ? getGoalStatus(goal.metric_current, goal.metric_target!) : null
  const overdue = isCheckinOverdue(goal.updates, checkinCadence)

  const statusColors = {
    on_track: 'bg-green-100 text-green-800',
    at_risk: 'bg-yellow-100 text-yellow-800',
    behind: 'bg-red-100 text-red-800',
  }

  const progressColors = {
    on_track: 'bg-green-500',
    at_risk: 'bg-yellow-500',
    behind: 'bg-red-500',
  }

  // Sort updates by date descending
  const sortedUpdates = [...(goal.updates || [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-semibold">{goal.title}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-muted-foreground">
                {getQuarterLabel(goal.year, goal.quarter)}
              </span>
              <Badge variant="outline">
                {goalTypeLabels[goal.goal_type as keyof typeof goalTypeLabels] || goal.goal_type}
              </Badge>
              {status && (
                <Badge className={statusColors[status]} variant="secondary">
                  {getStatusLabel(status)}
                </Badge>
              )}
              {goal.is_locked && (
                <Badge variant="outline">Locked</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Parent objective link */}
        {parentGoal && (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Supports company objective:</p>
            <Link
              href={`/goals/${parentGoal.id}`}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {parentGoal.title} →
            </Link>
          </div>
        )}

        {goal.description && (
          <p className="text-muted-foreground">{goal.description}</p>
        )}

        {/* Progress card - only for goals with metrics */}
        {hasMetrics && progress !== null && status !== null && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{goal.metric_name}</span>
                  <span className="font-medium">
                    {formatMetric(goal.metric_current)} / {formatMetric(goal.metric_target!)}
                  </span>
                </div>
                <div className="relative">
                  <Progress value={progress} className="h-3" />
                  <div
                    className={`absolute top-0 left-0 h-3 rounded-full ${progressColors[status]}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground text-right">{progress}% complete</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* For company objectives without metrics, show info */}
        {!hasMetrics && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                This is a company objective. Progress is measured through the team and individual goals that support it.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Child goals for company objectives */}
        {goal.goal_type === 'company' && childGoals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Goals Supporting This Objective</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {childGoals.map((child) => (
                  <Link
                    key={child.id}
                    href={`/goals/${child.id}`}
                    className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-medium">{child.title}</p>
                    <p className="text-sm text-gray-500">
                      {child.owner?.name || child.owner?.email}
                    </p>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weekly check-in - only for goals with metrics */}
        {isOwner && hasMetrics && goal.metric_name && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Weekly Check-in</CardTitle>
                {overdue && (
                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                    Overdue
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CheckinForm goalId={goal.id} metricName={goal.metric_name} />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Update History</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedUpdates.length === 0 ? (
              <p className="text-gray-500 text-sm">No updates yet.</p>
            ) : (
              <div className="space-y-4">
                {sortedUpdates.map((update) => (
                  <div
                    key={update.id}
                    className="border-l-2 border-gray-200 pl-4 py-2"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">
                        {goal.metric_name}: {formatMetric(update.metric_value)}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500">
                        {new Date(update.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    {update.notes && (
                      <p className="text-sm text-gray-600 mt-1">{update.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-sm text-gray-500">
          Owner: {goal.owner?.name || goal.owner?.email}
        </div>
      </div>
    </AppShell>
  )
}
