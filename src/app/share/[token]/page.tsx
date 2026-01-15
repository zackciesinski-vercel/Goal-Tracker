import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  calculateProgress,
  getGoalStatus,
  getStatusLabel,
  formatMetric,
} from '@/lib/goals'
import { getQuarterLabel } from '@/lib/fiscal'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ token: string }>
}

const goalTypeLabels = {
  company: 'Company Objective',
  team: 'Team Goal',
  individual: 'Individual Goal',
}

export default async function SharePage({ params }: PageProps) {
  const { token } = await params
  const supabase = await createClient()

  // Look up the share link by token
  const { data: shareLink, error: linkError } = await supabase
    .from('goal_share_links')
    .select('*')
    .eq('token', token)
    .eq('is_active', true)
    .single()

  if (linkError || !shareLink) {
    notFound()
  }

  // Check if link has expired
  if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
    notFound()
  }

  // Get the goal with updates and owner info
  const { data: goal, error: goalError } = await supabase
    .from('goals')
    .select(`
      *,
      updates (*),
      owner:users (name, email),
      organization:organizations (name)
    `)
    .eq('id', shareLink.goal_id)
    .single()

  if (goalError || !goal) {
    notFound()
  }

  // Company objectives may not have metrics
  const hasMetrics = goal.metric_target !== null
  const progress = hasMetrics ? calculateProgress(goal.metric_current, goal.metric_target!) : null
  const status = hasMetrics ? getGoalStatus(goal.metric_current, goal.metric_target!) : null

  const statusColors = {
    ahead: 'bg-blue-100 text-blue-800',
    on_track: 'bg-green-100 text-green-800',
    at_risk: 'bg-yellow-100 text-yellow-800',
    behind: 'bg-red-100 text-red-800',
  }

  const progressColors = {
    ahead: 'bg-blue-500',
    on_track: 'bg-green-500',
    at_risk: 'bg-yellow-500',
    behind: 'bg-red-500',
  }

  // Sort updates by date descending
  const sortedUpdates = [...(goal.updates || [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Simple header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">Goal Tracker</span>
              <Badge variant="outline" className="text-xs">Shared View</Badge>
            </div>
            {goal.organization && (
              <span className="text-sm text-muted-foreground">
                {goal.organization.name}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-6">
          {/* Goal header */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{goal.icon || '🎯'}</span>
              <h1 className="text-2xl font-semibold">{goal.title}</h1>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
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
            </div>
          </div>

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

          {/* For company objectives without metrics */}
          {!hasMetrics && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  This is a company objective. Progress is measured through the team and individual goals that support it.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Update History */}
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
                        <span className="text-gray-400">-</span>
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

          {/* Owner info */}
          <div className="text-sm text-muted-foreground">
            Owner: {goal.owner?.name || goal.owner?.email}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          This is a read-only shared view
        </div>
      </footer>
    </div>
  )
}
