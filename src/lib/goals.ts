import { Goal, Update } from '@/types/database'
import { getQuarterDates } from './fiscal'

export type GoalStatus = 'ahead' | 'on_track' | 'at_risk' | 'behind'

/**
 * Calculate progress percentage for a goal
 */
export function calculateProgress(current: number, target: number): number {
  if (target <= 0) return 0
  const progress = (current / target) * 100
  return Math.min(Math.round(progress), 100)
}

/**
 * Calculate expected progress based on time elapsed in the quarter
 */
export function calculateExpectedProgress(
  year: number,
  quarter: number,
  fiscalYearStartMonth: number = 2
): number {
  const { start, end } = getQuarterDates(year, quarter, fiscalYearStartMonth)
  const now = new Date()

  // If we're before the quarter starts, expected is 0
  if (now < start) return 0

  // If we're after the quarter ends, expected is 100
  if (now > end) return 100

  // Calculate percentage of quarter elapsed
  const totalDuration = end.getTime() - start.getTime()
  const elapsed = now.getTime() - start.getTime()

  return Math.round((elapsed / totalDuration) * 100)
}

/**
 * Determine goal status based on actual vs expected progress
 * Compares where you are vs where you should be at this point in the quarter
 *
 * - Ahead: >= 100% of expected
 * - On Track: 80-99% of expected
 * - At Risk: 60-79% of expected
 * - Behind: < 60% of expected
 */
export function getGoalStatus(
  current: number,
  target: number,
  year?: number,
  quarter?: number,
  fiscalYearStartMonth?: number,
  statusOverride?: GoalStatus | null
): GoalStatus {
  // If there's a manual override, use it
  if (statusOverride) return statusOverride

  const actualProgress = calculateProgress(current, target)

  // If no quarter info provided, fall back to simple percentage-based logic
  if (year === undefined || quarter === undefined) {
    if (actualProgress >= 70) return 'on_track'
    if (actualProgress >= 40) return 'at_risk'
    return 'behind'
  }

  const expectedProgress = calculateExpectedProgress(year, quarter, fiscalYearStartMonth)

  // Handle edge cases
  if (expectedProgress === 0) {
    // Quarter hasn't started yet - any progress is ahead
    return actualProgress > 0 ? 'ahead' : 'on_track'
  }

  // Calculate ratio of actual to expected
  const ratio = actualProgress / expectedProgress

  if (ratio >= 1.0) return 'ahead'
  if (ratio >= 0.8) return 'on_track'
  if (ratio >= 0.6) return 'at_risk'
  return 'behind'
}

/**
 * Legacy function for backward compatibility
 */
export function getGoalStatusSimple(current: number, target: number): GoalStatus {
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
    case 'ahead':
      return 'bg-blue-500'
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
    case 'ahead':
      return 'default'
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
    case 'ahead':
      return 'Ahead'
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
export function formatMetric(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '—'
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toLocaleString()
}
