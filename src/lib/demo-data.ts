// Demo data for guest users to explore the app

import { getCurrentFiscalPeriod } from './fiscal'

// Use the same fiscal period calculation as the rest of the app
const currentPeriod = getCurrentFiscalPeriod(1) // fiscalStartMonth = 1 (January)

export const demoCompanyObjectives = [
  {
    id: 'demo-obj-1',
    title: 'Expand Globally',
    description: 'Grow our presence in international markets and establish regional operations',
    icon: '🌍',
    metric_name: null,
    metric_current: 0,
    metric_target: null,
    goal_type: 'company' as const,
    year: currentPeriod.year,
    quarter: currentPeriod.quarter as 1 | 2 | 3 | 4,
    created_at: new Date().toISOString(),
    updates: [],
  },
  {
    id: 'demo-obj-2',
    title: 'Retain All Users',
    description: 'Deliver exceptional value to keep every customer engaged and successful',
    icon: '💎',
    metric_name: null,
    metric_current: 0,
    metric_target: null,
    goal_type: 'company' as const,
    year: currentPeriod.year,
    quarter: currentPeriod.quarter as 1 | 2 | 3 | 4,
    created_at: new Date().toISOString(),
    updates: [],
  },
  {
    id: 'demo-obj-3',
    title: 'Technical Excellence',
    description: 'Build a world-class engineering culture with reliable, scalable systems',
    icon: '⚡',
    metric_name: null,
    metric_current: 0,
    metric_target: null,
    goal_type: 'company' as const,
    year: currentPeriod.year,
    quarter: currentPeriod.quarter as 1 | 2 | 3 | 4,
    created_at: new Date().toISOString(),
    updates: [],
  },
]

export const demoTeamGoals = [
  {
    id: 'demo-goal-1',
    title: 'Launch in 3 new countries',
    description: 'Expand to UK, Germany, and Japan markets',
    icon: '🚀',
    metric_name: 'Countries launched',
    metric_current: 1,
    metric_target: 3,
    goal_type: 'team' as const,
    parent_goal_id: 'demo-obj-1',
    year: currentPeriod.year,
    quarter: currentPeriod.quarter as 1 | 2 | 3 | 4,
    created_at: new Date().toISOString(),
    updates: [
      {
        id: 'demo-update-1',
        goal_id: 'demo-goal-1',
        notes: 'UK launch complete! Germany and Japan on track for next month.',
        metric_value: 1,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'demo-goal-2',
    title: 'Reduce churn rate',
    description: 'Improve retention through better onboarding and support',
    icon: '📉',
    metric_name: 'Churn %',
    metric_current: 4.2,
    metric_target: 2,
    goal_type: 'individual' as const,
    parent_goal_id: 'demo-obj-2',
    year: currentPeriod.year,
    quarter: currentPeriod.quarter as 1 | 2 | 3 | 4,
    created_at: new Date().toISOString(),
    updates: [
      {
        id: 'demo-update-2',
        goal_id: 'demo-goal-2',
        notes: 'New onboarding flow reduced early churn by 15%',
        metric_value: 4.2,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
  {
    id: 'demo-goal-3',
    title: 'Achieve 99.9% uptime',
    description: 'Improve infrastructure reliability',
    icon: '🛡️',
    metric_name: 'Uptime %',
    metric_current: 99.5,
    metric_target: 99.9,
    goal_type: 'team' as const,
    parent_goal_id: 'demo-obj-3',
    year: currentPeriod.year,
    quarter: currentPeriod.quarter as 1 | 2 | 3 | 4,
    created_at: new Date().toISOString(),
    updates: [
      {
        id: 'demo-update-3',
        goal_id: 'demo-goal-3',
        notes: 'Migrated to multi-region setup, seeing major stability improvements',
        metric_value: 99.5,
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
]

export const demoOrgSettings = {
  fiscal_year_start_month: 1,
  checkin_cadence_days: 7,
}
