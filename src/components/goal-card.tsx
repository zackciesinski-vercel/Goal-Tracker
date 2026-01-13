'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Goal, Update } from '@/types/database'
import {
  calculateProgress,
  getGoalStatus,
  getStatusLabel,
  formatMetric,
  isCheckinOverdue,
} from '@/lib/goals'

interface GoalCardProps {
  goal: Goal
  updates?: Update[]
  checkinCadenceDays?: number
}

export function GoalCard({ goal, updates = [], checkinCadenceDays = 7 }: GoalCardProps) {
  const hasMetrics = goal.metric_target !== null
  const progress = hasMetrics ? calculateProgress(goal.metric_current, goal.metric_target!) : 0
  const status = hasMetrics ? getGoalStatus(goal.metric_current, goal.metric_target!) : 'on_track'
  const overdue = hasMetrics ? isCheckinOverdue(updates, checkinCadenceDays) : false

  const statusColors = {
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
    on_track: 'bg-status-on-track/10',
    at_risk: 'bg-status-at-risk/10',
    behind: 'bg-status-behind/10',
  }

  // Circular progress calculation
  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <Link href={`/goals/${goal.id}`}>
      <Card className={`hover:shadow-lg transition-all cursor-pointer border-0 ${bgColors[status]}`}>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Icon and circular progress */}
            <div className="relative flex-shrink-0">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-white/50"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  strokeWidth="8"
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
                {goal.icon?.startsWith('http') ? (
                  <img src={goal.icon} alt="" className="w-10 h-10 object-cover rounded" />
                ) : (
                  <span className="text-3xl">{goal.icon || '🎯'}</span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-foreground line-clamp-2 leading-tight">
                  {goal.title}
                </h3>
                {overdue && (
                  <Badge variant="outline" className="text-status-at-risk border-status-at-risk/50 flex-shrink-0 text-xs">
                    Overdue
                  </Badge>
                )}
              </div>

              {hasMetrics ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-2xl font-bold ${statusColors[status]}`}>
                      {progress}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {getStatusLabel(status)}
                    </span>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{formatMetric(goal.metric_current)}</span>
                    <span className="opacity-60"> / {formatMetric(goal.metric_target!)} </span>
                    <span>{goal.metric_name}</span>
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">
                  <Badge variant="outline" className="mb-2">Company Objective</Badge>
                  <p className="text-xs">Strategic objective - progress tracked via supporting goals</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
