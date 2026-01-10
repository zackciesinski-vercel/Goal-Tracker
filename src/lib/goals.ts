import { Goal, Update } from '@/types/database'

export type GoalStatus = 'on_track' | 'at_risk' | 'behind'

/**
 * Calculate progress percentage for a goal
 */
export function calculateProgress(current: number, target: number): number {
  if (target <= 0) return 0
  const progress = (current / target) * 100
  return Math.min(Math.round(progress), 100)
}

/**
 * Determine goal status based on progress
 * Green (on_track): >= 70%
 * Yellow (at_risk): 40-69%
 * Red (behind): < 40%
 */
export function getGoalStatus(current: number, target: number): GoalStatus {
  const progress = calculateProgress(current, target)

  if (progress >= 70) return 'on_track'
  if (progress >= 40) return 'at_risk'
  return 'behind'
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: GoalStatus): string {
  switch (status) {
    case 'on_track':
      return 'bg-green-500'
    case 'at_risk':
      return 'bg-yellow-500'
    case 'behind':
      return 'bg-red-500'
  }
}

/**
 * Get status badge variant
 */
export function getStatusBadgeVariant(status: GoalStatus): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'on_track':
      return 'default'
    case 'at_risk':
      return 'secondary'
    case 'behind':
      return 'destructive'
  }
}

/**
 * Get status label
 */
export function getStatusLabel(status: GoalStatus): string {
  switch (status) {
    case 'on_track':
      return 'On Track'
    case 'at_risk':
      return 'At Risk'
    case 'behind':
      return 'Behind'
  }
}

/**
 * Check if a check-in is overdue based on last update and cadence
 */
export function isCheckinOverdue(
  updates: Update[],
  cadenceDays: number
): boolean {
  if (updates.length === 0) {
    return true // No check-ins yet, consider overdue
  }

  const lastUpdate = updates.reduce((latest, update) => {
    return new Date(update.created_at) > new Date(latest.created_at) ? update : latest
  })

  const daysSinceLastUpdate = Math.floor(
    (Date.now() - new Date(lastUpdate.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  return daysSinceLastUpdate >= cadenceDays
}

/**
 * Get days since last check-in
 */
export function daysSinceLastCheckin(updates: Update[]): number | null {
  if (updates.length === 0) return null

  const lastUpdate = updates.reduce((latest, update) => {
    return new Date(update.created_at) > new Date(latest.created_at) ? update : latest
  })

  return Math.floor(
    (Date.now() - new Date(lastUpdate.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )
}

/**
 * Format metric value for display
 */
export function formatMetric(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toLocaleString()
}
