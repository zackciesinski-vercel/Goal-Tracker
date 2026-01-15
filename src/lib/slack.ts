import { Goal, Update } from '@/types/database'
import { calculateProgress, getGoalStatus, getStatusLabel, GoalStatus } from './goals'

type GoalWithUpdates = Goal & {
  updates?: Update[]
}

interface SlackBlock {
  type: string
  text?: {
    type: string
    text: string
    emoji?: boolean
  }
  elements?: Array<{
    type: string
    text?: string
    emoji?: boolean
  }>
}

/**
 * Generate a text-based progress bar
 */
function progressBar(percent: number): string {
  const filled = Math.round(percent / 10)
  const empty = 10 - filled
  return '█'.repeat(filled) + '░'.repeat(empty)
}

/**
 * Get status emoji
 */
function getStatusEmoji(status: string): string {
  switch (status) {
    case 'ahead':
      return '🔵'
    case 'on_track':
      return '🟢'
    case 'at_risk':
      return '🟡'
    case 'behind':
      return '🔴'
    default:
      return '⚪'
  }
}

/**
 * Get latest note from updates
 */
function getLatestNote(updates?: Update[]): string | null {
  if (!updates || updates.length === 0) return null

  const sortedUpdates = [...updates].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return sortedUpdates[0]?.notes || null
}

/**
 * Format goals as Slack Block Kit message
 */
export function formatGoalsForSlack(
  goals: GoalWithUpdates[],
  userName: string,
  weekNumber?: number,
  fiscalYearStartMonth: number = 2
): { blocks: SlackBlock[]; text: string } {
  const weekText = weekNumber ? ` - Week ${weekNumber}` : ''
  const headerText = `📊 ${userName}'s Goals${weekText}`

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: headerText,
        emoji: true,
      },
    },
    {
      type: 'divider',
    },
  ]

  if (goals.length === 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '_No goals set for this quarter_',
      },
    })
  } else {
    for (const goal of goals) {
      const progress = calculateProgress(goal.metric_current, goal.metric_target ?? 0)
      const status = goal.metric_target
        ? getGoalStatus(
            goal.metric_current,
            goal.metric_target,
            goal.year,
            goal.quarter,
            fiscalYearStartMonth,
            goal.status_override as GoalStatus | null
          )
        : 'on_track'
      const statusEmoji = getStatusEmoji(status)
      const statusLabel = getStatusLabel(status)
      const bar = progressBar(progress)
      const latestNote = getLatestNote(goal.updates)

      const metricText = goal.metric_target
        ? `${goal.metric_current} / ${goal.metric_target} ${goal.metric_name || ''}`
        : ''

      let goalText = `${goal.icon || '🎯'} *${goal.title}*\n\`${bar}\` ${progress}% ${statusEmoji} ${statusLabel}`
      if (metricText) {
        goalText += `\n_${metricText.trim()}_`
      }
      if (latestNote) {
        goalText += `\n> ${latestNote}`
      }

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: goalText,
        },
      })
    }
  }

  blocks.push(
    {
      type: 'divider',
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `_Updated ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}_`,
        },
      ],
    }
  )

  // Fallback text for notifications
  const text = `${userName}'s Goals Update: ${goals.length} goal${goals.length !== 1 ? 's' : ''}`

  return { blocks, text }
}

/**
 * Post message to Slack webhook
 */
export async function postToSlack(
  webhookUrl: string,
  blocks: SlackBlock[],
  text: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        blocks,
        text,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { ok: false, error: errorText }
    }

    return { ok: true }
  } catch (error) {
    return { ok: false, error: String(error) }
  }
}

/**
 * Get the current week number of the year
 */
export function getCurrentWeekNumber(): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const diff = now.getTime() - start.getTime()
  const oneWeek = 1000 * 60 * 60 * 24 * 7
  return Math.ceil(diff / oneWeek)
}
