'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from './ui/card'
import {
  calculateProgress,
  getGoalStatus,
  getStatusLabel,
  formatMetric,
} from '@/lib/goals'

const GUEST_GOAL_KEY = 'guest_demo_goal'

interface CompanyObjective {
  id: string
  title: string
  icon?: string
}

interface GuestGoalDisplayProps {
  companyObjectives: CompanyObjective[]
}

export function GuestGoalDisplay({ companyObjectives }: GuestGoalDisplayProps) {
  const [guestGoal, setGuestGoal] = useState<any>(null)

  useEffect(() => {
    const stored = localStorage.getItem(GUEST_GOAL_KEY)
    if (stored) {
      try {
        setGuestGoal(JSON.parse(stored))
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, [])

  if (!guestGoal) return null

  // Find the parent objective
  const parentObjective = companyObjectives.find(obj => obj.id === guestGoal.parent_goal_id)

  const hasMetrics = guestGoal.metric_target !== null
  const progress = hasMetrics ? calculateProgress(guestGoal.metric_current, guestGoal.metric_target) : 0
  const status = hasMetrics ? getGoalStatus(guestGoal.metric_current, guestGoal.metric_target) : 'on_track'

  const statusColors = {
    ahead: 'text-blue-500',
    on_track: 'text-status-on-track',
    at_risk: 'text-status-at-risk',
    behind: 'text-status-behind',
  }

  const progressColors = {
    ahead: 'stroke-blue-500',
    on_track: 'stroke-status-on-track',
    at_risk: 'stroke-status-at-risk',
    behind: 'stroke-status-behind',
  }

  const bgColors = {
    ahead: 'bg-blue-500/10',
    on_track: 'bg-status-on-track/10',
    at_risk: 'bg-status-at-risk/10',
    behind: 'bg-status-behind/10',
  }

  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <>
      <div>
        <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
          <span className="text-lg">{parentObjective?.icon || '🎯'}</span>
          {parentObjective?.title || 'Your Goal'}
          <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            Demo
          </span>
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Link to goal detail page */}
          <Link href={`/goals/${guestGoal.id}`}>
            <Card className={`hover:shadow-lg transition-all border-0 ${bgColors[status]}`}>
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
                      <span className="text-3xl">{guestGoal.icon || '🎯'}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground line-clamp-2 leading-tight mb-1">
                      {guestGoal.title}
                    </h3>

                    {hasMetrics && (
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
                          <span className="font-medium text-foreground">{formatMetric(guestGoal.metric_current)}</span>
                          <span className="opacity-60"> / {formatMetric(guestGoal.metric_target)} </span>
                          <span>{guestGoal.metric_name}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </>
  )
}
