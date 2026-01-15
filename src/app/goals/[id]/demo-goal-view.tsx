'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/app-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  calculateProgress,
  getGoalStatus,
  getStatusLabel,
  formatMetric,
} from '@/lib/goals'
import { getQuarterLabel } from '@/lib/fiscal'
import { demoCompanyObjectives } from '@/lib/demo-data'

const GUEST_GOAL_KEY = 'guest_demo_goal'

const goalTypeLabels = {
  company: 'Company Objective',
  team: 'Team Goal',
  individual: 'Individual Goal',
}

interface DemoGoalViewProps {
  goalId: string
  demoGoal: any | null
  parentGoal: any | null
}

export function DemoGoalView({ goalId, demoGoal: initialDemoGoal, parentGoal: initialParentGoal }: DemoGoalViewProps) {
  const [goal, setGoal] = useState<any>(initialDemoGoal)
  const [parentGoal, setParentGoal] = useState<any>(initialParentGoal)
  const [loading, setLoading] = useState(!initialDemoGoal)
  const [checkinValue, setCheckinValue] = useState('')
  const [checkinNotes, setCheckinNotes] = useState('')
  const [isGuestGoal, setIsGuestGoal] = useState(false)

  // Load guest goal from localStorage if needed
  useEffect(() => {
    if (!initialDemoGoal && goalId.startsWith('guest-goal-')) {
      const stored = localStorage.getItem(GUEST_GOAL_KEY)
      if (stored) {
        try {
          const guestGoal = JSON.parse(stored)
          if (guestGoal.id === goalId) {
            setGoal(guestGoal)
            setIsGuestGoal(true)
            // Find parent
            const parent = demoCompanyObjectives.find(obj => obj.id === guestGoal.parent_goal_id)
            setParentGoal(parent || null)
          }
        } catch {
          // Invalid JSON
        }
      }
      setLoading(false)
    }
  }, [goalId, initialDemoGoal])

  if (loading) {
    return (
      <AppShell isGuest>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </AppShell>
    )
  }

  if (!goal) {
    return (
      <AppShell isGuest>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Goal not found</p>
          <Link href="/">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </AppShell>
    )
  }

  const hasMetrics = goal.metric_target !== null
  const progress = hasMetrics ? calculateProgress(goal.metric_current, goal.metric_target) : null
  const status = hasMetrics ? getGoalStatus(goal.metric_current, goal.metric_target) : null

  const statusColors = {
    ahead: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    on_track: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    at_risk: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    behind: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  }

  const progressColors = {
    ahead: 'bg-blue-500',
    on_track: 'bg-green-500',
    at_risk: 'bg-yellow-500',
    behind: 'bg-red-500',
  }

  const handleCheckin = () => {
    if (!checkinValue || !isGuestGoal) return

    const newUpdate = {
      id: `demo-update-${Date.now()}`,
      goal_id: goal.id,
      metric_value: parseFloat(checkinValue),
      notes: checkinNotes || null,
      created_at: new Date().toISOString(),
    }

    const updatedGoal = {
      ...goal,
      metric_current: parseFloat(checkinValue),
      updates: [...(goal.updates || []), newUpdate],
    }

    localStorage.setItem(GUEST_GOAL_KEY, JSON.stringify(updatedGoal))
    setGoal(updatedGoal)
    setCheckinValue('')
    setCheckinNotes('')
  }

  // Sort updates by date descending
  const sortedUpdates = [...(goal.updates || [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <AppShell isGuest>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block"
            >
              ← Back to Dashboard
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{goal.icon || '🎯'}</span>
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
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Demo
              </Badge>
            </div>
          </div>
        </div>

        {/* Parent objective link */}
        {parentGoal && (
          <div className="bg-secondary/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Supports company objective:</p>
            <Link
              href={`/goals/${parentGoal.id}`}
              className="font-medium flex items-center gap-2 text-primary hover:underline"
            >
              <span>{parentGoal.icon}</span>
              {parentGoal.title} →
            </Link>
          </div>
        )}

        {goal.description && (
          <p className="text-muted-foreground">{goal.description}</p>
        )}

        {/* Progress card */}
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
                    {formatMetric(goal.metric_current)} / {formatMetric(goal.metric_target)}
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

        {/* Demo Check-in - only for guest-created goals */}
        {isGuestGoal && hasMetrics && goal.metric_name && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Weekly Check-in</CardTitle>
              <CardDescription>Try updating your progress (demo mode)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkin-value">{goal.metric_name}</Label>
                    <Input
                      id="checkin-value"
                      type="number"
                      placeholder="Current value"
                      value={checkinValue}
                      onChange={(e) => setCheckinValue(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkin-notes">Notes (optional)</Label>
                  <Textarea
                    id="checkin-notes"
                    placeholder="What progress did you make?"
                    value={checkinNotes}
                    onChange={(e) => setCheckinNotes(e.target.value)}
                    rows={2}
                  />
                </div>
                <Button onClick={handleCheckin} disabled={!checkinValue}>
                  Log Update
                </Button>
              </div>
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
              <p className="text-muted-foreground text-sm">
                {isGuestGoal ? 'No updates yet. Try logging a check-in above!' : 'No updates yet.'}
              </p>
            ) : (
              <div className="space-y-4">
                {sortedUpdates.map((update: any) => (
                  <div
                    key={update.id}
                    className="border-l-2 border-border pl-4 py-2"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">
                        {goal.metric_name}: {formatMetric(update.metric_value)}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        {new Date(update.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    {update.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{update.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sign up CTA */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">Ready to track real goals?</p>
                <p className="text-sm text-muted-foreground">Sign up to save your progress and collaborate with your team</p>
              </div>
              <Link href="/login">
                <Button>Sign Up Free</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
